# Career Page Discovery Pipeline

## Overview

The Career Page Discovery Pipeline is an AI-powered system that automatically discovers and analyzes company career pages. It takes a list of companies and generates structured metadata about their job search functionality, including URL parameters and search capabilities.

## Pipeline Goal

**Input**: List of companies
**Output**: Career page URLs with parameters (matching your CSV format)
**Process**: Find career pages → Navigate to job listings → Analyze filters → Generate metadata

## Architecture

### Workflow Flow
```
Company List → Career Page Finder → Job Listings Navigator → Filter Analyzer → Metadata Constructor
```

### Key Components

1. **Career Page Finder Node**: Uses Google search to find official career homepages
2. **Job Listings Navigator Node**: Navigates from career homepage to job listings page
3. **Filter & Parameter Analyzer Node**: Discovers all search filters and URL parameters
4. **Metadata Constructor Node**: Generates structured metadata in CSV format

## Features

- **AI-Powered Discovery**: Uses Stagehand's AI capabilities for intelligent navigation
- **Robust Fallbacks**: Multiple strategies for handling different career site patterns
- **Comprehensive Analysis**: Discovers all available search filters and parameters
- **CSV-Compatible Output**: Generates metadata matching your existing format
- **Error Handling**: Graceful handling of failures at each step

## Usage

### Basic Usage
```javascript
import { runCareerPageDiscovery } from './src/new-workflows/career-page-discovery/index.js';

const companies = ['Google', 'Microsoft', 'Meta'];
const results = await runCareerPageDiscovery(companies);
```

### API Endpoint
```bash
POST /api/career-page-discovery
{
  "companies": ["Google", "Microsoft", "Meta"]
}
```

## Output Format

The pipeline generates metadata in your CSV format:

```csv
url,description,company
"https://careers.google.com/jobs/results?q=software%20engineer&location=United%20States","This URL performs a job search with parameters: 'q' is set to search query; 'location' filters by location","Google"
```

## Configuration

### Environment Variables
- `STAGEHAND_API_URL`: Stagehand API endpoint
- `BROWSERBASE_API_KEY`: Browserbase API key
- `OPENAI_API_KEY`: OpenAI API key for AI analysis

### Search Strategies
- **Primary**: AI-powered Google search for career pages
- **Fallback**: Direct domain construction (careers.company.com)
- **Validation**: Ensure returned URLs are actual career pages

## Error Handling

The pipeline handles various failure scenarios:
- **Search Failures**: Falls back to domain construction
- **Navigation Failures**: Tries multiple navigation patterns
- **Analysis Failures**: Uses common parameter patterns
- **Validation Failures**: Logs issues for manual review

## Testing

### Test Companies
- Google (careers.google.com)
- Microsoft (careers.microsoft.com)
- Meta (careers.meta.com)
- Netflix (jobs.netflix.com)
- Airbnb (careers.airbnb.com)

### Success Criteria
- ✅ Finds career homepage for each company
- ✅ Navigates to job listings page
- ✅ Discovers search parameters
- ✅ Generates accurate metadata
- ✅ Handles different site patterns

## Development

### Project Structure
```
src/new-workflows/career-page-discovery/
├── index.js                    # Main workflow orchestrator
├── decisionFunctions.js        # Workflow routing logic
├── TASKS.md                   # Implementation tasks
├── README.md                  # This documentation
├── types.js                   # State schema and types
└── nodes/
    ├── careerPageFinderNode.js     # Node 1: Find career homepage
    ├── jobListingsNavigatorNode.js # Node 2: Navigate to job listings
    ├── filterAnalyzerNode.js       # Node 3: Analyze filters & parameters
    └── metadataConstructorNode.js  # Node 4: Generate metadata
```

### State Schema
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
  filterAnalysis: { type: 'object' },
  metadata: { type: 'object' },
  
  // Workflow state
  currentStep: { type: 'string' },
  errors: { type: 'array' }
};
```

## Contributing

1. Follow the task breakdown in `TASKS.md`
2. Implement nodes one at a time
3. Test with sample companies
4. Validate output format
5. Add error handling and fallbacks

## License

MIT License - see LICENSE file for details 