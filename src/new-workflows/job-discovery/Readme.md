# Job Discovery Workflow

## Overview

The Job Discovery Workflow is an AI-powered system that automatically discovers job opportunities by scraping job search platforms and storing them in DynamoDB for further processing. It uses OpenAI to intelligently construct domain-specific URLs and extract job description links from search pages.

## Architecture

### Workflow Components

```
CSV Input → URL Construction → Job Scraping → DynamoDB Storage → API Response
```

1. **CSV Reader**: Reads job search URLs and company mappings from CSV
2. **URL Construction Node**: Uses OpenAI to build domain-specific job search URLs
3. **Job Scraper Node**: Extracts job description URLs and stores them in DynamoDB
4. **DynamoDB Storage**: Bulk inserts job descriptions with metadata

### Key Features

- **Intelligent URL Construction**: Uses OpenAI to generate domain-specific job search URLs
- **Bulk DynamoDB Storage**: Efficient batch operations with retry logic
- **Company Mapping**: Preserves company names from CSV input
- **Error Handling**: Graceful handling of scraping and storage failures
- **API Integration**: RESTful endpoint for job discovery requests

## Data Flow

### Input
- **CSV File**: Contains job search URLs and company names
- **Domain**: Target job domain (e.g., "software engineering")
- **Filters**: Search criteria (location, experience, job type)

### Processing
1. **URL Enhancement**: OpenAI constructs domain-specific URLs with filters
2. **Job Scraping**: Browser automation extracts all job description URLs
3. **URL Classification**: OpenAI filters URLs to identify job description pages
4. **Company Mapping**: Maps company names from CSV to each job URL
5. **DynamoDB Storage**: Bulk stores job descriptions with metadata

### Output
- **Job Descriptions**: Array of job URLs with company mappings
- **Stored Jobs**: DynamoDB records with full metadata
- **Storage Errors**: Any failed storage operations
- **Count Metrics**: Processing statistics

## API Usage

### Endpoint
```
POST /api/v1/job-discovery
```

### Request Body
```json
{
  "domain": "software engineering",
  "filters": {
    "keywords": "software engineer",
    "location": "San Francisco",
    "experience": "mid_level",
    "employment_type": "full_time"
  }
}
```

### Response
```json
{
  "success": true,
  "processedUrls": [...],
  "scrapedJobs": [...],
  "jobDescriptions": [
    {
      "url": "https://linkedin.com/jobs/view/...",
      "company": "Google",
      "domain": "software engineering",
      "filters": {...}
    }
  ],
  "storedJobs": [...],
  "storageErrors": [...],
  "count": {
    "urls": 5,
    "jobs": 25,
    "stored": 25,
    "storageErrors": 0
  }
}
```

## DynamoDB Schema

### Table: `job_descriptions`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Auto-generated unique ID |
| `url` | String | Job description URL |
| `company` | String | Company name from CSV |
| `domain` | String | Search domain |
| `filters` | Object | Original search filters |
| `scrapedAt` | String | ISO timestamp |
| `status` | String | "discovered" |

### Example Record
```json
{
  "id": "job_a1b2c3d4_1234567890",
  "url": "https://linkedin.com/jobs/view/4253471300",
  "company": "Google",
  "domain": "software engineering",
  "filters": {
    "keywords": "software engineer",
    "location": "San Francisco"
  },
  "scrapedAt": "2024-01-15T10:30:00.000Z",
  "status": "discovered"
}
```

## Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Browser Automation
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

### CSV Format
```csv
url,company
https://linkedin.com/jobs/search?keywords=software%20engineer,Google
https://indeed.com/jobs?q=software+engineer,Microsoft
```

## Usage Examples

### Basic Job Discovery
```javascript
const response = await fetch('/api/v1/job-discovery', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: 'software engineering',
    filters: {
      keywords: 'software engineer',
      location: 'San Francisco'
    }
  })
});
```

### Test the Workflow
```bash
# Run the test
node test-dynamodb-storage.js

# Start the API server
npm run start-api

# Test the API endpoint
curl -X POST http://localhost:3000/api/v1/job-discovery \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "software engineering",
    "filters": {
      "keywords": "software engineer",
      "location": "San Francisco"
    }
  }'
```

## Performance Optimizations

### Bulk DynamoDB Operations
- Uses `BatchWriteItem` for efficient bulk inserts
- Processes up to 25 items per batch (DynamoDB limit)
- Automatic retry logic for unprocessed items
- Exponential backoff for throttling scenarios

### Browser Automation
- Rate limiting between different job sites
- Error handling for failed page loads
- Parallel processing of multiple URLs

## Error Handling

### Scraping Errors
- Individual URL failures don't stop the entire process
- Detailed error logging for debugging
- Graceful degradation with partial results

### Storage Errors
- Failed items are tracked separately
- Bulk operations continue even if some items fail
- Retry logic handles temporary DynamoDB issues

## Monitoring

### Logs
- Detailed logging at each workflow step
- Performance metrics for each operation
- Error tracking with context

### Metrics
- URLs processed
- Jobs scraped
- Items stored in DynamoDB
- Storage errors
- Processing time

## Future Enhancements

### Planned Features
- **Job Deduplication**: Prevent storing duplicate jobs
- **Source Analytics**: Track which sources yield best results
- **Job Classification**: Categorize jobs by type/seniority
- **Real-time Updates**: WebSocket notifications for new jobs
- **Advanced Filtering**: More sophisticated job filtering logic

### Items To Complete

#### 1. URL Duplicate Prevention
- **Issue**: Job discovery workflow doesn't check if URLs already exist before inserting
- **Solution**: Implement URL existence check in DynamoDB before storage
- **Implementation**: 
  - Add `checkJobUrlExists()` function to DynamoDB utilities
  - Query by URL field before inserting new jobs
  - Skip duplicates or update existing records with new metadata

#### 2. Pagination Support
- **Issue**: No way to move between pages in search results
- **Solution**: Implement pagination logic for job search platforms
- **Implementation**:
  - Add pagination detection for common job sites (LinkedIn, Indeed, etc.)
  - Implement "Next Page" button detection and clicking
  - Support for multiple page scraping in single workflow run
  - Configurable page limits per domain

#### 3. Auto-Reflection and Learning
- **Issue**: No mechanism to learn from successful URL extraction patterns
- **Solution**: Implement auto-reflection to improve URL pickup speed based on platform learnings
- **Implementation**:
  - Track success rates by platform and URL patterns
  - Store platform-specific selectors and strategies
  - Auto-optimize scraping patterns based on historical success
  - Implement adaptive learning for new job platforms
  - Cache successful extraction patterns for faster future runs

### Scalability Improvements
- **Distributed Processing**: Handle larger job volumes
- **Caching Layer**: Redis for frequently accessed data
- **Queue System**: Background job processing
- **Multi-region**: Support for multiple AWS regions

## Troubleshooting

### Common Issues

**OpenAI API Errors**
- Check API key configuration
- Verify rate limits and quotas
- Ensure proper prompt formatting

**DynamoDB Storage Failures**
- Verify AWS credentials
- Check table permissions
- Monitor throttling limits

**Browser Automation Issues**
- Check BrowserBase API key
- Verify project configuration
- Monitor browser session limits

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm run start-api
```

## Contributing

### Adding New Job Sources
1. Update CSV with new job search URLs
2. Test URL construction with new domains
3. Verify scraping works with new sites
4. Update documentation

### Extending the Workflow
1. Add new nodes to the workflow
2. Update state schema
3. Modify API response format
4. Update tests and documentation

## License

MIT License - see LICENSE file for details.
