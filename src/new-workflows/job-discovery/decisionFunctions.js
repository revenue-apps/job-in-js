/**
 * Decision Functions for Career Discovery Workflow
 * Simple linear flow - no complex routing needed
 */

export const afterUrlProcessingDecision = (state) => {
  const { processedUrls, errors, currentStep } = state;
  
  // If we have errors in URL construction, end the workflow
  if (errors && errors.length > 0) {
    console.log('❌ URL construction errors detected, ending workflow');
    return 'end';
  }
  
  // If we have processed URLs to scrape, continue to job scraper
  if (processedUrls && processedUrls.length > 0) {
    console.log(`📋 Proceeding to scrape ${processedUrls.length} URLs`);
    return 'job_scraper';
  }
  
  // If no URLs to process, end the workflow
  console.log('⚠️ No URLs to process, ending workflow');
  return 'end';
};

export const afterJobScrapingDecision = (state) => {
  const { discoveredJobs, errors, currentStep } = state;
  
  // If we have errors in job scraping, end the workflow
  if (errors && errors.length > 0) {
    console.log('❌ Job scraping errors detected, ending workflow');
    return 'end';
  }
  
  // If we have discovered jobs, continue to data processor
  if (discoveredJobs && discoveredJobs.length > 0) {
    console.log(`📊 Proceeding to process ${discoveredJobs.length} discovered jobs`);
    return 'data_processor';
  }
  
  // If no jobs discovered, end the workflow
  console.log('⚠️ No jobs discovered, ending workflow');
  return 'end';
}; 