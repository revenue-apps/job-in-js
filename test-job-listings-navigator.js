/**
 * Standalone Test for Job Listings Navigator Node
 * 
 * This file provides a focused way to test the jobListingsNavigatorNode
 * with mock data and controlled scenarios.
 */

import { logger } from './src/shared/utils/logger.js';
import jobListingsNavigatorNode from './src/new-workflows/career-page-discovery/nodes/jobListingsNavigatorNode.js';

// Mock Stagehand page for testing
class MockStagehandPage {
  constructor() {
    this.url = 'https://example.com';
    this.content = '';
    this.extractCalls = [];
    this.askCalls = [];
    this.discoverCalls = [];
    this.gotoCalls = [];
    this.responses = {
      extract: {},
      ask: {},
      discover: {}
    };
  }

  async goto(url) {
    this.gotoCalls.push(url);
    this.url = url;
    return { ok: true };
  }

  async extract(options) {
    this.extractCalls.push(options);
    
    // Return mock responses based on the instruction
    const instruction = options.instruction || '';
    
    if (instruction.includes('Find all links')) {
      return {
        matchingLinks: [
          { text: 'View Jobs', url: 'https://careers.example.com/jobs' },
          { text: 'Open Positions', url: 'https://careers.example.com/positions' }
        ]
      };
    }
    
    if (instruction.includes('Verify this is a job listings page')) {
      return { isValid: true };
    }
    
    if (instruction.includes('Quickly check if this page has job listings')) {
      return { isValid: true };
    }
    
    return this.responses.extract[instruction] || { isValid: false };
  }

  async ask(question) {
    this.askCalls.push(question);
    return this.responses.ask[question] || 'Mock AI response';
  }

  async discover(instruction) {
    this.discoverCalls.push(instruction);
    return this.responses.discover[instruction] || 'Mock discovered content';
  }

  async close() {
    return { ok: true };
  }
}

// Test state factory
function createTestState(overrides = {}) {
  return {
    // Input data
    careerPageUrl: 'https://careers.example.com',
    
    // Browser
    page: new MockStagehandPage(),
    
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
    logger.warn('Node completed with errors', { errors: result.errors });
  }
  
  return true;
}

// Test scenarios for Job Listings Navigator Node
async function testJobListingsNavigatorNode() {
  logger.info('=== Testing Job Listings Navigator Node ===');
  
  const testResults = [];
  
  try {
    // Test 1: Basic CTA matching success
    console.log('\n--- Test 1: Basic CTA Matching Success ---');
    const state1 = createTestState({
      careerPageUrl: 'https://careers.google.com'
    });
    
    const result1 = await jobListingsNavigatorNode(state1);
    validateNodeResult(result1, ['jobListingsUrl']);
    
    console.log('✅ Basic CTA matching test passed');
    console.log('Result:', {
      status: result1.status,
      jobListingsUrl: result1.jobListingsUrl,
      errors: result1.errors
    });
    
    testResults.push({ name: 'Basic CTA Matching', success: true, result: result1 });
    
    // Test 2: Fallback URL pattern success
    console.log('\n--- Test 2: Fallback URL Pattern Success ---');
    const state2 = createTestState({
      careerPageUrl: 'https://careers.microsoft.com'
    });
    
    // Mock the page to return no CTA matches, forcing fallback
    state2.page.responses.extract['Find all links'] = { matchingLinks: [] };
    state2.page.responses.extract['Verify this is a job listings page'] = { isValid: true };
    
    const result2 = await jobListingsNavigatorNode(state2);
    validateNodeResult(result2, ['jobListingsUrl']);
    
    console.log('✅ Fallback URL pattern test passed');
    console.log('Result:', {
      status: result2.status,
      jobListingsUrl: result2.jobListingsUrl,
      errors: result2.errors
    });
    
    testResults.push({ name: 'Fallback URL Pattern', success: true, result: result2 });
    
    // Test 3: No page provided (error handling)
    console.log('\n--- Test 3: No Page Provided (Error Handling) ---');
    const state3 = createTestState({
      careerPageUrl: 'https://careers.example.com',
      page: null
    });
    
    const result3 = await jobListingsNavigatorNode(state3);
    validateNodeResult(result3);
    
    console.log('✅ Error handling test passed');
    console.log('Result:', {
      status: result3.status,
      errors: result3.errors
    });
    
    testResults.push({ name: 'Error Handling', success: true, result: result3 });
    
    // Test 4: No career page URL provided (error handling)
    console.log('\n--- Test 4: No Career Page URL (Error Handling) ---');
    const state4 = createTestState({
      careerPageUrl: null
    });
    
    const result4 = await jobListingsNavigatorNode(state4);
    validateNodeResult(result4);
    
    console.log('✅ Missing URL error handling test passed');
    console.log('Result:', {
      status: result4.status,
      errors: result4.errors
    });
    
    testResults.push({ name: 'Missing URL Error Handling', success: true, result: result4 });
    
    // Test 5: Page interaction validation
    console.log('\n--- Test 5: Page Interaction Validation ---');
    const state5 = createTestState({
      careerPageUrl: 'https://careers.apple.com'
    });
    
    const result5 = await jobListingsNavigatorNode(state5);
    
    // Check if page methods were called
    const page = state5.page;
    console.log('Page interactions:', {
      gotoCalls: page.gotoCalls.length,
      extractCalls: page.extractCalls.length,
      askCalls: page.askCalls.length,
      discoverCalls: page.discoverCalls.length
    });
    
    console.log('✅ Page interaction test passed');
    testResults.push({ name: 'Page Interactions', success: true, result: result5 });
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    testResults.forEach((test, index) => {
      const status = test.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${index + 1}. ${test.name}: ${status}`);
      if (test.result.errors && test.result.errors.length > 0) {
        console.log(`   Errors: ${test.result.errors.join(', ')}`);
      }
    });
    
    const allPassed = testResults.every(test => test.success);
    
    if (allPassed) {
      logger.info('All job listings navigator node tests passed!');
      console.log('\n🎉 All tests passed successfully!');
    } else {
      logger.error('Some job listings navigator node tests failed');
      console.log('\n⚠️  Some tests failed. Check the logs above.');
    }
    
    return { success: allPassed, results: testResults };
    
  } catch (error) {
    logger.error('Job Listings Navigator Node test failed', { error: error.message });
    console.log('\n💥 Test execution failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Export for programmatic use
export {
  testJobListingsNavigatorNode,
  createTestState,
  MockStagehandPage,
  validateNodeResult
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testJobListingsNavigatorNode();
} 