import { enhancedStagehandClient } from '../../../shared/utils/enhancedStagehand.js';
import { logger } from '../../../shared/utils/logger.js';

export async function jobClassifierNode(state) {
  const { jobUrl } = state;
  
  logger.info('Starting job classification', { jobUrl });
  
  try {
    // Classify the job application type
    const classification = await enhancedStagehandClient.classifyJobApplication(jobUrl);
    
    // Analyze application requirements
    const requirements = await enhancedStagehandClient.analyzeApplicationRequirements(jobUrl);
    
    // Determine if application is possible
    const canApply = classification.applicationType !== 'oauth_required' && 
                     classification.applicationType !== 'external_redirect' &&
                     classification.confidence > 0.5;
    
    const result = {
      ...state,
      classification,
      requirements,
      canApply,
      applicationType: classification.applicationType,
      requiresLogin: classification.requiresLogin,
      platform: classification.platform,
      confidence: classification.confidence,
      error: canApply ? null : `Cannot apply: ${classification.reasoning}`,
    };
    
    logger.info('Job classification completed', {
      jobUrl,
      applicationType: classification.applicationType,
      canApply,
      confidence: classification.confidence,
      requiresLogin: classification.requiresLogin
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in job classification', { jobUrl, error: error.message });
    
    return {
      ...state,
      classification: {
        applicationType: 'unknown',
        confidence: 0,
        requiresLogin: false,
        hasApplyButton: false,
        hasForm: false,
        hasFileUpload: false,
        platform: 'unknown',
        reasoning: 'Classification failed due to error',
      },
      requirements: {
        requiredFields: [],
        optionalFields: [],
        fileUploads: [],
        additionalQuestions: [],
        platform: 'unknown',
      },
      canApply: false,
      applicationType: 'unknown',
      requiresLogin: false,
      platform: 'unknown',
      confidence: 0,
      error: `Classification failed: ${error.message}`,
    };
  }
} 