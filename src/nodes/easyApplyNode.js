import { enhancedStagehandClient } from '../shared/utils/enhancedStagehand.js';
import { createCandidateProfile } from '../utils/candidateProfile.js';
import { logger } from '../utils/logger.js';

export async function easyApplyNode(state) {
  const { jobUrl, candidateData, jobDescription } = state;
  
  logger.info('Starting easy apply application', { jobUrl });
  
  try {
    // Create candidate profile
    const candidateProfile = createCandidateProfile(candidateData);
    
    // Validate candidate profile
    const validation = candidateProfile.validateProfile();
    if (!validation.isValid) {
      logger.error('Invalid candidate profile', { errors: validation.errors });
      return {
        ...state,
        applicationResult: {
          success: false,
          error: `Invalid candidate profile: ${validation.errors.join(', ')}`,
          applicationId: null,
          confirmationMessage: null,
        },
        nextNode: 'outputGeneratorNode',
      };
    }
    
    // Handle easy apply using Stagehand
    const result = await enhancedStagehandClient.handleEasyApply(jobUrl, candidateProfile.toJSON());
    
    logger.info('Easy apply completed', { 
      jobUrl, 
      success: result.success,
      applicationId: result.applicationId 
    });
    
    return {
      ...state,
      applicationResult: result,
      candidateProfile: candidateProfile.toJSON(),
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