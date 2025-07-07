# Job-in-JS: Automated Job Application System

A LangGraph JS project for automated job applications using Stagehand and AI-powered form filling.

## 🚀 Features

- **Intelligent Job Classification**: Automatically detects application type (easy apply, form submission, resume upload, OAuth required)
- **Smart Form Filling**: Uses AI to fill application forms with candidate data
- **Resume Upload Support**: Handles file uploads and document processing
- **Cover Letter Generation**: AI-generated personalized cover letters
- **Error Handling**: Comprehensive error categorization and suggestions
- **Batch Processing**: Apply to multiple jobs with rate limiting
- **Detailed Output**: JSON output with application confirmations and tracking

## 🏗️ Architecture

```
Job URL → Job Classifier → Application Router → 
[Easy Apply | Form Submission | Resume Upload | Error Handler] → 
Confirmation Handler → Output Generator
```

### Core Components

- **Enhanced Stagehand Client**: Handles browser automation and AI extraction
- **Candidate Profile Manager**: Manages candidate data and generates application materials
- **LangGraph Workflow**: Orchestrates the application process
- **Application Nodes**: Specialized handlers for different application types
- **Error Handler**: Categorizes and provides solutions for application errors

## 📋 Prerequisites

- Node.js 18+
- OpenAI API key
- Browserbase API key
- Valid candidate data

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd job-in-js
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys and settings
   ```

4. **Prepare candidate data**
   ```bash
   # Edit data/sample_candidate.json with your information
   ```

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key
BROWSERBASE_API_KEY=your_browserbase_api_key

# Optional
STAGEHAND_ENV=production
STAGEHAND_MODEL_NAME=gpt-4o-mini
MAX_CONCURRENT_APPLICATIONS=1
DELAY_BETWEEN_APPLICATIONS=2000
```

### Candidate Data Format

```json
{
  "personal": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "location": "San Francisco, CA"
  },
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "TechCorp Inc",
      "startDate": "2022-01-01",
      "endDate": null,
      "achievements": ["Reduced load time by 40%"]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of California, Berkeley",
      "endDate": "2019-05-31"
    }
  ],
  "skills": ["JavaScript", "React", "Node.js"],
  "resume": "/path/to/resume.pdf"
}
```

## 🚀 Usage

### Single Job Application

```javascript
import { applyToJob } from './src/applicationWorkflow.js';
import candidateData from './data/sample_candidate.json';

const result = await applyToJob(
  'https://www.linkedin.com/jobs/view/software-engineer',
  candidateData,
  {
    title: 'Software Engineer',
    company: 'Tech Company',
    description: 'Job description...'
  }
);

console.log('Application result:', result);
```

### Batch Job Applications

```javascript
import { applyToMultipleJobs } from './src/applicationWorkflow.js';

const jobUrls = [
  'https://linkedin.com/jobs/view/job1',
  'https://linkedin.com/jobs/view/job2'
];

const result = await applyToMultipleJobs(jobUrls, candidateData);
console.log('Batch results:', result.summary);
```

### Running Tests

```bash
# Test single application
npm run test:application

# Test original job scraping
npm run test
```

## 📊 Output Format

### Successful Application

```json
{
  "status": "success",
  "jobUrl": "https://linkedin.com/jobs/view/123",
  "candidateInfo": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "application": {
    "id": "APP123456",
    "type": "easy_apply",
    "message": "Application submitted successfully",
    "nextSteps": "We'll review your application within 48 hours",
    "trackingNumber": "TRK789",
    "recruiterEmail": "recruiter@company.com"
  },
  "classification": {
    "applicationType": "easy_apply",
    "confidence": 0.95,
    "platform": "linkedin"
  },
  "submittedAt": "2024-01-15T10:30:00Z"
}
```

### Error Output

```json
{
  "status": "error",
  "jobUrl": "https://linkedin.com/jobs/view/123",
  "error": {
    "type": "oauth_required",
    "message": "This job requires OAuth authentication",
    "code": "OAUTH_REQUIRED",
    "suggestions": [
      "Consider using a browser extension for OAuth",
      "Manual application may be required"
    ]
  }
}
```

## 🔍 Job Classification Types

- **easy_apply**: LinkedIn/Indeed quick apply buttons
- **form_submission**: Traditional application forms
- **resume_upload**: File upload applications
- **oauth_required**: Requires login/authentication
- **external_redirect**: Redirects to external site
- **unknown**: Cannot determine application type

## 🛡️ Error Handling

The system categorizes errors and provides actionable suggestions:

- **Authentication Errors**: OAuth/login requirements
- **Form Errors**: Missing fields or validation issues
- **File Upload Errors**: Resume upload problems
- **Timeout Errors**: Network or processing delays
- **External Site Errors**: Redirects to external applications

## 📁 Project Structure

```
job-in-js/
├── src/
│   ├── applicationWorkflow.js    # Main workflow orchestration
│   ├── utils/
│   │   ├── enhancedStagehand.js  # Enhanced Stagehand client
│   │   ├── candidateProfile.js   # Candidate data management
│   │   └── logger.js             # Logging utilities
│   ├── nodes/
│   │   ├── jobClassifier.js      # Job type classification
│   │   ├── applicationRouter.js  # Application routing
│   │   ├── easyApplyNode.js      # Easy apply handler
│   │   ├── formSubmissionNode.js # Form submission handler
│   │   ├── resumeUploadNode.js   # Resume upload handler
│   │   ├── confirmationHandler.js # Confirmation processing
│   │   ├── errorHandler.js       # Error categorization
│   │   └── outputGenerator.js    # Output generation
│   └── config/
│       └── environment.js        # Configuration management
├── data/
│   ├── sample_candidate.json     # Sample candidate data
│   └── job_urls.csv             # Job URLs for batch processing
├── output/                      # Application results
└── logs/                        # Application logs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This tool is for educational and personal use. Please ensure compliance with:
- Job site terms of service
- Rate limiting policies
- Data privacy regulations
- Company application policies

Use responsibly and ethically.

# Job Application Workflow

A LangGraph-based automated job application system using Stagehand for browser automation.

## Features

- **Stateless Workflow**: Candidate data is provided as JSON input, not stored in environment variables
- **Modular Design**: Separate nodes for job classification, application routing, and execution
- **Multiple Application Types**: Handles easy apply, form submission, and resume upload scenarios
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Batch Processing**: Apply to multiple jobs with configurable delays

## Environment Setup

Copy the environment example and configure your API keys:

```bash
cp env.example .env
```

### Required Environment Variables

```bash
# API Keys (Required)
OPENAI_API_KEY=your_openai_api_key_here
BROWSERBASE_API_KEY=your_browserbase_api_key_here

# Application Settings
LOG_LEVEL=info
MAX_CONCURRENT_APPLICATIONS=1
DELAY_BETWEEN_APPLICATIONS=2000
```

## Usage

### 1. Single Job Application

The workflow is stateless and receives candidate data as JSON input:

```javascript
import { applyToJob } from './src/workflows/job-application/index.js';

const candidateData = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1-555-123-4567",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/johndoe",
  },
  experience: [
    {
      title: "Senior Software Engineer",
      company: "Tech Corp",
      startDate: "2022-01-01",
      endDate: null, // Current position
      description: "Led development of scalable web applications",
      achievements: ["Reduced application load time by 40%"],
      skills: ["JavaScript", "React", "Node.js", "AWS"]
    }
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of California, Berkeley",
      startDate: "2016-09-01",
      endDate: "2020-05-15",
      gpa: 3.8
    }
  ],
  skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python"],
  resume: {
    path: "./data/resume.pdf",
    filename: "john_doe_resume.pdf"
  },
  coverLetter: {
    autoGenerate: true
  }
};

const jobUrl = "https://linkedin.com/jobs/view/123456789";

try {
  const result = await applyToJob(jobUrl, candidateData);
  console.log('Application Result:', {
    status: result.status,
    applicationId: result.confirmationDetails?.applicationId,
  });
} catch (error) {
  console.error('Application failed:', error.message);
}
```

### 2. Batch Job Applications

Apply to multiple jobs with the same candidate data:

```javascript
import { applyToMultipleJobs } from './src/workflows/job-application/index.js';

const jobUrls = [
  "https://linkedin.com/jobs/view/123456789",
  "https://linkedin.com/jobs/view/987654321",
  "https://linkedin.com/jobs/view/456789123",
];

const candidateData = {
  // ... same candidate data structure as above
};

try {
  const results = await applyToMultipleJobs(jobUrls, candidateData);
  
  console.log('Batch Results:', {
    total: results.summary.total,
    successful: results.summary.successful,
    failed: results.summary.failed,
    successRate: `${results.summary.successRate.toFixed(1)}%`,
  });
} catch (error) {
  console.error('Batch application failed:', error.message);
}
```

### 3. With Job Description and Custom Settings

```javascript
const jobDescription = {
  title: "Senior Software Engineer",
  company: "Tech Innovations Inc",
  description: "We are seeking a senior software engineer...",
  requirements: [
    "5+ years of experience with JavaScript and React",
    "Experience with backend development and APIs"
  ],
  location: "San Francisco, CA",
  salary: "$140,000 - $180,000",
  type: "full-time"
};

const applicationSettings = {
  autoGenerateCoverLetter: true,
  customizeApplications: true,
  skipJobsWithLoginRequired: false,
  maxRetries: 5,
  timeout: 90000
};

const result = await applyToJob(jobUrl, candidateData, jobDescription);
```

## Candidate Data Schema

The workflow expects candidate data in this structure:

```javascript
{
  personal: {
    firstName: string,        // Required
    lastName: string,         // Required
    email: string,           // Required (valid email)
    phone: string,           // Required (min 10 chars)
    location?: string,
    city?: string,
    state?: string,
    country?: string,
    zipCode?: string,
    address?: string,
    linkedin?: string,       // URL
    portfolio?: string,      // URL
    github?: string,         // URL
    website?: string,        // URL
  },
  experience: [{
    title: string,
    company: string,
    startDate: string,       // ISO date
    endDate?: string,        // null for current position
    description?: string,
    achievements?: string[],
    skills?: string[],
  }],
  education: [{
    degree: string,
    institution: string,
    field?: string,
    startDate: string,       // ISO date
    endDate: string,         // ISO date
    gpa?: number,           // 0-4 scale
    honors?: string[],
  }],
  skills: string[],
  resume?: {
    path?: string,          // File path
    content?: string,       // Base64 encoded
    filename?: string,
  },
  coverLetter?: {
    path?: string,          // File path
    content?: string,       // Cover letter text
    autoGenerate?: boolean, // Default: true
  },
  customFields?: Record<string, any>, // Additional form fields
}
```

## Workflow Architecture

The job application workflow consists of these nodes:

1. **Job Classifier**: Analyzes job posting and determines application type
2. **Application Router**: Routes to appropriate application handler
3. **Easy Apply Handler**: Handles LinkedIn-style one-click applications
4. **Form Submission Handler**: Fills and submits complex application forms
5. **Resume Upload Handler**: Handles file upload requirements
6. **Confirmation Handler**: Processes application confirmations
7. **Error Handler**: Manages errors and retries
8. **Output Generator**: Creates application reports and logs

## Examples

See `examples/job-application-example.js` for complete usage examples including:
- Single job application
- Batch applications
- Custom candidate data
- Advanced settings

## Installation

```bash
npm install
```

## Running Examples

```bash
# Run job application examples
node examples/job-application-example.js

# Run job scraping workflow
node src/entry-points/jobScraper.js

# Run job application workflow
node src/entry-points/jobApplicator.js
```

## Configuration

The workflow uses environment variables for system configuration only. All candidate-specific data is provided as JSON input, making the workflow stateless and reusable across different candidates.

## Error Handling

The workflow includes comprehensive error handling:
- Network timeouts and retries
- Form validation errors
- Login requirement detection
- Rate limiting protection
- Application failure recovery

## Output

Applications generate detailed output including:
- Application status and confirmation details
- Error information with suggestions
- Screenshots and HTML snapshots (optional)
- Application reports and logs 