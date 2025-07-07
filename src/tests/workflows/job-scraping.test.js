import { processJobUrl, processJobUrls } from '../../workflows/job-scraping/index.js';
import { logger } from '../../shared/utils/logger.js';

// Sample job URLs for testing
const sampleJobUrls = [
  'https://www.linkedin.com/jobs/view/software-engineer-at-google',
  'https://careers.microsoft.com/jobs/12345/senior-developer',
  'https://jobs.apple.com/jobs/67890/ios-developer',
];

async function testSingleJobProcessing() {
  logger.info('Testing single job processing');
  
  try {
    const jobUrl = sampleJobUrls[0];
    logger.info('Processing single job', { jobUrl });
    
    const result = await processJobUrl(jobUrl);
    
    logger.info('Single job processing completed', {
      jobUrl,
      processed: result.processed,
      saved: result.saved,
      outputFile: result.outputFile,
      error: result.error,
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in single job processing test', { error: error.message });
    throw error;
  }
}

async function testBatchJobProcessing() {
  logger.info('Testing batch job processing');
  
  try {
    logger.info('Processing batch jobs', { count: sampleJobUrls.length });
    
    const result = await processJobUrls(sampleJobUrls);
    
    logger.info('Batch job processing completed', {
      total: result.summary.total,
      successful: result.summary.successful,
      failed: result.summary.failed,
    });
    
    // Log individual results
    result.results.forEach((jobResult, index) => {
      logger.info(`Job ${index + 1} result`, {
        jobUrl: sampleJobUrls[index],
        processed: jobResult.processed,
        saved: jobResult.saved,
        error: jobResult.error,
      });
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in batch job processing test', { error: error.message });
    throw error;
  }
}

async function testErrorHandling() {
  logger.info('Testing error handling');
  
  try {
    const invalidJobUrl = 'https://invalid-job-url.com/job/123';
    
    logger.info('Testing with invalid URL', { jobUrl: invalidJobUrl });
    
    const result = await processJobUrl(invalidJobUrl);
    
    logger.info('Error handling test completed', {
      jobUrl: invalidJobUrl,
      processed: result.processed,
      error: result.error,
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in error handling test', { error: error.message });
    throw error;
  }
}

// Main test function
async function runTests() {
  logger.info('Starting job scraping workflow tests');
  
  try {
    // Test 1: Single job processing
    console.log('\n=== Test 1: Single Job Processing ===');
    await testSingleJobProcessing();
    
    // Test 2: Error handling
    console.log('\n=== Test 2: Error Handling ===');
    await testErrorHandling();
    
    // Test 3: Batch processing (commented out to avoid rate limiting)
    // console.log('\n=== Test 3: Batch Job Processing ===');
    // await testBatchJobProcessing();
    
    logger.info('All job scraping tests completed successfully');
    
  } catch (error) {
    logger.error('Job scraping test execution failed', { error: error.message });
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export {
  testSingleJobProcessing,
  testBatchJobProcessing,
  testErrorHandling,
  runTests,
}; 