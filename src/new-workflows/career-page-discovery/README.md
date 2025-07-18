# Career Discovery Workflow

## Overview

The Career Discovery Workflow is a comprehensive pipeline that automatically discovers and analyzes company career pages, job listings, and search filters. It uses AI-powered browser automation to build a structured database of job search capabilities across different companies.

## Pipeline Architecture

```
Company Name → Career Page Finder → Job Listings Navigator → Filter Analyzer → Metadata Constructor → CSV Output
```

## Node 1: Career Page Finder Node

### Purpose
Find the company's career homepage URL from a company name, ensuring it's a global career page (not location-specific).

### Input
- `companyName` (string): Company name (e.g., "Google", "Microsoft", "Okta")

### Output
- `careerPageUrl` (string): Valid career homepage URL
- `status` (string): "career_page_found" or "career_page_failed"

### Strategy
1. **AI-Powered Google Search**: Searches for "{companyName} careers global jobs" using AI analysis
2. **Fallback Domain Construction**: Tries common URL patterns if search fails
3. **Location Bias Prevention**: Uses incognito mode and global search terms
4. **Quality Validation**: Ensures official company branding and job search functionality

### Key Features
- ✅ Incognito browser mode to avoid location bias
- ✅ AI-powered search result analysis
- ✅ Confidence scoring (>= 0.5 required)
- ✅ Fallback URL patterns for reliability
- ✅ Robust error handling and rate limiting

### Example
```javascript
// Input
{ companyName: "Google", status: "pending" }

// Output
{
  companyName: "Google",
  careerPageUrl: "https://careers.google.com",
  status: "career_page_found",
  currentStep: "career_page_finder"
}
```

---

## Node 2: Job Listings Navigator Node

### Purpose
Find the job listings page from the career homepage using CTA phrase matching and fallback URL patterns.

### Input
- `careerPageUrl` (string): Career homepage URL from Node 1
- `page` (StagehandPage): Browser page instance

### Output
- `jobListingsUrl` (string): Job listings page URL
- `status` (string): "job_listings_found" or "job_listings_failed"

### Strategy
1. **CTA Phrase Matching**: Uses AI to find clickable links matching job-related phrases
2. **Fallback URL Patterns**: Tries common job listings URL patterns
3. **Page Validation**: Verifies the resulting page shows job listings
4. **URL Construction**: Handles relative and absolute URLs properly

### Key Features
- ✅ AI-powered CTA phrase detection
- ✅ CSV-based phrase configuration (`job_listings_cta_phrases.csv`)
- ✅ Fallback URL patterns (`/jobs`, `/careers/jobs`, `/openings`, etc.)
- ✅ Page validation to ensure job listings content
- ✅ Absolute URL construction from relative paths

### Example
```javascript
// Input
{
  careerPageUrl: "https://careers.google.com",
  page: stagehandPage
}

// Output
{
  careerPageUrl: "https://careers.google.com",
  jobListingsUrl: "https://careers.google.com/jobs",
  status: "job_listings_found",
  currentStep: "job_listings_navigator"
}
```

---

## Node 3: Filter Analyzer Node

### Purpose
Analyze job listings pages to identify available filters and construct filtered job URLs using interactive form filling.

### Input
- `jobListingsUrl` (string): Job listings page URL from Node 2
- `page` (StagehandPage): Browser page instance

### Output
- `filteredJobUrl` (string): URL with filters applied
- `urlParameters` (object): Applied filter parameters
- `filters` (object): Available filter information
- `status` (string): "success" or "filters_analyzed"

### Strategy
1. **Granular Filter Detection**: Extracts search bar, location, and department filters
2. **Interactive Form Filling**: Uses Stagehand `page.act()` to fill forms
3. **URL Validation**: Verifies the resulting URL shows filtered job listings
4. **Fallback Strategies**: Multiple approaches if initial method fails

### Key Features
- ✅ AI-powered filter detection and extraction
- ✅ Interactive form filling with Stagehand `page.act()`
- ✅ Support for custom dropdowns and modern UI elements
- ✅ URL validation and page verification
- ✅ Comprehensive error handling and retry logic

### ARBITRARY_FILTERS
```javascript
const ARBITRARY_FILTERS = {
  domain: "software engineer",
  location: "remote",
  department: "engineering"
}
```

### Example
```javascript
// Input
{
  jobListingsUrl: "https://careers.google.com/jobs",
  page: stagehandPage
}

// Output
{
  jobListingsUrl: "https://careers.google.com/jobs",
  filteredJobUrl: "https://careers.google.com/jobs?q=software%20engineer&location=remote",
  urlParameters: { domain: "software engineer", location: "remote" },
  filters: { domain: {...}, location: {...}, department: {...} },
  status: "success",
  currentStep: "filter_analyzer"
}
```

---

## Node 4: Metadata Constructor Node

### Purpose
Build structured metadata and append to CSV with all discovered data from previous nodes.

### Input
- `companyName` (string): Company name
- `careerPageUrl` (string): Career page URL from Node 1
- `jobListingsUrl` (string): Job listings URL from Node 2
- `filteredJobUrl` (string): Filtered job URL from Node 3
- `urlParameters` (object): Applied filter parameters
- `filters` (object): Available filter information

### Output
- `metadata` (object): Structured CSV row data
- `status` (string): "metadata_constructed" or "metadata_construction_failed"

### Strategy
1. **AI-Powered Metadata Generation**: Uses OpenAI to generate human-readable descriptions
2. **CSV Management**: Creates or appends to `data/job_discovery_urls.csv`
3. **Natural Language Output**: Converts technical parameters to readable text
4. **Error Handling**: Comprehensive validation and error management

### Key Features
- ✅ AI-powered metadata generation with natural language
- ✅ Automatic CSV file creation with headers
- ✅ Human-readable parameter descriptions
- ✅ Discovery date tracking
- ✅ Robust error handling and validation

### CSV Structure
```csv
company_name,career_page_url,job_listings_url,filtered_job_url,available_filters,url_parameters,discovery_date,status
"Google","https://careers.google.com","https://careers.google.com/jobs","https://careers.google.com/jobs?q=engineer&location=remote","search|location","search for software engineer roles in remote locations","2024-01-15","discovered"
```

### Example
```javascript
// Input
{
  companyName: "Google",
  careerPageUrl: "https://careers.google.com",
  jobListingsUrl: "https://careers.google.com/jobs",
  filteredJobUrl: "https://careers.google.com/jobs?q=engineer&location=remote",
  urlParameters: { domain: "software engineer", location: "remote" },
  filters: { domain: {...}, location: {...} }
}

// Output
{
  metadata: {
    company_name: "Google",
    career_page_url: "https://careers.google.com",
    job_listings_url: "https://careers.google.com/jobs",
    filtered_job_url: "https://careers.google.com/jobs?q=engineer&location=remote",
    available_filters: "search|location",
    url_parameters: "search for software engineer roles in remote locations",
    discovery_date: "2024-01-15",
    status: "discovered"
  },
  status: "metadata_constructed",
  currentStep: "metadata_constructor"
}
```

---

## Complete Workflow Example

### Input
```javascript
const initialState = {
  companyName: "Google",
  status: "pending"
};
```

### Pipeline Execution
```javascript
// Node 1: Career Page Finder
const careerResult = await careerPageFinderNode(initialState);
// → careerPageUrl: "https://careers.google.com"

// Node 2: Job Listings Navigator  
const listingsResult = await jobListingsNavigatorNode(careerResult);
// → jobListingsUrl: "https://careers.google.com/jobs"

// Node 3: Filter Analyzer
const filterResult = await filterAnalyzerNode(listingsResult);
// → filteredJobUrl: "https://careers.google.com/jobs?q=engineer&location=remote"

// Node 4: Metadata Constructor
const metadataResult = await metadataConstructorNode(filterResult);
// → CSV row appended to data/job_discovery_urls.csv
```

### Final CSV Output
```csv
company_name,career_page_url,job_listings_url,filtered_job_url,available_filters,url_parameters,discovery_date,status
"Google","https://careers.google.com","https://careers.google.com/jobs","https://careers.google.com/jobs?q=engineer&location=remote","search|location","search for software engineer roles in remote locations","2024-01-15","discovered"
```

---

## Key Features

### ✅ AI-Powered Discovery
- Uses OpenAI for intelligent search and analysis
- AI-powered filter detection and form interaction
- Natural language metadata generation

### ✅ Robust Error Handling
- Comprehensive error handling at each node
- Fallback strategies for reliability
- Graceful degradation on failures

### ✅ Location Bias Prevention
- Incognito browser mode
- Global search terms
- Location detection and filtering

### ✅ Modern UI Support
- Handles custom dropdowns and modern UI elements
- Interactive form filling with Stagehand
- Support for complex job site layouts

### ✅ Structured Output
- CSV-based data storage
- Human-readable parameter descriptions
- Comprehensive metadata tracking

## Performance

- **Typical Execution Time**: 30-90 seconds per company
- **Rate Limiting**: Built-in delays to avoid blocking
- **Error Recovery**: Automatic retry and fallback strategies
- **Batch Processing**: Can process multiple companies sequentially

## Dependencies

- **Stagehand**: Browser automation and AI-powered interactions
- **OpenAI**: AI-powered analysis and natural language generation
- **Zod**: Schema validation and type safety
- **Node.js**: File system operations and CSV management

## Usage

```javascript
import careerPageFinderNode from './nodes/careerPageFinderNode.js';
import jobListingsNavigatorNode from './nodes/jobListingsNavigatorNode.js';
import filterAnalyzerNode from './nodes/filterAnalyzerNode.js';
import metadataConstructorNode from './nodes/metadataConstructorNode.js';

// Run complete pipeline
const result = await metadataConstructorNode(
  await filterAnalyzerNode(
    await jobListingsNavigatorNode(
      await careerPageFinderNode(initialState)
    )
  )
);
```

## Configuration

### CTA Phrases (`config/job_listings_cta_phrases.csv`)
```csv
phrase
"View Jobs"
"Open Positions"
"Browse Jobs"
"Search Jobs"
"Find Jobs"
```

### ARBITRARY_FILTERS (`filterAnalyzerNode.js`)
```javascript
const ARBITRARY_FILTERS = {
  domain: "software engineer",
  location: "remote", 
  department: "engineering"
}
```

## Success Criteria

- ✅ Find valid career homepage URL
- ✅ Navigate to job listings page
- ✅ Apply filters and get filtered URL
- ✅ Generate structured metadata
- ✅ Append to CSV database
- ✅ Handle errors gracefully

The Career Discovery Workflow provides a complete solution for automatically discovering and analyzing job search capabilities across different companies, building a comprehensive database for job automation applications. 