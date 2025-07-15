# Career Page Discovery Pipeline - Design Specification

## Overview

A simple, CSV-based pipeline to discover and analyze company career pages using Stagehand browser automation. The pipeline takes a CSV list of company names and discovers their career pages, job listings pages, and job search filters, then appends valid metadata to an existing CSV file.

## Pipeline Architecture

```
Company Name → Career Page Finder → Job Listings Navigator → Filter Analyzer → Metadata Constructor → CSV Output
```

## Workflow Strategy

### 1. **LangGraph StateGraph Structure**
```javascript
// Follow the pattern from job-discovery and easyApply workflows
const workflow = new StateGraph({
  channels: careerDiscoveryStateSchema
});

// Add nodes
workflow.addNode('career_page_finder', careerPageFinderNode);
workflow.addNode('job_listings_navigator', jobListingsNavigatorNode);
workflow.addNode('filter_analyzer', filterAnalyzerNode);
workflow.addNode('metadata_constructor', metadataConstructorNode);

// Linear flow - no conditional edges needed
workflow.addEdge('career_page_finder', 'job_listings_navigator');
workflow.addEdge('job_listings_navigator', 'filter_analyzer');
workflow.addEdge('filter_analyzer', 'metadata_constructor');
workflow.addEdge('metadata_constructor', END);
```

### 2. **State Schema** (following job-discovery pattern)
```javascript
const careerDiscoveryStateSchema = {
  // Input
  companyName: { type: 'string' },
  companies: { type: 'array' },
  currentCompanyIndex: { type: 'number' },
  
  // Browser
  page: { type: 'any' },
  agent: { type: 'any' },
  
  // Discovery results
  careerPageUrl: { type: 'string' },
  jobListingsUrl: { type: 'string' },
  filteredJobUrl: { type: 'string' },
  urlParameters: { type: 'object' },
  
  // Workflow state
  currentStep: { type: 'string' },
  status: { type: 'string' },
  errors: { type: 'array' },
  metadata: { type: 'object' }
};
```

### 3. **Node Structure** (following job-extraction pattern)
```javascript
// Each node is a pure function that takes state and returns updated state
const careerPageFinderNode = async (state) => {
  try {
    // Node logic here
    return { ...state, careerPageUrl: url, status: 'career_page_found' };
  } catch (error) {
    return { ...state, error: error.message, status: 'career_page_failed' };
  }
};
```

### 4. **CSV Integration** (following job-discovery pattern)
- Read companies from `data/companies.csv`
- Process each company through the pipeline
- Append results to `data/job_discovery_urls.csv`
- Skip failed companies in subsequent runs

### 5. **Error Handling** (following easyApply pattern)
- Each node handles its own errors
- Failed nodes update status and continue
- Errors are logged but don't stop the pipeline
- Failed companies are marked in CSV for skipping

### 6. **Browser Management** (following job-extraction pattern)
- Use `enhancedStagehandClient` from shared utils
- Create fresh incognito pages for each node
- Clean up pages after each node
- Handle page crashes and retries

### 7. **Decision Functions** (simple linear flow)
```javascript
// No complex decision logic needed - linear flow
// Each node passes to the next automatically
// Only handle end conditions
```

## Node Specifications

### Node 1: Career Page Finder

**Purpose:** Find the career page URL for a given company name.

**Input:** Company name from CSV
**Output:** Career page URL or failure status

**Process:**
1. Use incognito Stagehand page to avoid location bias
2. Perform AI-powered Google search: "company name careers jobs"
3. Analyze search results with confidence threshold of 0.5
4. If AI search fails, try direct domain construction with common patterns:
   - `company.com/careers`
   - `company.com/jobs`
   - `company.com/join-us`
   - `careers.company.com`
5. Validate career page by checking for job-related keywords
6. Update CSV status: "career_page_found" or "career_page_failed"

**State Schema:**
```javascript
{
  companyName: "string",
  careerPageUrl: "string|null",
  status: "career_page_found|career_page_failed",
  error: "string|null"
}
```

### Node 2: Job Listings Navigator

**Purpose:** Find the job listings page from the career homepage.

**Input:** Career page URL from Node 1
**Output:** Job listings page URL or failure status

**Process:**
1. Load career homepage in incognito Stagehand page
2. Use local JSON store of common CTA phrases:
   - "Open positions", "View all jobs", "Browse jobs"
   - "Current openings", "Job opportunities", "Work with us"
3. Open multiple incognito tabs to test each CTA phrase
4. Analyze resulting pages for job listings presence
5. Select first valid unique URL as job listings page
6. If no navigation works, try common URL suffixes:
   - `/jobs`, `/openings`, `/positions`, `/opportunities`
7. Update CSV status: "job_listings_found" or "job_listings_failed"

**State Schema:**
```javascript
{
  companyName: "string",
  careerPageUrl: "string",
  jobListingsUrl: "string|null",
  status: "job_listings_found|job_listings_failed",
  error: "string|null"
}
```

### Node 3: Filter Analyzer

**Purpose:** Discover job search filters and construct URL patterns.

**Input:** Job listings page URL from Node 2
**Output:** URL construction pattern with parameter hints

**Process:**
1. Load job listings page in Stagehand
2. Use AI prompt to discover all job-filtering form fields:
   ```
   "Find all form fields on this page that are used for filtering the job listings. For each field, tell me:
   1. Field name/ID
   2. Field type (search box, dropdown, checkbox, radio)
   3. Available values/options (if dropdown/checkbox/radio)
   4. Placeholder text (if search box)
   
   Only include fields that actually filter the job list, not general page navigation."
   ```
3. Fill all discovered filters with sample values:
   - Search box: "software engineer"
   - Location dropdown: "remote"
   - Job type: "full-time"
   - Department: "engineering"
4. Hit search button and capture the resulting URL
5. Extract URL pattern and parameter purposes
6. Update CSV status: "filters_analyzed" or "filter_analysis_failed"

**State Schema:**
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

### Node 4: Metadata Constructor

**Purpose:** Build structured metadata and append to CSV.

**Input:** All data from previous nodes
**Output:** CSV row appended to existing file

**Process:**
1. Collect all discovered data:
   - Company name
   - Career page URL
   - Job listings URL
   - Filtered job URL with parameters
2. Create CSV row with metadata:
   - Company name
   - Career page URL
   - Job listings URL
   - Available filter types (search|location|job_type|department)
   - URL construction pattern
   - Parameter purposes
   - Discovery date
3. Append to existing `job_discovery_urls.csv`
4. Update status to "discovered"

**State Schema:**
```javascript
{
  companyName: "string",
  careerPageUrl: "string",
  jobListingsUrl: "string",
  filteredJobUrl: "string",
  metadata: {
    company_name: "string",
    career_page_url: "string",
    job_listings_url: "string",
    filtered_job_url: "string",
    available_filters: "string",
    url_parameters: "string",
    discovery_date: "string",
    status: "discovered"
  },
  status: "metadata_constructed|metadata_construction_failed"
}
```

## CSV Structure

The pipeline appends to `data/job_discovery_urls.csv` with columns:

```csv
company_name,career_page_url,job_listings_url,filtered_job_url,available_filters,url_parameters,discovery_date,status
"Google","https://careers.google.com","https://careers.google.com/jobs","https://careers.google.com/jobs?q=engineer&location=remote&type=full-time","search|location|job_type","q=title,location=city,type=employment","2024-01-15","discovered"
```

## Key Implementation Nuances

### 1. **CSV Processing**
- Read companies in batches (5-10 per run)
- Track status in CSV to skip failed companies
- Append results immediately after each company
- Handle file locking for concurrent access

### 2. **Browser Management**
- Fresh incognito page for each company
- 2-3 second delays between requests
- Handle page crashes gracefully
- Clean up pages after each node

### 3. **Error Resilience**
- Node failures don't stop the pipeline
- Log errors but continue processing
- Mark failed companies in CSV
- Graceful degradation with partial results

### 4. **State Management**
- Pass state between nodes linearly
- No complex state management needed
- Simple error propagation
- State validation at each node

### 5. **File I/O**
- Read CSV at start
- Append results after each company
- Handle file system issues gracefully
- Validate data before writing

## Error Handling Strategy

- **Node failures** break the workflow and update CSV status
- **Failed companies** are skipped in subsequent runs
- **Simple logging** to track progress and errors
- **No complex state management** - just CSV status updates

## Configuration Parameters

- **Companies per run**: Configurable batch size
- **Confidence threshold**: 0.5 for AI search results
- **Delay between requests**: 2-3 seconds to avoid rate limiting
- **Retry attempts**: 2 for each node before marking as failed

## Key Design Principles

1. **Simplicity**: CSV-based status tracking, no complex state management
2. **Reliability**: Incognito pages, fallback strategies, error handling
3. **Efficiency**: Batch processing, configurable limits
4. **Maintainability**: Clear node separation, simple interfaces
5. **Extensibility**: Easy to add new filter types or discovery methods

## Implementation Notes

- Uses Stagehand for browser automation
- AI prompts for intelligent discovery
- Local JSON stores for common patterns
- Direct CSV manipulation for status tracking
- No external state management systems 