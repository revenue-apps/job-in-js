import { logger } from '../src/shared/utils/logger.js';
import DiscoveryJob from './discovery.js';
import ProcessorJob from './processor.js';

/**
 * Job Manager
 * Coordinates discovery and processor jobs
 */
export class JobManager {
  constructor() {
    this.discoveryJob = new DiscoveryJob();
    this.processorJob = new ProcessorJob();
    this.isStarted = false;
  }

  /**
   * Start all background jobs
   */
  start() {
    if (this.isStarted) {
      logger.warn('⚠️ Job Manager already started');
      return;
    }

    logger.info('🚀 Starting Job Manager');
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    try {
      // Start discovery job
      this.discoveryJob.start();
      
      // Start processor job
      this.processorJob.start();
      
      this.isStarted = true;
      
      logger.info('✅ All background jobs started successfully');
      
      // Log job schedules
      const discoveryInterval = process.env.NODE_ENV === 'production' ? '15 minutes' : '1 minute';
      logger.info(`📅 Discovery Job: every ${discoveryInterval}`);
      logger.info(`📅 Processor Job: every 1 minute`);
      
    } catch (error) {
      logger.error('❌ Failed to start Job Manager:', error.message);
      throw error;
    }
  }

  /**
   * Stop all background jobs
   */
  stop() {
    logger.info('🛑 Stopping Job Manager');
    
    try {
      this.discoveryJob.stop();
      this.processorJob.stop();
      
      this.isStarted = false;
      
      logger.info('✅ All background jobs stopped');
      
    } catch (error) {
      logger.error('❌ Failed to stop Job Manager:', error.message);
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isStarted: this.isStarted,
      discovery: {
        isRunning: this.discoveryJob.isRunning
      },
      processor: {
        isRunning: this.processorJob.isRunning
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Manually trigger discovery job
   */
  async triggerDiscovery() {
    logger.info('🔧 Manually triggering discovery job');
    await this.discoveryJob.runDiscovery();
  }

  /**
   * Manually trigger processor job
   */
  async triggerProcessor() {
    logger.info('🔧 Manually triggering processor job');
    await this.processorJob.runProcessor();
  }
}

export default JobManager; 