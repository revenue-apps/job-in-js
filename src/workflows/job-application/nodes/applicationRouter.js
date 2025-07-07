import { logger } from '../../../shared/utils/logger.js';

export async function applicationRouterNode(state) {
  const { applicationType, canApply, error } = state;
  
  logger.info('Routing application based on type', { applicationType, canApply });
  
  if (!canApply) {
    logger.warn('Cannot apply to job', { applicationType, error });
    return {
      ...state,
      nextNode: 'errorHandler',
      routingReason: 'Application not possible',
    };
  }
  
  let nextNode;
  let routingReason;
  
  switch (applicationType) {
    case 'easy_apply':
      nextNode = 'easyApply';
      routingReason = 'Direct application without login required';
      break;
      
    case 'google_login':
      nextNode = 'errorHandler';
      routingReason = 'Google OAuth login required';
      break;
      
    case 'login_required':
      nextNode = 'errorHandler';
      routingReason = 'Login authentication required';
      break;
      
    case 'anti_bot':
      nextNode = 'errorHandler';
      routingReason = 'Anti-bot protection detected (CAPTCHA, OTP, etc.)';
      break;
      
    case 'external_redirect':
      nextNode = 'errorHandler';
      routingReason = 'External application site detected';
      break;
      
    default:
      nextNode = 'errorHandler';
      routingReason = 'Unknown application type';
      break;
  }
  
  logger.info('Application routing completed', { 
    applicationType, 
    nextNode, 
    routingReason 
  });
  
  return {
    ...state,
    nextNode,
    routingReason,
  };
} 