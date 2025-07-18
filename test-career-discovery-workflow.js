/**
 * Test Career Discovery Workflow - Simple State Approach
 * 
 * Demonstrates how to use the career discovery workflow with:
 * 1. CSV row index tracking
 * 2. Simple state management
 * 3. CSV file updates
 */

import { runCareerDiscovery, loadState } from './src/new-workflows/career-page-discovery/index.js';

// Test single company processing
async function testSingleCompanyProcessing() {
  console.log('🧪 Testing Career Discovery Workflow - Single Company Processing');
  console.log('===============================================================');
  
  try {
    // Run the workflow (processes one company)
    const result = await runCareerDiscovery();
    
    console.log('\n📊 Result:');
    console.log('==========');
    
    if (result.message) {
      // Company already processed or other message
      console.log(result.message);
      if (result.nextRow) {
        console.log(`Next row to process: ${result.nextRow}`);
      }
    } else if (result.error) {
      console.log(`Error: ${result.error}`);
    } else {
      // Single company processed
      console.log(`Company: ${result.companyName}`);
      console.log(`Row: ${result.rowIndex}`);
      console.log(`Status: ${result.status}`);
      console.log(`Next Row: ${result.nextRow}`);
      console.log(`Total Rows: ${result.totalRows}`);
      
      if (result.result) {
        console.log(`Career Page: ${result.result.careerPageUrl || 'Not found'}`);
        console.log(`Job Listings: ${result.result.jobListingsUrl || 'Not found'}`);
        console.log(`Filtered URL: ${result.result.filteredJobUrl || 'Not found'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test multiple runs to process all companies
async function testMultipleRuns() {
  console.log('🧪 Testing Career Discovery Workflow - Multiple Runs');
  console.log('===================================================');
  
  try {
    let runCount = 0;
    let resetCount = 0;
    
    while (runCount < 20) { // Safety limit
      runCount++;
      console.log(`\n🔄 Run #${runCount}`);
      console.log('================');
      
      const result = await runCareerDiscovery();
      
      if (result.message) {
        console.log(result.message);
        if (result.nextRow === 1) {
          resetCount++;
          console.log('🔄 Reset to first row detected');
        }
      } else if (result.error) {
        console.log(`Error: ${result.error}`);
        break;
      } else {
        console.log(`Processed: ${result.companyName} (Row ${result.rowIndex}/${result.totalRows})`);
      }
      
      // Small delay between runs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Completed ${runCount} runs, ${resetCount} resets`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test state inspection
async function testStateInspection() {
  console.log('🧪 Testing State Inspection');
  console.log('===========================');
  
  try {
    const state = await loadState();
    
    console.log('\n📊 Current State:');
    console.log('=================');
    console.log(`CSV File Path: ${state.csvFilePath || 'Not set'}`);
    console.log(`Current Row Index: ${state.csvRowIndex || 'Not set'}`);
    console.log(`Total Rows: ${state.totalRows || 'Not set'}`);
    
    if (state.csvFilePath) {
      console.log(`\n📋 CSV Status:`);
      console.log(`   File: ${state.csvFilePath}`);
      console.log(`   Next Row: ${state.csvRowIndex}`);
      console.log(`   Total Rows: ${state.totalRows}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test force row processing
async function testForceRow() {
  console.log('🧪 Testing Force Row Processing');
  console.log('===============================');
  
  try {
    // Force process company at row 1
    const result = await runCareerDiscovery({ forceRowIndex: 1 });
    
    console.log('\n📊 Force Row Result:');
    console.log('====================');
    
    if (result.message) {
      console.log(result.message);
    } else if (result.error) {
      console.log(`Error: ${result.error}`);
    } else {
      console.log(`Forced Company: ${result.companyName}`);
      console.log(`Row: ${result.rowIndex}`);
      console.log(`Status: ${result.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test CSV file inspection
async function testCSVInspection() {
  console.log('🧪 Testing CSV File Inspection');
  console.log('==============================');
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const csvFilePath = './data/companies.csv';
    const csvContent = await fs.readFile(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log('\n📊 CSV File Status:');
    console.log('===================');
    console.log(`File: ${csvFilePath}`);
    console.log(`Total Lines: ${lines.length}`);
    
    if (lines.length > 0) {
      console.log('\n📋 First few rows:');
      lines.slice(0, 5).forEach((line, index) => {
        const values = line.split(',').map(val => val.replace(/"/g, '').trim());
        console.log(`   ${index}: ${values.join(' | ')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Career Discovery Workflow Tests - Simple State Approach');
  console.log('==========================================================');
  console.log('');
  
  // Test 1: State inspection
  await testStateInspection();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: CSV inspection
  await testCSVInspection();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Single company processing
  await testSingleCompanyProcessing();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Force row processing
  await testForceRow();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: Multiple runs (uncomment to test full processing)
  // await testMultipleRuns();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--single')) {
    testSingleCompanyProcessing();
  } else if (args.includes('--multiple')) {
    testMultipleRuns();
  } else if (args.includes('--state')) {
    testStateInspection();
  } else if (args.includes('--force')) {
    testForceRow();
  } else if (args.includes('--csv')) {
    testCSVInspection();
  } else {
    runTests();
  }
}

export { testSingleCompanyProcessing, testMultipleRuns, testStateInspection, testForceRow, testCSVInspection, runTests }; 