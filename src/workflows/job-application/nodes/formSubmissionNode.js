import { enhancedStagehandClient } from '../../../shared/utils/enhancedStagehand.js';
import { createCandidateProfile } from '../../../shared/utils/candidateProfile.js';
import { logger } from '../../../shared/utils/logger.js';

export async function formSubmissionNode(state) {
  const { jobUrl, candidateData, requirements, jobDescription } = state;
  
  logger.info('Starting form submission application', { jobUrl });
  
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
    
    // Generate cover letter if needed
    if (requirements.additionalQuestions.some(q => q.question.toLowerCase().includes('cover letter'))) {
      const coverLetter = candidateProfile.generateCoverLetter(jobDescription, jobDescription.company);
      candidateProfile.coverLetter = coverLetter;
    }
    
    // Handle form submission using Stagehand
    const result = await enhancedStagehandClient.handleFormSubmission(
      jobUrl, 
      candidateProfile.toJSON(), 
      requirements
    );
    
    logger.info('Form submission completed', { 
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
    logger.error('Error in form submission', { jobUrl, error: error.message });
    
    return {
      ...state,
      applicationResult: {
        success: false,
        error: `Form submission failed: ${error.message}`,
        applicationId: null,
        confirmationMessage: null,
      },
      nextNode: 'outputGeneratorNode',
    };
  }
} 