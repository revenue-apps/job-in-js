import { applyToJob, applyToMultipleJobs } from '../src/workflows/job-application/index.js';
import { exampleCandidateData, exampleJobApplicationInput } from '../src/shared/types/schemas.js';
import { logger } from '../src/shared/utils/logger.js';

// Example 1: Single job application
async function singleJobApplicationExample() {
  console.log('=== Single Job Application Example ===');
  
  const jobUrl = 'https://linkedin.com/jobs/view/123456789';
  
  // Use the example candidate data or provide your own
  const candidateData = {
    ...exampleCandidateData,
    // Override with your actual data
    personal: {
      ...exampleCandidateData.personal,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-987-6543',
    }
  };
  
  try {
    const result = await applyToJob(jobUrl, candidateData);
    
    console.log('Application Result:', {
      status: result.status,
      applicationId: result.confirmationDetails?.applicationId,
      error: result.errorDetails?.errorMessage,
    });
    
    return result;
  } catch (error) {
    console.error('Application failed:', error.message);
    throw error;
  }
}

// Example 2: Batch job applications
async function batchJobApplicationExample() {
  console.log('=== Batch Job Application Example ===');
  
  const jobUrls = [
    'https://linkedin.com/jobs/view/123456789',
    'https://linkedin.com/jobs/view/987654321',
    'https://linkedin.com/jobs/view/456789123',
  ];
  
  // Use the example candidate data
  const candidateData = exampleCandidateData;
  
  try {
    const results = await applyToMultipleJobs(jobUrls, candidateData);
    
    console.log('Batch Application Results:', {
      total: results.summary.total,
      successful: results.summary.successful,
      failed: results.summary.failed,
      successRate: `${results.summary.successRate.toFixed(1)}%`,
    });
    
    // Log individual results
    results.results.forEach((result, index) => {
      console.log(`Job ${index + 1}:`, {
        url: result.jobUrl,
        status: result.status,
        applicationId: result.confirmationDetails?.applicationId,
      });
    });
    
    return results;
  } catch (error) {
    console.error('Batch application failed:', error.message);
    throw error;
  }
}

// Example 3: Custom candidate data
async function customCandidateExample() {
  console.log('=== Custom Candidate Data Example ===');
  
  const customCandidateData = {
    personal: {
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@example.com',
      phone: '+1-555-111-2222',
      location: 'New York, NY',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      linkedin: 'https://linkedin.com/in/alexjohnson',
      github: 'https://github.com/alexjohnson',
    },
    experience: [
      {
        title: 'Full Stack Developer',
        company: 'Innovation Labs',
        startDate: '2021-03-01',
        endDate: null, // Current position
        description: 'Developed and maintained web applications using modern technologies',
        achievements: [
          'Led migration from monolithic to microservices architecture',
          'Improved application performance by 60%',
          'Implemented automated testing pipeline'
        ],
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS']
      }
    ],
    education: [
      {
        degree: 'Master of Science in Computer Science',
        institution: 'New York University',
        field: 'Computer Science',
        startDate: '2019-09-01',
        endDate: '2021-05-15',
        gpa: 3.9
      }
    ],
    skills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'MongoDB',
      'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST APIs'
    ],
    resume: {
      path: './data/alex_johnson_resume.pdf',
      filename: 'alex_johnson_resume.pdf'
    },
    coverLetter: {
      autoGenerate: true
    },
    customFields: {
      'years-of-experience': '2',
      'preferred-location': 'New York or Remote',
      'salary-expectation': '$100,000 - $130,000'
    }
  };
  
  const jobUrl = 'https://linkedin.com/jobs/view/555666777';
  
  try {
    const result = await applyToJob(jobUrl, customCandidateData);
    
    console.log('Custom Application Result:', {
      status: result.status,
      applicationId: result.confirmationDetails?.applicationId,
      error: result.errorDetails?.errorMessage,
    });
    
    return result;
  } catch (error) {
    console.error('Custom application failed:', error.message);
    throw error;
  }
}

// Example 4: With job description and custom settings
async function advancedApplicationExample() {
  console.log('=== Advanced Application Example ===');
  
  const jobUrl = 'https://linkedin.com/jobs/view/888999000';
  const candidateData = exampleCandidateData;
  
  const jobDescription = {
    title: 'Senior Software Engineer',
    company: 'Tech Innovations Inc',
    description: 'We are seeking a senior software engineer to join our growing team...',
    requirements: [
      '5+ years of experience with JavaScript and React',
      'Experience with backend development and APIs',
      'Knowledge of cloud platforms and DevOps practices'
    ],
    location: 'San Francisco, CA',
    salary: '$140,000 - $180,000',
    type: 'full-time'
  };
  
  const applicationSettings = {
    autoGenerateCoverLetter: true,
    customizeApplications: true,
    skipJobsWithLoginRequired: false, // Try to handle login if needed
    maxRetries: 5,
    timeout: 90000 // 90 seconds
  };
  
  try {
    const result = await applyToJob(jobUrl, candidateData, jobDescription);
    
    console.log('Advanced Application Result:', {
      status: result.status,
      applicationId: result.confirmationDetails?.applicationId,
      confirmationMessage: result.confirmationDetails?.confirmationMessage,
      error: result.errorDetails?.errorMessage,
    });
    
    return result;
  } catch (error) {
    console.error('Advanced application failed:', error.message);
    throw error;
  }
}

// Main function to run examples
async function runExamples() {
  try {
    // Run single application example
    await singleJobApplicationExample();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Run custom candidate example
    await customCandidateExample();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Run advanced application example
    await advancedApplicationExample();
    
    // Uncomment to run batch example (be careful with rate limiting)
    // await batchJobApplicationExample();
    
  } catch (error) {
    console.error('Example execution failed:', error.message);
  }
}

// Export functions for individual testing
export {
  singleJobApplicationExample,
  batchJobApplicationExample,
  customCandidateExample,
  advancedApplicationExample,
  runExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
} 