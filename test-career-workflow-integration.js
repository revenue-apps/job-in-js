/**
 * Career Discovery Workflow Integration Test
 * 
 * This test simulates the complete workflow:
 * 1. Company Name → Career Page Finder Node
 * 2. Career Page URL → Job Listings Navigator Node
 * 3. Job Listings URL → Final Result
 */

// Mock logger
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message, data) => console.log(`[WARN] ${message}`, data || ''),
  error: (message, data) => console.log(`[ERROR] ${message}`, data || ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data || '')
};

// Mock zod for schema validation
const z = {
  object: (schema) => ({
    parse: (data) => data,
    safeParse: (data) => ({ success: true, data })
  }),
  array: (schema) => schema,
  string: () => (val) => val,
  boolean: () => (val) => val,
  number: () => (val) => val
};

// Mock CSV reader
const readCsvFile = async (path) => {
  console.log(`[MOCK] Reading CSV from: ${path}`);
  return [
    { phrase: 'View Jobs' },
    { phrase: 'Open Positions' },
    { phrase: 'Browse Jobs' },
    { phrase: 'Search Jobs' },
    { phrase: 'Find Jobs' },
    { phrase: 'Job Opportunities' },
    { phrase: 'Current Openings' },
    { phrase: 'Job Search' }
  ];
};

// Mock path and fileURLToPath
const path = {
  join: (...parts) => parts.join('/'),
  dirname: (filePath) => filePath.split('/').slice(0, -1).join('/')
};

const fileURLToPath = (url) => '/mock/path/to/file.js';

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
    
    const instruction = options.instruction || '';
    
    // Career page finder responses
    if (instruction.includes('Find the career page')) {
      return {
        careerPageUrl: 'https://careers.example.com',
        confidence: 0.9
      };
    }
    
    // Job listings navigator responses
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

// Import the actual node implementations
import careerPageFinderNode from './src/new-workflows/career-page-discovery/nodes/careerPageFinderNode.js';
import jobListingsNavigatorNode from './src/new-workflows/career-page-discovery/nodes/jobListingsNavigatorNode.js';

/**
 * Strategy 1: CTA phrase matching for job listings discovery
 */
async function findJobListingsWithCTA(page, careerPageUrl) {
  try {
    logger.info('Attempting CTA phrase matching for job listings', { careerPageUrl });
    
    // Load CTA phrases from CSV
    const ctaPhrases = await loadCTAPhrases();
    logger.info('Loaded CTA phrases', { count: ctaPhrases.length });
    
    // Navigate to career page
    await page.goto(careerPageUrl);
    
    // Use AI to find links matching CTA phrases
    const extractResult = await page.extract({
      instruction: `Find all links or buttons on this page whose text matches any of these phrases: ${ctaPhrases.join(', ')}. 
        Return the URLs of matching links. Focus on links that lead to job listings or job search pages.`,
      schema: z.object({ 
        matchingLinks: z.array(z.object({
          text: z.string(),
          url: z.string()
        }))
      })
    });
    
    const matchingLinks = extractResult?.matchingLinks || [];
    logger.info('Found matching CTA links', { count: matchingLinks.length, matchingLinks });
    
    // Test each matching link
    for (const link of matchingLinks) {
      try {
        logger.info('Testing CTA link', { text: link.text, url: link.url });
        
        // Navigate to the link
        await page.goto(link.url);
        
        // Validate it's actually a job listings page
        const { isValid } = await page.extract({
          instruction: `Verify this is a job listings page by checking for:
            - Job search functionality or search box
            - Job postings or job listings
            - Job filters or categories
            - "Apply" buttons or job application links
            Return true if this appears to be a job listings/search page.`,
          schema: z.object({ isValid: z.boolean() })
        });
        
        if (isValid) {
          logger.info('CTA link validated successfully', { text: link.text, url: link.url });
          return link.url;
        } else {
          logger.warn('CTA link validation failed', { text: link.text, url: link.url });
        }
        
      } catch (error) {
        logger.debug('CTA link test failed', { text: link.text, url: link.url, error: error.message });
        continue;
      }
    }
    
    return null;
    
  } catch (error) {
    logger.warn('CTA phrase matching failed', { careerPageUrl, error: error.message });
    return null;
  }
}

/**
 * Load CTA phrases from CSV file
 */
async function loadCTAPhrases() {
  try {
    const csvPath = path.join('/mock/path', 'config/job_listings_cta_phrases.csv');
    const phrases = await readCsvFile(csvPath);
    return phrases.map(row => row.phrase).filter(phrase => phrase && phrase.trim());
  } catch (error) {
    logger.warn('Failed to load CTA phrases from CSV, using defaults', { error: error.message });
    // Fallback to hardcoded phrases
    return [
      'View Jobs',
      'Open Positions', 
      'Browse Jobs',
      'Search Jobs',
      'Find Jobs',
      'Job Opportunities',
      'Current Openings',
      'Job Search'
    ];
  }
}

/**
 * Strategy 2: Fallback URL patterns
 */
async function findJobListingsWithFallback(page, careerPageUrl) {
  const commonPatterns = [
    '/jobs',
    '/careers/jobs',
    '/openings',
    '/positions',
    '/opportunities',
    '/search',
    '/job-search',
    '/careers/search',
    '/jobs/search',
    '/find-jobs',
    '/browse-jobs',
    '/job-listings'
  ];
  
  logger.info('Attempting fallback URL patterns', { 
    careerPageUrl, 
    patternsCount: commonPatterns.length 
  });
  
  for (const pattern of commonPatterns) {
    try {
      const testUrl = new URL(pattern, careerPageUrl).href;
      logger.info('Testing fallback URL pattern', { pattern, testUrl });
      
      // Navigate to the test URL
      const response = await page.goto(testUrl);
      
      if (response && response.ok) {
        // Validate the page is a job listings page
        const { isValid } = await page.extract({
          instruction: `Quickly check if this page has job listings or job search functionality.
            Look for job postings, search boxes, or job-related content.
            Return true if this appears to be a job listings page.`,
          schema: z.object({ isValid: z.boolean() })
        });
        
        if (isValid) {
          logger.info('Fallback URL pattern worked', { pattern, testUrl });
          return testUrl;
        }
      }
      
    } catch (error) {
      logger.error('Fallback URL pattern failed', { pattern, error: error.message });
      continue;
    }
  }
  
  return null;
}

// Integration test: Complete workflow from company name to job listings
async function testCareerWorkflowIntegration() {
  logger.info('=== Testing Complete Career Discovery Workflow ===');
  
  const testCompanies = [
    'Google',
    'Microsoft',
    'Apple',
    'Amazon',
    'Meta'
  ];
  
  const results = [];
  
  for (const companyName of testCompanies) {
    console.log(`\n--- Testing Workflow for: ${companyName} ---`);
    
    try {
      // Step 1: Start with company name
      let state = createTestState({
        companyName: companyName,
        currentStep: 'career_page_finder'
      });
      
      console.log(`Step 1: Finding career page for ${companyName}`);
      
      // Step 2: Run Career Page Finder Node
      state = await careerPageFinderNode(state);
      console.log('Career Page Finder Result:', {
        status: state.status,
        careerPageUrl: state.careerPageUrl,
        errors: state.errors
      });
      
      // Step 3: If career page found, run Job Listings Navigator Node
      if (state.status === 'career_page_found') {
        console.log(`Step 2: Finding job listings for ${companyName}`);
        state.currentStep = 'job_listings_navigator';
        
        state = await jobListingsNavigatorNode(state);
        console.log('Job Listings Navigator Result:', {
          status: state.status,
          jobListingsUrl: state.jobListingsUrl,
          errors: state.errors
        });
      }
      
      // Step 4: Summary
      const workflowResult = {
        companyName,
        careerPageFound: state.status === 'career_page_found',
        jobListingsFound: state.status === 'job_listings_found',
        careerPageUrl: state.careerPageUrl,
        jobListingsUrl: state.jobListingsUrl,
        errors: state.errors,
        pageInteractions: {
          gotoCalls: state.page.gotoCalls.length,
          extractCalls: state.page.extractCalls.length,
          askCalls: state.page.askCalls.length,
          discoverCalls: state.page.discoverCalls.length
        }
      };
      
      results.push(workflowResult);
      
      console.log('✅ Workflow completed for', companyName);
      
    } catch (error) {
      console.log('❌ Workflow failed for', companyName, ':', error.message);
      results.push({
        companyName,
        careerPageFound: false,
        jobListingsFound: false,
        error: error.message
      });
    }
  }
  
  // Final Summary
  console.log('\n📊 Workflow Integration Test Summary:');
  console.log('=====================================');
  
  results.forEach((result, index) => {
    const status = result.careerPageFound && result.jobListingsFound ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${index + 1}. ${result.companyName}: ${status}`);
    
    if (result.careerPageFound) {
      console.log(`   Career Page: ${result.careerPageUrl}`);
    }
    
    if (result.jobListingsFound) {
      console.log(`   Job Listings: ${result.jobListingsUrl}`);
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
    
    if (result.pageInteractions) {
      console.log(`   Page Interactions: ${result.pageInteractions.gotoCalls} goto, ${result.pageInteractions.extractCalls} extract`);
    }
  });
  
  const successCount = results.filter(r => r.careerPageFound && r.jobListingsFound).length;
  const totalCount = results.length;
  
  console.log(`\n🎯 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('🎉 All workflows completed successfully!');
  } else {
    console.log('⚠️  Some workflows failed. Check the details above.');
  }
  
  return { success: successCount === totalCount, results };
}

// Test individual nodes
async function testIndividualNodes() {
  console.log('\n🧪 Testing Individual Nodes...\n');
  
  // Test Career Page Finder
  console.log('--- Testing Career Page Finder Node ---');
  const state1 = createTestState({
    companyName: 'Test Company',
    currentStep: 'career_page_finder'
  });
  
  const result1 = await careerPageFinderNode(state1);
  console.log('Career Page Finder Result:', {
    status: result1.status,
    careerPageUrl: result1.careerPageUrl,
    errors: result1.errors
  });
  
  // Test Job Listings Navigator
  console.log('\n--- Testing Job Listings Navigator Node ---');
  const state2 = createTestState({
    careerPageUrl: 'https://careers.example.com',
    currentStep: 'job_listings_navigator'
  });
  
  const result2 = await jobListingsNavigatorNode(state2);
  console.log('Job Listings Navigator Result:', {
    status: result2.status,
    jobListingsUrl: result2.jobListingsUrl,
    errors: result2.errors
  });
  
  return { careerPageFinder: result1, jobListingsNavigator: result2 };
}

// Main test runner
async function runAllTests() {
  logger.info('Starting Career Discovery Workflow Integration Tests');
  
  try {
    // Test individual nodes first
    await testIndividualNodes();
    
    // Test complete workflow
    await testCareerWorkflowIntegration();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    logger.error('Test execution failed', { error: error.message });
    console.log('\n💥 Test execution failed:', error.message);
  }
}

// Export for programmatic use
export {
  testCareerWorkflowIntegration,
  testIndividualNodes,
  careerPageFinderNode,
  jobListingsNavigatorNode,
  createTestState,
  MockStagehandPage
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
} 