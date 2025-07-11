import { 
  insertItem, 
  insertItems, 
  insertItemsWithRetry,
  updateItem, 
  getItem, 
  queryItems, 
  deleteItem,
  insertJobDescriptions,
  insertUserProfiles,
  insertApplicationData
} from '../src/shared/utils/dynamoDB.js';

// Example 1: Insert a single job description
const insertSingleJobExample = async () => {
  const jobDescription = {
    url: 'https://example.com/job1',
    company: 'Tech Corp',
    domain: 'software',
    filters: { location: 'SF' }
  };
  
  try {
    const result = await insertJobDescriptions([jobDescription]);
    console.log('Inserted job:', result.results[0]);
    return result;
  } catch (error) {
    console.error('Failed to insert job:', error);
  }
};

// Example 2: Insert multiple job descriptions
const insertMultipleJobsExample = async () => {
  const jobDescriptions = [
    {
      url: 'https://example.com/job1',
      company: 'Tech Corp',
      domain: 'software',
      filters: { location: 'SF' }
    },
    {
      url: 'https://example.com/job2',
      company: 'Startup Inc',
      domain: 'software',
      filters: { location: 'NYC' }
    }
  ];
  
  try {
    const result = await insertJobDescriptions(jobDescriptions);
    console.log(`Inserted ${result.results.length} jobs, ${result.errors.length} failed`);
    return result;
  } catch (error) {
    console.error('Failed to insert jobs:', error);
  }
};

// Example 3: Insert user profiles
const insertUserProfilesExample = async () => {
  const userProfiles = [
    {
      email: 'user1@example.com',
      name: 'John Doe',
      skills: ['JavaScript', 'React']
    },
    {
      email: 'user2@example.com',
      name: 'Jane Smith',
      skills: ['Python', 'Django']
    }
  ];
  
  try {
    const result = await insertUserProfiles(userProfiles);
    console.log(`Inserted ${result.results.length} user profiles`);
    return result;
  } catch (error) {
    console.error('Failed to insert user profiles:', error);
  }
};

// Example 4: Insert application data
const insertApplicationDataExample = async () => {
  const applicationData = [
    {
      applicationId: 'app123',
      jobUrl: 'https://example.com/job',
      company: 'Tech Corp',
      resumePath: '/path/to/resume.pdf'
    }
  ];
  
  try {
    const result = await insertApplicationData(applicationData);
    console.log(`Inserted ${result.results.length} applications`);
    return result;
  } catch (error) {
    console.error('Failed to insert application data:', error);
  }
};

// Example 5: Generic insert with custom configuration
const customInsertExample = async () => {
  const items = [
    {
      url: 'https://example.com',
      title: 'Example Job',
      category: 'test'
    }
  ];
  
  try {
    const result = await insertItems('custom_table', items, {
      idField: 'id',
      idPrefix: 'custom',
      additionalFields: {
        source: 'custom-example',
        environment: 'development'
      },
      statusField: 'status',
      statusValue: 'active',
      timestampField: 'createdAt'
    });
    
    console.log(`Inserted ${result.results.length} custom items`);
    return result;
  } catch (error) {
    console.error('Failed to insert custom items:', error);
  }
};

// Example 5b: Bulk insert with retry logic
const bulkInsertWithRetryExample = async () => {
  const items = [
    { url: 'https://example.com/job1', company: 'Tech Corp' },
    { url: 'https://example.com/job2', company: 'Startup Inc' },
    { url: 'https://example.com/job3', company: 'Big Corp' }
  ];
  
  try {
    const result = await insertItemsWithRetry('job_descriptions', items, {
      idField: 'id',
      idPrefix: 'job',
      additionalFields: {
        source: 'bulk-insert-example'
      },
      statusField: 'status',
      statusValue: 'extracted',
      timestampField: 'scrapedAt',
      maxRetries: 3
    });
    
    console.log(`Bulk inserted ${result.results.length} items, ${result.errors.length} failed`);
    return result;
  } catch (error) {
    console.error('Failed to bulk insert items:', error);
  }
};

// Example 6: Update an item
const updateItemExample = async () => {
  try {
    const updatedItem = await updateItem('job_descriptions', 
      { id: 'job_abc123_1234567890' }, 
      { 
        status: 'applied',
        appliedAt: new Date().toISOString()
      }
    );
    
    console.log('Updated item:', updatedItem);
    return updatedItem;
  } catch (error) {
    console.error('Failed to update item:', error);
  }
};

// Example 7: Get an item
const getItemExample = async () => {
  try {
    const item = await getItem('job_descriptions', 
      { id: 'job_abc123_1234567890' }
    );
    
    console.log('Retrieved item:', item);
    return item;
  } catch (error) {
    console.error('Failed to get item:', error);
  }
};

// Example 8: Query items
const queryItemsExample = async () => {
  try {
    const items = await queryItems('job_descriptions', {
      IndexName: 'company-index',
      KeyConditionExpression: 'company = :company',
      ExpressionAttributeValues: {
        ':company': 'Tech Corp'
      }
    });
    
    console.log(`Found ${items.length} items for Tech Corp`);
    return items;
  } catch (error) {
    console.error('Failed to query items:', error);
  }
};

// Example 9: Delete an item
const deleteItemExample = async () => {
  try {
    await deleteItem('job_descriptions', 
      { id: 'job_abc123_1234567890' }
    );
    
    console.log('Deleted item successfully');
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
};

// Example 10: Insert single item with custom options
const insertSingleItemExample = async () => {
  const item = {
    url: 'https://example.com/job',
    company: 'Tech Corp',
    title: 'Software Engineer'
  };
  
  try {
    const result = await insertItem('job_descriptions', item, {
      idField: 'id',
      idPrefix: 'job',
      additionalFields: {
        source: 'manual-insert'
      },
      statusField: 'status',
      statusValue: 'extracted',
      timestampField: 'scrapedAt'
    });
    
    console.log('Inserted single item:', result);
    return result;
  } catch (error) {
    console.error('Failed to insert single item:', error);
  }
};

export {
  insertSingleJobExample,
  insertMultipleJobsExample,
  insertUserProfilesExample,
  insertApplicationDataExample,
  customInsertExample,
  bulkInsertWithRetryExample,
  updateItemExample,
  getItemExample,
  queryItemsExample,
  deleteItemExample,
  insertSingleItemExample
}; 