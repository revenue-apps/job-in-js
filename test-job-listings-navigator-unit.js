/**
 * Unit Test for Job Listings Navigator Node
 * 
 * This test uses the actual jobListingsNavigatorNode function with a real career site (Tekion)
 * to validate that it can find job listings pages from career homepages.
 */

import { enhancedStagehandClient } from './src/shared/utils/enhancedStagehand.js';
import jobListingsNavigatorNode from './src/new-workflows/career-page-discovery/nodes/jobListingsNavigatorNode.js';

// Test configuration
const TEST_CONFIG = {
  companyName: 'Uber',
  careerPageUrl: 'https://www.uber.com/in/en/careers/',
  timeout: 30000, // 30 seconds
  headless: false // Set to true for headless mode
};

// Test state factory
function createTestState(overrides = {}) {
  return {
    // Input data
    careerPageUrl: TEST_CONFIG.careerPageUrl,
    
    // Browser (will be set by test)
    page: null,
    
    // Discovery results
    jobListingsUrl: '',
    
    // Workflow state
    currentStep: 'job_listings_navigator',
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
async function testJobListingsNavigatorWithRealSite() {
  console.log('🧪 Testing Job Listings Navigator Node with Real Site');
  console.log('==================================================');
  console.log(`Company: ${TEST_CONFIG.companyName}`);
  console.log(`Career Page: ${TEST_CONFIG.careerPageUrl}`);
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
      careerPageUrl: TEST_CONFIG.careerPageUrl
    });
    
    // Step 4: Run the actual node function
    console.log('🚀 Running jobListingsNavigatorNode...');
    console.log(`Navigating to: ${TEST_CONFIG.careerPageUrl}`);
    
    const startTime = Date.now();
    const result = await jobListingsNavigatorNode(state);
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Step 5: Validate result
    console.log('\n📊 Test Results:');
    console.log('================');
    
    validateNodeResult(result, ['jobListingsUrl']);
    
    console.log('✅ Node execution completed successfully');
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`📈 Status: ${result.status}`);
    
    if (result.jobListingsUrl) {
      console.log(`🎯 Job Listings URL found: ${result.jobListingsUrl}`);
      
      // Step 6: Verify the found URL (optional)
      console.log('\n🔍 Verifying job listings URL...');
      try {
        await page.goto(result.jobListingsUrl);
        console.log('✅ Successfully navigated to job listings page');
        
        // Take a screenshot for verification
        await page.screenshot({ path: 'job-listings-verification.png' });
        console.log('📸 Screenshot saved as: job-listings-verification.png');
        
      } catch (error) {
        console.log('⚠️  Could not verify job listings URL:', error.message);
      }
      
    } else {
      console.log('❌ No job listings URL found');
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
    console.log(`Career Page: ${TEST_CONFIG.careerPageUrl}`);
    console.log(`Job Listings Found: ${result.jobListingsUrl ? '✅ YES' : '❌ NO'}`);
    console.log(`Job Listings URL: ${result.jobListingsUrl || 'N/A'}`);
    console.log(`Status: ${result.status}`);
    console.log(`Execution Time: ${executionTime}ms`);
    console.log(`Errors: ${result.errors ? result.errors.length : 0}`);
    
    const success = result.status === 'job_listings_found' && result.jobListingsUrl;
    console.log(`\n🎯 Test Result: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      success,
      result,
      executionTime,
      jobListingsUrl: result.jobListingsUrl,
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

// Test with different companies
async function testMultipleCompanies() {
  const companies = [
    {
      name: 'Tekion',
      careerPageUrl: 'https://tekion.com/careers'
    },
    {
      name: 'Google',
      careerPageUrl: 'https://careers.google.com'
    },
    {
      name: 'Microsoft',
      careerPageUrl: 'https://careers.microsoft.com'
    }
  ];
  
  console.log('🧪 Testing Multiple Companies');
  console.log('=============================');
  
  const results = [];
  
  for (const company of companies) {
    console.log(`\n--- Testing ${company.name} ---`);
    
    // Update test config
    TEST_CONFIG.companyName = company.name;
    TEST_CONFIG.careerPageUrl = company.careerPageUrl;
    
    const result = await testJobListingsNavigatorWithRealSite();
    results.push({
      company: company.name,
      ...result
    });
    
    // Wait between tests
    if (company.name !== companies[companies.length - 1].name) {
      console.log('⏳ Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary
  console.log('\n📊 Multi-Company Test Summary:');
  console.log('==============================');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${index + 1}. ${result.company}: ${status}`);
    
    if (result.jobListingsUrl) {
      console.log(`   Job Listings: ${result.jobListingsUrl}`);
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
  testJobListingsNavigatorWithRealSite,
  testMultipleCompanies,
  createTestState,
  validateNodeResult
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--multi')) {
    testMultipleCompanies();
  } else {
    testJobListingsNavigatorWithRealSite();
  }
} 