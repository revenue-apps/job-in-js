import cron from 'node-cron';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { logger } from '../src/shared/utils/logger.js';
import { runCareerDiscovery } from '../src/new-workflows/career-page-discovery/index.js';

/**
 * Career Discovery Job
 * Runs career discovery workflow for companies from CSV
 * Processes one company at a time with state tracking
 */
export class CareerDiscoveryJob {
  constructor() {
    this.isRunning = false;
    this.stateFile = './data/career_discovery_state.json';
    this.inputCsvPath = './data/companies.csv';
  }

  /**
   * Load career discovery state (current CSV row index)
   */
  loadState() {
    try {
      if (!existsSync(this.stateFile)) {
        // Initialize state file if it doesn't exist
        const initialState = { 
          csvRowIndex: 1, 
          csvFilePath: null, 
          totalRows: 0,
          lastRun: null 
        };
        writeFileSync(this.stateFile, JSON.stringify(initialState, null, 2));
        return initialState;
      }
      
      const stateData = readFileSync(this.stateFile, 'utf-8');
      return JSON.parse(stateData);
    } catch (error) {
      logger.error('Failed to load career discovery state:', error.message);
      return { 
        csvRowIndex: 1, 
        csvFilePath: null, 
        totalRows: 0,
        lastRun: null 
      };
    }
  }

  /**
   * Save career discovery state
   */
  saveState(state) {
    try {
      writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      logger.error('Failed to save career discovery state:', error.message);
    }
  }

  /**
   * Check if input CSV exists and has companies to process
   */
  checkInputCsv() {
    try {
      if (!existsSync(this.inputCsvPath)) {
        logger.warn(`⚠️ Input CSV not found: ${this.inputCsvPath}`);
        return { exists: false, totalRows: 0 };
      }
      
      const csvData = readFileSync(this.inputCsvPath, 'utf-8');
      const lines = csvData.split('\n').filter(line => line.trim());
      const totalRows = Math.max(0, lines.length - 1); // Exclude header
      
      return { exists: true, totalRows };
    } catch (error) {
      logger.error('Failed to check input CSV:', error.message);
      return { exists: false, totalRows: 0 };
    }
  }

  /**
   * Run career discovery for one company
   */
  async runCareerDiscovery() {
    if (this.isRunning) {
      logger.warn('⚠️ Career discovery job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    logger.info('🚀 Starting Career Discovery Job');
    
    try {
      // Check input CSV
      const csvCheck = this.checkInputCsv();
      if (!csvCheck.exists) {
        logger.warn('⚠️ No input CSV found, skipping career discovery');
        return;
      }
      
      if (csvCheck.totalRows === 0) {
        logger.warn('⚠️ No companies to process in input CSV');
        return;
      }
      
      // Load current state
      const state = this.loadState();
      
      logger.info(`📊 Processing company ${state.csvRowIndex}/${csvCheck.totalRows}`);
      logger.info(`📁 Input CSV: ${this.inputCsvPath}`);
      logger.info(`📁 State file: ${this.stateFile}`);
      
      // Run career discovery workflow for one company
      const result = await runCareerDiscovery();
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      // Update state for next run
      const newState = {
        csvRowIndex: state.csvRowIndex + 1,
        csvFilePath: this.inputCsvPath,
        totalRows: csvCheck.totalRows,
        lastRun: new Date().toISOString(),
        lastProcessedRow: state.csvRowIndex,
        nextRowToProcess: state.csvRowIndex + 1
      };
      
      // Reset to first row if we've processed all companies
      if (newState.csvRowIndex > csvCheck.totalRows) {
        newState.csvRowIndex = 1;
        newState.nextRowToProcess = 1;
        logger.info('🔄 Completed all companies, resetting to first row');
      }
      
      this.saveState(newState);
      
      // Summary
      logger.info('📈 Career Discovery Job Summary:');
      logger.info(`   - Processed row: ${state.csvRowIndex}/${csvCheck.totalRows}`);
      logger.info(`   - Next row: ${newState.nextRowToProcess}`);
      logger.info(`   - Success: ${result.success}`);
      logger.info(`   - Duration: ${duration}ms`);
      
      if (result.errors && result.errors.length > 0) {
        logger.warn(`⚠️ Career discovery had ${result.errors.length} errors`);
        result.errors.forEach(error => {
          logger.error(`   - ${error.step}: ${error.error}`);
        });
      }
      
    } catch (error) {
      logger.error('❌ Career discovery job failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the career discovery cron job
   */
  start() {
    // Run every hour
    const interval = '0 * * * *';
    const intervalText = '1 hour';
    
    logger.info(`⏰ Starting Career Discovery Job - runs every ${intervalText}`);
    
    cron.schedule(interval, () => {
      const timestamp = new Date().toISOString();
      logger.info(`🕐 [${timestamp}] Career Discovery Job triggered`);
      
      this.runCareerDiscovery().catch(error => {
        logger.error('❌ Career discovery job error:', error.message);
      });
    });
    
    logger.info('✅ Career Discovery Job scheduled successfully');
  }

  /**
   * Stop the career discovery cron job
   */
  stop() {
    logger.info('🛑 Stopping Career Discovery Job');
    // Note: node-cron doesn't have a direct stop method
    // The job will continue running until the process ends
  }

  /**
   * Get current status for API
   */
  getStatus() {
    try {
      const state = this.loadState();
      const csvCheck = this.checkInputCsv();
      
      return {
        isRunning: this.isRunning,
        lastRun: state.lastRun,
        currentRow: state.csvRowIndex,
        totalRows: csvCheck.totalRows,
        nextRow: state.nextRowToProcess,
        inputCsvExists: csvCheck.exists,
        hasCompanies: csvCheck.totalRows > 0
      };
    } catch (error) {
      logger.error('Failed to get career discovery status:', error.message);
      return {
        isRunning: this.isRunning,
        error: error.message
      };
    }
  }
}

export default CareerDiscoveryJob; 