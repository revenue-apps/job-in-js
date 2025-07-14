import cron from 'node-cron';
import { readFileSync } from 'fs';
import { logger } from '../src/shared/utils/logger.js';
import { runJobDiscoveryFromConfig } from '../src/new-workflows/job-discovery/index.js';

/**
 * Discovery Job
 * Runs job discovery for multiple domains and filters
 */
export class DiscoveryJob {
  constructor() {
    this.isRunning = false;
    this.config = this.loadConfig();
  }

  /**
   * Load discovery configuration
   */
  loadConfig() {
    try {
      const configPath = './config/discovery_inputs.json';
      const configData = readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      logger.error('Failed to load discovery config:', error.message);
      return { discovery_inputs: [], settings: {} };
    }
  }

  /**
   * Run discovery for a single input
   */
  async runDiscoveryForInput(input) {
    const { domain, filters, config_path, description } = input;
    
    logger.info(`🔍 Starting discovery for domain: ${domain}`);
    logger.info(`📋 Description: ${description}`);
    logger.info(`🎯 Filters: ${JSON.stringify(filters)}`);
    
    try {
      const startTime = new Date();
      
      // Run job discovery workflow
      const result = await runJobDiscoveryFromConfig(config_path, domain, filters);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      logger.info(`✅ Discovery completed for ${domain}:`);
      logger.info(`   - Processed URLs: ${result.processedUrls?.length || 0}`);
      logger.info(`   - Scraped Jobs: ${result.scrapedJobs?.length || 0}`);
      logger.info(`   - Duration: ${duration}ms`);
      logger.info(`   - Success: ${result.success}`);
      
      if (result.errors && result.errors.length > 0) {
        logger.warn(`⚠️ Discovery had ${result.errors.length} errors for ${domain}`);
        result.errors.forEach(error => {
          logger.error(`   - ${error.step}: ${error.error}`);
        });
      }
      
      return result;
      
    } catch (error) {
      logger.error(`❌ Discovery failed for ${domain}:`, error.message);
      return {
        success: false,
        error: error.message,
        domain,
        filters
      };
    }
  }

  /**
   * Run discovery for all configured inputs
   */
  async runDiscovery() {
    if (this.isRunning) {
      logger.warn('⚠️ Discovery job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    logger.info('🚀 Starting Discovery Job');
    logger.info(`📊 Processing ${this.config.discovery_inputs.length} discovery inputs`);
    
    const results = [];
    
    try {
      // Process each discovery input
      for (const input of this.config.discovery_inputs) {
        const result = await this.runDiscoveryForInput(input);
        results.push(result);
        
        // Add small delay between discoveries to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      // Summary
      const successful = results.filter(r => r.success).length;
      const totalJobs = results.reduce((sum, r) => sum + (r.scrapedJobs?.length || 0), 0);
      
      logger.info('📈 Discovery Job Summary:');
      logger.info(`   - Total inputs: ${this.config.discovery_inputs.length}`);
      logger.info(`   - Successful: ${successful}`);
      logger.info(`   - Failed: ${this.config.discovery_inputs.length - successful}`);
      logger.info(`   - Total jobs discovered: ${totalJobs}`);
      logger.info(`   - Total duration: ${duration}ms`);
      
    } catch (error) {
      logger.error('❌ Discovery job failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the discovery cron job
   */
  start() {
    // Determine interval based on environment
    const interval = process.env.NODE_ENV === 'production' ? '*/15 * * * *' : '*/1 * * * *';
    const intervalText = process.env.NODE_ENV === 'production' ? '15 minutes' : '1 minute';
    
    logger.info(`⏰ Starting Discovery Job - runs every ${intervalText}`);
    
    cron.schedule(interval, () => {
      const timestamp = new Date().toISOString();
      logger.info(`🕐 [${timestamp}] Discovery Job triggered`);
      
      this.runDiscovery().catch(error => {
        logger.error('❌ Discovery job error:', error.message);
      });
    });
    
    logger.info('✅ Discovery Job scheduled successfully');
  }

  /**
   * Stop the discovery cron job
   */
  stop() {
    logger.info('🛑 Stopping Discovery Job');
    // Note: node-cron doesn't have a direct stop method
    // The job will continue running until the process ends
  }
}

export default DiscoveryJob; 