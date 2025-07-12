/**
 * Job Extraction Workflow
 * LangGraph-based workflow for job extraction
 */

import { StateGraph, END } from '@langchain/langgraph';
import jobLoaderNode from '../../new-nodes/processing/jobLoaderNode.js';
import contentExtractorNode from '../../new-nodes/processing/contentExtractorNode.js';
import jobAnalyzerNode from '../../new-nodes/analysis/jobAnalyzerNode.js';
import domainClassifierNode from '../../new-nodes/analysis/domainClassifierNode.js';
import experienceLevelDetectorNode from '../../new-nodes/analysis/experienceLevelDetectorNode.js';
import dimensionMapperNode from '../../new-nodes/mapping/dimensionMapperNode.js';
import qualityValidatorNode from '../../new-nodes/validation/qualityValidatorNode.js';
import storageNode from '../../new-nodes/storage/storageNode.js';
import StateManager from './utils/stateManager.js';
import { enhancedStagehandClient } from '../../shared/utils/enhancedStagehand.js';

/**
 * Job Extraction Workflow Class
 * LangGraph-based orchestrator for the job extraction process
 */
class JobExtractionWorkflow {
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 2000,
      stopOnError: config.stopOnError !== false,
      enableLogging: config.enableLogging !== false,
      ...config
    };

    // Initialize nodes (all pure functions)
    this.nodes = {
      job_loader: jobLoaderNode,
      content_extractor: contentExtractorNode,
      job_analyzer: jobAnalyzerNode,
      domain_classifier: domainClassifierNode,
      experience_level_detector: experienceLevelDetectorNode,
      dimension_mapper: dimensionMapperNode,
      quality_validator: qualityValidatorNode,
      storage: storageNode
    };

    // Initialize state manager
    this.stateManager = new StateManager(config.stateManager);

    // Create LangGraph workflow
    this.workflow = this.createWorkflow();
  }

  /**
   * Create LangGraph workflow with nodes and edges
   * @returns {StateGraph} LangGraph workflow
   */
  createWorkflow() {
    // Create state graph
    const workflow = new StateGraph({
      channels: {
        job_data: { value: null },
        page: { value: null },
        extracted_content: { value: null },
        analysis_results: { value: null },
        domain_classification: { value: null },
        experience_detection: { value: null },
        dimension_mapping: { value: null },
        quality_metrics: { value: null },
        current_node: { value: 'job_loader' },
        errors: { value: [] },
        metadata: { value: {} }
      }
    });

    // Add nodes to the workflow
    workflow.addNode('job_loader', this.createNodeWrapper('job_loader'));
    workflow.addNode('content_extractor', this.createNodeWrapper('content_extractor'));
    workflow.addNode('job_analyzer', this.createNodeWrapper('job_analyzer'));
    workflow.addNode('domain_classifier', this.createNodeWrapper('domain_classifier'));
    workflow.addNode('experience_level_detector', this.createNodeWrapper('experience_level_detector'));
    workflow.addNode('dimension_mapper', this.createNodeWrapper('dimension_mapper'));
    // workflow.addNode('quality_validator', this.createNodeWrapper('quality_validator'));
    workflow.addNode('storage', this.createNodeWrapper('storage'));

    // Define edges (workflow flow)
    workflow.addEdge('job_loader', 'content_extractor');
    workflow.addEdge('content_extractor', 'job_analyzer');
    workflow.addEdge('job_analyzer', 'domain_classifier');
    workflow.addEdge('domain_classifier', 'experience_level_detector');
    workflow.addEdge('experience_level_detector', 'dimension_mapper');
    // workflow.addEdge('dimension_mapper', 'quality_validator');
    workflow.addEdge('dimension_mapper', 'storage');
    // workflow.addEdge('quality_validator', 'storage');
    workflow.addEdge('storage', END);

    // Set entry point
    workflow.setEntryPoint('job_loader');

    return workflow.compile();
  }

    /**
   * Create a node wrapper for LangGraph
   * @param {string} nodeName - Name of the node
   * @returns {Function} Node wrapper function
   */
  createNodeWrapper(nodeName) {
    return async (state) => {
      try {
        console.log(`JobExtractionWorkflow: Executing node: ${nodeName}`);
        
        const node = this.nodes[nodeName];
        
        // All nodes are pure functions - call directly and return updated state
        return await node(state);
        
      } catch (error) {
        console.error(`JobExtractionWorkflow: Error executing node ${nodeName}:`, error);
        
        const errorState = { ...state };
        errorState.errors = [
          ...errorState.errors,
          {
            node: nodeName,
            error: error.message,
            timestamp: new Date().toISOString()
          }
        ];
        
        errorState.metadata = {
          ...errorState.metadata,
          [`${nodeName}_failed`]: true,
          [`${nodeName}_error`]: error.message,
          [`${nodeName}_timestamp`]: new Date().toISOString()
        };
        
        if (this.config.stopOnError) {
          throw error;
        }
        
        return errorState;
      }
    };
  }

  /**
   * Execute the complete workflow using LangGraph
   * @param {Object} initialJobData - Initial job data
   * @returns {Promise<Object>} Workflow execution result
   */
  async execute(initialJobData) {
    const startTime = new Date();
    
    try {
      console.log('JobExtractionWorkflow: Starting LangGraph workflow execution...');
      
      // Initialize state for LangGraph
      const initialState = {
        job_data: initialJobData,
        page: null,
        extracted_content: null,
        analysis_results: null,
        domain_classification: null,
        experience_detection: null,
        dimension_mapping: null,
        quality_metrics: null,
        current_node: 'job_loader',
        errors: [],
        metadata: {
          workflow_start: new Date().toISOString(),
          workflow_id: `workflow_${Date.now()}`
        }
      };
      
      // Execute LangGraph workflow
      const result = await this.workflow.invoke(initialState);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      // Prepare final results
      const workflowResult = {
        success: result.errors.length === 0,
        workflow_id: result.metadata.workflow_id,
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        final_state: result,
        summary: this.generateWorkflowSummary(result, duration),
        errors: result.errors
      };

      console.log(`JobExtractionWorkflow: LangGraph workflow completed. Success: ${workflowResult.success}, Duration: ${duration}ms`);
      
      return workflowResult;

    } catch (error) {
      console.error('JobExtractionWorkflow: LangGraph workflow execution failed:', error);
      
      const endTime = new Date();
      return {
        success: false,
        workflow_id: `workflow_${Date.now()}`,
        start_time: startTime,
        end_time: endTime,
        duration: endTime - startTime,
        error: error.message,
        summary: {
          total_nodes: Object.keys(this.nodes).length,
          successful_nodes: 0,
          failed_nodes: 0,
          success_rate: 0
        }
      };
    } finally {
      // Clean up Stagehand client
      try {
        await enhancedStagehandClient.close();
        console.log('JobExtractionWorkflow: Stagehand client closed successfully');
      } catch (error) {
        console.warn('JobExtractionWorkflow: Error closing Stagehand client:', error.message);
      }
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      await enhancedStagehandClient.close();
      console.log('JobExtractionWorkflow: Cleanup completed successfully');
    } catch (error) {
      console.warn('JobExtractionWorkflow: Error during cleanup:', error.message);
    }
  }

  /**
   * Execute workflow for a batch of jobs
   * @param {Array<Object>} jobBatch - Batch of job data
   * @returns {Promise<Object>} Batch execution results
   */
  async executeBatch(jobBatch) {
    console.log(`JobExtractionWorkflow: Starting batch execution for ${jobBatch.length} jobs`);
    
    const batchResults = {
      total_jobs: jobBatch.length,
      successful_jobs: 0,
      failed_jobs: 0,
      results: [],
      start_time: new Date(),
      end_time: null,
      duration: 0
    };

    for (const jobData of jobBatch) {
      try {
        const result = await this.execute(jobData);
        batchResults.results.push(result);
        
        if (result.success) {
          batchResults.successful_jobs++;
        } else {
          batchResults.failed_jobs++;
        }
        
      } catch (error) {
        console.error(`JobExtractionWorkflow: Error processing job ${jobData.id}:`, error);
        batchResults.failed_jobs++;
        batchResults.results.push({
          success: false,
          job_id: jobData.id,
          error: error.message
        });
      }
    }

    batchResults.end_time = new Date();
    batchResults.duration = batchResults.end_time - batchResults.start_time;
    batchResults.success_rate = batchResults.total_jobs > 0 ? batchResults.successful_jobs / batchResults.total_jobs : 0;

    console.log(`JobExtractionWorkflow: Batch execution completed. Success rate: ${(batchResults.success_rate * 100).toFixed(1)}%`);
    
    return batchResults;
  }

  /**
   * Generate workflow summary
   * @param {Object} finalState - Final workflow state
   * @param {number} duration - Workflow duration
   * @returns {Object} Workflow summary
   */
  generateWorkflowSummary(finalState, duration) {
    const completedNodes = Object.keys(finalState.metadata).filter(key => 
      key.endsWith('_completed') && finalState.metadata[key]
    ).length;
    
    const failedNodes = Object.keys(finalState.metadata).filter(key => 
      key.endsWith('_failed') && finalState.metadata[key]
    ).length;
    
    const totalNodes = Object.keys(this.nodes).length;
    
    return {
      total_nodes: totalNodes,
      successful_nodes: completedNodes,
      failed_nodes: failedNodes,
      success_rate: totalNodes > 0 ? completedNodes / totalNodes : 0,
      duration_ms: duration,
      duration_seconds: Math.round(duration / 1000),
      final_status: finalState.job_data?.status || 'unknown',
      quality_score: finalState.quality_metrics?.quality_score || 0,
      confidence_score: finalState.quality_metrics?.confidence_score || 0,
      completeness_score: finalState.quality_metrics?.completeness_score || 0,
      dimensions_extracted: this.countExtractedDimensions(finalState),
      domain_classified: finalState.domain_classification?.primary_domain || null,
      sub_domain_classified: finalState.domain_classification?.sub_domain || null,
      experience_level_detected: finalState.experience_detection?.primary_level || null,
      errors_count: finalState.errors.length
    };
  }

  /**
   * Count extracted dimensions
   * @param {Object} state - Workflow state
   * @returns {number} Number of extracted dimensions
   */
  countExtractedDimensions(state) {
    let count = 0;
    
    // Count analysis dimensions
    if (state.analysis_results?.dimensions) {
      count += Object.keys(state.analysis_results.dimensions).length;
    }
    
    // Count domain-specific dimensions
    if (state.dimension_mapping?.dimensions) {
      count += Object.keys(state.dimension_mapping.dimensions).length;
    }
    
    return count;
  }

  /**
   * Get workflow statistics
   * @returns {Object} Workflow statistics
   */
  getWorkflowStatistics() {
    return {
      total_nodes: Object.keys(this.nodes).length,
      node_types: Object.keys(this.nodes),
      execution_order: [
        'job_loader',
        'content_extractor', 
        'job_analyzer',
        'domain_classifier',
        'experience_level_detector',
        'dimension_mapper',
        'quality_validator',
        'storage'
      ],
      config: {
        max_retries: this.config.maxRetries,
        retry_delay: this.config.retryDelay,
        stop_on_error: this.config.stopOnError,
        enable_logging: this.config.enableLogging
      },
      langgraph_enabled: true
    };
  }

  /**
   * Validate workflow configuration
   * @returns {Object} Validation result
   */
  validateConfiguration() {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if all required nodes are available
    const requiredNodes = [
      'job_loader',
      'content_extractor',
      'job_analyzer', 
      'domain_classifier',
      'experience_level_detector',
      'dimension_mapper',
      'quality_validator',
      'storage'
    ];

    for (const nodeName of requiredNodes) {
      if (!this.nodes[nodeName]) {
        validation.isValid = false;
        validation.errors.push(`Missing node: ${nodeName}`);
      }
    }

    // Check configuration values
    if (this.config.maxRetries < 1) {
      validation.errors.push('maxRetries must be at least 1');
    }

    if (this.config.retryDelay < 0) {
      validation.errors.push('retryDelay must be non-negative');
    }

    if (validation.errors.length > 0) {
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * Utility function for delays
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default JobExtractionWorkflow; 