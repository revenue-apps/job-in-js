import { logger } from '../../shared/utils/logger.js';

export const urlIteratorNode = async (state) => {
  const { processedUrls, currentUrlIndex, scrapedJobs = [], errors = [] } = state;

  logger.info(`🔄 URL Iterator: currentUrlIndex: ${currentUrlIndex}`);
  
  // Use zero-based indexing throughout
  const nextUrlIndex =  currentUrlIndex === 0 ? 1 : currentUrlIndex + 1;
  
  logger.info(`🔄 URL Iterator: Processing URL ${nextUrlIndex} of ${processedUrls?.length || 0}`);
  
  // Check if we're done with all URLs
  if (!processedUrls || nextUrlIndex > processedUrls.length) {
    // logger.info('✅ All URLs processed, moving to storage');
    return {
      ...state,
      currentStep: 'url_iterator_complete'
    };
  }
  
  // Get current URL and set up state
  const currentUrl = processedUrls[nextUrlIndex-1]; // Array is 0-indexed
  logger.info(`📋 Processing URL: ${currentUrl.finalUrl}`);
  logger.info(`🏢 Company: ${currentUrl.company}`);
  
  return {
    ...state,
    currentUrl,
    currentUrlIndex: nextUrlIndex,
    scrapedJobs,
    errors,
    currentStep: 'url_iterator_processing',
    // Reset pagination state for new URL
    pagination: {
      currentPage: 1,
      hasMorePages: false,
      nextPageUrl: null
    }
  };
}; 