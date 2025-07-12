/**
 * Storage Node
 * Saves extracted job data to DynamoDB with status "extracted"
 */

import { insertItem, getItem, updateItem } from '../../shared/utils/dynamoDB.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Storage Node (Pure Function)
 * Saves extracted job data to DynamoDB with status "extracted"
 */
const storageNode = async (state) => {
  console.log('=== STORAGE NODE START ===');
  console.log('State Keys:', Object.keys(state));
  console.log('Job Data Keys:', Object.keys(state.job_data || {}));
  console.log('Analysis Results Keys:', Object.keys(state.analysis_results || {}));
  console.log('Dimension Mapping Keys:', Object.keys(state.dimension_mapping || {}));
  console.log('Domain Classification Keys:', Object.keys(state.domain_classification || {}));
  console.log('Quality Metrics Keys:', Object.keys(state.quality_metrics || {}));
  console.log('Extracted Content Keys:', Object.keys(state.extracted_content || {}));
  console.log('Entities Keys:', Object.keys(state.entities || {}));
  console.log('=== STORAGE NODE END ===');
  try {
    if (!state.job_data || !state.analysis_results || !state.dimension_mapping) {
      throw new Error('No job data, analysis results, or dimension mapping available for storage');
    }

    if (!state.job_data?.entities) {
      throw new Error('No formatted entities available for storage');
    }

    const jobData = state.job_data;
    const analysisResults = state.analysis_results;
    const dimensionMapping = state.dimension_mapping;
    const domainClassification = state.domain_classification;
    const qualityMetrics = state.quality_metrics;
    const extractedContent = state.extracted_content;
    const entities = state.job_data?.entities;

    // Merge all extracted dimensions
    const extractedDimensions = {};
    if (analysisResults?.dimensions) {
      for (const [dimension, data] of Object.entries(analysisResults.dimensions)) {
        extractedDimensions[dimension] = {
          value: data.value,
          confidence: data.confidence,
          source: data.source || 'analysis',
          metadata: data.metadata || {}
        };
      }
    }
    if (dimensionMapping?.dimensions) {
      for (const [dimension, data] of Object.entries(dimensionMapping.dimensions)) {
        if (extractedDimensions[dimension]) {
          extractedDimensions[dimension] = {
            ...extractedDimensions[dimension],
            domain_value: data.value,
            domain_confidence: data.confidence,
            domain_source: data.source || 'domain_mapping',
            domain_metadata: data.metadata || {}
          };
        } else {
          extractedDimensions[dimension] = {
            value: data.value,
            confidence: data.confidence,
            source: data.source || 'domain_mapping',
            metadata: data.metadata || {}
          };
        }
      }
    }

    // Prepare storage item with formatted entities
    const storageData = {
      jd_id: jobData.jd_id || jobData.id,
      url: jobData.url,
      status: 'extracted',
      data: {
        ...jobData,
        extracted_data: extractedDimensions,
        analysis_results: analysisResults,
        dimension_mapping: dimensionMapping,
        domain_classification: domainClassification,
        quality_metrics: qualityMetrics,
        extracted_content: extractedContent
      },
      domain: domainClassification?.domain,
      sub_domain: domainClassification?.sub_domain,
      role: domainClassification?.role,
      experience_level: state.experience_detection?.level,
      extracted_dimensions: extractedDimensions,
      quality_metrics: qualityMetrics,
      entities: entities,
      created_at: jobData.created_at,
      updated_at: new Date().toISOString(),
      extraction_metadata: {
        extraction_time: new Date().toISOString(),
        total_dimensions: Object.keys(extractedDimensions).length,
        quality_score: qualityMetrics?.quality_score || 0,
        confidence_score: qualityMetrics?.confidence_score || 0,
        completeness_score: qualityMetrics?.completeness_score || 0,
        validation_passed: qualityMetrics?.passed || false,
        entities_formatted: true
      }
    };

    // Log the storage data before insertion
    console.log('=== STORAGE DATA BEFORE INSERTION ===');
    console.log('Storage Data Keys:', Object.keys(storageData));
    console.log('JD ID:', storageData.jd_id);
    console.log('URL:', storageData.url);
    console.log('Status:', storageData.status);
    console.log('Domain:', storageData.domain);
    console.log('Role:', storageData.role);
    console.log('Experience Level:', storageData.experience_level);
    console.log('Entities Keys:', Object.keys(storageData.entities || {}));
    console.log('Entities Sample:', JSON.stringify(storageData.entities, null, 2).substring(0, 500) + '...');
    console.log('Data Keys:', Object.keys(storageData.data || {}));
    console.log('Extraction Metadata:', storageData.extraction_metadata);
    console.log('=== END STORAGE DATA ===');

    // Check if record exists and implement upsert logic
    const tableName = process.env.DYNAMODB_TABLE || 'job_descriptions';
    const existingRecord = await getItem(tableName, { jd_id: storageData.jd_id });
    
    let finalStorageData;
    if (existingRecord) {
      console.log('StorageNode: Existing record found, implementing upsert logic...');
      
      
      // Merge extracted_dimensions (replace overlapping, keep existing non-overlapping)
      const mergedExtractedDimensions = {
        ...existingRecord.extracted_dimensions,
        ...storageData.extracted_dimensions
      };
      
      // Merge extraction_metadata (replace overlapping, keep existing non-overlapping)
      const mergedExtractionMetadata = {
        ...existingRecord.extraction_metadata,
        ...storageData.extraction_metadata
      };
      
      // Remove key fields that can't be updated
      const { jd_id, ...updateData } = {
        ...existingRecord,
        ...storageData,
        entities: storageData.entities,
        data: existingRecord.data,
        extracted_dimensions: mergedExtractedDimensions,
        extraction_metadata: mergedExtractionMetadata,
        updated_at: new Date().toISOString()
      };
      
      finalStorageData = { jd_id, ...updateData };
      
      console.log('StorageNode: Merged with existing record');
      console.log('StorageNode: Original entities keys:', Object.keys(existingRecord.entities || {}));
      console.log('StorageNode: New entities keys:', Object.keys(storageData.entities || {}));
      // console.log('StorageNode: Merged entities keys:', Object.keys(mergedEntities));
      
      // Update existing record (excluding key fields)
      await updateItem(tableName, { jd_id: storageData.jd_id }, updateData);
      console.log('StorageNode: Updated existing record');
      
    } else {
      console.log('StorageNode: No existing record found, creating new record...');
      finalStorageData = storageData;
      
      // Insert new record
      await insertItem(tableName, finalStorageData, {
        idField: 'jd_id',
        idPrefix: 'job',
        additionalFields: {},
        statusField: 'status',
        statusValue: 'extracted',
        timestampField: 'updated_at'
      });
      console.log('StorageNode: Created new record');
    }

    logger.info(`StorageNode: Successfully stored job data for job ID: ${jobData.jd_id || jobData.id}`);

    return {
      ...state,
      job_data: {
        ...jobData,
        status: 'extracted',
        updated_at: new Date().toISOString()
      },
      storage_result: {
        job_id: jobData.jd_id || jobData.id,
        status: 'extracted',
        message: 'Job data stored successfully'
      },
      current_node: 'storage'
    };
  } catch (error) {
    logger.error('StorageNode: Error storing data:', error);
    logger.error('StorageNode: Error details:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      stateKeys: Object.keys(state),
      hasJobData: !!state.job_data,
      hasAnalysisResults: !!state.analysis_results,
      hasDimensionMapping: !!state.dimension_mapping,
      hasEntities: !!state.entities,
      tableName: process.env.DYNAMODB_TABLE || 'job_descriptions',
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      hasAwsCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    });
    
    return {
      ...state,
      errors: [
        ...(state.errors || []),
        {
          node: 'storage',
          error: error.message,
          errorDetails: {
            name: error.name,
            stack: error.stack
          },
          timestamp: new Date().toISOString()
        }
      ],
      storage_result: {
        job_id: state.job_data?.id,
        status: 'failed',
        message: error.message
      },
      current_node: 'storage'
    };
  }
};

export default storageNode; 