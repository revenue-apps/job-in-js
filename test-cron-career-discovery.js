import { CareerDiscoveryJob } from './jobs/career-discovery.js';
import { logger } from './src/shared/utils/logger.js';

/**
 * Test Career Discovery Cron Job
 * Runs every minute for testing purposes
 */
async function testCronCareerDiscovery() {
  logger.info('🧪 Starting Career Discovery Cron Job Test...');
  
  try {
    // Create career discovery job instance
    const careerDiscoveryJob = new CareerDiscoveryJob();
    
    // Check initial status
    const initialStatus = careerDiscoveryJob.getStatus();
    logger.info('📊 Initial status:', JSON.stringify(initialStatus, null, 2));
    
    // Start the cron job (will run every minute)
    logger.info('⏰ Starting cron job (runs every minute)...');
    careerDiscoveryJob.start();
    
    // Monitor for 3 minutes
    logger.info('👀 Monitoring cron job for 3 minutes...');
    
    let minuteCount = 0;
    const maxMinutes = 3;
    
    const monitorInterval = setInterval(() => {
      minuteCount++;
      const status = careerDiscoveryJob.getStatus();
      
      logger.info(`📊 Minute ${minuteCount}/${maxMinutes} - Status:`, {
        isRunning: status.isRunning,
        currentRow: status.currentRow,
        totalRows: status.totalRows,
        lastRun: status.lastRun
      });
      
      if (minuteCount >= maxMinutes) {
        clearInterval(monitorInterval);
        logger.info('✅ Cron job test completed successfully!');
        logger.info('📊 Final status:', JSON.stringify(status, null, 2));
        process.exit(0);
      }
    }, 60000); // Check every minute
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('🛑 Received SIGINT, stopping cron job test...');
      clearInterval(monitorInterval);
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('🛑 Received SIGTERM, stopping cron job test...');
      clearInterval(monitorInterval);
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('❌ Cron job test failed:', error.message);
    process.exit(1);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCronCareerDiscovery()
    .catch((error) => {
      logger.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}

export { testCronCareerDiscovery }; 