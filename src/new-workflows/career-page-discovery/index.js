/**
 * Career Discovery Workflow - Main Orchestrator
 * 
 * Uses LangGraph to coordinate the career discovery pipeline:
 * Career Page Finder → Job Listings Navigator → Filter Analyzer → Metadata Constructor
 */

import { StateGraph, END } from '@langchain/langgraph';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { enhancedStagehandClient } from '../../shared/utils/enhancedStagehand.js';
import { logger } from '../../shared/utils/logger.js';

// Import nodes
import { careerPageFinderNode } from './nodes/careerPageFinderNode.js';
import { jobListingsNavigatorNode } from './nodes/jobListingsNavigatorNode.js';
import { filterAnalyzerNode } from './nodes/filterAnalyzerNode.js';
import { metadataConstructorNode } from './nodes/metadataConstructorNode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// State file path for tracking progress
const STATE_FILE_PATH = path.join(__dirname, '../../../data/career_discovery_state.json');

/**
 * Load current state from file
 */
async function loadState() {
  try {
    const stateData = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(stateData);
  } catch (error) {
    // If file doesn't exist, return initial state
    return {
      csvRowIndex: 1, // Start from row 1 (after header)
      csvFilePath: null,
      totalRows: 0
    };
  }
}

/**
 * Save current state to file
 */
async function saveState(state) {
  await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

/**
 * Read specific row from CSV file
 */
async function readCSVRow(csvFilePath, rowIndex) {
  try {
    const csvContent = await fs.readFile(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (rowIndex >= lines.length) {
      return null; // Row doesn't exist
    }
    
    const line = lines[rowIndex];
    const values = line.split(',').map(val => val.replace(/"/g, '').trim());
    
    return {
      companyName: values[0] || '',
      status: values[1] || '',
      reason: values[2] || ''
    };
  } catch (error) {
    logger.error('Failed to read CSV row', { rowIndex, error: error.message });
    return null;
  }
}

/**
 * Update CSV row with status and reason
 */
async function updateCSVRow(csvFilePath, rowIndex, status, reason = '') {
  try {
    const csvContent = await fs.readFile(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (rowIndex >= lines.length) {
      logger.error('Row index out of bounds', { rowIndex, totalLines: lines.length });
      return false;
    }
    
    // Parse the line
    const values = lines[rowIndex].split(',').map(val => val.replace(/"/g, '').trim());
    
    // Update status and reason
    values[1] = status;
    values[2] = reason;
    
    // Reconstruct the line
    lines[rowIndex] = values.map(val => `"${val}"`).join(',');
    
    // Write back to file
    await fs.writeFile(csvFilePath, lines.join('\n') + '\n');
    
    logger.info('Updated CSV row', { rowIndex, status, reason });
    return true;
    
  } catch (error) {
    logger.error('Failed to update CSV row', { rowIndex, status, reason, error: error.message });
    return false;
  }
}

/**
 * Get total rows in CSV file
 */
async function getCSVTotalRows(csvFilePath) {
  try {
    const csvContent = await fs.readFile(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    return lines.length;
  } catch (error) {
    logger.error('Failed to get CSV total rows', { error: error.message });
    return 0;
  }
}

/**
 * Create the career discovery workflow
 */
function createCareerDiscoveryWorkflow() {
  const workflow = new StateGraph({
    channels: {
      companyName: { value: (x) => x.companyName },
      page: { value: (x) => x.page },
      careerPageUrl: { value: (x) => x.careerPageUrl },
      jobListingsUrl: { value: (x) => x.jobListingsUrl },
      filteredJobUrl: { value: (x) => x.filteredJobUrl },
      metadata: { value: (x) => x.metadata },
      status: { value: (x) => x.status },
      errors: { value: (x) => x.errors }
    }
  });

  // Add nodes
  workflow.addNode('career_page_finder', careerPageFinderNode);
  workflow.addNode('job_listings_navigator', jobListingsNavigatorNode);
  workflow.addNode('filter_analyzer', filterAnalyzerNode);
  workflow.addNode('metadata_constructor', metadataConstructorNode);

  // Linear flow - no conditional edges needed
  workflow.addEdge('career_page_finder', 'job_listings_navigator');
  workflow.addEdge('job_listings_navigator', 'filter_analyzer');
  workflow.addEdge('filter_analyzer', 'metadata_constructor');
  workflow.addEdge('metadata_constructor', END);

  return workflow.compile();
}

/**
 * Process a single company through the workflow
 */
async function processCompany(companyName, workflow) {
  logger.info('Starting career discovery for company', { companyName });
  
  try {
    // Initialize enhanced Stagehand client
    await enhancedStagehandClient.initialize();
    
    // Create fresh incognito page
    const page = await enhancedStagehandClient.newPage();
    
    // Initial state
    const initialState = {
      companyName,
      page,
      status: 'pending',
      currentStep: 'career_page_finder',
      errors: []
    };
    
    // Run the workflow
    const result = await workflow.invoke(initialState);
    
    logger.info('Career discovery completed for company', { 
      companyName, 
      status: result.status,
      careerPageUrl: result.careerPageUrl,
      jobListingsUrl: result.jobListingsUrl,
      filteredJobUrl: result.filteredJobUrl
    });
    
    return result;
    
  } catch (error) {
    logger.error('Career discovery failed for company', { 
      companyName, 
      error: error.message 
    });
    
    return {
      companyName,
      status: 'failed',
      errors: [error.message],
      currentStep: 'error'
    };
    
  } finally {
    // Cleanup
    await enhancedStagehandClient.close();
  }
}

/**
 * Main function to run career discovery workflow - SIMPLE STATE APPROACH
 * Processes ONE company at a time based on CSV row index
 */
async function runCareerDiscovery(options = {}) {
  const {
    csvFilePath = path.join(__dirname, '../../../data/companies.csv'),
    forceRowIndex = null // Optional: force processing a specific row
  } = options;
  
  try {
    // Load current state
    const state = await loadState();
    
    // Initialize state if first run
    if (!state.csvFilePath) {
      logger.info('First run - initializing state', { csvFilePath });
      state.csvFilePath = csvFilePath;
      state.csvRowIndex = 1;
      state.totalRows = await getCSVTotalRows(csvFilePath);
      
      if (state.totalRows === 0) {
        logger.warn('No companies found in CSV file');
        return { message: 'No companies found in CSV file' };
      }
      
      await saveState(state);
    }
    
    // Determine which row to process
    let targetRowIndex = forceRowIndex !== null ? forceRowIndex : state.csvRowIndex;
    
    // Check if we've reached the end
    if (targetRowIndex > state.totalRows) {
      logger.info('Reached end of CSV, resetting to first row');
      targetRowIndex = 1;
      state.csvRowIndex = 1;
      await saveState(state);
    }
    
    // Read the company from CSV
    const company = await readCSVRow(csvFilePath, targetRowIndex);
    
    if (!company) {
      logger.error('Failed to read company from CSV', { targetRowIndex });
      return { error: 'Failed to read company from CSV' };
    }
    
    // Check if company is already processed
    if (company.status === 'success' || company.status === 'failed') {
      logger.info('Company already processed, moving to next', { 
        companyName: company.companyName, 
        status: company.status,
        reason: company.reason,
        rowIndex: targetRowIndex 
      });
      
      // Move to next row
      state.csvRowIndex = targetRowIndex + 1;
      await saveState(state);
      
      return { 
        message: `Company already processed: ${company.companyName} (${company.status})`,
        nextRow: state.csvRowIndex
      };
    }
    
    // Process the company
    logger.info('Processing company', { 
      companyName: company.companyName,
      rowIndex: targetRowIndex,
      totalRows: state.totalRows
    });
    
    console.log(`🔄 Processing company ${targetRowIndex}/${state.totalRows}: ${company.companyName}`);
    
    // Create workflow and process company
    const workflow = createCareerDiscoveryWorkflow();
    const result = await processCompany(company.companyName, workflow);
    
    // Update CSV based on result
    if (result.status === 'metadata_constructed') {
      await updateCSVRow(csvFilePath, targetRowIndex, 'success', 'Career discovery completed successfully');
      console.log(`✅ Success: ${company.companyName}`);
      logger.info('Company processed successfully', { companyName: company.companyName });
    } else {
      const errorReason = result.errors ? result.errors.join(', ') : 'Unknown error';
      await updateCSVRow(csvFilePath, targetRowIndex, 'failed', errorReason);
      console.log(`❌ Failed: ${company.companyName} - ${errorReason}`);
      logger.error('Company processing failed', { 
        companyName: company.companyName, 
        error: errorReason 
      });
    }
    
    // Move to next row
    state.csvRowIndex = targetRowIndex + 1;
    await saveState(state);
    
    // Return result
    return {
      companyName: company.companyName,
      rowIndex: targetRowIndex,
      status: result.status,
      result,
      nextRow: state.csvRowIndex,
      totalRows: state.totalRows
    };
    
  } catch (error) {
    logger.error('Career discovery workflow failed', { error: error.message });
    throw error;
  }
}

// Export functions
export {
  runCareerDiscovery,
  processCompany,
  createCareerDiscoveryWorkflow,
  loadState,
  saveState
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  // Check for force row index option
  let forceRowIndex = null;
  if (args.includes('--force-row')) {
    const rowArg = args[args.indexOf('--force-row') + 1];
    forceRowIndex = parseInt(rowArg);
  }
  
  runCareerDiscovery({ forceRowIndex });
} 