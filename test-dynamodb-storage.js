import { runJobDiscoveryFromConfig } from './src/new-workflows/job-discovery/index.js';
import { logger } from './src/shared/utils/logger.js';

async function testDynamoDBStorage() {
  try {
    logger.info('🧪 Starting DynamoDB Storage Test');
    
    // Configuration for the test
    const configPath = './data/job_discovery_urls.csv';
    const domain = 'software engineering';
    const filters = {
      keywords: 'software engineer',
      location: 'San Francisco',
      experience: 'mid_level',
      employment_type: 'full_time'
    };
    
    logger.info(`🎯 Domain: ${domain}`);
    logger.info(`🔍 Filters:`, filters);
    
    // Run the job discovery workflow with DynamoDB storage
    const result = await runJobDiscoveryFromConfig(configPath, domain, filters);
    
    logger.info('✅ DynamoDB Storage Test completed');
    logger.info(`📊 Results:`, {
      processedUrls: result.processedUrls?.length || 0,
      scrapedJobs: result.scrapedJobs?.length || 0,
      storedJobs: result.storedJobs?.length || 0,
      storageErrors: result.storageErrors?.length || 0,
      errors: result.errors?.length || 0
    });
    
    // Log sample stored jobs
    if (result.storedJobs && result.storedJobs.length > 0) {
      logger.info('💾 Sample stored jobs in DynamoDB:');
      result.storedJobs.slice(0, 3).forEach((job, index) => {
        logger.info(`${index + 1}. ID: ${job.id}`);
        logger.info(`   Company: ${job.company}`);
        logger.info(`   URL: ${job.url}`);
        logger.info(`   Domain: ${job.domain}`);
        logger.info(`   Status: ${job.status}`);
        logger.info('   ---');
      });
    }
    
    // Log storage errors if any
    if (result.storageErrors && result.storageErrors.length > 0) {
      logger.info('❌ Storage errors:');
      result.storageErrors.forEach((error, index) => {
        logger.info(`${index + 1}. ${error.error || JSON.stringify(error)}`);
      });
    }
    
  } catch (error) {
    logger.error('❌ DynamoDB Storage Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testDynamoDBStorage(); 