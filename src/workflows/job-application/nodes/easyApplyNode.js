import { runEasyApplyWorkflow } from '../../../new-workflows/easyApply/index.js';
import { enhancedStagehandClient } from '../../../shared/utils/enhancedStagehand.js';
import { logger } from '../../../shared/utils/logger.js';

export async function easyApplyNode(state) {
  const { jobUrl, candidateData, jobDescription } = state;
  
  logger.info('Starting easy apply application', { jobUrl });
  
  try {
    // Trigger the Easy Apply workflow - it handles everything internally
    const result = await runEasyApplyWorkflow(jobUrl, candidateData, enhancedStagehandClient);
    
    logger.info('Easy apply workflow completed', { 
      jobUrl, 
      result: result
    });
    
    // Pass through the result from the Easy Apply workflow
    return {
      ...state,
      applicationResult: result,
      nextNode: 'confirmationHandlerNode',
    };
    
  } catch (error) {
    logger.error('Error in easy apply', { jobUrl, error: error.message });
    
    return {
      ...state,
      applicationResult: {
        success: false,
        error: `Easy apply failed: ${error.message}`,
        applicationId: null,
        confirmationMessage: null,
      },
      nextNode: 'outputGeneratorNode',
    };
  }
} 