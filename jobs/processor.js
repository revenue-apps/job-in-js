import cron from 'node-cron';
import { logger } from '../src/shared/utils/logger.js';
import { queryItems } from '../src/shared/utils/dynamoDB.js';

/**
 * Processor Job
 * Picks oldest discovered job and processes it
 */
export class ProcessorJob {
  constructor() {
    this.isRunning = false;
    this.tableName = process.env.DYNAMODB_TABLE || 'job_descriptions';
  }

  /**
   * Find the oldest job with status "discovered"
   */
  async findOldestDiscoveredJob() {
    try {
      // Query for jobs with status "discovered", ordered by discoveredAt
      const queryParams = {
        IndexName: 'status-discoveredAt-index', // Assuming this GSI exists
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'discovered'
        },
        ScanIndexForward: true, // Ascending order (oldest first)
        Limit: 1
      };

      const items = await queryItems(this.tableName, queryParams);
      
      if (items && items.length > 0) {
        return items[0];
      }
      
      return null;
      
    } catch (error) {
      logger.error('Failed to query oldest discovered job:', error.message);
      return null;
    }
  }

  /**
   * Process a single job by calling the API
   */
  async processJob(job) {
    const { jd_id, url, company } = job;
    
    logger.info(`🔧 Processing job: ${jd_id}`);
    logger.info(`   - URL: ${url}`);
    logger.info(`   - Company: ${company}`);
    
    try {
      // Call the job extraction API
      const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/v1/job-extraction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_KEY || 'dev-key'}`
        },
        body: JSON.stringify({
          job_id: jd_id,
          options: {
            extractRawContent: true,
            validateQuality: true,
            confidenceThreshold: 0.8
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      logger.info(`✅ Job processing completed: ${jd_id}`);
      logger.info(`   - Success: ${result.success}`);
      logger.info(`   - Duration: ${result.duration}ms`);
      
      if (result.errors && result.errors.length > 0) {
        logger.warn(`⚠️ Job processing had ${result.errors.length} errors`);
        result.errors.forEach(error => {
          logger.error(`   - ${error}`);
        });
      }
      
      return result;
      
    } catch (error) {
      logger.error(`❌ Job processing failed: ${jd_id}`, error.message);
      return {
        success: false,
        error: error.message,
        jd_id
      };
    }
  }

  /**
   * Run processor job
   */
  async runProcessor() {
    if (this.isRunning) {
      logger.warn('⚠️ Processor job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    try {
      logger.info('🔍 Looking for oldest discovered job...');
      
      // Find oldest discovered job
      const job = await this.findOldestDiscoveredJob();
      
      if (!job) {
        logger.info('ℹ️ No discovered jobs found to process');
        return;
      }
      
      logger.info(`📋 Found job to process: ${job.jd_id}`);
      
      // Process the job
      const result = await this.processJob(job);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      logger.info(`📊 Processor Job Summary:`);
      logger.info(`   - Job ID: ${job.jd_id}`);
      logger.info(`   - Success: ${result.success}`);
      logger.info(`   - Duration: ${duration}ms`);
      
      if (!result.success) {
        logger.error(`   - Error: ${result.error}`);
      }
      
    } catch (error) {
      logger.error('❌ Processor job failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the processor cron job
   */
  start() {
    // Determine interval based on environment
    const interval = process.env.NODE_ENV === 'production' ? '*/15 * * * *' : '*/15 * * * *';
    const intervalText = '5 minutes';
    
    logger.info(`⏰ Starting Processor Job - runs every ${intervalText}`);
    
    cron.schedule(interval, () => {
      const timestamp = new Date().toISOString();
      logger.info(`🕐 [${timestamp}] Processor Job triggered`);
      
      this.runProcessor().catch(error => {
        logger.error('❌ Processor job error:', error.message);
      });
    });
    
    logger.info('✅ Processor Job scheduled successfully');
  }

  /**
   * Stop the processor cron job
   */
  stop() {
    logger.info('🛑 Stopping Processor Job');
    // Note: node-cron doesn't have a direct stop method
    // The job will continue running until the process ends
  }
}

export default ProcessorJob; 