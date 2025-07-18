import { CareerDiscoveryJob } from './jobs/career-discovery.js';
import { logger } from './src/shared/utils/logger.js';

/**
 * Test Career Discovery Job
 */
async function testCareerDiscoveryJob() {
  logger.info('🧪 Testing Career Discovery Job...');
  
  try {
    // Create career discovery job instance
    const careerDiscoveryJob = new CareerDiscoveryJob();
    
    // Test 1: Check initial status
    logger.info('📊 Test 1: Checking initial status...');
    const initialStatus = careerDiscoveryJob.getStatus();
    logger.info('Initial status:', JSON.stringify(initialStatus, null, 2));
    
    // Test 2: Check input CSV
    logger.info('📊 Test 2: Checking input CSV...');
    const csvCheck = careerDiscoveryJob.checkInputCsv();
    logger.info('CSV check:', JSON.stringify(csvCheck, null, 2));
    
    // Test 3: Run career discovery for one company
    logger.info('📊 Test 3: Running career discovery for one company...');
    const result = await careerDiscoveryJob.runCareerDiscovery();
    logger.info('Career discovery result:', JSON.stringify(result, null, 2));
    
    // Test 4: Check updated status
    logger.info('📊 Test 4: Checking updated status...');
    const updatedStatus = careerDiscoveryJob.getStatus();
    logger.info('Updated status:', JSON.stringify(updatedStatus, null, 2));
    
    // Test 5: Test state reset
    logger.info('📊 Test 5: Testing state reset...');
    careerDiscoveryJob.saveState({
      csvRowIndex: 1,
      csvFilePath: null,
      totalRows: 0,
      lastRun: null
    });
    const resetStatus = careerDiscoveryJob.getStatus();
    logger.info('Reset status:', JSON.stringify(resetStatus, null, 2));
    
    logger.info('✅ Career Discovery Job tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ Career Discovery Job test failed:', error.message);
    throw error;
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCareerDiscoveryJob()
    .then(() => {
      logger.info('✅ All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Tests failed:', error.message);
      process.exit(1);
    });
}

export { testCareerDiscoveryJob }; 