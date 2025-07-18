#!/usr/bin/env node

/**
 * Career Discovery Scheduled Job Runner
 * 
 * This script is designed to be run as a scheduled job (e.g., cron job).
 * Each execution processes ONE company from the CSV and updates the state.
 * 
 * Usage:
 *   node run-career-discovery.js                    # Process next company
 *   node run-career-discovery.js --force-row 1     # Force process specific row
 *   node run-career-discovery.js --status          # Show current status
 */

import { runCareerDiscovery, loadState } from './src/new-workflows/career-page-discovery/index.js';

async function main() {
  const args = process.argv.slice(2);
  
  // Check for status flag
  if (args.includes('--status')) {
    console.log('📊 Career Discovery Status');
    console.log('==========================');
    
    try {
      const state = await loadState();
      
      if (!state.csvFilePath) {
        console.log('No CSV file configured yet. Run without --status to start processing.');
        return;
      }
      
      console.log(`CSV File: ${state.csvFilePath}`);
      console.log(`Current Row: ${state.csvRowIndex}`);
      console.log(`Total Rows: ${state.totalRows}`);
      
      if (state.csvRowIndex > state.totalRows) {
        console.log('\n🔄 Status: Ready to reset to first row');
      } else {
        console.log(`\n📋 Next company to process: Row ${state.csvRowIndex}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to load status:', error.message);
    }
    
    return;
  }
  
  // Check for force row
  let forceRowIndex = null;
  if (args.includes('--force-row')) {
    const rowArg = args[args.indexOf('--force-row') + 1];
    forceRowIndex = parseInt(rowArg);
    console.log(`🔄 Force processing row: ${forceRowIndex}`);
  }
  
  // Run career discovery
  try {
    console.log('🚀 Starting Career Discovery Job');
    console.log('================================');
    
    const result = await runCareerDiscovery({ forceRowIndex });
    
    if (result.message) {
      // Company already processed or other message
      console.log('\n' + result.message);
      if (result.nextRow) {
        console.log(`Next row to process: ${result.nextRow}`);
      }
    } else if (result.error) {
      console.log(`\n❌ Error: ${result.error}`);
      process.exit(1);
    } else {
      // Single company processed
      console.log(`\n✅ Processed: ${result.companyName}`);
      console.log(`   Row: ${result.rowIndex}/${result.totalRows}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Next Row: ${result.nextRow}`);
      
      if (result.result) {
        console.log(`   Career Page: ${result.result.careerPageUrl || 'Not found'}`);
        console.log(`   Job Listings: ${result.result.jobListingsUrl || 'Not found'}`);
        console.log(`   Filtered URL: ${result.result.filteredJobUrl || 'Not found'}`);
      }
    }
    
    // Exit with success code
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Career discovery failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 