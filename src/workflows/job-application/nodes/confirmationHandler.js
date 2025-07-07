import { enhancedStagehandClient } from '../../../shared/utils/enhancedStagehand.js';
import { logger } from '../../../shared/utils/logger.js';

export async function confirmationHandlerNode(state) {
  const { jobUrl, applicationResult, candidateProfile } = state;
  
  logger.info('Processing application confirmation', { jobUrl });
  
  try {
    if (!applicationResult.success) {
      logger.warn('Application was not successful, skipping confirmation processing', { 
        jobUrl, 
        error: applicationResult.error 
      });
      
      return {
        ...state,
        confirmationDetails: {
          success: false,
          error: applicationResult.error,
          applicationId: null,
          confirmationMessage: applicationResult.confirmationMessage,
          nextSteps: null,
          contactInfo: null,
          submittedAt: new Date().toISOString(),
        },
        nextNode: 'outputGeneratorNode',
      };
    }
    
    // Extract additional confirmation details if available
    let additionalDetails = {};
    
    if (applicationResult.applicationId) {
      // Try to extract more details from the confirmation page
      try {
        const page = enhancedStagehandClient.stagehand.page;
        const currentUrl = page.url();
        
        if (currentUrl.includes('confirmation') || currentUrl.includes('success')) {
          additionalDetails = await page.extract({
            instruction: "Extract any additional application confirmation details including tracking information, next steps, or contact details.",
            schema: {
              trackingNumber: "string",
              estimatedResponseTime: "string",
              recruiterEmail: "string",
              recruiterPhone: "string",
              nextInterviewDate: "string",
              additionalDocuments: "array",
            },
          });
        }
      } catch (error) {
        logger.warn('Could not extract additional confirmation details', { error: error.message });
      }
    }
    
    const confirmationDetails = {
      success: true,
      applicationId: applicationResult.applicationId,
      confirmationMessage: applicationResult.confirmationMessage,
      nextSteps: applicationResult.nextSteps || additionalDetails.nextSteps,
      contactInfo: applicationResult.contactInfo || additionalDetails.contactInfo,
      trackingNumber: additionalDetails.trackingNumber,
      estimatedResponseTime: additionalDetails.estimatedResponseTime,
      recruiterEmail: additionalDetails.recruiterEmail,
      recruiterPhone: additionalDetails.recruiterPhone,
      nextInterviewDate: additionalDetails.nextInterviewDate,
      additionalDocuments: additionalDetails.additionalDocuments,
      submittedAt: new Date().toISOString(),
      candidateInfo: {
        name: `${candidateProfile.personal.firstName} ${candidateProfile.personal.lastName}`,
        email: candidateProfile.personal.email,
        phone: candidateProfile.personal.phone,
      },
    };
    
    logger.info('Confirmation processing completed', { 
      jobUrl, 
      applicationId: confirmationDetails.applicationId,
      success: confirmationDetails.success 
    });
    
    return {
      ...state,
      confirmationDetails,
      nextNode: 'outputGeneratorNode',
    };
    
  } catch (error) {
    logger.error('Error processing confirmation', { jobUrl, error: error.message });
    
    return {
      ...state,
      confirmationDetails: {
        success: false,
        error: `Confirmation processing failed: ${error.message}`,
        applicationId: applicationResult?.applicationId || null,
        confirmationMessage: applicationResult?.confirmationMessage || null,
        nextSteps: null,
        contactInfo: null,
        submittedAt: new Date().toISOString(),
      },
      nextNode: 'outputGeneratorNode',
    };
  }
} 