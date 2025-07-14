import cron from 'node-cron';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { logger } from '../src/shared/utils/logger.js';
import { runJobDiscoveryFromConfig } from '../src/new-workflows/job-discovery/index.js';

/**
 * Discovery Job
 * Runs job discovery for multiple domains and filters
 * Processes one domain at a time with rotation
 */
export class DiscoveryJob {
  constructor() {
    this.isRunning = false;
    this.config = this.loadConfig();
    this.stateFile = './config/discovery_state.json';
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
   * Load discovery state (current domain index)
   */
  loadState() {
    try {
      if (!existsSync(this.stateFile)) {
        // Initialize state file if it doesn't exist
        const initialState = { currentDomainIndex: 0, lastRun: null };
        writeFileSync(this.stateFile, JSON.stringify(initialState, null, 2));
        return initialState;
      }
      
      const stateData = readFileSync(this.stateFile, 'utf-8');
      return JSON.parse(stateData);
    } catch (error) {
      logger.error('Failed to load discovery state:', error.message);
      return { currentDomainIndex: 0, lastRun: null };
    }
  }

  /**
   * Save discovery state
   */
  saveState(state) {
    try {
      writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      logger.error('Failed to save discovery state:', error.message);
    }
  }

  /**
   * Get next domain index with rotation
   */
  getNextDomainIndex(currentIndex, totalDomains) {
    return (currentIndex + 1) % totalDomains;
  }

  /**
   * Run discovery for a single input
   */
  async runDiscoveryForInput(input) {
    const { name, domain, filters, config_path, description, enabled } = input;
    
    if (!enabled) {
      logger.info(`⏭️ Skipping disabled discovery: ${name}`);
      return { success: true, skipped: true, name };
    }
    
    logger.info(`🔍 Starting discovery: ${name}`);
    logger.info(`📋 Description: ${description}`);
    logger.info(`🎯 Domain: ${domain}`);
    logger.info(`📁 Config: ${config_path}`);
    logger.info(`🎯 Filters: ${JSON.stringify(filters)}`);
    
    try {
      const startTime = new Date();
      
      // Run job discovery workflow
      const result = await runJobDiscoveryFromConfig(config_path, domain, filters);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      logger.info(`✅ Discovery completed for ${name}:`);
      logger.info(`   - Processed URLs: ${result.processedUrls?.length || 0}`);
      logger.info(`   - Scraped Jobs: ${result.scrapedJobs?.length || 0}`);
      logger.info(`   - Duration: ${duration}ms`);
      logger.info(`   - Success: ${result.success}`);
      
      if (result.errors && result.errors.length > 0) {
        logger.warn(`⚠️ Discovery had ${result.errors.length} errors for ${name}`);
        result.errors.forEach(error => {
          logger.error(`   - ${error.step}: ${error.error}`);
        });
      }
      
      return {
        ...result,
        name,
        domain,
        config_path
      };
      
    } catch (error) {
      logger.error(`❌ Discovery failed for ${name}:`, error.message);
      return {
        success: false,
        error: error.message,
        name,
        domain,
        config_path
      };
    }
  }

  /**
   * Run discovery for one domain at a time with rotation
   */
  async runDiscovery() {
    if (this.isRunning) {
      logger.warn('⚠️ Discovery job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    logger.info('🚀 Starting Discovery Job');
    
    try {
      // Load current state
      const state = this.loadState();
      const enabledInputs = this.config.discovery_inputs.filter(input => input.enabled !== false);
      
      if (enabledInputs.length === 0) {
        logger.warn('⚠️ No enabled discovery inputs found');
        return;
      }
      
      // Get current domain to process
      const currentIndex = state.currentDomainIndex;
      const currentInput = enabledInputs[currentIndex];
      
      logger.info(`📊 Processing domain ${currentIndex + 1}/${enabledInputs.length}: ${currentInput.name}`);
      logger.info(`🔄 Domain rotation: ${currentInput.name} (${currentInput.domain})`);
      
      // Process the current domain
      const result = await this.runDiscoveryForInput(currentInput);
      
      // Update state for next run
      const nextIndex = this.getNextDomainIndex(currentIndex, enabledInputs.length);
      const newState = {
        currentDomainIndex: nextIndex,
        lastRun: new Date().toISOString(),
        lastProcessedDomain: currentInput.name,
        nextDomainToProcess: enabledInputs[nextIndex]?.name || 'None'
      };
      
      this.saveState(newState);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      // Summary
      logger.info('📈 Discovery Job Summary:');
      logger.info(`   - Processed domain: ${currentInput.name}`);
      logger.info(`   - Domain index: ${currentIndex + 1}/${enabledInputs.length}`);
      logger.info(`   - Next domain: ${enabledInputs[nextIndex]?.name || 'None'}`);
      logger.info(`   - Success: ${result.success}`);
      logger.info(`   - Jobs discovered: ${result.scrapedJobs?.length || 0}`);
      logger.info(`   - Duration: ${duration}ms`);
      
      if (result.errors && result.errors.length > 0) {
        logger.warn(`⚠️ Discovery had ${result.errors.length} errors`);
        result.errors.forEach(error => {
          logger.error(`   - ${error.step}: ${error.error}`);
        });
      }
      
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
    const interval = process.env.NODE_ENV === 'production' ? '0 * * * *' : '0 * * * *';
    const intervalText = process.env.NODE_ENV === 'production' ? '1 hour' : '1 hour';
    
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