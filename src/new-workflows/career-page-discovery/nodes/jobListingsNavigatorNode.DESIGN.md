# Job Listings Navigator Node - Design Document

## Overview

**Node Purpose**: Navigate from career homepage to job listings page
**Input**: Career homepage URL (e.g., `https://www.okta.com/company/careers/`)
**Output**: Job listings page URL (e.g., `https://www.okta.com/company/careers/job-listing/`)
**Status**: Ready for implementation

## Strategy

### Primary Approach: AI-Powered Navigation with CTA Store

**Step 1: Load CTA Patterns**
```javascript
// config/cta_patterns.json
{
  "job_listings_ctas": [
    "Open positions",
    "View all jobs", 
    "Browse jobs",
    "Search jobs",
    "View jobs",
    "Browse open positions",
    "See all jobs",
    "Find jobs",
    "Job opportunities",
    "Careers",
    "Join our team",
    "Work with us"
  ]
}
```

**Step 2: Find Navigation Elements**
```javascript
const ctaPatterns = loadCTAPatterns(); // Load from local file

const navigationResult = await page.extract({
  instruction: `Find job listings navigation on this career homepage.
  
  Look for these specific CTAs: ${ctaPatterns.join(', ')}
  
  Also look for:
  - Any job-related buttons or links
  - Navigation menus with job listings
  - "Careers" or "Jobs" sections
  
  Return ALL matching elements found.`,
  schema: z.object({
    foundElements: z.array(z.object({
      text: z.string(),
      selector: z.string(),
      type: z.string(), // "button", "link", "menu"
      confidence: z.number()
    })),
    reasoning: z.string()
  })
});
```

**Step 3: Multi-Tab Testing**
```javascript
// Find all potential navigation elements
const navigationElements = navigationResult.foundElements;

// Try each element in separate tabs
const candidates = [];

for (const element of navigationElements) {
  try {
    // Open new tab
    const newPage = await stagehandClient.newPage({ incognito: true });
    await newPage.goto(careerHomepageUrl);
    
    // Click the element
    await newPage.click(element.selector);
    
    // Analyze resulting page
    const pageAnalysis = await newPage.extract({
      instruction: `Is this a job listings page?
      Check for:
      - Job listings or job cards visible
      - Job search functionality
      - Job filters or categories
      - Apply buttons or job details`,
      schema: z.object({
        isJobListingsPage: z.boolean(),
        hasJobListings: z.boolean(),
        hasJobSearch: z.boolean(),
        hasFilters: z.boolean(),
        confidence: z.number(),
        pageType: z.string()
      })
    });
    
    // Basic check - is this a job listings page?
    if (isJobListingsPage(pageAnalysis)) {
      candidates.push({
        element: element,
        url: newPage.url(),
        analysis: pageAnalysis
      });
    }
    
    await newPage.close();
  } catch (error) {
    continue; // Try next element
  }
}
```

**Step 4: Winner Selection**
```javascript
function isJobListingsPage(pageAnalysis) {
  return (
    pageAnalysis.isJobListingsPage &&
    pageAnalysis.hasJobListings &&
    pageAnalysis.confidence > 0.7
  );
}

// Remove duplicates (same URL, different CTAs)
const uniqueCandidates = candidates.filter((candidate, index, self) => 
  index === self.findIndex(c => c.url === candidate.url)
);

// Take the first unique candidate
const winner = uniqueCandidates.length > 0 ? uniqueCandidates[0] : null;

if (winner) {
  return {
    jobListingsUrl: winner.url,
    selectedElement: winner.element,
    analysis: winner.analysis,
    success: true
  };
} else {
  // No valid job listings page found
  throw new Error(`No job listings page found for ${companyName}`);
}
```

### Fallback Approach: URL Pattern Construction

**Step 5: Try Common URL Patterns**
```javascript
// If no navigation elements work, try common URL patterns
const fallbackPatterns = [
  `${careerHomepageUrl}/jobs`,
  `${careerHomepageUrl}/job-listing`,
  `${careerHomepageUrl}/openings`,
  `${careerHomepageUrl}/positions`,
  `${careerHomepageUrl}/careers/jobs`,
  `${careerHomepageUrl}/careers/positions`
];

for (const pattern of fallbackPatterns) {
  try {
    await page.goto(pattern);
    
    const pageValidation = await page.extract({
      instruction: "Is this a job listings page?",
      schema: z.object({
        isJobListingsPage: z.boolean(),
        confidence: z.number()
      })
    });
    
    if (pageValidation.isJobListingsPage && pageValidation.confidence > 0.7) {
      return pattern;
    }
  } catch (error) {
    continue;
  }
}
```

## Error Handling

### Failure Scenarios
1. **No navigation elements found** - No CTAs on career homepage
2. **All navigation clicks fail** - Elements found but clicks don't work
3. **No valid job listings page** - All resulting pages are not job listings
4. **All fallback URLs fail** - No valid job listings page found

### Error Response
```javascript
// If all attempts fail
updateCompanyStatus(companyName, 'failed', 'No job listings navigation found');
throw new Error(`Failed to navigate to job listings for ${companyName}`);
```

## Key Design Decisions

### 1. CTA Store (Local File)
- **Reason**: Centralized list of common job navigation patterns
- **Benefits**: Easy to update, reusable across companies
- **Implementation**: JSON file with array of CTAs

### 2. Multi-Tab Testing
- **Reason**: Test multiple navigation elements without interference
- **Benefits**: Clean testing, can compare results
- **Implementation**: New incognito page for each element

### 3. Simple Winner Selection
- **Criteria**: Job listings page + confidence > 0.7
- **Strategy**: First valid candidate wins
- **Deduplication**: Remove same URL from different CTAs

### 4. Fallback URL Patterns
- **Reason**: Handle cases where navigation elements don't work
- **Patterns**: Common job listings URL suffixes
- **Validation**: AI validation for each pattern

### 5. Workflow Breaking on Failure
- **Reason**: Don't waste resources if no job listings found
- **Action**: Update CSV status, throw error, stop workflow

## State Schema

### Input State
```javascript
const jobListingsNavigatorInputState = {
  // Company information
  companyName: "Okta",
  careerPageUrl: "https://www.okta.com/company/careers/",
  
  // Browser context
  page: StagehandPage,
  agent: StagehandAgent,
  
  // Workflow state
  currentStep: "job_listings_navigator",
  
  // Configuration
  config: {
    batchSize: 5,
    maxRetries: 3,
    confidenceThreshold: 0.7
  }
};
```

### Output State
```javascript
const jobListingsNavigatorOutputState = {
  // Original input state
  ...jobListingsNavigatorInputState,
  
  // Navigation results
  jobListingsUrl: "https://www.okta.com/company/careers/job-listing/",
  navigationSuccess: true,
  navigationTime: 8000,
  
  // Analysis results
  foundElements: [
    {
      text: "Open positions",
      selector: "button[data-testid='open-positions']",
      type: "button",
      confidence: 0.9
    }
  ],
  selectedElement: {
    text: "Open positions",
    selector: "button[data-testid='open-positions']"
  },
  pageAnalysis: {
    isJobListingsPage: true,
    hasJobListings: true,
    hasJobSearch: true,
    hasFilters: true,
    confidence: 0.9,
    pageType: "listings"
  },
  
  // Updated workflow state
  currentStep: "filter_analyzer" // Next node
};
```

### Error State (if Node 2 fails)
```javascript
const errorState = {
  ...jobListingsNavigatorInputState,
  jobListingsUrl: null,
  navigationSuccess: false,
  error: "No job listings page found for Okta",
  errorStep: "navigation_attempts",
  currentStep: "end" // Stop workflow
};
```

## Success Criteria

### Primary Success
- ✅ Find valid job listings page URL
- ✅ Page has job listings visible
- ✅ Confidence >= 0.7
- ✅ Page has job search functionality

### Validation Checks
- ✅ URL is accessible
- ✅ Page contains job listings
- ✅ Job search functionality present
- ✅ Job filters or categories available

## Example Flows

### Successful Flow (Okta)
1. **Input**: `https://www.okta.com/company/careers/`
2. **Find CTAs**: "Open positions", "View jobs"
3. **Test CTAs**: Click each in separate tabs
4. **Winner**: "Open positions" → Job listings page
5. **Output**: `https://www.okta.com/company/careers/job-listing/`

### Fallback Flow (Unknown Company)
1. **Input**: `https://somecompany.com/careers/`
2. **Find CTAs**: No CTAs found
3. **Fallback URLs**: Try `/jobs`, `/job-listing`
4. **Winner**: `/jobs` → Valid job listings page
5. **Output**: `https://somecompany.com/careers/jobs`

### Failure Flow (No Job Listings)
1. **Input**: `https://tinycompany.com/careers/`
2. **Find CTAs**: No CTAs found
3. **Fallback URLs**: All fail
4. **Error**: "No job listings page found"
5. **Action**: Update CSV status, break workflow

## Implementation Notes

### Dependencies
- Stagehand client with incognito support
- OpenAI API for AI analysis
- CTA patterns JSON file
- CSV utilities for status updates

### Performance Considerations
- Total time: ~5-10 seconds per company
- Multiple tab testing: 2-3 tabs typically
- Fallback URL testing: 6 patterns maximum

### Testing Strategy
- Test with known companies (Google, Microsoft, Meta)
- Test with unknown companies
- Test with companies without job listings
- Test different CTA patterns

## Scope Clarification

### This Node Does:
- ✅ Navigate from career homepage to job listings page
- ✅ Find and click navigation elements
- ✅ Validate resulting page is job listings
- ✅ Return job listings URL

### This Node Does NOT Do:
- ❌ Analyze job search filters
- ❌ Extract URL parameters
- ❌ Map search functionality
- ❌ Generate metadata

**Filter analysis is handled by Node 3 (Filter Analyzer)**

## Next Steps

1. **Implement Node 2** - Job Listings Navigator
2. **Test with sample companies** - Validate navigation
3. **Move to Node 3** - Filter Analyzer
4. **Integration testing** - End-to-end workflow

## Related Documents

- [Career Page Finder Node Design](./careerPageFinderNode.DESIGN.md)
- [Filter Analyzer Node Design](./filterAnalyzerNode.DESIGN.md)
- [Metadata Constructor Node Design](./metadataConstructorNode.DESIGN.md)
- [Main Workflow Design](../README.md) 