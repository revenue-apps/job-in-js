import { enhancedStagehandClient } from '../shared/utils/enhancedStagehand.js';
import { createCandidateProfile } from '../utils/candidateProfile.js';
import { logger } from '../utils/logger.js';

export async function resumeUploadNode(state) {
  const { jobUrl, candidateData, requirements, jobDescription } = state;
  
  logger.info('Starting resume upload application', { jobUrl });
  
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
    
    // Check if resume is available
    if (!candidateProfile.resume) {
      logger.error('Resume not available for upload application');
      return {
        ...state,
        applicationResult: {
          success: false,
          error: 'Resume file is required but not provided',
          applicationId: null,
          confirmationMessage: null,
        },
        nextNode: 'outputGeneratorNode',
      };
    }
    
    // Handle resume upload using Stagehand
    const result = await enhancedStagehandClient.handleFormSubmission(
      jobUrl, 
      candidateProfile.toJSON(), 
      requirements
    );
    
    logger.info('Resume upload completed', { 
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
    logger.error('Error in resume upload', { jobUrl, error: error.message });
    
    return {
      ...state,
      applicationResult: {
        success: false,
        error: `Resume upload failed: ${error.message}`,
        applicationId: null,
        confirmationMessage: null,
      },
      nextNode: 'outputGeneratorNode',
    };
  }
} 