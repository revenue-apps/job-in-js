# Candidate Data Guide

## Overview

The job application workflow is designed to be **stateless** and **reusable**. Candidate data is provided as JSON input to the workflow, not stored in environment variables. This approach allows:

- **Multiple candidates**: Use the same workflow with different candidate data
- **Stateless operation**: No persistent state between runs
- **Security**: Sensitive candidate data is not stored in environment files
- **Flexibility**: Easy to modify candidate data without changing configuration

## Environment Variables vs. Candidate Data

### ❌ Don't Store in Environment Variables

```bash
# WRONG - Don't do this
CANDIDATE_FIRST_NAME=John
CANDIDATE_LAST_NAME=Doe
CANDIDATE_EMAIL=john.doe@example.com
CANDIDATE_PHONE=+1234567890
```

### ✅ Provide as JSON Input

```javascript
// CORRECT - Do this
const candidateData = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1-555-123-4567",
  },
  // ... rest of candidate data
};

const result = await applyToJob(jobUrl, candidateData);
```

## Required Environment Variables

Only system configuration should be in environment variables:

```bash
# API Keys (Required)
OPENAI_API_KEY=your_openai_api_key_here
BROWSERBASE_API_KEY=your_browserbase_api_key_here

# Application Settings
LOG_LEVEL=info
MAX_CONCURRENT_APPLICATIONS=1
DELAY_BETWEEN_APPLICATIONS=2000

# File Paths
OUTPUT_DIR=./output
DATA_DIR=./data
```

## Candidate Data Structure

### Complete Example

```javascript
const candidateData = {
  personal: {
    firstName: "John",           // Required
    lastName: "Doe",             // Required
    email: "john.doe@example.com", // Required
    phone: "+1-555-123-4567",    // Required
    location: "San Francisco, CA",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    zipCode: "94105",
    address: "123 Main St, San Francisco, CA 94105",
    linkedin: "https://linkedin.com/in/johndoe",
    portfolio: "https://johndoe.dev",
    github: "https://github.com/johndoe",
    website: "https://johndoe.com",
  },
  experience: [
    {
      title: "Senior Software Engineer",
      company: "Tech Corp",
      startDate: "2022-01-01",
      endDate: null, // null for current position
      description: "Led development of scalable web applications",
      achievements: [
        "Reduced application load time by 40%",
        "Mentored 5 junior developers",
        "Implemented CI/CD pipeline"
      ],
      skills: ["JavaScript", "React", "Node.js", "AWS"]
    }
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of California, Berkeley",
      field: "Computer Science",
      startDate: "2016-09-01",
      endDate: "2020-05-15",
      gpa: 3.8,
      honors: ["Dean's List", "Computer Science Honor Society"]
    }
  ],
  skills: [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Django",
    "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git"
  ],
  resume: {
    path: "./data/resume.pdf", // Path to resume file
    filename: "john_doe_resume.pdf"
  },
  coverLetter: {
    autoGenerate: true, // Let the system generate cover letter
    content: null // Will be auto-generated based on job description
  },
  customFields: {
    "years-of-experience": "3",
    "preferred-location": "Remote",
    "salary-expectation": "$120,000 - $150,000"
  }
};
```

### Minimal Required Data

```javascript
const minimalCandidateData = {
  personal: {
    firstName: "John",           // Required
    lastName: "Doe",             // Required
    email: "john.doe@example.com", // Required
    phone: "+1-555-123-4567",    // Required
  },
  skills: ["JavaScript", "React", "Node.js"], // Recommended
  resume: {
    path: "./data/resume.pdf" // Recommended
  }
};
```

## Usage Examples

### Single Job Application

```javascript
import { applyToJob } from './src/workflows/job-application/index.js';

const jobUrl = "https://linkedin.com/jobs/view/123456789";
const candidateData = {
  // ... your candidate data
};

const result = await applyToJob(jobUrl, candidateData);
console.log('Status:', result.status);
```

### Batch Applications

```javascript
import { applyToMultipleJobs } from './src/workflows/job-application/index.js';

const jobUrls = [
  "https://linkedin.com/jobs/view/123456789",
  "https://linkedin.com/jobs/view/987654321",
];

const candidateData = {
  // ... your candidate data
};

const results = await applyToMultipleJobs(jobUrls, candidateData);
console.log('Success rate:', results.summary.successRate);
```

### Multiple Candidates

```javascript
const candidates = [
  {
    personal: { firstName: "John", lastName: "Doe", email: "john@example.com", phone: "+1234567890" },
    // ... rest of John's data
  },
  {
    personal: { firstName: "Jane", lastName: "Smith", email: "jane@example.com", phone: "+0987654321" },
    // ... rest of Jane's data
  }
];

const jobUrl = "https://linkedin.com/jobs/view/123456789";

for (const candidateData of candidates) {
  const result = await applyToJob(jobUrl, candidateData);
  console.log(`${candidateData.personal.firstName} application:`, result.status);
}
```

## Data Sources

You can load candidate data from various sources:

### From JSON File

```javascript
import { readFileSync } from 'fs';

const candidateData = JSON.parse(
  readFileSync('./data/candidate-profile.json', 'utf8')
);
```

### From Database

```javascript
// Example with a database query
const candidateData = await db.query(
  'SELECT * FROM candidates WHERE id = ?',
  [candidateId]
);
```

### From API

```javascript
// Example with API call
const response = await fetch('/api/candidates/123');
const candidateData = await response.json();
```

### From Form Input

```javascript
// Example with web form data
const formData = new FormData(form);
const candidateData = {
  personal: {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
  },
  // ... rest of data
};
```

## Validation

The workflow validates candidate data using Zod schemas:

```javascript
import { candidateProfileSchema } from './src/shared/types/schemas.js';

try {
  const validatedData = candidateProfileSchema.parse(candidateData);
  const result = await applyToJob(jobUrl, validatedData);
} catch (error) {
  console.error('Invalid candidate data:', error.errors);
}
```

## Security Considerations

- **Never commit candidate data** to version control
- **Use environment variables** only for system configuration
- **Validate input data** before processing
- **Encrypt sensitive data** in transit and at rest
- **Log minimal candidate information** (avoid logging full data)

## Best Practices

1. **Keep candidate data separate** from system configuration
2. **Use consistent data structure** across all candidates
3. **Validate data** before passing to workflow
4. **Handle missing data gracefully** with defaults
5. **Test with sample data** before using real candidate information
6. **Document your data structure** for team members

## Troubleshooting

### Common Issues

1. **Missing required fields**: Ensure firstName, lastName, email, and phone are provided
2. **Invalid email format**: Use valid email addresses
3. **File not found**: Ensure resume path is correct and file exists
4. **Invalid date format**: Use ISO date strings (YYYY-MM-DD)

### Debug Mode

Enable debug logging to see detailed workflow execution:

```bash
LOG_LEVEL=debug node your-application.js
```

This will show the candidate data being processed and any validation errors. 