import { DiscoveryJob } from './discovery.js';
import { ProcessorJob } from './processor.js';
import { logger } from '../src/shared/utils/logger.js';

/**
 * Job Manager
 * Coordinates discovery and processor jobs
 */
export class JobManager {
  constructor() {
    this.discoveryJob = new DiscoveryJob();
    this.processorJob = new ProcessorJob();
    this.isRunning = false;
  }

  /**
   * Start all jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('⚠️ Job manager already running');
      return;
    }

    logger.info('🚀 Starting Job Manager...');
    
    try {
      // Start discovery job
      this.discoveryJob.start();
      
      // Start processor job
      this.processorJob.start();
      
      this.isRunning = true;
      logger.info('✅ Job Manager started successfully');
      
    } catch (error) {
      logger.error('❌ Failed to start Job Manager:', error.message);
      throw error;
    }
  }

  /**
   * Stop all jobs
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('⚠️ Job manager not running');
      return;
    }

    logger.info('🛑 Stopping Job Manager...');
    
    try {
      // Stop discovery job
      this.discoveryJob.stop();
      
      // Stop processor job
      this.processorJob.stop();
      
      this.isRunning = false;
      logger.info('✅ Job Manager stopped successfully');
      
    } catch (error) {
      logger.error('❌ Failed to stop Job Manager:', error.message);
      throw error;
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      discovery: {
        isRunning: this.discoveryJob.isRunning
      },
      processor: {
        isRunning: this.processorJob.isRunning
      }
    };
  }

  /**
   * Manually trigger discovery job
   */
  async triggerDiscovery() {
    logger.info('🔍 Manually triggering discovery job...');
    return await this.discoveryJob.runDiscovery();
  }

  /**
   * Manually trigger processor job
   */
  async triggerProcessor() {
    logger.info('🔧 Manually triggering processor job...');
    return await this.processorJob.runProcessor();
  }
}

export default JobManager; 