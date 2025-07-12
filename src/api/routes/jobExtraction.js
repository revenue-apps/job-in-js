/**
 * Job Extraction API Routes
 * HTTP endpoints for triggering job extraction workflows
 */

import express from 'express';
import { getItem } from '../../shared/utils/dynamoDB.js';
import { logger } from '../../shared/utils/logger.js';
import JobExtractionWorkflow from '../../new-workflows/job-extraction/index.js';

const router = express.Router();

/**
 * POST /api/v1/job-extraction
 * Trigger job extraction workflow for a single job
 */
router.post('/job-extraction', async (req, res) => {
  try {
    const startTime = new Date();
    
    // Validate input
    const { job_id, options = {} } = req.body;
    
    if (!job_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: job_id',
        message: 'Job ID is required to start extraction workflow'
      });
    }

    logger.info(`JobExtractionAPI: Starting extraction for job ${job_id}`);

    // Validate job exists and has correct status
    const tableName = process.env.DYNAMODB_TABLE || 'job_descriptions';
    const job = await getItem(tableName, { jd_id: job_id });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        message: `Job with ID ${job_id} not found in database`
      });
    }

    if (job.status !== 'discovered') {
      return res.status(400).json({
        success: false,
        error: 'Invalid job status',
        message: `Job ${job_id} has status '${job.status}', expected 'discovered'`
      });
    }

    // Initialize workflow with configuration
    const workflowConfig = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 2000,
      stopOnError: options.stopOnError !== false,
      enableLogging: options.enableLogging !== false,
      contentExtractor: {
        timeout: options.timeout || 30000,
        waitForNetworkIdle: true
      },
      jobAnalyzer: {
        extractRawContent: options.extractRawContent !== false,
        confidenceThreshold: options.confidenceThreshold || 0.8
      },
      qualityValidator: {
        confidenceThreshold: options.confidenceThreshold || 0.7,
        completenessThreshold: options.completenessThreshold || 0.8,
        qualityThreshold: options.qualityThreshold || 0.75
      },
      storage: {
        tableName: tableName,
        updateStatus: true
      }
    };

    // Create workflow instance
    const workflow = new JobExtractionWorkflow(workflowConfig);
    
    // Validate workflow configuration
    const validation = workflow.validateConfiguration();
    if (!validation.isValid) {
      return res.status(500).json({
        success: false,
        error: 'Workflow configuration invalid',
        message: 'Failed to initialize workflow',
        details: validation.errors
      });
    }

    // Prepare initial job data
    const initialJobData = {
      jd_id: job.jd_id,
      url: job.url,
      status: job.status,
      filters: job.filters || {},
      metadata: job.metadata || {}
    };

    // Execute workflow
    logger.info(`JobExtractionAPI: Executing workflow for job ${job_id}`);
    const workflowResult = await workflow.execute(initialJobData);
    
    const endTime = new Date();
    const duration = endTime - startTime;

    // Prepare response
    if (workflowResult.success) {
      const finalState = workflowResult.final_state;
      
      const response = {
        success: true,
        workflow_id: workflowResult.workflow_id,
        job_id: job_id,
        status: finalState.job_data?.status || 'extracted',
        duration_ms: duration,
        duration_seconds: Math.round(duration / 1000),
        quality_metrics: finalState.quality_metrics || {},
        job_data: {
          title: finalState.job_data?.title,
          company: finalState.job_data?.company,
          location: finalState.job_data?.location,
          salary: finalState.job_data?.salary,
          experience_level: finalState.experience_detection?.level,
          domain: finalState.domain_classification?.domain,
          sub_domain: finalState.domain_classification?.sub_domain
        },
        extracted_dimensions: finalState.dimension_mapping?.dimensions || {},
        analysis_metadata: {
          extracted_at: finalState.job_data?.updated_at,
          confidence_score: finalState.quality_metrics?.confidence_score,
          completeness_score: finalState.quality_metrics?.completeness_score,
          total_dimensions: finalState.dimension_mapping?.total_dimensions || 0
        },
        summary: workflowResult.summary
      };

      logger.info(`JobExtractionAPI: Successfully extracted job ${job_id} in ${duration}ms`);
      return res.status(200).json(response);

    } else {
      // Workflow failed
      const errorResponse = {
        success: false,
        workflow_id: workflowResult.workflow_id,
        job_id: job_id,
        error: workflowResult.error || 'Workflow execution failed',
        duration_ms: duration,
        duration_seconds: Math.round(duration / 1000),
        errors: workflowResult.errors || [],
        summary: workflowResult.summary
      };

      logger.error(`JobExtractionAPI: Workflow failed for job ${job_id}: ${workflowResult.error}`);
      return res.status(500).json(errorResponse);
    }

  } catch (error) {
    logger.error('JobExtractionAPI: Unexpected error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred during job extraction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/job-extraction/status/:workflow_id
 * Get workflow status and progress
 */
router.get('/job-extraction/status/:workflow_id', async (req, res) => {
  try {
    const { workflow_id } = req.params;
    
    // For now, return basic status
    // In a full implementation, you'd query workflow state from DynamoDB
    return res.status(200).json({
      success: true,
      workflow_id: workflow_id,
      status: 'completed', // This would be dynamic based on actual state
      message: 'Workflow status endpoint - implementation pending'
    });

  } catch (error) {
    logger.error('JobExtractionAPI: Error getting workflow status:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get workflow status'
    });
  }
});

/**
 * GET /api/v1/job-extraction/health
 * Health check endpoint
 */
router.get('/job-extraction/health', (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'job-extraction-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router; 