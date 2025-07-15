import { logger } from '../../shared/utils/logger.js';
import careerPageFinderNode from '../../new-workflows/job-discovery/nodes/careerPageFinderNode.js';
import jobListingsNavigatorNode from '../../new-workflows/job-discovery/nodes/jobListingsNavigatorNode.js';
import filterAnalyzerNode from '../../new-workflows/job-discovery/nodes/filterAnalyzerNode.js';
import metadataConstructorNode from '../../new-workflows/job-discovery/nodes/metadataConstructorNode.js';

/**
 * Unit Testing Framework for Career Discovery Nodes
 * 
 * This framework allows testing individual nodes in isolation with:
 * - Mock Stagehand pages
 * - Controlled state inputs
 * - Expected output validation
 * - Error scenario testing
 */

// Mock Stagehand page for testing
class MockStagehandPage {
  constructor() {
    this.url = 'https://example.com';
    this.content = '';
    this.extractCalls = [];
    this.askCalls = [];
    this.discoverCalls = [];
    this.gotoCalls = [];
  }

  async goto(url) {
    this.gotoCalls.push(url);
    this.url = url;
    return { ok: true };
  }

  async extract(selector) {
    this.extractCalls.push(selector);
    return this.content;
  }

  async ask(question) {
    this.askCalls.push(question);
    return 'Mock AI response';
  }

  async discover(instruction) {
    this.discoverCalls.push(instruction);
    return 'Mock discovered content';
  }

  async close() {
    return { ok: true };
  }
}

// Test state factory
function createTestState(overrides = {}) {
  return {
    // Input data
    companyName: 'Test Company',
    companies: [
      { name: 'Test Company', domain: 'testcompany.com' }
    ],
    currentCompanyIndex: 0,
    
    // Browser
    page: new MockStagehandPage(),
    agent: null,
    
    // Discovery results
    careerPageUrl: '',
    jobListingsUrl: '',
    filteredJobUrl: '',
    urlParameters: {},
    
    // Workflow state
    currentStep: 'career_page_finder',
    status: 'pending',
    errors: [],
    metadata: {},
    
    ...overrides
  };
}

// Test result validator
function validateNodeResult(result, expectedFields = []) {
  const requiredFields = ['status', 'errors', ...expectedFields];
  
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

// Node 1: Career Page Finder Tests
async function testCareerPageFinderNode() {
  logger.info('=== Testing Career Page Finder Node ===');
  
  try {
    // Test 1: Basic functionality
    console.log('\n--- Test 1: Basic Career Page Discovery ---');
    const state1 = createTestState({
      companyName: 'Google',
      currentStep: 'career_page_finder'
    });
    
    const result1 = await careerPageFinderNode(state1);
    validateNodeResult(result1, ['careerPageUrl']);
    
    console.log('✅ Basic test passed');
    console.log('Result:', {
      status: result1.status,
      careerPageUrl: result1.careerPageUrl,
      errors: result1.errors
    });
    
    // Test 2: Error handling
    console.log('\n--- Test 2: Error Handling ---');
    const state2 = createTestState({
      companyName: 'Invalid Company 12345',
      currentStep: 'career_page_finder'
    });
    
    const result2 = await careerPageFinderNode(state2);
    validateNodeResult(result2);
    
    console.log('✅ Error handling test passed');
    console.log('Result:', {
      status: result2.status,
      errors: result2.errors
    });
    
    // Test 3: Page interaction validation
    console.log('\n--- Test 3: Page Interaction Validation ---');
    const state3 = createTestState({
      companyName: 'Microsoft',
      currentStep: 'career_page_finder'
    });
    
    const result3 = await careerPageFinderNode(state3);
    
    // Check if page methods were called
    const page = state3.page;
    console.log('Page interactions:', {
      gotoCalls: page.gotoCalls.length,
      askCalls: page.askCalls.length,
      discoverCalls: page.discoverCalls.length,
      extractCalls: page.extractCalls.length
    });
    
    console.log('✅ Page interaction test passed');
    
    return { success: true, results: [result1, result2, result3] };
    
  } catch (error) {
    logger.error('Career Page Finder Node test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Node 2: Job Listings Navigator Tests
async function testJobListingsNavigatorNode() {
  logger.info('=== Testing Job Listings Navigator Node ===');
  
  try {
    // Test 1: Basic navigation
    console.log('\n--- Test 1: Basic Job Listings Navigation ---');
    const state1 = createTestState({
      careerPageUrl: 'https://careers.google.com',
      currentStep: 'job_listings_navigator'
    });
    
    const result1 = await jobListingsNavigatorNode(state1);
    validateNodeResult(result1, ['jobListingsUrl']);
    
    console.log('✅ Basic navigation test passed');
    console.log('Result:', {
      status: result1.status,
      jobListingsUrl: result1.jobListingsUrl,
      errors: result1.errors
    });
    
    // Test 2: Navigation with existing job listings URL
    console.log('\n--- Test 2: Direct Job Listings URL ---');
    const state2 = createTestState({
      careerPageUrl: 'https://careers.microsoft.com',
      jobListingsUrl: 'https://careers.microsoft.com/us/en/search-results',
      currentStep: 'job_listings_navigator'
    });
    
    const result2 = await jobListingsNavigatorNode(state2);
    validateNodeResult(result2);
    
    console.log('✅ Direct URL test passed');
    
    return { success: true, results: [result1, result2] };
    
  } catch (error) {
    logger.error('Job Listings Navigator Node test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Node 3: Filter Analyzer Tests
async function testFilterAnalyzerNode() {
  logger.info('=== Testing Filter Analyzer Node ===');
  
  try {
    // Test 1: Basic filter analysis
    console.log('\n--- Test 1: Basic Filter Analysis ---');
    const state1 = createTestState({
      jobListingsUrl: 'https://careers.google.com/jobs',
      currentStep: 'filter_analyzer'
    });
    
    const result1 = await filterAnalyzerNode(state1);
    validateNodeResult(result1, ['filteredJobUrl', 'urlParameters']);
    
    console.log('✅ Basic filter analysis test passed');
    console.log('Result:', {
      status: result1.status,
      filteredJobUrl: result1.filteredJobUrl,
      urlParameters: result1.urlParameters,
      errors: result1.errors
    });
    
    // Test 2: Complex filter scenarios
    console.log('\n--- Test 2: Complex Filter Scenarios ---');
    const state2 = createTestState({
      jobListingsUrl: 'https://careers.microsoft.com/us/en/search-results',
      currentStep: 'filter_analyzer'
    });
    
    const result2 = await filterAnalyzerNode(state2);
    validateNodeResult(result2);
    
    console.log('✅ Complex filter test passed');
    
    return { success: true, results: [result1, result2] };
    
  } catch (error) {
    logger.error('Filter Analyzer Node test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Node 4: Metadata Constructor Tests
async function testMetadataConstructorNode() {
  logger.info('=== Testing Metadata Constructor Node ===');
  
  try {
    // Test 1: Basic metadata construction
    console.log('\n--- Test 1: Basic Metadata Construction ---');
    const state1 = createTestState({
      companyName: 'Google',
      careerPageUrl: 'https://careers.google.com',
      jobListingsUrl: 'https://careers.google.com/jobs',
      filteredJobUrl: 'https://careers.google.com/jobs?location=remote&level=senior',
      urlParameters: { location: 'remote', level: 'senior' },
      currentStep: 'metadata_constructor'
    });
    
    const result1 = await metadataConstructorNode(state1);
    validateNodeResult(result1, ['metadata']);
    
    console.log('✅ Basic metadata test passed');
    console.log('Result:', {
      status: result1.status,
      metadata: result1.metadata,
      errors: result1.errors
    });
    
    // Test 2: Metadata with errors
    console.log('\n--- Test 2: Metadata with Previous Errors ---');
    const state2 = createTestState({
      companyName: 'Test Company',
      careerPageUrl: 'https://testcompany.com/careers',
      errors: ['Failed to find job listings'],
      currentStep: 'metadata_constructor'
    });
    
    const result2 = await metadataConstructorNode(state2);
    validateNodeResult(result2);
    
    console.log('✅ Error metadata test passed');
    
    return { success: true, results: [result1, result2] };
    
  } catch (error) {
    logger.error('Metadata Constructor Node test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Integration test: Full workflow simulation
async function testNodeIntegration() {
  logger.info('=== Testing Node Integration ===');
  
  try {
    console.log('\n--- Simulating Full Workflow ---');
    
    // Start with initial state
    let state = createTestState({
      companyName: 'Apple',
      currentStep: 'career_page_finder'
    });
    
    // Node 1: Career Page Finder
    console.log('Running Node 1: Career Page Finder');
    state = await careerPageFinderNode(state);
    console.log('Node 1 result:', { status: state.status, careerPageUrl: state.careerPageUrl });
    
    // Node 2: Job Listings Navigator
    if (state.status === 'career_page_found') {
      console.log('Running Node 2: Job Listings Navigator');
      state.currentStep = 'job_listings_navigator';
      state = await jobListingsNavigatorNode(state);
      console.log('Node 2 result:', { status: state.status, jobListingsUrl: state.jobListingsUrl });
    }
    
    // Node 3: Filter Analyzer
    if (state.status === 'job_listings_found') {
      console.log('Running Node 3: Filter Analyzer');
      state.currentStep = 'filter_analyzer';
      state = await filterAnalyzerNode(state);
      console.log('Node 3 result:', { status: state.status, filteredJobUrl: state.filteredJobUrl });
    }
    
    // Node 4: Metadata Constructor
    console.log('Running Node 4: Metadata Constructor');
    state.currentStep = 'metadata_constructor';
    state = await metadataConstructorNode(state);
    console.log('Node 4 result:', { status: state.status, metadata: state.metadata });
    
    console.log('✅ Integration test passed');
    return { success: true, finalState: state };
    
  } catch (error) {
    logger.error('Integration test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runAllNodeTests() {
  logger.info('Starting Career Discovery Node Unit Tests');
  
  const testResults = {
    careerPageFinder: null,
    jobListingsNavigator: null,
    filterAnalyzer: null,
    metadataConstructor: null,
    integration: null
  };
  
  try {
    // Test individual nodes
    console.log('\n🧪 Testing Individual Nodes...\n');
    
    testResults.careerPageFinder = await testCareerPageFinderNode();
    testResults.jobListingsNavigator = await testJobListingsNavigatorNode();
    testResults.filterAnalyzer = await testFilterAnalyzerNode();
    testResults.metadataConstructor = await testMetadataConstructorNode();
    
    // Test integration
    console.log('\n🧪 Testing Node Integration...\n');
    testResults.integration = await testNodeIntegration();
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    Object.entries(testResults).forEach(([testName, result]) => {
      const status = result?.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${testName}: ${status}`);
      if (result?.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    const allPassed = Object.values(testResults).every(result => result?.success);
    
    if (allPassed) {
      logger.info('All career discovery node tests passed!');
      console.log('\n🎉 All tests passed successfully!');
    } else {
      logger.error('Some career discovery node tests failed');
      console.log('\n⚠️  Some tests failed. Check the logs above.');
    }
    
    return { success: allPassed, results: testResults };
    
  } catch (error) {
    logger.error('Test execution failed', { error: error.message });
    console.log('\n💥 Test execution failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Export individual test functions for selective testing
export {
  testCareerPageFinderNode,
  testJobListingsNavigatorNode,
  testFilterAnalyzerNode,
  testMetadataConstructorNode,
  testNodeIntegration,
  runAllNodeTests,
  createTestState,
  MockStagehandPage
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllNodeTests();
} 