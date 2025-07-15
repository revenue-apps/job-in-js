# Job Listings Navigator Node Testing Guide

## Overview

The `jobListingsNavigatorNode.js` is responsible for finding job listings pages from career homepages using two strategies:
1. **CTA Phrase Matching**: Find links/buttons with job-related text
2. **Fallback URL Patterns**: Try common job listing URL patterns

## Testing Approaches

### 1. **Quick Test (Recommended)**

Run the simplified test file that mocks all dependencies:

```bash
node test-job-listings-navigator-simple.js
```

This test covers:
- ✅ Basic CTA matching success
- ✅ Fallback URL pattern success  
- ✅ Error handling (no page provided)
- ✅ Error handling (no career page URL)
- ✅ Page interaction validation

### 2. **Integration with Full Test Suite**

The node is already integrated into the comprehensive career discovery test suite:

```bash
# Run all career discovery tests
node src/tests/workflows/career-discovery-node.test.js

# Or run the specific test function
node -e "
import { testJobListingsNavigatorNode } from './src/tests/workflows/career-discovery-node.test.js';
testJobListingsNavigatorNode();
"
```

### 3. **Manual Testing with Real Browser**

Create a test script that uses a real Stagehand page:

```javascript
import { Stagehand } from '@stagehand/browser';
import jobListingsNavigatorNode from './src/new-workflows/career-page-discovery/nodes/jobListingsNavigatorNode.js';

async function testWithRealBrowser() {
  const browser = await Stagehand.launch();
  const page = await browser.newPage();
  
  const state = {
    careerPageUrl: 'https://careers.google.com',
    page: page,
    currentStep: 'job_listings_navigator',
    status: 'pending',
    errors: []
  };
  
  try {
    const result = await jobListingsNavigatorNode(state);
    console.log('Result:', result);
  } finally {
    await browser.close();
  }
}
```

## Test Scenarios

### Scenario 1: CTA Phrase Matching Success
**Input**: Career page with "View Jobs" button
**Expected**: Finds job listings URL via CTA matching
**Test**: `test-job-listings-navigator-simple.js` Test 1

### Scenario 2: Fallback URL Pattern Success
**Input**: Career page without clear CTA buttons
**Expected**: Finds job listings URL via URL pattern matching
**Test**: `test-job-listings-navigator-simple.js` Test 2

### Scenario 3: Error Handling - No Page
**Input**: State without Stagehand page
**Expected**: Returns error status with appropriate message
**Test**: `test-job-listings-navigator-simple.js` Test 3

### Scenario 4: Error Handling - No Career URL
**Input**: State without career page URL
**Expected**: Returns error status with appropriate message
**Test**: `test-job-listings-navigator-simple.js` Test 4

### Scenario 5: Page Interaction Validation
**Input**: Valid state with mock page
**Expected**: Verifies page methods are called correctly
**Test**: `test-job-listings-navigator-simple.js` Test 5

## Expected Output Structure

### Success Case
```javascript
{
  status: 'job_listings_found',
  jobListingsUrl: 'https://careers.company.com/jobs',
  currentStep: 'job_listings_navigator',
  errors: []
}
```

### Error Case
```javascript
{
  status: 'job_listings_failed',
  jobListingsUrl: null,
  currentStep: 'job_listings_navigator',
  errors: ['Job listings navigation failed: No Stagehand page provided']
}
```

## Mock Configuration

The test uses a `MockStagehandPage` class that simulates browser interactions:

```javascript
class MockStagehandPage {
  constructor() {
    this.gotoCalls = [];
    this.extractCalls = [];
    this.responses = { extract: {} };
  }
  
  async goto(url) {
    this.gotoCalls.push(url);
    return { ok: true };
  }
  
  async extract(options) {
    this.extractCalls.push(options);
    // Return mock responses based on instruction
    return { matchingLinks: [...] };
  }
}
```

## Customizing Tests

### Adding New Test Scenarios

1. **Create new test state**:
```javascript
const state = createTestState({
  careerPageUrl: 'https://your-test-url.com',
  // Add custom overrides
});
```

2. **Configure mock responses**:
```javascript
state.page.responses.extract['Find all links'] = {
  matchingLinks: [
    { text: 'Custom Job Link', url: 'https://custom.com/jobs' }
  ]
};
```

3. **Run the test**:
```javascript
const result = await jobListingsNavigatorNode(state);
validateNodeResult(result, ['jobListingsUrl']);
```

### Testing Different CTA Phrases

Modify the CSV mock in `loadCTAPhrases()`:

```javascript
const readCsvFile = async (path) => {
  return [
    { phrase: 'Your Custom Phrase' },
    { phrase: 'Another Custom Phrase' }
  ];
};
```

### Testing Different URL Patterns

Modify the `commonPatterns` array in `findJobListingsWithFallback()`:

```javascript
const commonPatterns = [
  '/your-custom-pattern',
  '/another-pattern',
  // ... existing patterns
];
```

## Debugging Tests

### Enable Detailed Logging

```javascript
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message, data) => console.log(`[WARN] ${message}`, data || ''),
  error: (message, data) => console.log(`[ERROR] ${message}`, data || ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data || '')
};
```

### Inspect Page Interactions

```javascript
const page = state.page;
console.log('Page interactions:', {
  gotoCalls: page.gotoCalls,
  extractCalls: page.extractCalls,
  responses: page.responses
});
```

### Validate State Changes

```javascript
function validateNodeResult(result, expectedFields = []) {
  const requiredFields = ['status', 'errors', 'currentStep', ...expectedFields];
  
  for (const field of requiredFields) {
    if (!(field in result)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return true;
}
```

## Integration Testing

### Test with Other Nodes

```javascript
// Test the complete workflow
let state = createTestState({
  companyName: 'Test Company',
  currentStep: 'career_page_finder'
});

// Run career page finder first
state = await careerPageFinderNode(state);

// Then run job listings navigator
if (state.status === 'career_page_found') {
  state.currentStep = 'job_listings_navigator';
  state = await jobListingsNavigatorNode(state);
}
```

### Test with Real Data

```javascript
const realCompanies = [
  'Google',
  'Microsoft', 
  'Apple',
  'Amazon',
  'Meta'
];

for (const company of realCompanies) {
  const state = createTestState({
    companyName: company,
    careerPageUrl: `https://careers.${company.toLowerCase()}.com`
  });
  
  const result = await jobListingsNavigatorNode(state);
  console.log(`${company}: ${result.status}`);
}
```

## Performance Testing

### Measure Execution Time

```javascript
const startTime = Date.now();
const result = await jobListingsNavigatorNode(state);
const endTime = Date.now();

console.log(`Execution time: ${endTime - startTime}ms`);
```

### Test with Large CTA Lists

```javascript
// Test with many CTA phrases
const manyPhrases = Array.from({ length: 100 }, (_, i) => ({
  phrase: `Job Phrase ${i}`
}));

state.page.responses.extract['Find all links'] = {
  matchingLinks: manyPhrases.map(p => ({
    text: p.phrase,
    url: `https://example.com/jobs/${i}`
  }))
};
```

## Troubleshooting

### Common Issues

1. **Import Path Errors**: Use the simplified test file that mocks dependencies
2. **Missing Dependencies**: Ensure all required modules are available
3. **Schema Validation Errors**: Check that mock responses match expected schemas
4. **Page Interaction Failures**: Verify mock page methods are called correctly

### Debug Commands

```bash
# Run with verbose logging
DEBUG=* node test-job-listings-navigator-simple.js

# Run specific test only
node -e "
import { testJobListingsNavigatorNode } from './test-job-listings-navigator-simple.js';
testJobListingsNavigatorNode();
"
```

## Best Practices

1. **Always test error scenarios** - ensure graceful failure handling
2. **Mock external dependencies** - avoid network calls in unit tests
3. **Validate state structure** - ensure nodes return expected fields
4. **Test both success and failure paths** - cover all code branches
5. **Use descriptive test names** - make failures easy to understand
6. **Group related tests** - organize by functionality
7. **Clean up resources** - close browsers, clear mocks

## Next Steps

1. **Run the simplified test**: `node test-job-listings-navigator-simple.js`
2. **Review test results** and understand the output
3. **Modify test scenarios** as needed for your use case
4. **Add new test cases** for specific requirements
5. **Integrate with CI/CD** for automated testing 