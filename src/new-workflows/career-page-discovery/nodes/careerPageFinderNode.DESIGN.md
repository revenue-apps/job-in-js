# Career Page Finder Node - Design Document

## Overview

**Node Purpose**: Find the company's career homepage from Google search or direct domain construction
**Input**: Company name (e.g., "Okta", "Google", "Microsoft")
**Output**: Career homepage URL (e.g., "https://www.okta.com/company/careers/")
**Status**: Ready for implementation

## Strategy

### Primary Approach: AI-Powered Google Search

**Step 1: Initialize Incognito Browser**
```javascript
const page = await stagehandClient.newPage({
  incognito: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  locale: 'en-US',
  timezoneId: 'America/New_York'
});
```

**Step 2: Google Search with AI Analysis**
```javascript
// Add delay before search
await page.waitForTimeout(2000);

await page.goto('https://google.com');
await page.fill('input[name="q"]', `${companyName} careers global jobs`);
await page.click('input[name="btnK"]');

// Add delay after search
await page.waitForTimeout(3000);

const searchResults = await page.extract({
  instruction: `Find the main global career homepage for ${companyName}.
  Look for:
  - Official company career pages (company.com/careers)
  - Global job portals (not location-specific)
  - Avoid job boards (LinkedIn, Indeed, Glassdoor)
  - Avoid location-specific results (Chennai, Bangalore, India, etc.)
  
  Return the best global career homepage URL.`,
  schema: z.object({
    careerPageUrl: z.string().optional(),
    isLocationSpecific: z.boolean(),
    confidence: z.number(),
    reasoning: z.string()
  })
});

// Check confidence threshold (0.5)
if (searchResults.careerPageUrl && 
    !searchResults.isLocationSpecific && 
    searchResults.confidence >= 0.5) {
  return searchResults.careerPageUrl;
}
```

### Fallback Approach: Direct Domain Construction

**Step 3: Try Common URL Patterns**
```javascript
const fallbackUrls = [
  `https://careers.${companyName.toLowerCase()}.com`,
  `https://${companyName.toLowerCase()}.com/careers`,
  `https://jobs.${companyName.toLowerCase()}.com`,
  `https://${companyName.toLowerCase()}.com/jobs`,
  `https://${companyName.toLowerCase()}.com/company/careers`,
  `https://${companyName.toLowerCase()}.com/careers`,
  `https://${companyName.toLowerCase()}.com/join-us`,
  `https://${companyName.toLowerCase()}.com/work-with-us`
];

for (const url of fallbackUrls) {
  try {
    // Add delay between URL attempts
    await page.waitForTimeout(1000);
    
    await page.goto(url);
    
    const pageValidation = await page.extract({
      instruction: `Is this a global career page for ${companyName}?
      Check for:
      - Career/jobs content
      - Job search functionality
      - No location-specific content
      - Official company branding`,
      schema: z.object({
        isCareerPage: z.boolean(),
        isLocationSpecific: z.boolean(),
        hasJobSearch: z.boolean(),
        confidence: z.number()
      })
    });
    
    if (pageValidation.isCareerPage && 
        !pageValidation.isLocationSpecific && 
        pageValidation.confidence >= 0.5) {
      return url;
    }
  } catch (error) {
    continue;
  }
}
```

## Error Handling

### Failure Scenarios
1. **Google search fails** - Network error, rate limiting
2. **AI analysis fails** - Low confidence, no results found
3. **All fallback URLs fail** - No valid career page found
4. **Location-specific results** - Only local career pages available

### Error Response
```javascript
try {
  const careerPageUrl = await findCareerPage(companyName);
  return careerPageUrl;
} catch (error) {
  // Update company status to failed
  updateCompanyStatus(companyName, 'failed', error.message);
  
  // Break the workflow - don't proceed to next node
  throw new Error(`Career page discovery failed for ${companyName}: ${error.message}`);
}
```

## Key Design Decisions

### 1. Incognito Mode
- **Reason**: Avoid location bias from browser history/cookies
- **Implementation**: Use Stagehand's incognito option
- **Benefits**: Gets global results, not location-specific

### 2. AI-Powered Search (Primary)
- **Reason**: More intelligent than simple domain construction
- **Confidence Threshold**: 0.5 (decent but not too strict)
- **Location Detection**: Explicitly avoid location-specific results

### 3. Fallback Strategy
- **Reason**: Handle cases where Google search fails
- **URL Patterns**: 8 common career page patterns
- **Validation**: AI validation for each fallback URL

### 4. Delays Between Operations
- **Google Search**: 2s before, 3s after
- **Fallback URLs**: 1s between attempts
- **Reason**: Avoid rate limiting and ensure page loads

### 5. Workflow Breaking on Failure
- **Reason**: Don't waste resources on companies without career pages
- **Action**: Update CSV status, throw error, stop workflow

## Location Bias Prevention

### Problem
- Google shows location-specific results based on user location
- "Okta careers" → "Okta careers Chennai"
- "Google careers" → "Google careers Bangalore"

### Solution
1. **Incognito mode** - No location history
2. **Explicit global search terms** - "global jobs worldwide"
3. **Location detection** - Check for location indicators
4. **Validation** - Ensure no location-specific content

### Location Indicators
```javascript
const locationIndicators = [
  'chennai', 'bangalore', 'mumbai', 'delhi', 'india',
  'united states', 'us', 'america', 'europe', 'asia'
];
```

## Success Criteria

### Primary Success
- ✅ Find valid career homepage URL
- ✅ URL is not location-specific
- ✅ Confidence >= 0.5
- ✅ Page has job search functionality

### Validation Checks
- ✅ URL is accessible
- ✅ Page contains career content
- ✅ No location-specific indicators
- ✅ Official company branding present

## Example Flows

### Successful Flow (Okta)
1. **Input**: "Okta"
2. **Google Search**: "Okta careers global jobs"
3. **AI Result**: `https://www.okta.com/company/careers/`
4. **Validation**: Global career page, confidence 0.8
5. **Output**: `https://www.okta.com/company/careers/`

### Fallback Flow (Unknown Company)
1. **Input**: "SomeCompany"
2. **Google Search**: Fails or low confidence
3. **Fallback URLs**: Try `https://careers.somecompany.com`
4. **Validation**: Valid career page found
5. **Output**: `https://careers.somecompany.com`

### Failure Flow (No Career Page)
1. **Input**: "TinyCompany"
2. **Google Search**: No results
3. **Fallback URLs**: All fail
4. **Error**: "Failed to find career page"
5. **Action**: Update CSV status, break workflow

## State Schema

### Input State
```javascript
const careerPageFinderInputState = {
  // Company information
  companyName: "Okta",                    // Current company to process
  
  // Browser context
  page: StagehandPage,                    // Incognito page instance
  agent: StagehandAgent,                  // AI agent instance
  
  // Workflow state
  currentStep: "career_page_finder",      // Current node name
  
  // Configuration
  config: {
    batchSize: 5,
    maxRetries: 3,
    confidenceThreshold: 0.5
  }
};
```

### Output State
```javascript
const careerPageFinderOutputState = {
  // Original input state
  ...careerPageFinderInputState,
  
  // Career page discovery results
  careerPageUrl: "https://www.okta.com/company/careers/",  // Found career homepage
  discoverySuccess: true,                                   // Whether discovery succeeded
  discoveryTime: 12500,                                    // Time taken in milliseconds
  
  // AI analysis results
  searchResults: {
    careerPageUrl: "https://www.okta.com/company/careers/",
    isLocationSpecific: false,
    confidence: 0.8,
    reasoning: "Found official Okta careers page with global job listings"
  },
  
  // Validation results
  pageValidation: {
    isCareerPage: true,
    isLocationSpecific: false,
    hasJobSearch: true,
    confidence: 0.9
  },
  
  // Updated workflow state
  currentStep: "job_listings_navigator"  // Next node
};
```

### Error State (if Node 1 fails)
```javascript
const errorState = {
  ...careerPageFinderInputState,
  careerPageUrl: null,
  discoverySuccess: false,
  error: "Failed to find career page for Okta after all attempts",
  errorStep: "fallback_url_validation",
  currentStep: "end"  // Stop workflow
};
```

## Implementation Notes

### Dependencies
- Stagehand client with incognito support
- OpenAI API for AI analysis
- CSV utilities for status updates

### Performance Considerations
- Total time: ~10-15 seconds per company
- Delays: 2s + 3s + (1s × 8 fallbacks) = ~13s
- Rate limiting: Built-in delays prevent issues

### Testing Strategy
- Test with known companies (Google, Microsoft, Meta)
- Test with unknown companies
- Test with companies without career pages
- Test location bias scenarios

## Next Steps

1. **Implement Node 1** - Career Page Finder
2. **Test with sample companies** - Validate strategy
3. **Move to Node 2** - Job Listings Navigator
4. **Integration testing** - End-to-end workflow

## Related Documents

- [Job Listings Navigator Node Design](./jobListingsNavigatorNode.DESIGN.md)
- [Filter Analyzer Node Design](./filterAnalyzerNode.DESIGN.md)
- [Metadata Constructor Node Design](./metadataConstructorNode.DESIGN.md)
- [Main Workflow Design](../README.md) 