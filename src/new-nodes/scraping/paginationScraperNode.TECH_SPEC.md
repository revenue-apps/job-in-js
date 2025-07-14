# Pagination Scraper Node - Technical Specification

## Overview
The Pagination Scraper Node detects and extracts next page URLs from job listing pages using AI-powered analysis with fallback selector-based detection.

## Purpose
- Detect if more pages exist for current job listing URL
- Extract the next page URL for pagination
- Provide robust fallback mechanisms for different pagination patterns
- Enable continuous scraping across multiple pages

## Input State
```javascript
{
  currentUrl: {
    finalUrl: string,
    company: string,
    description: string
  },
  pagination: {
    currentPage: number,
    hasMorePages: boolean,
    nextPageUrl: string | null
  },
  page: PuppeteerPage,
  agent: StagehandAgent
}
```

## Output State
```javascript
{
  pagination: {
    hasMorePages: boolean,
    nextPageUrl: string | null,
    currentPage: number
  },
  currentStep: 'pagination_complete' | 'pagination_failed'
}
```

## Detection Strategy

### 1. AI-Powered Detection (Primary)
- Uses Stagehand agent to analyze page content
- Looks for pagination controls, "Next" buttons, page numbers
- Returns next page URL or "NO_MORE_PAGES"
- Handles complex pagination patterns automatically

### 2. Selector-Based Detection (Fallback)
- Comprehensive list of common pagination selectors
- Covers major job sites (LinkedIn, Indeed, Glassdoor, etc.)
- Validates extracted URLs before returning
- Graceful error handling for each selector

## Pagination Patterns Supported

### Button-Based Pagination
- "Next" buttons with href attributes
- Navigation arrows
- Page number links

### URL-Based Pagination
- Query parameters: `?page=2`, `&p=2`
- Path segments: `/page/2`, `/jobs/page/2`
- Site-specific patterns

### Content-Based Pagination
- "Load more" buttons
- Infinite scroll indicators
- "Showing X of Y results" text

## Error Handling
- Graceful degradation from AI to selector-based detection
- URL validation before returning results
- Comprehensive logging for debugging
- State preservation on errors

## Performance Considerations
- Quick AI analysis with focused prompts
- Efficient selector iteration
- Minimal page navigation during detection
- Caching of pagination patterns

## Integration Points
- Works with Job Discovery workflow
- Compatible with URL Iterator node
- Supports conditional routing to Job Scraper
- Maintains state consistency across workflow

## Future Enhancements
- Site-specific pagination rules
- Machine learning for pattern recognition
- Pagination depth limits
- Rate limiting for pagination requests 