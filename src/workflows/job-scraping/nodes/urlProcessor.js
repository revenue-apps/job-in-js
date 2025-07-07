import { logger } from '../../../shared/utils/logger.js';

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
    
    // Basic URL validation
    const url = new URL(jobUrl);
    
    // Check if it's a supported job platform
    const supportedPlatforms = [
      'linkedin.com',
      'indeed.com',
      'glassdoor.com',
      'careers.microsoft.com',
      'jobs.apple.com',
      'careers.google.com',
      'amazon.jobs',
      'jobs.netflix.com',
      'careers.meta.com',
      'jobs.github.com',
    ];
    
    const isSupported = supportedPlatforms.some(platform => 
      url.hostname.includes(platform)
    );
    
    if (!isSupported) {
      logger.warn('Unsupported job platform', { hostname: url.hostname });
      return {
        ...state,
        error: `Unsupported job platform: ${url.hostname}`,
        processed: false,
      };
    }
    
    logger.info('URL validation passed', { hostname: url.hostname });
    
    const result = {
      ...state,
      processed: true,
      processedAt: new Date().toISOString(),
    };
    
    logger.langgraph(nodeName, 'URL processing completed', { 
      jobUrl, 
      processed: result.processed,
      processedAt: result.processedAt 
    });
    
    return result;
    
  } catch (error) {
    logger.error('URL processing failed', { jobUrl, error: error.message });
    
    return {
      ...state,
      error: `Invalid URL: ${error.message}`,
      processed: false,
      processedAt: new Date().toISOString(),
    };
  }
} 