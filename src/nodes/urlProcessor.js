import { logger } from '../utils/logger.js';

/**
 * URL Processor Node
 * 
 * Input: { jobUrl: string }
 * Output: { jobUrl: string, isValid: boolean, processedAt: string }
 */
export async function urlProcessorNode(state) {
  const nodeName = 'urlProcessor';
  logger.langgraph(nodeName, 'Starting URL processing', { jobUrl: state.jobUrl });
  
  try {
    const { jobUrl } = state;
    
    // Validate URL format
    const isValid = isValidJobUrl(jobUrl);
    
    if (!isValid) {
      logger.langgraph(nodeName, 'Invalid job URL detected', { jobUrl });
    }
    
    const result = {
      ...state,
      isValid,
      processedAt: new Date().toISOString(),
    };
    
    logger.langgraph(nodeName, 'URL processing completed', { 
      jobUrl, 
      isValid,
      processedAt: result.processedAt 
    });
    
    return result;
    
  } catch (error) {
    logger.langgraph(nodeName, 'Error in URL processing', { 
      error: error.message, 
      jobUrl: state.jobUrl 
    });
    
    return {
      ...state,
      isValid: false,
      error: error.message,
      processedAt: new Date().toISOString(),
    };
  }
}

function isValidJobUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Check if it's a supported job platform
    const supportedDomains = [
      'linkedin.com',
      'indeed.com',
      'glassdoor.com',
      'careers.microsoft.com',
      'jobs.apple.com',
      'careers.google.com',
      'amazon.jobs',
      'netflix.jobs',
      'meta.com',
      'github.com'
    ];
    
    const domain = urlObj.hostname.toLowerCase();
    const isSupported = supportedDomains.some(supported => 
      domain.includes(supported)
    );
    
    return isSupported;
    
  } catch (error) {
    return false;
  }
} 