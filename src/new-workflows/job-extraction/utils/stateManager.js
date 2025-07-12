/**
 * State Management Utility
 * Manages workflow state and provides state persistence
 */

import { insertItem, getItem, updateItem } from '../../../shared/utils/dynamoDB.js';
import { logger } from '../../../shared/utils/logger.js';

/**
 * State Manager Class
 * Handles workflow state management and persistence
 */
class StateManager {
  constructor(config = {}) {
    this.tableName = config.tableName || process.env.DYNAMODB_TABLE || 'job-extraction-table';
    this.state = null;
  }

  /**
   * Initialize workflow state
   * @param {Object} jobData - Initial job data
   * @returns {Object} Initial workflow state
   */
  initializeState(jobData) {
    this.state = {
      job_data: {
        id: jobData.id,
        url: jobData.url,
        status: 'processing',
        title: null,
        company: null,
        location: null,
        salary: null,
        experience_level: null,
        extracted_data: {},
        metadata: {},
        created_at: new Date(),
        updated_at: new Date()
      },
      current_node: 'job_loader',
      extracted_content: null,
      analysis_results: null,
      domain_classification: null,
      dimension_mapping: null,
      quality_metrics: null,
      errors: [],
      metadata: {
        workflow_start: new Date(),
        nodes_completed: [],
        retry_count: 0
      }
    };

    return this.state;
  }

  /**
   * Update workflow state
   * @param {Object} updates - State updates
   */
  updateState(updates) {
    if (!this.state) {
      throw new Error('State not initialized');
    }

    // Deep merge updates
    this.mergeState(this.state, updates);
    
    // Update timestamp
    this.state.job_data.updated_at = new Date();
    
    return this.state;
  }

  /**
   * Deep merge state updates
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   */
  mergeState(target, source) {
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!target[key]) {
          target[key] = {};
        }
        this.mergeState(target[key], value);
      } else {
        target[key] = value;
      }
    }
  }

  /**
   * Add error to state
   * @param {Error} error - Error object
   * @param {string} node - Node where error occurred
   */
  addError(error, node) {
    if (!this.state) {
      throw new Error('State not initialized');
    }

    const errorEntry = {
      message: error.message,
      stack: error.stack,
      node: node,
      timestamp: new Date(),
      type: error.constructor.name
    };

    this.state.errors.push(errorEntry);
    this.state.job_data.status = 'failed';
  }

  /**
   * Mark node as completed
   * @param {string} nodeName - Name of completed node
   */
  markNodeCompleted(nodeName) {
    if (!this.state) {
      throw new Error('State not initialized');
    }

    if (!this.state.metadata.nodes_completed.includes(nodeName)) {
      this.state.metadata.nodes_completed.push(nodeName);
    }
  }

  /**
   * Get current state
   * @returns {Object} Current workflow state
   */
  getState() {
    return this.state;
  }

  /**
   * Save state to DynamoDB
   * @returns {Promise<Object>} Save result
   */
  async saveState() {
    if (!this.state) {
      throw new Error('State not initialized');
    }

    try {
      const item = {
        id: this.state.job_data.id,
        url: this.state.job_data.url,
        status: this.state.job_data.status,
        data: this.state.job_data,
        domain: this.state.domain_classification?.primary_domain,
        sub_domain: this.state.domain_classification?.sub_domain,
        extracted_dimensions: this.state.dimension_mapping?.dimensions,
        quality_metrics: this.state.quality_metrics,
        workflow_state: this.state,
        created_at: this.state.job_data.created_at.toISOString(),
        updated_at: this.state.job_data.updated_at.toISOString()
      };

      await insertItem(this.tableName, item, {
        idField: 'id',
        idPrefix: 'job',
        additionalFields: {},
        statusField: 'status',
        statusValue: this.state.job_data.status,
        timestampField: 'updated_at'
      });
      
      logger.info(`State saved successfully for job ID: ${this.state.job_data.id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to save state: ${error.message}`);
      throw new Error(`Failed to save state: ${error.message}`);
    }
  }

  /**
   * Load state from DynamoDB
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Loaded state
   */
  async loadState(jobId) {
    try {
      const result = await getItem(this.tableName, { id: jobId });
      
      if (!result) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      this.state = result.workflow_state || result;
      logger.info(`State loaded successfully for job ID: ${jobId}`);
      return this.state;
    } catch (error) {
      logger.error(`Failed to load state: ${error.message}`);
      throw new Error(`Failed to load state: ${error.message}`);
    }
  }

  /**
   * Update job status
   * @param {string} status - New status
   */
  updateJobStatus(status) {
    if (!this.state) {
      throw new Error('State not initialized');
    }

    this.state.job_data.status = status;
    this.state.job_data.updated_at = new Date();
  }

  /**
   * Get job data
   * @returns {Object} Job data
   */
  getJobData() {
    return this.state?.job_data;
  }

  /**
   * Get extracted content
   * @returns {Object} Extracted content
   */
  getExtractedContent() {
    return this.state?.extracted_content;
  }

  /**
   * Get analysis results
   * @returns {Object} Analysis results
   */
  getAnalysisResults() {
    return this.state?.analysis_results;
  }

  /**
   * Get domain classification
   * @returns {Object} Domain classification
   */
  getDomainClassification() {
    return this.state?.domain_classification;
  }

  /**
   * Get dimension mapping
   * @returns {Object} Dimension mapping
   */
  getDimensionMapping() {
    return this.state?.dimension_mapping;
  }

  /**
   * Get quality metrics
   * @returns {Object} Quality metrics
   */
  getQualityMetrics() {
    return this.state?.quality_metrics;
  }

  /**
   * Get errors
   * @returns {Array} Errors
   */
  getErrors() {
    return this.state?.errors || [];
  }

  /**
   * Check if workflow has errors
   * @returns {boolean} True if has errors
   */
  hasErrors() {
    return this.state?.errors?.length > 0;
  }

  /**
   * Get current node
   * @returns {string} Current node name
   */
  getCurrentNode() {
    return this.state?.current_node;
  }

  /**
   * Set current node
   * @param {string} nodeName - Node name
   */
  setCurrentNode(nodeName) {
    if (this.state) {
      this.state.current_node = nodeName;
    }
  }

  /**
   * Get completed nodes
   * @returns {Array<string>} Completed node names
   */
  getCompletedNodes() {
    return this.state?.metadata?.nodes_completed || [];
  }

  /**
   * Check if node is completed
   * @param {string} nodeName - Node name
   * @returns {boolean} True if completed
   */
  isNodeCompleted(nodeName) {
    return this.getCompletedNodes().includes(nodeName);
  }

  /**
   * Get retry count
   * @returns {number} Retry count
   */
  getRetryCount() {
    return this.state?.metadata?.retry_count || 0;
  }

  /**
   * Increment retry count
   */
  incrementRetryCount() {
    if (this.state?.metadata) {
      this.state.metadata.retry_count = (this.state.metadata.retry_count || 0) + 1;
    }
  }

  /**
   * Reset retry count
   */
  resetRetryCount() {
    if (this.state?.metadata) {
      this.state.metadata.retry_count = 0;
    }
  }
}

export default StateManager; 