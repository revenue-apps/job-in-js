import { runJobDiscoveryFromConfig } from './src/new-workflows/job-discovery/index.js';
import { logger } from './src/shared/utils/logger.js';

async function testJobDiscovery() {
  try {
    logger.info('🧪 Starting Job Discovery Test');
    
    // Configuration for the test
    const configPath = './data/job_discovery_urls.csv';
    const domain = 'software engineering';
    const filters = {
      keywords: 'software engineer',
      location: 'San Francisco',
      experience: 'mid_level',
      job_type: 'full_time',
      salary_range: '100000-150000'
    };
    
    logger.info(`🎯 Domain: ${domain}`);
    logger.info(`🔍 Filters:`, filters);
    
    // Run the job discovery workflow
    const result = await runJobDiscoveryFromConfig(configPath);
    
    logger.info('✅ Job Discovery Test completed');
    logger.info(`📊 Results:`, {
      processedUrls: result.processedUrls?.length || 0,
      discoveredJobs: result.discoveredJobs?.length || 0,
      errors: result.errors?.length || 0
    });
    
    // Log some sample results
    if (result.processedUrls && result.processedUrls.length > 0) {
      logger.info('🔗 Sample processed URLs:');
      result.processedUrls.slice(0, 3).forEach((url, index) => {
        logger.info(`${index + 1}. ${url.finalUrl}`);
      });
    }
    
    if (result.discoveredJobs && result.discoveredJobs.length > 0) {
      logger.info('💼 Sample discovered jobs:');
      result.discoveredJobs.slice(0, 3).forEach((job, index) => {
        logger.info(`${index + 1}. ${job.title} at ${job.company} (${job.location})`);
      });
    }
    
  } catch (error) {
    logger.error('❌ Job Discovery Test failed:', error.message);
    console.error(error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testJobDiscovery();
}

export { testJobDiscovery }; 