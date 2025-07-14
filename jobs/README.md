# Background Jobs System

This directory contains the background job system for the job application platform. The system consists of two main jobs that run on a schedule using `node-cron`.

## Jobs Overview

### 1. Discovery Job (`discovery.js`)
- **Purpose**: Scrapes job listings from multiple sources and stores them in DynamoDB
- **Schedule**: 
  - Production: Every 15 minutes
  - Development: Every 1 minute (for faster testing)
- **Input**: Reads from `config/discovery_inputs.json`
- **Output**: Jobs stored in DynamoDB with status = "discovered"

### 2. Processor Job (`processor.js`)
- **Purpose**: Picks the oldest discovered job and processes it for detailed extraction
- **Schedule**: Every 1 minute
- **Input**: Queries DynamoDB for jobs with status = "discovered"
- **Output**: Calls `/api/v1/job-extraction` API to process the job

## Configuration

### Discovery Inputs (`config/discovery_inputs.json`)
```json
{
  "discovery_inputs": [
    {
      "domain": "software_engineering",
      "filters": {
        "keywords": ["software engineer", "full stack"],
        "location": ["United States", "India"],
        "employment_type": "FULL_TIME"
      },
      "config_path": "data/job_discovery_urls.csv",
      "description": "Software Engineering roles"
    }
  ]
}
```

## API Endpoints

### Job Status
```bash
GET /api/v1/jobs/status
```
Returns the status of all background jobs.

### Manual Discovery Trigger
```bash
POST /api/v1/jobs/discovery/trigger
```
Manually triggers the discovery job.

### Manual Processor Trigger
```bash
POST /api/v1/jobs/processor/trigger
```
Manually triggers the processor job.

## Environment Variables

- `NODE_ENV`: Determines job intervals (production vs development)
- `DYNAMODB_TABLE`: DynamoDB table name (default: 'job_descriptions')
- `PORT`: API server port (default: 3000)
- `API_KEY`: API key for internal calls (default: 'dev-key')

## File Structure

```
jobs/
├── index.js          # Job manager (coordinates both jobs)
├── discovery.js      # Discovery job implementation
├── processor.js      # Processor job implementation
└── README.md         # This file

config/
└── discovery_inputs.json  # Discovery configuration
```

## Usage

The jobs are automatically started when the Express server starts. The JobManager handles:

1. **Starting jobs** with appropriate schedules
2. **Graceful shutdown** when the server stops
3. **Manual triggers** via API endpoints
4. **Status monitoring** and logging

## Logging

All jobs use the centralized logger and include:
- Timestamp for each job trigger
- Detailed progress logging
- Error handling and reporting
- Performance metrics (duration, success rates)

## Error Handling

- Jobs are designed to fail gracefully
- Concurrent job execution is prevented
- Errors are logged but don't stop the job system
- Manual triggers are available for recovery

## Development vs Production

- **Development**: Jobs run every 1 minute for faster testing
- **Production**: Discovery runs every 15 minutes, processor every 1 minute
- Environment is determined by `NODE_ENV` variable 