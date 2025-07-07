# Postman Collection for Job Application API

This directory contains a comprehensive Postman collection for testing the Job Application API endpoints.

## Files

- `Job-Application-API.postman_collection.json` - The main Postman collection file

## How to Import

### Method 1: Import via Postman App
1. Open Postman
2. Click "Import" button
3. Select "File" tab
4. Choose the `Job-Application-API.postman_collection.json` file
5. Click "Import"

### Method 2: Import via Postman Web
1. Go to [postman.com](https://postman.com)
2. Click "Import" button
3. Drag and drop the `Job-Application-API.postman_collection.json` file
4. Click "Import"

## Collection Overview

The collection includes the following request groups:

### 1. Health Check
- **Basic Health Check** - Simple health endpoint (no auth required)
- **Detailed Health Check** - Detailed health information

### 2. Job Application
- **Get Example Candidate Data** - Get sample candidate data structure
- **Validate Candidate Data** - Validate candidate data without applying
- **Single Job Application** - Apply to a single job
- **Batch Job Applications** - Apply to multiple jobs
- **Get API Documentation** - Retrieve API documentation

### 3. Error Testing
- **Test Without API Key** - Test authentication (should return 401)
- **Test Invalid API Key** - Test with invalid API key
- **Test Invalid Candidate Data** - Test validation errors
- **Test Invalid Job URL** - Test URL validation
- **Test Missing Required Fields** - Test required field validation

### 4. Examples
- **Minimal Candidate Data** - Example with minimal required fields
- **Complete Candidate Data** - Example with all optional fields

## Environment Variables

The collection uses the following environment variables:

- `baseUrl` - API base URL (default: `http://localhost:3000`)
- `apiKey` - Your API key (default: `test-api-key`)

### Setting Up Environment Variables

1. In Postman, click on the collection name
2. Go to the "Variables" tab
3. Update the values:
   - Set `baseUrl` to your API server URL
   - Set `apiKey` to your actual API key

### Using Different Environments

You can create different environments for different stages:

#### Development Environment
```
baseUrl: http://localhost:3000
apiKey: dev-api-key
```

#### Staging Environment
```
baseUrl: https://staging-api.yourdomain.com
apiKey: staging-api-key
```

#### Production Environment
```
baseUrl: https://api.yourdomain.com
apiKey: prod-api-key
```

## Authentication

The collection uses API key authentication via the `X-API-Key` header. The API key is automatically included in all requests that require authentication.

## Testing Workflow

### 1. Start with Health Check
First, test the health endpoint to ensure the API is running:
```
GET {{baseUrl}}/health
```

### 2. Get Example Data
Retrieve the example candidate data structure:
```
GET {{baseUrl}}/api/v1/job-application/example-candidate
```

### 3. Validate Your Data
Test your candidate data structure:
```
POST {{baseUrl}}/api/v1/job-application/validate-candidate
```

### 4. Test Single Application
Apply to a single job:
```
POST {{baseUrl}}/api/v1/job-application/single
```

### 5. Test Batch Applications
Apply to multiple jobs:
```
POST {{baseUrl}}/api/v1/job-application/batch
```

## Request Examples

### Single Job Application
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
    "skills": ["JavaScript", "React", "Node.js"]
  }
}
```

### Batch Job Applications
```json
{
  "jobUrls": [
    "https://linkedin.com/jobs/view/123456789",
    "https://linkedin.com/jobs/view/987654321"
  ],
  "candidateData": {
    "personal": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567"
    },
    "skills": ["JavaScript", "React", "Node.js"]
  }
}
```

## Response Validation

The collection includes automatic response validation scripts that:
- Check for successful status codes (200, 201)
- Validate response structure
- Log responses for debugging

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check that your API key is correct
   - Ensure the API key is set in the collection variables

2. **400 Bad Request**
   - Validate your request body structure
   - Check required fields are present
   - Ensure data types are correct

3. **Connection Errors**
   - Verify the API server is running
   - Check the `baseUrl` variable is correct
   - Ensure network connectivity

### Debug Tips

1. **Check Response Headers**
   - Look for error details in response headers
   - Check for rate limiting headers

2. **Use Console Logs**
   - Open browser developer tools
   - Check the console for detailed error messages

3. **Test with Minimal Data**
   - Start with the minimal candidate data example
   - Gradually add more fields

## API Documentation

For detailed API documentation, use the "Get API Documentation" request:
```
GET {{baseUrl}}/api/v1/job-application/docs
```

This will return comprehensive documentation including:
- Endpoint descriptions
- Request/response schemas
- Example requests
- Error codes and messages

## Support

If you encounter issues:
1. Check the API documentation endpoint
2. Review the error testing examples
3. Verify your environment variables
4. Ensure the API server is running and accessible 