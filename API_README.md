# Job Application API

A RESTful API for automated job applications using LangGraph and Stagehand.

## 🚀 Quick Start

### 1. Start the API Server

```bash
# Install dependencies
npm install

# Start the API server
npm run api

# Or start in development mode with auto-reload
npm run api:dev
```

The server will start on `http://localhost:3000`

### 2. Test the API

```bash
# Run the test suite
npm run test:api
```

## 📋 API Endpoints

### Health Check
```bash
GET /health
```
Returns server health status (no authentication required).

### Job Application Endpoints

All endpoints require API key authentication via `X-API-Key` header.

#### Single Job Application
```bash
POST /api/v1/job-application/single
```

**Request Body:**
```json
{
  "jobUrl": "https://linkedin.com/jobs/view/123456789",
  "candidateData": {
    "personal": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567"
    },
    "experience": [...],
    "education": [...],
    "skills": ["JavaScript", "React", "Node.js"],
    "resume": {
      "path": "./data/resume.pdf"
    }
  },
  "jobDescription": {
    "title": "Software Engineer",
    "company": "Tech Corp",
    "description": "Job description..."
  }
}
```

#### Batch Job Applications
```bash
POST /api/v1/job-application/batch
```

**Request Body:**
```json
{
  "jobUrls": [
    "https://linkedin.com/jobs/view/123456789",
    "https://linkedin.com/jobs/view/987654321"
  ],
  "candidateData": {
    // Same structure as single application
  }
}
```

#### Get Example Candidate Data
```bash
GET /api/v1/job-application/example-candidate
```

Returns a complete example of candidate data structure.

#### Validate Candidate Data
```bash
POST /api/v1/job-application/validate-candidate
```

Validates candidate data without applying to jobs.

#### API Documentation
```bash
GET /api/v1/job-application/docs
```

Returns API documentation and examples.

## 🔐 Authentication

All API endpoints (except health check) require an API key:

```bash
# Set the API key in headers
X-API-Key: your-api-key

# Or use Authorization header
Authorization: Bearer your-api-key
```

## 📝 Usage Examples

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Get example candidate data
curl -H "X-API-Key: test-api-key" \
  http://localhost:3000/api/v1/job-application/example-candidate

# Apply to a single job
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key" \
  -d '{
    "jobUrl": "https://linkedin.com/jobs/view/123456789",
    "candidateData": {
      "personal": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1-555-123-4567"
      },
      "skills": ["JavaScript", "React", "Node.js"]
    }
  }' \
  http://localhost:3000/api/v1/job-application/single
```

### Using JavaScript/Fetch

```javascript
const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'your-api-key';

// Apply to a single job
async function applyToJob(jobUrl, candidateData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/job-application/single`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      jobUrl,
      candidateData
    })
  });

  return response.json();
}

// Example usage
const candidateData = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1-555-123-4567"
  },
  skills: ["JavaScript", "React", "Node.js"]
};

const result = await applyToJob(
  'https://linkedin.com/jobs/view/123456789',
  candidateData
);

console.log(result);
```

### Using Python/Requests

```python
import requests
import json

API_BASE_URL = 'http://localhost:3000'
API_KEY = 'your-api-key'

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
}

# Apply to a single job
def apply_to_job(job_url, candidate_data):
    payload = {
        'jobUrl': job_url,
        'candidateData': candidate_data
    }
    
    response = requests.post(
        f'{API_BASE_URL}/api/v1/job-application/single',
        headers=headers,
        json=payload
    )
    
    return response.json()

# Example usage
candidate_data = {
    'personal': {
        'firstName': 'John',
        'lastName': 'Doe',
        'email': 'john.doe@example.com',
        'phone': '+1-555-123-4567'
    },
    'skills': ['JavaScript', 'React', 'Node.js']
}

result = apply_to_job(
    'https://linkedin.com/jobs/view/123456789',
    candidate_data
)

print(result)
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# API Keys (Required)
OPENAI_API_KEY=your_openai_api_key
BROWSERBASE_API_KEY=your_browserbase_api_key

# API Server Configuration
PORT=3000
NODE_ENV=development
VALID_API_KEYS=test-api-key,your-production-api-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Application Settings
MAX_CONCURRENT_APPLICATIONS=1
DELAY_BETWEEN_APPLICATIONS=2000
```

### API Key Management

For production, you should:

1. Use strong, unique API keys
2. Store them securely (not in version control)
3. Rotate them regularly
4. Use different keys for different environments

## 📊 Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2025-06-29T03:12:42.082Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "code": "error_code"
    }
  ],
  "timestamp": "2025-06-29T03:12:42.082Z"
}
```

## 🚨 Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing or invalid API key
- **429 Too Many Requests**: Rate limiting
- **500 Internal Server Error**: Server errors

## 🔍 Monitoring

### Health Checks

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed
```

### Logging

The API logs all requests and responses. Check the console output or log files for debugging.

## 🚀 Deployment

### Local Development
```bash
npm run api:dev
```

### Production
```bash
npm run api
```

### Docker (Future)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "run", "api"]
```

## 🔄 Migration to Lambda

The API is designed to be easily migrated to AWS Lambda:

1. **Stateless Design**: No persistent state between requests
2. **Modular Structure**: Easy to extract individual functions
3. **Environment Variables**: Already configured for serverless
4. **Error Handling**: Comprehensive error responses

### Lambda Migration Steps:

1. Extract route handlers into separate Lambda functions
2. Use API Gateway for routing
3. Configure environment variables in Lambda
4. Update CORS settings for API Gateway
5. Deploy using AWS SAM or Serverless Framework

## 📚 Additional Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Stagehand Documentation](https://docs.browserbase.com/stagehand)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 