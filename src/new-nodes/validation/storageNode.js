/**
 * Storage Node
 * Class for storing job extraction results using DynamoDB utilities
 */

import { updateItem, insertItem } from '../../shared/utils/dynamoDB.js';

/**
 * Storage Node Class
 * Stores job extraction results and updates job status
 */
class StorageNode {
  constructor(config = {}) {
    this.tableName = config.tableName || process.env.DYNAMODB_TABLE_NAME;
    this.batchSize = config.batchSize || 25;
  }

  /**
   * Execute the storage node
   * @param {Object} state - Workflow state
   * @returns {Promise<Object>} Node result
   */
  async execute(state) {
    try {
      console.log('StorageNode: Starting job storage...');
      
      if (!state.currentJob || !state.currentJob.id) {
        throw new Error('No job ID available for storage');
      }

      if (!state.dimension_mapping) {
        throw new Error('No dimension mapping available for storage');
      }

      const jobId = state.currentJob.id;
      const dimensionMapping = state.dimension_mapping;
      const domainClassification = state.domain_classification;
      const experienceClassification = state.experience_classification;
      const qualityValidation = state.quality_validation;
      
      console.log(`StorageNode: Storing job ${jobId} with ${Object.keys(dimensionMapping.dimensions).length} dimensions`);
      
      // Prepare storage data
      const storageData = this.prepareStorageData(state);
      
      // Update job status from "discovered" to "extracted"
      const updateResult = await this.updateJobStatus(jobId, storageData);
      
      // Store extraction metadata
      const metadataResult = await this.storeExtractionMetadata(jobId, state);
      
      console.log(`StorageNode: Successfully stored job ${jobId} with status "extracted"`);
      
      return {
        success: true,
        data: {
          job_id: jobId,
          status: 'extracted',
          stored_dimensions: Object.keys(dimensionMapping.dimensions).length,
          quality_score: qualityValidation?.quality_score || 0,
          storage_timestamp: new Date().toISOString(),
          update_result: updateResult,
          metadata_result: metadataResult
        },
        metadata: {
          node: 'storage',
          timestamp: new Date(),
          job_id: jobId,
          dimensions_stored: Object.keys(dimensionMapping.dimensions).length
        }
      };

    } catch (error) {
      console.error('StorageNode: Error storing job:', error);
      return {
        success: false,
        error: error.message,
        data: {
          job_id: state.currentJob?.id,
          status: 'storage_failed',
          error: error.message
        },
        metadata: {
          node: 'storage',
          timestamp: new Date(),
          error: error.stack
        }
      };
    }
  }

  /**
   * Prepare storage data from state
   * @param {Object} state - Workflow state
   * @returns {Object} Storage data
   */
  prepareStorageData(state) {
    const {
      currentJob,
      job_analysis,
      domain_classification,
      experience_classification,
      dimension_mapping,
      quality_validation
    } = state;

    return {
      // Job metadata
      jd_id: currentJob.id,
      url: currentJob.url,
      company: currentJob.company,
      status: 'extracted',
      extracted_at: new Date().toISOString(),
      
      // Domain classification
      domain: domain_classification.domain,
      sub_domain: domain_classification.sub_domain,
      role: domain_classification.role,
      domain_confidence: domain_classification.confidence,
      
      // Experience classification
      experience_level: experience_classification.level,
      experience_confidence: experience_classification.confidence,
      required_dimensions: experience_classification.required_dimensions,
      analysis_depth: experience_classification.analysis_depth,
      
      // Dimension mapping
      dimensions: dimension_mapping.dimensions,
      total_dimensions: dimension_mapping.total_dimensions,
      required_dimensions_count: dimension_mapping.required_dimensions,
      extracted_required_count: dimension_mapping.extracted_required,
      completeness_score: dimension_mapping.completeness_score,
      
      // Quality validation
      quality_score: quality_validation?.quality_score || 0,
      validation_passed: quality_validation?.passed || false,
      validation_issues: quality_validation?.issues || [],
      
      // Raw content for re-analysis
      raw_content: {
        full_text: job_analysis.rawText,
        extracted_at: job_analysis.extractedAt
      },
      
      // Workflow metadata
      workflow_metadata: {
        nodes_completed: [
          'job_loader',
          'content_extractor', 
          'job_analyzer',
          'domain_classifier',
          'experience_detector',
          'dimension_mapper',
          'quality_validator',
          'storage'
        ],
        total_processing_time: this.calculateProcessingTime(state),
        quality_metrics: quality_validation?.quality_metrics || {}
      }
    };
  }

  /**
   * Update job status using DynamoDB utility
   * @param {string} jobId - Job ID
   * @param {Object} storageData - Data to store
   * @returns {Promise<Object>} Update result
   */
  async updateJobStatus(jobId, storageData) {
    try {
      const updateParams = {
        TableName: this.tableName,
        Key: { jd_id: jobId },
        UpdateExpression: 'SET #status = :status, #extracted_at = :extracted_at, #domain = :domain, #role = :role, #experience_level = :experience_level, #dimensions = :dimensions, #quality_score = :quality_score, #validation_passed = :validation_passed',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#extracted_at': 'extracted_at',
          '#domain': 'domain',
          '#role': 'role',
          '#experience_level': 'experience_level',
          '#dimensions': 'dimensions',
          '#quality_score': 'quality_score',
          '#validation_passed': 'validation_passed'
        },
        ExpressionAttributeValues: {
          ':status': 'extracted',
          ':extracted_at': storageData.extracted_at,
          ':domain': storageData.domain,
          ':role': storageData.role,
          ':experience_level': storageData.experience_level,
          ':dimensions': storageData.dimensions,
          ':quality_score': storageData.quality_score,
          ':validation_passed': storageData.validation_passed
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await updateItem(updateParams);
      console.log(`StorageNode: Updated job ${jobId} status to "extracted"`);
      
      return result;
      
    } catch (error) {
      console.error(`StorageNode: Error updating job ${jobId}:`, error);
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  /**
   * Store extraction metadata using DynamoDB utility
   * @param {string} jobId - Job ID
   * @param {Object} state - Workflow state
   * @returns {Promise<Object>} Insert result
   */
  async storeExtractionMetadata(jobId, state) {
    try {
      const metadataId = `${jobId}_metadata_${Date.now()}`;
      
      const metadataData = {
        jd_id: jobId,
        metadata_id: metadataId,
        workflow_metadata: state.metadata,
        quality_validation: state.quality_validation,
        domain_classification: state.domain_classification,
        experience_classification: state.experience_classification,
        dimension_mapping: state.dimension_mapping,
        raw_content: {
          full_text: state.job_analysis.rawText,
          extracted_at: state.job_analysis.extractedAt
        },
        created_at: new Date().toISOString()
      };

      const insertParams = {
        TableName: this.tableName,
        Item: metadataData
      };

      const result = await insertItem(insertParams);
      console.log(`StorageNode: Stored metadata for job ${jobId}`);
      
      return result;
      
    } catch (error) {
      console.error(`StorageNode: Error storing metadata for job ${jobId}:`, error);
      throw new Error(`Failed to store metadata: ${error.message}`);
    }
  }

  /**
   * Calculate total processing time
   * @param {Object} state - Workflow state
   * @returns {number} Processing time in milliseconds
   */
  calculateProcessingTime(state) {
    const startTime = state.metadata?.job_loader_timestamp;
    const endTime = new Date();
    
    if (!startTime) {
      return 0;
    }
    
    return new Date(endTime) - new Date(startTime);
  }

  /**
   * Get storage summary
   * @param {Object} result - Storage result
   * @returns {Object} Storage summary
   */
  getStorageSummary(result) {
    return {
      job_id: result.data.job_id,
      status: result.data.status,
      dimensions_stored: result.data.stored_dimensions,
      quality_score: result.data.quality_score,
      storage_timestamp: result.data.storage_timestamp,
      success: result.success
    };
  }
}

export default StorageNode; 