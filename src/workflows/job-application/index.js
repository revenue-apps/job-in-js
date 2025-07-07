import { StateGraph, END } from '@langchain/langgraph';
import { logger } from '../../shared/utils/logger.js';
import { enhancedStagehandClient } from '../../shared/utils/enhancedStagehand.js';
import { jobClassifierNode } from './nodes/jobClassifier.js';
import { applicationRouterNode } from './nodes/applicationRouter.js';
import { easyApplyNode } from './nodes/easyApplyNode.js';
import { formSubmissionNode } from './nodes/formSubmissionNode.js';
import { resumeUploadNode } from './nodes/resumeUploadNode.js';
import { confirmationHandlerNode } from './nodes/confirmationHandler.js';
import { errorHandlerNode } from './nodes/errorHandler.js';
import { outputGeneratorNode } from './nodes/outputGenerator.js';
import { jobApplicationStateSchema } from './types.js';
import { createCandidateProfile } from '../../utils/candidateProfile.js';

// Define the state schema
const stateSchema = {
  jobUrl: { value: '' },
  candidateData: { value: null },
  jobDescription: { value: null },
  applicationType: { value: 'unknown' },
  requirements: { value: null },
  applicationResult: { value: null },
  error: { value: null },
  status: { value: 'pending' },
  timestamp: { value: null },
};

// Create the workflow
export function createJobApplicationWorkflow() {
  const workflow = new StateGraph({
    channels: stateSchema,
  });

  // Add nodes
  workflow.addNode('jobClassifier', jobClassifierNode);
  workflow.addNode('applicationRouter', applicationRouterNode);
  workflow.addNode('easyApply', easyApplyNode);
  workflow.addNode('formSubmission', formSubmissionNode);
  workflow.addNode('resumeUpload', resumeUploadNode);
  workflow.addNode('confirmationHandler', confirmationHandlerNode);
  workflow.addNode('errorHandler', errorHandlerNode);
  workflow.addNode('outputGenerator', outputGeneratorNode);

  // Define the workflow edges
  workflow.setEntryPoint('jobClassifier');
  
  // From job classifier to router
  workflow.addEdge('jobClassifier', 'applicationRouter');
  
  // From router to specific application handlers
  workflow.addConditionalEdges(
    'applicationRouter',
    (state) => state.nextNode,
    {
      'easyApply': 'easyApply',
      'formSubmission': 'formSubmission',
      'resumeUpload': 'resumeUpload',
      'errorHandler': 'errorHandler',
    }
  );
  
  // From application handlers to confirmation or output
  workflow.addConditionalEdges(
    'easyApply',
    (state) => state.nextNode,
    {
      'confirmationHandler': 'confirmationHandler',
      'outputGenerator': 'outputGenerator',
    }
  );
  
  workflow.addConditionalEdges(
    'formSubmission',
    (state) => state.nextNode,
    {
      'confirmationHandler': 'confirmationHandler',
      'outputGenerator': 'outputGenerator',
    }
  );
  
  workflow.addConditionalEdges(
    'resumeUpload',
    (state) => state.nextNode,
    {
      'confirmationHandler': 'confirmationHandler',
      'outputGenerator': 'outputGenerator',
    }
  );
  
  // From confirmation handler to output
  workflow.addEdge('confirmationHandler', 'outputGenerator');
  
  // From error handler to output
  workflow.addEdge('errorHandler', 'outputGenerator');
  
  // Output generator is the end
  workflow.addEdge('outputGenerator', END);

  return workflow.compile();
}

// Main application function
export async function applyToJob(jobUrl, candidateData, jobDescription = null) {
  logger.info('Starting job application process', { jobUrl });
  
  try {
    // Initialize Stagehand client
    // await enhancedStagehandClient.initialize();
    
    // Create workflow
    const workflow = createJobApplicationWorkflow();
    
    // Prepare initial state
    const initialState = {
      jobUrl,
      candidateData,
      jobDescription,
      timestamp: new Date().toISOString(),
    };
    
    // Execute workflow
    const result = await workflow.invoke(initialState);
    
    logger.info('Job application process completed', {
      jobUrl,
      status: result.status,
      applicationId: result.confirmationDetails?.applicationId,
      error: result.errorDetails?.errorMessage,
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in job application process', { jobUrl, error: error.message });
    
    // Create error result
    const errorResult = {
      jobUrl,
      candidateData,
      jobDescription,
      timestamp: new Date().toISOString(),
      errorDetails: {
        errorType: 'workflow_error',
        errorMessage: `Workflow execution failed: ${error.message}`,
        errorCode: 'WORKFLOW_ERROR',
        suggestions: ['Check the job URL and candidate data', 'Verify Stagehand configuration'],
        timestamp: new Date().toISOString(),
      },
      status: 'error',
    };
    
    return errorResult;
    
  } finally {
    // Clean up Stagehand client
    try {
      await enhancedStagehandClient.close();
    } catch (error) {
      logger.warn('Error closing Stagehand client', { error: error.message });
    }
  }
}

// Batch application function
export async function applyToMultipleJobs(jobUrls, candidateData, jobDescriptions = []) {
  logger.info('Starting batch job application', { jobCount: jobUrls.length });
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < jobUrls.length; i++) {
    const jobUrl = jobUrls[i];
    const jobDescription = jobDescriptions[i] || null;
    
    logger.info(`Processing job ${i + 1}/${jobUrls.length}`, { jobUrl });
    
    try {
      const result = await applyToJob(jobUrl, candidateData, jobDescription);
      results.push(result);
      
      // Add delay between applications to avoid rate limiting
      if (i < jobUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      logger.error('Error in batch application', { jobUrl, error: error.message });
      errors.push({ jobUrl, error: error.message });
    }
  }
  
  logger.info('Batch application completed', {
    totalJobs: jobUrls.length,
    successful: results.length,
    errors: errors.length,
  });
  
  return {
    results,
    errors,
    summary: {
      total: jobUrls.length,
      successful: results.length,
      failed: errors.length,
      successRate: (results.length / jobUrls.length) * 100,
    },
  };
}

// Fallback URL-based classification (helper function)
function classifyJobByUrl(jobUrl) {
  const url = jobUrl.toLowerCase();
  
  if (url.includes('linkedin.com')) {
    return { applicationType: 'easy_apply' };
  } else if (url.includes('indeed.com')) {
    return { applicationType: 'form_submission' };
  } else if (url.includes('glassdoor.com')) {
    return { applicationType: 'form_submission' };
  } else if (url.includes('monster.com')) {
    return { applicationType: 'form_submission' };
  } else {
    return { applicationType: 'unknown' };
  }
} 