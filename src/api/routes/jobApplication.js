import express from 'express';
import { z } from 'zod';
import { logger } from '../../shared/utils/logger.js';
import { applyToJob, applyToMultipleJobs } from '../../workflows/job-application/index.js';
import { candidateProfileSchema, jobApplicationInputSchema, batchJobApplicationInputSchema } from '../../shared/types/schemas.js';
import { exampleCandidateData } from '../../shared/types/schemas.js';
import { runEasyApplyWorkflow } from '../../new-workflows/easyApply/index.js';
import { enhancedStagehandClient } from '../../shared/utils/enhancedStagehand.js';

const router = express.Router();

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
};

// Single job application
router.post('/single', validateRequest(jobApplicationInputSchema), async (req, res) => {
  try {
    const { jobUrl, candidateData, jobDescription, applicationSettings } = req.validatedData;
    
    logger.info('API: Single job application request', {
      jobUrl,
      candidateEmail: candidateData.personal.email,
      hasJobDescription: !!jobDescription,
      apiKey: req.apiKey
    });

    const result = await runEasyApplyWorkflow(jobUrl, candidateData, enhancedStagehandClient);
    
    logger.info('API: Single job application completed', {
      jobUrl,
      status: result.status,
      applicationId: result.confirmationDetails?.applicationId,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Single job application failed', {
      error: error.message,
      jobUrl: req.validatedData?.jobUrl,
      apiKey: req.apiKey
    });

    res.status(500).json({
      success: false,
      error: 'Application Failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Batch job applications
router.post('/batch', validateRequest(batchJobApplicationInputSchema), async (req, res) => {
  try {
    const { jobUrls, candidateData, jobDescriptions, applicationSettings } = req.validatedData;
    
    logger.info('API: Batch job application request', {
      jobCount: jobUrls.length,
      candidateEmail: candidateData.personal.email,
      apiKey: req.apiKey
    });

    const results = await applyToMultipleJobs(jobUrls, candidateData, jobDescriptions);
    
    logger.info('API: Batch job application completed', {
      totalJobs: results.summary.total,
      successful: results.summary.successful,
      failed: results.summary.failed,
      successRate: results.summary.successRate,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Batch job application failed', {
      error: error.message,
      jobCount: req.validatedData?.jobUrls?.length,
      apiKey: req.apiKey
    });

    res.status(500).json({
      success: false,
      error: 'Batch Application Failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get example candidate data
router.get('/example-candidate', (req, res) => {
  res.json({
    success: true,
    data: exampleCandidateData,
    timestamp: new Date().toISOString()
  });
});

// Validate candidate data
router.post('/validate-candidate', validateRequest(candidateProfileSchema), (req, res) => {
  res.json({
    success: true,
    message: 'Candidate data is valid',
    data: req.validatedData,
    timestamp: new Date().toISOString()
  });
});

// Get API documentation
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Job Application API Documentation',
    version: '1.0.0',
    endpoints: {
      'POST /single': {
        description: 'Apply to a single job',
        body: {
          jobUrl: 'string (required)',
          candidateData: 'object (required)',
          jobDescription: 'object (optional)',
          applicationSettings: 'object (optional)'
        },
        example: {
          jobUrl: 'https://linkedin.com/jobs/view/123456789',
          candidateData: exampleCandidateData,
          jobDescription: {
            title: 'Software Engineer',
            company: 'Tech Corp',
            description: 'Job description...'
          }
        }
      },
      'POST /batch': {
        description: 'Apply to multiple jobs',
        body: {
          jobUrls: 'array of strings (required)',
          candidateData: 'object (required)',
          jobDescriptions: 'array of objects (optional)',
          applicationSettings: 'object (optional)'
        }
      },
      'GET /example-candidate': {
        description: 'Get example candidate data structure'
      },
      'POST /validate-candidate': {
        description: 'Validate candidate data without applying'
      }
    },
    headers: {
      'X-API-Key': 'Required for all endpoints except /health'
    },
    timestamp: new Date().toISOString()
  });
});

export default router; 