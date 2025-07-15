import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, QueryCommand, DeleteCommand, BatchWriteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from './logger.js';
import crypto from 'crypto';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * Generate a unique ID based on a value and prefix
 */
function generateItemId(value, prefix) {
  const hash = crypto.createHash('md5').update(value).digest('hex');
  return `${prefix}_${hash.substring(0, 8)}_${Date.now()}`;
}

/**
 * Insert a single item into DynamoDB
 */
export const insertItem = async (tableName, item, options = {}) => {
  const {
    idField = 'id',
    idPrefix = 'item',
    additionalFields = {},
    statusField = 'status',
    statusValue = 'active',
    timestampField = 'createdAt'
  } = options;

  try {
    // Generate ID if not provided
    if (!item[idField]) {
      const idValue = item.url || item.email || item.id || JSON.stringify(item);
      item[idField] = generateItemId(idValue, idPrefix);
    }

    // Clean the item to remove non-serializable data
    const cleanItem = JSON.parse(JSON.stringify(item));
    
    const dbItem = {
      ...cleanItem,
      ...additionalFields,
      [timestampField]: new Date().toISOString(),
      [statusField]: statusValue
    };

    const putCommand = new PutCommand({
      TableName: tableName,
      Item: dbItem
    });

    await docClient.send(putCommand);
    logger.info(`Inserted item: ${dbItem[idField]} in table ${tableName}`);
    
    return dbItem;
  } catch (error) {
    logger.error(`Failed to insert item in table ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Insert multiple items into DynamoDB using BatchWrite
 */
export const insertItems = async (tableName, items, options = {}) => {
  const {
    idField = 'id',
    idPrefix = 'item',
    additionalFields = {},
    statusField = 'status',
    statusValue = 'active',
    timestampField = 'createdAt'
  } = options;

  const results = [];
  const errors = [];
  const batchSize = 25; // DynamoDB BatchWrite limit

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchItems = [];

    // Prepare batch items
    for (const item of batch) {
      try {
        // Generate ID if not provided
        if (!item[idField]) {
          const idValue = item.url || item.email || item.id || JSON.stringify(item);
          item[idField] = generateItemId(idValue, idPrefix);
        }

        const dbItem = {
          ...item,
          ...additionalFields,
          [timestampField]: new Date().toISOString(),
          [statusField]: statusValue
        };

        batchItems.push({
          PutRequest: {
            Item: dbItem
          }
        });

        results.push(dbItem);
      } catch (error) {
        errors.push({ item, error: error.message });
        logger.error(`Failed to prepare item for batch:`, error.message);
      }
    }

    // Execute batch write if we have items
    if (batchItems.length > 0) {
      try {
        const batchWriteCommand = new BatchWriteCommand({
          RequestItems: {
            [tableName]: batchItems
          }
        });

        const result = await docClient.send(batchWriteCommand);
        
        // Check for unprocessed items (retry logic could be added here)
        if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
          logger.warn(`Some items were not processed in batch for table ${tableName}`);
          // You could implement retry logic here for unprocessed items
        }

        logger.info(`Batch inserted ${batchItems.length} items in table ${tableName}`);
      } catch (error) {
        logger.error(`Batch insert failed for table ${tableName}:`, error.message);
        // Mark all items in this batch as failed
        batch.forEach(item => {
          errors.push({ item, error: error.message });
        });
      }
    }
  }

  logger.info(`Bulk insert completed: ${results.length} items inserted, ${errors.length} failed in table ${tableName}`);
  
  return { results, errors };
};

/**
 * Insert multiple items into DynamoDB with retry logic for unprocessed items
 */
export const insertItemsWithRetry = async (tableName, items, options = {}) => {
  const {
    idField = 'id',
    idPrefix = 'item',
    additionalFields = {},
    statusField = 'status',
    statusValue = 'active',
    timestampField = 'createdAt',
    maxRetries = 3
  } = options;

  const results = [];
  const errors = [];
  const batchSize = 25; // DynamoDB BatchWrite limit

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    let batchItems = [];
    let batchResults = [];

    // Prepare batch items
    for (const item of batch) {
      try {
        // Generate ID if not provided
        if (!item[idField]) {
          const idValue = item.url || item.email || item.id || JSON.stringify(item);
          item[idField] = generateItemId(idValue, idPrefix);
        }

        const dbItem = {
          ...item,
          ...additionalFields,
          [timestampField]: new Date().toISOString(),
          [statusField]: statusValue
        };

        batchItems.push({
          PutRequest: {
            Item: dbItem
          }
        });

        batchResults.push(dbItem);
      } catch (error) {
        errors.push({ item, error: error.message });
        logger.error(`Failed to prepare item for batch:`, error.message);
      }
    }

    // Execute batch write with retry logic
    if (batchItems.length > 0) {
      let retryCount = 0;
      let unprocessedItems = batchItems;

      while (unprocessedItems.length > 0 && retryCount < maxRetries) {
        try {
          const batchWriteCommand = new BatchWriteCommand({
            RequestItems: {
              [tableName]: unprocessedItems
            }
          });

          const result = await docClient.send(batchWriteCommand);
          
          // Check for unprocessed items
          if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
            unprocessedItems = result.UnprocessedItems[tableName] || [];
            retryCount++;
            
            if (retryCount < maxRetries) {
              logger.warn(`Retry ${retryCount}/${maxRetries}: ${unprocessedItems.length} items not processed`);
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            } else {
              logger.error(`Max retries reached. ${unprocessedItems.length} items failed to process`);
              // Mark unprocessed items as errors
              unprocessedItems.forEach((request, index) => {
                if (request.PutRequest) {
                  errors.push({ 
                    item: request.PutRequest.Item, 
                    error: 'Max retries exceeded' 
                  });
                }
              });
            }
          } else {
            // All items processed successfully
            unprocessedItems = [];
            results.push(...batchResults);
            logger.info(`Batch inserted ${batchItems.length} items in table ${tableName}`);
          }
        } catch (error) {
          logger.error(`Batch insert failed for table ${tableName}:`, error.message);
          // Mark all items in this batch as failed
          batch.forEach(item => {
            errors.push({ item, error: error.message });
          });
          break;
        }
      }
    }
  }

  logger.info(`Bulk insert with retry completed: ${results.length} items inserted, ${errors.length} failed in table ${tableName}`);
  
  return { results, errors };
};

/**
 * Update an item in DynamoDB
 */
export const updateItem = async (tableName, key, updates) => {
  try {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Filter out reserved fields and null/undefined values
    const filteredUpdates = Object.entries(updates).filter(([key, value]) => {
      const reservedFields = ['created_at', 'id', 'jd_id']; // Add other reserved fields as needed
      return !reservedFields.includes(key) && value !== null && value !== undefined;
    });

    filteredUpdates.forEach(([key, value]) => {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;
      
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);
    logger.info(`Updated item in table ${tableName}`);
    
    return result.Attributes;
  } catch (error) {
    logger.error(`Failed to update item in table ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Get an item from DynamoDB
 */
export const getItem = async (tableName, key) => {
  try {
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: key
    });

    const result = await docClient.send(getCommand);
    return result.Item;
  } catch (error) {
    logger.error(`Failed to get item from table ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Query items from DynamoDB
 */
export const queryItems = async (tableName, queryParams) => {
  try {
    const queryCommand = new QueryCommand({
      TableName: tableName,
      ...queryParams
    });

    const result = await docClient.send(queryCommand);
    return result.Items;
  } catch (error) {
    logger.error(`Failed to query items from table ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Scan items from DynamoDB
 */
export const scanItems = async (tableName, scanParams = {}) => {
  try {
    const scanCommand = new ScanCommand({
      TableName: tableName,
      ...scanParams
    });

    const result = await docClient.send(scanCommand);
    return result.Items;
  } catch (error) {
    logger.error(`Failed to scan items from table ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Delete an item from DynamoDB
 */
export const deleteItem = async (tableName, key) => {
  try {
    const deleteCommand = new DeleteCommand({
      TableName: tableName,
      Key: key
    });

    await docClient.send(deleteCommand);
    logger.info(`Deleted item from table ${tableName}`);
  } catch (error) {
    logger.error(`Failed to delete item from table ${tableName}:`, error.message);
    throw error;
  }
};

// Pre-configured functions for common use cases
export const insertJobDescriptions = async (jobDescriptions) => {
  return insertItemsWithRetry('job_descriptions', jobDescriptions, {
    idField: 'id',
    idPrefix: 'job',
    additionalFields: {},
    statusField: 'status',
    statusValue: 'discovered',
    timestampField: 'scrapedAt',
    maxRetries: 3
  });
};

export const insertUserProfiles = async (userProfiles) => {
  return insertItemsWithRetry('user_profiles', userProfiles, {
    idField: 'id',
    idPrefix: 'user',
    additionalFields: {},
    statusField: 'status',
    statusValue: 'active',
    timestampField: 'createdAt',
    maxRetries: 3
  });
};

export const insertApplicationData = async (applicationData) => {
  return insertItemsWithRetry('application_data', applicationData, {
    idField: 'id',
    idPrefix: 'app',
    additionalFields: {},
    statusField: 'status',
    statusValue: 'submitted',
    timestampField: 'submittedAt',
    maxRetries: 3
  });
}; 