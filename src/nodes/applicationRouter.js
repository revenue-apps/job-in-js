import { logger } from '../utils/logger.js';

export async function applicationRouterNode(state) {
  const { applicationType, canApply, error } = state;
  
  logger.info('Routing application based on type', { applicationType, canApply });
  
  if (!canApply) {
    logger.warn('Cannot apply to job', { applicationType, error });
    return {
      ...state,
      nextNode: 'errorHandlerNode',
      routingReason: 'Application not possible',
    };
  }
  
  let nextNode;
  let routingReason;
  
  switch (applicationType) {
    case 'easy_apply':
      nextNode = 'easyApplyNode';
      routingReason = 'Easy apply application detected';
      break;
      
    case 'form_submission':
      nextNode = 'formSubmissionNode';
      routingReason = 'Traditional form submission required';
      break;
      
    case 'resume_upload':
      nextNode = 'resumeUploadNode';
      routingReason = 'Resume upload application detected';
      break;
      
    case 'oauth_required':
      nextNode = 'errorHandlerNode';
      routingReason = 'OAuth authentication required';
      break;
      
    case 'external_redirect':
      nextNode = 'errorHandlerNode';
      routingReason = 'External application site detected';
      break;
      
    default:
      nextNode = 'errorHandlerNode';
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