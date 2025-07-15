# Filter Analyzer Node - Design Specification

## Overview

The Filter Analyzer Node discovers job search filters on a job listings page and constructs URL patterns by actually filling the filters and capturing the resulting URLs.

## Purpose

Discover job search filters and construct URL patterns for automated job discovery.

## Input

- Job listings page URL from Node 2 (Job Listings Navigator)
- Stagehand page instance

## Output

- URL construction pattern with parameter hints
- Filter field names and their purposes

## Process Flow

### Step 1: Load Job Listings Page
- Load the job listings page in Stagehand
- Wait for page to fully load

### Step 2: Discover Filter Fields
Use AI prompt to find all job-filtering form fields:
```
"Find all form fields on this page that are used for filtering the job listings. For each field, tell me:
1. Field name/ID
2. Field type (search box, dropdown, checkbox, radio)
3. Available values/options (if dropdown/checkbox/radio)
4. Placeholder text (if search box)

Only include fields that actually filter the job list, not general page navigation."
```

### Step 3: Fill Filters with Sample Values
- **Search box**: Fill with "software engineer"
- **Location dropdown**: Select "remote" or first available option
- **Job type**: Select "full-time" or first available option
- **Department**: Select "engineering" or first available option

### Step 4: Submit Search
- Click the search/filter button
- Wait for page to reload with filtered results

### Step 5: Capture URL
- Get the current URL after search submission
- Example: `https://company.com/careers/jobs?q=software+engineer&location=remote&type=full-time&department=engineering`

### Step 6: Extract URL Pattern
- Parse URL parameters
- Map parameters to their purposes
- Create URL construction template

## State Schema

```javascript
{
  companyName: "string",
  careerPageUrl: "string",
  jobListingsUrl: "string",
  filteredJobUrl: "string|null",
  urlParameters: {
    q: "job title search",
    location: "location filter", 
    type: "employment type",
    department: "team filter"
  },
  status: "filters_analyzed|filter_analysis_failed",
  error: "string|null"
}
```

## Success Criteria

- Successfully discovers at least one filter field
- Successfully fills filters and captures resulting URL
- Extracts meaningful parameter names and purposes
- No errors during filter interaction

## Error Handling

- **No filters found**: Mark as failed, continue to next company
- **Filter interaction fails**: Log error, mark as failed
- **URL capture fails**: Log error, mark as failed
- **Invalid URL pattern**: Log error, mark as failed

## Key Design Principles

1. **Actual Interaction**: Fill real filters instead of guessing URL patterns
2. **Simple Discovery**: One AI prompt to find all filter fields
3. **Single URL**: Capture one URL with all parameters combined
4. **Parameter Mapping**: Understand what each parameter does
5. **Error Resilience**: Graceful failure handling

## Implementation Notes

- Uses Stagehand for browser automation
- AI prompt for intelligent field discovery
- Direct filter interaction for URL construction
- Simple parameter extraction and mapping
- CSV status tracking for failed companies 