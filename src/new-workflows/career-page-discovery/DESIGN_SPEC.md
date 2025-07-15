# Career Page Discovery Pipeline - Design Specification

## Overview

A simple, CSV-based pipeline to discover and analyze company career pages using Stagehand browser automation. The pipeline takes a CSV list of company names and discovers their career pages, job listings pages, and job search filters, then appends valid metadata to an existing CSV file.

## Pipeline Architecture

```
Company Name → Career Page Finder → Job Listings Navigator → Filter Analyzer → Metadata Constructor → CSV Output
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