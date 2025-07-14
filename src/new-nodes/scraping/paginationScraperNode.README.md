# Pagination Scraper Node

## Description
The Pagination Scraper Node intelligently detects and extracts next page URLs from job listing pages. It uses AI-powered analysis as the primary method with comprehensive generic selector-based detection as a fallback.

## Features
- 🤖 **AI-Powered Detection**: Uses Stagehand agent to analyze page content and find pagination elements
- 🔍 **Generic Fallback Selectors**: Comprehensive list of common pagination selectors that work across any job site
- ✅ **URL Validation**: Validates extracted URLs before returning them
- 🛡️ **Error Handling**: Graceful degradation and comprehensive error logging
- 🔄 **State Management**: Maintains pagination state across workflow iterations

## Usage

### Basic Usage
```javascript
import { paginationScraperNode } from './paginationScraperNode.js';

const state = {
  currentUrl: {
    finalUrl: 'https://example.com/jobs/search?keywords=software',
    company: 'Example Corp',
    description: 'Software Engineer jobs'
  },
  pagination: {
    currentPage: 1,
    hasMorePages: false,
    nextPageUrl: null
  },
  page: puppeteerPage,
  agent: stagehandAgent
};

const result = await paginationScraperNode(state);
```

### Expected Output
```javascript
{
  pagination: {
    hasMorePages: true,
    nextPageUrl: 'https://example.com/jobs/search?keywords=software&page=2',
    currentPage: 2
  },
  currentStep: 'pagination_complete'
}
```

## Detection Methods

### 1. AI-Powered Detection
The node uses a focused prompt to analyze the page and find pagination elements:
- "Next" buttons and links
- Page number navigation
- Pagination controls
- "Load more" buttons

### 2. Generic Selector-Based Fallback
If AI detection fails, the node tries these generic selectors:
```javascript
[
  // Next buttons - generic patterns
  'a[href*="next"]',
  'button[aria-label*="next"]',
  '.pagination a[href*="next"]',
  '.pagination-next',
  '.next-page',
  
  // Page numbers - generic patterns
  'a[href*="page="]',
  'a[href*="p="]',
  '.pagination a[href]',
  
  // Generic pagination
  '.pagination a',
  '.pager a',
  '.nav a',
  '.navigation a',
  
  // Navigation arrows and buttons
  'a[aria-label*="next"]',
  'button[aria-label*="next"]',
  'a[title*="next"]',
  'button[title*="next"]',
  
  // Generic next indicators
  'a:contains("Next")',
  'button:contains("Next")',
  'a:contains(">")',
  'button:contains(">")'
]
```

## Generic Pagination Patterns
- **Query Parameters**: `?page=2`, `&p=2`
- **Path Segments**: `/page/2`, `/jobs/page/2`
- **Button Navigation**: "Next" buttons with href attributes
- **Content-Based**: "Load more" functionality
- **Navigation Arrows**: `>` symbols and arrow buttons
- **Page Numbers**: Direct links to page numbers

## Error Handling
The node handles various error scenarios:
- AI detection failures
- Invalid URLs
- Missing pagination elements
- Network errors

All errors are logged and the node continues with fallback methods.

## Integration with Workflow
This node is designed to work with the Job Discovery workflow:
1. **Input**: Current URL and pagination state
2. **Process**: Detect next page URL
3. **Output**: Updated pagination state
4. **Routing**: Conditional edge to Job Scraper or URL Iterator

## State Management
The node maintains consistent state:
- Increments `currentPage`
- Sets `hasMorePages` based on detection
- Updates `nextPageUrl` if found
- Preserves existing state on errors

## Logging
Comprehensive logging for debugging:
- Current URL and page being processed
- Detection method used (AI vs Selector)
- Next page URL found
- Error details if detection fails

## Performance
- Fast AI analysis with focused prompts
- Efficient selector iteration
- Minimal page navigation
- Quick URL validation

## Dependencies
- `logger`: For comprehensive logging
- `page`: Puppeteer page object
- `agent`: Stagehand agent for AI detection

## Testing
Test the node with various job sites:
```javascript
// Test with any job site
const state = { /* ... */ };
await paginationScraperNode(state);
```

## Troubleshooting
- **No next page detected**: Check if page has pagination elements
- **Invalid URL returned**: Verify URL validation logic
- **AI detection fails**: Check agent configuration and prompts
- **Selector failures**: Review generic selector list for common patterns 