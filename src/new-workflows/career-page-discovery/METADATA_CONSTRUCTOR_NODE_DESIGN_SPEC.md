# Metadata Constructor Node - Design Specification

## Overview

The Metadata Constructor Node takes all discovered data from previous nodes and constructs a structured CSV row to append to the existing job discovery file.

## Purpose

Format discovered career page data into CSV format and append to existing file for tracking and future use.

## Input

- Company name from Node 1 (Career Page Finder)
- Career page URL from Node 1
- Job listings URL from Node 2 (Job Listings Navigator)
- Filtered job URL from Node 3 (Filter Analyzer)
- URL parameters and their purposes from Node 3

## Output

- CSV row appended to existing `data/job_discovery_urls.csv`
- Success/failure status

## Process Flow

### Step 1: Validate Input Data
- Check that all required fields are present
- Validate URL formats
- Ensure status from previous nodes is successful

### Step 2: Build Filter Summary
- Extract available filter types from URL parameters
- Create pipe-separated list of filter types
- Example: "search|location|job_type|department"

### Step 3: Create CSV Row
Construct structured data object:
```javascript
{
  company_name: "string",
  career_page_url: "string",
  job_listings_url: "string",
  filtered_job_url: "string",
  available_filters: "string",
  url_parameters: "string",
  discovery_date: "YYYY-MM-DD",
  status: "discovered"
}
```

### Step 4: Append to CSV File
- Read existing `data/job_discovery_urls.csv`
- Add new row to the end
- Write updated file back to disk

### Step 5: Update Status
- Mark company as "discovered" in CSV
- Log success with company name and filters found

## State Schema

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
  status: "metadata_constructed|metadata_construction_failed",
  error: "string|null"
}
```

## CSV Structure

Appends to `data/job_discovery_urls.csv` with columns:

```csv
company_name,career_page_url,job_listings_url,filtered_job_url,available_filters,url_parameters,discovery_date,status
"Google","https://careers.google.com","https://careers.google.com/jobs","https://careers.google.com/jobs?q=engineer&location=remote&type=full-time","search|location|job_type","q=title,location=city,type=employment","2024-01-15","discovered"
```

## Success Criteria

- All required data fields are present and valid
- CSV row is successfully appended to file
- File write operation completes without errors
- Status is updated to "discovered"

## Error Handling

- **Missing data**: Log error, mark as failed
- **Invalid URLs**: Validate format before writing
- **CSV file doesn't exist**: Create new file with headers
- **File write fails**: Log error, mark as failed
- **Invalid CSV format**: Validate before writing

## Key Design Principles

1. **Simple Data Formatting**: Just structure the data, no complex processing
2. **File I/O Only**: Read CSV, append row, write back
3. **Validation**: Check data integrity before writing
4. **Error Resilience**: Handle file system issues gracefully
5. **Status Tracking**: Update CSV status for failed companies

## Implementation Notes

- Uses Node.js file system operations
- CSV parsing and writing
- Data validation and formatting
- Simple error handling and logging
- No external dependencies beyond file I/O 