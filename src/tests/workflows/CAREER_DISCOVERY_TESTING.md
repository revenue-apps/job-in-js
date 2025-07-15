# Career Discovery Node Testing Guide

## Overview

This guide covers how to test individual career discovery nodes in isolation and as part of the complete workflow. The testing framework provides:

- **Unit Testing**: Test each node individually with mock data
- **Integration Testing**: Test the complete workflow end-to-end
- **Mock Stagehand Pages**: Simulate browser interactions without real network calls
- **State Validation**: Ensure nodes return expected state structure
- **Error Handling**: Test various error scenarios

## Test Structure

### Files
- `career-discovery-node.test.js` - Main test framework
- `test-career-discovery-nodes.js` - Command-line test runner
- `CAREER_DISCOVERY_TESTING.md` - This guide

### Test Components

#### 1. MockStagehandPage Class
```javascript
class MockStagehandPage {
  constructor() {
    this.url = 'https://example.com';
    this.extractCalls = [];
    this.askCalls = [];
    this.discoverCalls = [];
    this.gotoCalls = [];
  }
  
  async goto(url) { /* Mock implementation */ }
  async extract(selector) { /* Mock implementation */ }
  async ask(question) { /* Mock implementation */ }
  async discover(instruction) { /* Mock implementation */ }
}
```

#### 2. Test State Factory
```javascript
function createTestState(overrides = {}) {
  return {
    companyName: 'Test Company',
    page: new MockStagehandPage(),
    status: 'pending',
    errors: [],
    // ... other state fields
    ...overrides
  };
}
```

#### 3. Result Validator
```javascript
function validateNodeResult(result, expectedFields = []) {
  // Validates required fields and error handling
}
```

## Running Tests

### Command Line Usage

```bash
# Run all tests
npm run test:career-discovery

# Test individual nodes
npm run test:career-discovery:node1  # Career Page Finder
npm run test:career-discovery:node2  # Job Listings Navigator  
npm run test:career-discovery:node3  # Filter Analyzer
npm run test:career-discovery:node4  # Metadata Constructor

# Test integration only
npm run test:career-discovery:integration

# Direct node commands
node test-career-discovery-nodes.js --node=1
node test-career-discovery-nodes.js --integration
node test-career-discovery-nodes.js --help
```

### Programmatic Usage

```javascript
import { 
  testCareerPageFinderNode,
  testNodeIntegration,
  createTestState,
  MockStagehandPage
} from './src/tests/workflows/career-discovery-node.test.js';

// Test specific node
const result = await testCareerPageFinderNode();

// Create custom test state
const state = createTestState({
  companyName: 'Custom Company',
  careerPageUrl: 'https://custom.com/careers'
});

// Test with custom page
const customPage = new MockStagehandPage();
customPage.content = '<div>Custom content</div>';
```

## Test Scenarios

### Node 1: Career Page Finder

**Test Cases:**
1. **Basic Discovery**: Valid company name → career page URL
2. **Error Handling**: Invalid company → error status
3. **Page Interactions**: Verify `page.ask()` and `page.discover()` calls

**Expected Output:**
```javascript
{
  status: 'career_page_found',
  careerPageUrl: 'https://careers.company.com',
  errors: []
}
```

### Node 2: Job Listings Navigator

**Test Cases:**
1. **Basic Navigation**: Career page → job listings URL
2. **Direct URL**: Existing job listings URL → no change
3. **Page Navigation**: Verify `page.goto()` calls

**Expected Output:**
```javascript
{
  status: 'job_listings_found',
  jobListingsUrl: 'https://careers.company.com/jobs',
  errors: []
}
```

### Node 3: Filter Analyzer

**Test Cases:**
1. **Basic Analysis**: Job listings → filtered URL with parameters
2. **Complex Filters**: Multiple filter scenarios
3. **Parameter Extraction**: URL parameter parsing

**Expected Output:**
```javascript
{
  status: 'filters_analyzed',
  filteredJobUrl: 'https://careers.company.com/jobs?location=remote&level=senior',
  urlParameters: { location: 'remote', level: 'senior' },
  errors: []
}
```

### Node 4: Metadata Constructor

**Test Cases:**
1. **Basic Construction**: All data available → complete metadata
2. **Error Handling**: Previous errors → error metadata
3. **Partial Data**: Missing data → partial metadata

**Expected Output:**
```javascript
{
  status: 'metadata_constructed',
  metadata: {
    companyName: 'Company',
    careerPageUrl: 'https://careers.company.com',
    jobListingsUrl: 'https://careers.company.com/jobs',
    filteredJobUrl: 'https://careers.company.com/jobs?filters',
    urlParameters: { /* extracted parameters */ },
    discoveryStatus: 'success',
    errors: []
  },
  errors: []
}
```

## Integration Testing

### Full Workflow Simulation

The integration test simulates the complete workflow:

1. **Start**: Initial state with company name
2. **Node 1**: Career page discovery
3. **Node 2**: Job listings navigation
4. **Node 3**: Filter analysis
5. **Node 4**: Metadata construction

**Test Flow:**
```javascript
let state = createTestState({
  companyName: 'Apple',
  currentStep: 'career_page_finder'
});

// Run each node in sequence
state = await careerPageFinderNode(state);
state = await jobListingsNavigatorNode(state);
state = await filterAnalyzerNode(state);
state = await metadataConstructorNode(state);
```

## Mock Data Patterns

### Company Data
```javascript
const companies = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Apple', domain: 'apple.com' }
];
```

### Page Content Simulation
```javascript
const mockPage = new MockStagehandPage();
mockPage.content = `
  <div class="career-links">
    <a href="/careers">Careers</a>
    <a href="/jobs">Jobs</a>
  </div>
  <div class="job-filters">
    <select name="location">...</select>
    <select name="level">...</select>
  </div>
`;
```

### Error Scenarios
```javascript
const errorState = createTestState({
  companyName: 'Invalid Company 12345',
  errors: ['Failed to find career page']
});
```

## Validation Rules

### Required State Fields
Every node must return:
- `status`: String indicating completion status
- `errors`: Array of error messages
- Node-specific fields (e.g., `careerPageUrl`, `jobListingsUrl`)

### Status Values
- `career_page_found` - Node 1 success
- `job_listings_found` - Node 2 success  
- `filters_analyzed` - Node 3 success
- `metadata_constructed` - Node 4 success
- `error` - Any node failure

### Error Handling
- Nodes should catch exceptions and add to `errors` array
- Failed nodes should set `status: 'error'`
- Subsequent nodes should handle previous errors gracefully

## Development Workflow

### 1. Implement Node
```javascript
const careerPageFinderNode = async (state) => {
  try {
    // Node implementation
    return { ...state, status: 'career_page_found', careerPageUrl: url };
  } catch (error) {
    return { 
      ...state, 
      status: 'error', 
      errors: [...state.errors, error.message] 
    };
  }
};
```

### 2. Test Node Individually
```bash
npm run test:career-discovery:node1
```

### 3. Test Integration
```bash
npm run test:career-discovery:integration
```

### 4. Test All Nodes
```bash
npm run test:career-discovery
```

## Best Practices

### 1. Use Mock Pages
- Always use `MockStagehandPage` for testing
- Avoid real network calls in unit tests
- Simulate different page content scenarios

### 2. Test Error Scenarios
- Invalid company names
- Network failures
- Missing page elements
- Malformed URLs

### 3. Validate State Structure
- Check required fields are present
- Verify error handling works
- Ensure state transitions are correct

### 4. Test Page Interactions
- Verify `page.ask()` calls for AI operations
- Check `page.discover()` for content discovery
- Validate `page.extract()` for data extraction

### 5. Integration Testing
- Test complete workflow end-to-end
- Verify state flows between nodes
- Check final metadata structure

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all node files are properly exported
2. **State Validation**: Check that nodes return required fields
3. **Mock Page Issues**: Verify page method calls are tracked
4. **Async/Await**: Ensure all async operations are properly handled

### Debug Mode
```javascript
// Add debug logging to test functions
console.log('Test state:', state);
console.log('Node result:', result);
```

### Test Isolation
- Each test should be independent
- Use fresh state for each test case
- Clean up any side effects

## Next Steps

1. **Implement Real Nodes**: Replace dummy implementations with actual logic
2. **Add More Test Cases**: Cover edge cases and error scenarios
3. **Performance Testing**: Add timing and performance metrics
4. **Real Page Testing**: Add integration tests with real websites
5. **CSV Integration**: Test with actual CSV file operations 