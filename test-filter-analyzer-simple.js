/**
 * Simple Unit Test for Filter Analyzer Node
 * 
 * Tests the filterAnalyzerNode with a real URL and page instance
 */

import { enhancedStagehandClient } from './src/shared/utils/enhancedStagehand.js';
import filterAnalyzerNode from './src/new-workflows/career-page-discovery/nodes/filterAnalyzerNode.js';

// Test configuration
const TEST_CONFIG = {
  companyName: 'Aha!',
  jobListingsUrl: 'https://www.aha.io/company/careers/current-openings',
  timeout: 30000
};

// Simple test state factory
function createTestState(page, jobListingsUrl) {
  return {
    // Input data
    jobListingsUrl: jobListingsUrl,
    page: page,
    
    // Workflow state
    currentStep: 'filter_analyzer',
    status: 'pending',
    errors: []
  };
}

// Main test function
async function testFilterAnalyzerSimple() {
  console.log('🧪 Simple Filter Analyzer Node Test');
  console.log('====================================');
  console.log(`Company: ${TEST_CONFIG.companyName}`);
  console.log(`URL: ${TEST_CONFIG.jobListingsUrl}`);
  console.log('');
  
  let page = null;
  
  try {
    // Step 1: Initialize enhanced Stagehand client
    console.log('📱 Initializing enhanced Stagehand client...');
    await enhancedStagehandClient.initialize();
    
    // Step 2: Get page from enhanced client
    console.log('📄 Getting page from enhanced client...');
    page = await enhancedStagehandClient.newPage();
    
    // Step 3: Create test state with URL and page
    console.log('🔧 Creating test state...');
    const state = createTestState(page, TEST_CONFIG.jobListingsUrl);
    
    // Step 4: Run the node function
    console.log('🚀 Running filterAnalyzerNode...');
    console.log(`Input URL: ${TEST_CONFIG.jobListingsUrl}`);
    
    const startTime = Date.now();
    const result = await filterAnalyzerNode(state);
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Step 5: Display results
    console.log('\n📊 Test Results:');
    console.log('================');
    
    console.log('✅ Node execution completed');
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`📈 Status: ${result.status}`);
    
    if (result.filteredJobUrl) {
      console.log(`🎯 Filtered Job URL: ${result.filteredJobUrl}`);
    }
    
    if (result.urlParameters && Object.keys(result.urlParameters).length > 0) {
      console.log(`🔍 URL Parameters:`, result.urlParameters);
    }
    
    if (result.filters && Object.keys(result.filters).length > 0) {
      console.log(`🎛️  Filters Found:`);
      Object.entries(result.filters).forEach(([key, filter]) => {
        if (filter && filter.isFound) {
          console.log(`  ✅ ${key}: ${filter.field} (${filter.selector})`);
        } else {
          console.log(`  ❌ ${key}: Not found`);
        }
      });
    }
    
    if (result.pageValidated !== undefined) {
      console.log(`✅ Page Validation: ${result.pageValidated ? 'Passed' : 'Failed'}`);
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Step 6: Summary
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`Input URL: ${TEST_CONFIG.jobListingsUrl}`);
    console.log(`Output URL: ${result.filteredJobUrl}`);
    console.log(`Status: ${result.status}`);
    console.log(`Execution Time: ${executionTime}ms`);
    console.log(`Errors: ${result.errors ? result.errors.length : 0}`);
    
    const success = result.status === 'success' && result.filteredJobUrl;
    console.log(`\n🎯 Test Result: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      success,
      result,
      executionTime
    };
    
  } catch (error) {
    console.log('\n💥 Test failed with error:', error.message);
    console.log('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
    
  } finally {
    // Cleanup
    if (page) {
      console.log('🧹 Closing page...');
      await page.close();
    }
    
    console.log('🧹 Closing enhanced Stagehand client...');
    await enhancedStagehandClient.close();
    
    console.log('✅ Cleanup completed');
  }
}

// Export for programmatic use
export { testFilterAnalyzerSimple };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFilterAnalyzerSimple();
} 