import { logger } from '../../../shared/utils/logger.js';

export async function errorHandlerNode(state) {
  const { jobUrl, error, applicationType, routingReason, classification } = state;
  
  logger.info('Processing application error', { jobUrl, error, applicationType });
  
  try {
    let errorType = 'unknown';
    let errorMessage = error || 'Unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    let suggestions = [];
    
    // Categorize errors based on application type and error message
    if (applicationType === 'oauth_required') {
      errorType = 'authentication_required';
      errorMessage = 'This job requires OAuth authentication (login) to apply';
      errorCode = 'OAUTH_REQUIRED';
      suggestions = [
        'Consider using a browser extension for OAuth authentication',
        'Manual application may be required for this job',
        'Check if the company has alternative application methods'
      ];
    } else if (applicationType === 'external_redirect') {
      errorType = 'external_site';
      errorMessage = 'This job redirects to an external application site';
      errorCode = 'EXTERNAL_REDIRECT';
      suggestions = [
        'Follow the external link to apply manually',
        'Check if the external site supports automated applications',
        'Consider using a different application method'
      ];
    } else if (error?.includes('login')) {
      errorType = 'login_required';
      errorMessage = 'Login or authentication is required to apply';
      errorCode = 'LOGIN_REQUIRED';
      suggestions = [
        'Provide valid login credentials',
        'Use OAuth authentication if available',
        'Consider manual application'
      ];
    } else if (error?.includes('form')) {
      errorType = 'form_error';
      errorMessage = 'Error occurred while filling the application form';
      errorCode = 'FORM_ERROR';
      suggestions = [
        'Check if all required fields are properly filled',
        'Verify candidate data completeness',
        'Try manual application as fallback'
      ];
    } else if (error?.includes('timeout')) {
      errorType = 'timeout';
      errorMessage = 'Application process timed out';
      errorCode = 'TIMEOUT_ERROR';
      suggestions = [
        'Try again with a slower approach',
        'Check internet connection',
        'Consider manual application'
      ];
    } else if (error?.includes('resume')) {
      errorType = 'resume_error';
      errorMessage = 'Error occurred during resume upload';
      errorCode = 'RESUME_ERROR';
      suggestions = [
        'Verify resume file format and size',
        'Check if resume file is accessible',
        'Try manual resume upload'
      ];
    }
    
    const errorDetails = {
      errorType,
      errorMessage,
      errorCode,
      suggestions,
      applicationType,
      routingReason,
      classification: classification || {},
      timestamp: new Date().toISOString(),
      jobUrl,
    };
    
    logger.info('Error processing completed', { 
      jobUrl, 
      errorType, 
      errorCode,
      suggestions: suggestions.length 
    });
    
    return {
      ...state,
      errorDetails,
      nextNode: 'outputGeneratorNode',
    };
    
  } catch (processingError) {
    logger.error('Error in error handler', { jobUrl, error: processingError.message });
    
    return {
      ...state,
      errorDetails: {
        errorType: 'handler_error',
        errorMessage: `Error processing failed: ${processingError.message}`,
        errorCode: 'HANDLER_ERROR',
        suggestions: ['Contact support for assistance'],
        applicationType,
        routingReason,
        timestamp: new Date().toISOString(),
        jobUrl,
      },
      nextNode: 'outputGeneratorNode',
    };
  }
} 