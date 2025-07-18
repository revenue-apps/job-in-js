/**
 * Unit Test for Filter Analyzer Node
 * 
 * This test uses the actual filterAnalyzerNode function with a real job listings page
 * to validate that it can analyze and extract filter parameters from job listings pages.
 */

import { enhancedStagehandClient } from './src/shared/utils/enhancedStagehand.js';
import filterAnalyzerNode from './src/new-workflows/career-page-discovery/nodes/filterAnalyzerNode.js';

// Test configuration
const TEST_CONFIG = {
  companyName: 'Housing.com',
  jobListingsUrl: 'https://careers.housing.com/join-us/', // This should be the URL found by jobListingsNavigatorNode
  timeout: 30000, // 30 seconds
  headless: false // Set to true for headless mode
};

// Test state factory
function createTestState(overrides = {}) {
  return {
    // Input data
    jobListingsUrl: TEST_CONFIG.jobListingsUrl,
    
    // Browser (will be set by test)
    page: null,
    
    // Discovery results
    filteredJobUrl: '',
    urlParameters: {},
    availableFilters: [],
    
    // Workflow state
    currentStep: 'filter_analyzer',
    status: 'pending',
    errors: [],
    
    ...overrides
  };
}

// Test result validator
function validateNodeResult(result, expectedFields = []) {
  const requiredFields = ['status', 'errors', 'currentStep', ...expectedFields];
  
  for (const field of requiredFields) {
    if (!(field in result)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  if (result.errors && result.errors.length > 0) {
    console.log('⚠️  Node completed with errors:', result.errors);
  }
  
  return true;
}

// Main test function
async function testFilterAnalyzerWithRealSite() {
  console.log('🧪 Testing Filter Analyzer Node with Real Site');
  console.log('==============================================');
  console.log(`Company: ${TEST_CONFIG.companyName}`);
  console.log(`Job Listings URL: ${TEST_CONFIG.jobListingsUrl}`);
  console.log(`Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log(`Headless: ${TEST_CONFIG.headless}`);
  console.log('');
  
  let page = null;
  
  try {
    // Step 1: Initialize enhanced Stagehand client
    console.log('📱 Initializing enhanced Stagehand client...');
    await enhancedStagehandClient.initialize();
    
    // Step 2: Get page from enhanced client
    console.log('📄 Getting page from enhanced client...');
    page = await enhancedStagehandClient.newPage();
    
    // Step 3: Create test state with the actual page object
    console.log('🔧 Setting up test state...');
    const state = createTestState({
      page: page, // Pass the real Stagehand page object
      jobListingsUrl: TEST_CONFIG.jobListingsUrl
    });
    
    // Step 4: Run the actual node function
    console.log('🚀 Running filterAnalyzerNode...');
    console.log(`Navigating to: ${TEST_CONFIG.jobListingsUrl}`);
    
    const startTime = Date.now();
    const result = await filterAnalyzerNode(state);
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Step 5: Validate result
    console.log('\n📊 Test Results:');
    console.log('================');
    
    validateNodeResult(result, ['filteredJobUrl', 'urlParameters', 'availableFilters']);
    
    console.log('✅ Node execution completed successfully');
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`📈 Status: ${result.status}`);
    
    if (result.filteredJobUrl) {
      console.log(`🎯 Filtered Job URL: ${result.filteredJobUrl}`);
    }
    
    if (result.urlParameters && Object.keys(result.urlParameters).length > 0) {
      console.log(`🔍 URL Parameters found:`, result.urlParameters);
    }
    
    if (result.availableFilters && result.availableFilters.length > 0) {
      console.log(`🎛️  Available Filters (${result.availableFilters.length}):`);
      result.availableFilters.forEach((filter, index) => {
        console.log(`  ${index + 1}. ${filter.name} (${filter.type})`);
        if (filter.values && filter.values.length > 0) {
          console.log(`     Values: ${filter.values.slice(0, 3).join(', ')}${filter.values.length > 3 ? '...' : ''}`);
        }
        if (filter.urlParameter) {
          console.log(`     URL Param: ${filter.urlParameter}`);
        }
      });
    }
    
    // Display granular filter information
    if (result.filters) {
      console.log(`🔍 Granular Filter Analysis:`);
      
      if (result.filters.searchBar) {
        const searchBar = result.filters.searchBar;
        console.log(`  📝 Search Bar: ${searchBar.isFound ? 'Found' : 'Not Found'}`);
        if (searchBar.isFound) {
          console.log(`     Selector: ${searchBar.selector}`);
          console.log(`     Field: ${searchBar.field}`);
        }
      }
      
      if (result.filters.locationFilter) {
        const locationFilter = result.filters.locationFilter;
        console.log(`  📍 Location Filter: ${locationFilter.isFound ? 'Found' : 'Not Found'}`);
        if (locationFilter.isFound) {
          console.log(`     Selector: ${locationFilter.selector}`);
          console.log(`     Field: ${locationFilter.field}`);
        }
      }
      
      if (result.filters.departmentFilter) {
        const departmentFilter = result.filters.departmentFilter;
        console.log(`  🏢 Department Filter: ${departmentFilter.isFound ? 'Found' : 'Not Found'}`);
        if (departmentFilter.isFound) {
          console.log(`     Selector: ${departmentFilter.selector}`);
          console.log(`     Field: ${departmentFilter.field}`);
        }
      }
    }
    
    // Step 6: Verify the filtered URL (optional)
    if (result.filteredJobUrl && result.filteredJobUrl !== TEST_CONFIG.jobListingsUrl) {
      console.log('\n🔍 Verifying filtered job URL...');
      try {
        await page.goto(result.filteredJobUrl);
        console.log('✅ Successfully navigated to filtered job listings page');
        
        // Take a screenshot for verification
        await page.screenshot({ path: 'filtered-job-listings-verification.png' });
        console.log('📸 Screenshot saved as: filtered-job-listings-verification.png');
        
      } catch (error) {
        console.log('⚠️  Could not verify filtered job URL:', error.message);
      }
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Step 7: Summary
    console.log('\n📋 Test Summary:');
    console.log('===============');
    console.log(`Company: ${TEST_CONFIG.companyName}`);
    console.log(`Job Listings URL: ${TEST_CONFIG.jobListingsUrl}`);
    console.log(`Filtered URL: ${result.filteredJobUrl}`);
    console.log(`URL Parameters: ${Object.keys(result.urlParameters || {}).length}`);
    console.log(`Available Filters: ${result.availableFilters ? result.availableFilters.length : 0}`);
    console.log(`Granular Filters: ${result.filters ? 'Analyzed' : 'Not Available'}`);
    console.log(`Page Validation: ${result.pageValidated ? 'Passed' : 'Failed'}`);
    console.log(`Status: ${result.status}`);
    console.log(`Execution Time: ${executionTime}ms`);
    console.log(`Errors: ${result.errors ? result.errors.length : 0}`);
    
    const success = result.status === 'filters_analyzed' && result.filteredJobUrl;
    console.log(`\n🎯 Test Result: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      success,
      result,
      executionTime,
      filteredJobUrl: result.filteredJobUrl,
      urlParameters: result.urlParameters,
      availableFilters: result.availableFilters,
      errors: result.errors
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

// Test with different job listings URLs
async function testMultipleJobSites() {
  const jobSites = [
    {
      name: 'Tekion',
      jobListingsUrl: 'https://tekion.com/careers/jobs'
    },
    {
      name: 'Google',
      jobListingsUrl: 'https://careers.google.com/jobs'
    },
    {
      name: 'Microsoft',
      jobListingsUrl: 'https://careers.microsoft.com/us/en/search-results'
    }
  ];
  
  console.log('🧪 Testing Multiple Job Sites');
  console.log('=============================');
  
  const results = [];
  
  for (const site of jobSites) {
    console.log(`\n--- Testing ${site.name} ---`);
    
    // Update test config
    TEST_CONFIG.companyName = site.name;
    TEST_CONFIG.jobListingsUrl = site.jobListingsUrl;
    
    const result = await testFilterAnalyzerWithRealSite();
    results.push({
      company: site.name,
      ...result
    });
    
    // Wait between tests
    if (site.name !== jobSites[jobSites.length - 1].name) {
      console.log('⏳ Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary
  console.log('\n📊 Multi-Site Test Summary:');
  console.log('===========================');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${index + 1}. ${result.company}: ${status}`);
    
    if (result.filteredJobUrl) {
      console.log(`   Filtered URL: ${result.filteredJobUrl}`);
    }
    
    if (result.urlParameters && Object.keys(result.urlParameters).length > 0) {
      console.log(`   URL Parameters: ${Object.keys(result.urlParameters).length}`);
    }
    
    if (result.availableFilters && result.availableFilters.length > 0) {
      console.log(`   Available Filters: ${result.availableFilters.length}`);
    }
    
    if (result.filters) {
      const foundFilters = Object.values(result.filters).filter(f => f && f.isFound).length;
      console.log(`   Granular Filters Found: ${foundFilters}`);
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
    }
    
    console.log(`   Time: ${result.executionTime}ms`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n🎯 Overall Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  return results;
}

// Export functions for programmatic use
export {
  testFilterAnalyzerWithRealSite,
  testMultipleJobSites,
  createTestState,
  validateNodeResult
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--multi')) {
    testMultipleJobSites();
  } else {
    testFilterAnalyzerWithRealSite();
  }
} 