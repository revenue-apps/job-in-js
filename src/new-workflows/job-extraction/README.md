# Job Extraction Workflow

## Overview

The Job Extraction Workflow is responsible for extracting detailed job information from discovered job URLs. It takes job URLs with status "discovered" from the job discovery workflow and extracts comprehensive job details including title, company, location, requirements, and domain-specific information.

## Workflow Purpose

- **Input**: Single job ID with status "discovered" from DynamoDB
- **Process**: Extract detailed job information from the job URL
- **Output**: Rich job description with structured data, status "extracted"
- **Goal**: Transform raw job URL into comprehensive job profile for analysis and matching
- **Scalability**: Process one job at a time for better resource management and error handling

## Architecture

### Workflow Flow
```
Job ID → Load Job from DDB → Content Extraction → Job Analysis → Domain Classification → 
Experience Detection → Dimension Mapping → Quality Validation → DynamoDB Storage → Status Update
```

### Key Components

1. **Job Loader Node**: Loads single job from DynamoDB by ID
2. **Job Content Extractor Node**: Navigates to job URL and extracts raw content
3. **Job Analyzer Node**: Extracts basic company/job details
4. **Domain Classifier Node**: Identifies job domain and sub-domain with multi-domain scoring
5. **Experience Level Detector Node**: Determines job seniority level
6. **Dimension Mapper Node**: Maps extracted data to configured dimensions
7. **Quality Validator Node**: Validates extraction quality and completeness
8. **Storage Node**: Stores results in DynamoDB with status "extracted"

## Data Flow

### Input
- **Job ID**: Single job ID with status "discovered" from DynamoDB
- **Domain Config**: Pre-configured domain and dimension specifications

### Processing
1. **Content Extraction**: Extract raw HTML/text from job pages
2. **Basic Analysis**: Extract essential company/job details
3. **Multi-Domain Classification**: Identify job domain and sub-domain with confidence scores
4. **Experience Detection**: Determine job seniority level
5. **Dimension Mapping**: Map extracted data to configured dimensions
6. **Quality Check**: Validate extraction completeness and accuracy

### Output
- **Structured Job Data**: Comprehensive job profiles with all extracted information
- **Raw Content Storage**: Store original job content for future re-analysis
- **Analysis Metadata**: Track extraction quality and confidence scores
- **Status Update**: Mark jobs as "extracted" in DynamoDB

## DynamoDB Schema

### Enhanced Job Descriptions Table
```json
{
  "id": "job_abc123",
  "url": "https://linkedin.com/jobs/view/...",
  "status": "extracted",
  "raw_content": {
    "full_text": "Complete job description text...",
    "structured_html": "<div>Job description HTML...</div>",
    "extracted_at": "2024-01-15T10:30:00.000Z"
  },
  "job_data": {
    "title": "Senior Software Engineer",
    "company": "Google",
    "location": "San Francisco, CA",
    "salary": "$150k-$200k",
    "experience_level": "senior",
    "domain": "software_engineering",
    "sub_domain": "development"
  },
  "extracted_dimensions": {
    "core": {
      "title": "Senior Software Engineer",
      "company": "Google",
      "location": "San Francisco, CA"
    },
    "domain_specific": {
      "programming_languages": ["Python", "JavaScript", "Go"],
      "frameworks": ["React", "Django"],
      "databases": ["PostgreSQL", "Redis"]
    }
  },
  "analysis_metadata": {
    "extracted_at": "2024-01-15T10:30:00.000Z",
    "confidence_score": 0.87,
    "domain": "software_engineering",
    "sub_domain": "development",
    "experience_level": "senior",
    "platform": "linkedin"
  }
}
```

## Configuration

### Domain Configuration
```json
{
  "software_engineering": {
    "core_dimensions": ["title", "company", "location", "salary", "experience_level"],
    "sub_domains": {
      "development": {
        "dimensions": ["programming_languages", "frameworks", "databases", "tools"]
      },
      "testing": {
        "dimensions": ["testing_frameworks", "automation_tools", "qa_methodologies"]
      },
      "architecture": {
        "dimensions": ["design_patterns", "system_architecture", "scalability"]
      }
    },
    "experience_levels": {
      "junior": { "analysis_depth": "basic", "required_dimensions": 3 },
      "senior": { "analysis_depth": "comprehensive", "required_dimensions": 8 },
      "principal": { "analysis_depth": "expert", "required_dimensions": 12 }
    }
  }
}
```

## API Usage

### Endpoint
```
POST /api/v1/job-extraction
```

### Request Body
```json
{
  "job_id": "job_abc123",
  "domain": "software_engineering",
  "options": {
    "extract_raw_content": true,
    "validate_quality": true,
    "confidence_threshold": 0.8
  }
}
```

### Response
```json
{
  "success": true,
  "job_id": "job_abc123",
  "status": "extracted",
  "quality_metrics": {
    "confidence": 0.87,
    "completeness_score": 0.92,
    "processing_time": 15.2
  },
  "job_data": { /* structured job data */ },
  "extracted_dimensions": { /* mapped dimensions */ },
  "analysis_metadata": { /* analysis details */ }
}
```

## Error Handling

### Immediate Error Stopping
- **Stop on Error**: Workflow stops immediately when any node fails
- **Error State**: Failed nodes set workflow status to 'stopped'
- **Error Logging**: Comprehensive error tracking with node identification
- **No Cascading**: Prevents error propagation to downstream nodes

### Common Issues
- **Content Unavailable**: Job page no longer accessible
- **Platform Changes**: Job site structure has changed
- **Extraction Failures**: AI unable to extract required information
- **Quality Issues**: Extracted data below confidence threshold

### Recovery Strategies
- **Retry Logic**: Automatic retry with different extraction strategies
- **Fallback Methods**: Rule-based extraction when AI fails
- **Manual Review**: Flag jobs for human review when needed
- **Partial Results**: Store partial data when full extraction fails
- **Resume Capability**: Can resume workflow from failed nodes (low priority)

## Performance Optimizations

### Batch Processing
- Process multiple jobs from same platform together
- Cache platform-specific extraction patterns
- Reuse browser sessions for same domain

### Quality Assurance
- Confidence scoring for each extracted dimension
- Completeness validation against required dimensions
- Cross-validation of extracted data

## Future Enhancements

### Planned Features
- **Dimension Discovery**: Automatic detection of new job dimensions
- **Human-in-the-Loop**: Approval workflow for new dimensions
- **Re-analysis Capability**: Re-analyze jobs with updated configurations
- **Cross-Domain Learning**: Apply learnings across different domains

### Separate Workflows
- **Dimension Management Workflow**: Handle dimension discovery and approval
- **Quality Improvement Workflow**: Continuously improve extraction quality
- **Domain Expansion Workflow**: Add new domains and sub-domains

## Monitoring

### Metrics
- Jobs processed per run
- Extraction success rate
- Average confidence scores
- Processing time per job
- Quality scores

### Logs
- Detailed extraction logs for each job
- Error tracking and debugging information
- Performance metrics and bottlenecks

## Testing

### Test Scenarios
- Different job platforms (LinkedIn, Indeed, Glassdoor)
- Various job domains and seniority levels
- Error conditions and edge cases
- Quality validation and confidence scoring

### Test Data
- Sample job URLs from different platforms
- Expected extraction results
- Quality benchmarks and thresholds 