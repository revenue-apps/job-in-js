import { applyToJob, applyToMultipleJobs } from './applicationWorkflow.js';
import { readFileSync } from 'fs';
import { logger } from './utils/logger.js';
import { exampleCandidateData } from './shared/types/schemas.js';

// Sample job URLs for testing
const sampleJobUrls = [
  'https://www.linkedin.com/jobs/view/software-engineer-at-google',
  'https://jobs.lever.co/company/senior-developer',
  'https://boards.greenhouse.io/company/jobs/12345',
];

// Sample job descriptions
const sampleJobDescriptions = [
  {
    title: 'Senior Software Engineer',
    company: 'Google',
    location: 'Mountain View, CA',
    description: 'We are looking for a Senior Software Engineer to join our team...',
    requirements: ['JavaScript', 'Python', 'AWS', '5+ years experience'],
  },
  {
    title: 'Senior Developer',
    company: 'Tech Startup',
    location: 'San Francisco, CA',
    description: 'Join our fast-growing startup as a Senior Developer...',
    requirements: ['React', 'Node.js', 'PostgreSQL', '3+ years experience'],
  },
  {
    title: 'Software Engineer',
    company: 'Enterprise Corp',
    location: 'Remote',
    description: 'We are seeking a Software Engineer to build scalable applications...',
    requirements: ['Java', 'Spring', 'Microservices', '2+ years experience'],
  },
];

// Test candidate data - this would normally come from your application
const testCandidateData = {
  ...exampleCandidateData,
  personal: {
    ...exampleCandidateData.personal,
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    phone: '+1-555-999-8888',
  }
};

// Test job URL (replace with a real job URL for testing)
const testJobUrl = 'https://linkedin.com/jobs/view/123456789';

async function testSingleApplication() {
  logger.info('Testing single job application');
  
  try {
    // Load sample candidate data
    const candidateData = JSON.parse(
      readFileSync('./data/sample_candidate.json', 'utf8')
    );
    
    // Test with first job
    const jobUrl = sampleJobUrls[0];
    const jobDescription = sampleJobDescriptions[0];
    
    logger.info('Starting single application test', { jobUrl });
    
    const result = await applyToJob(jobUrl, candidateData, jobDescription);
    
    logger.info('Single application test completed', {
      status: result.status,
      applicationId: result.confirmationDetails?.applicationId,
      error: result.errorDetails?.errorMessage,
      outputPath: result.outputPath,
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in single application test', { error: error.message });
    throw error;
  }
}

async function testBatchApplication() {
  logger.info('Testing batch job application');
  
  try {
    // Load sample candidate data
    const candidateData = JSON.parse(
      readFileSync('./data/sample_candidate.json', 'utf8')
    );
    
    logger.info('Starting batch application test', { jobCount: sampleJobUrls.length });
    
    const result = await applyToMultipleJobs(sampleJobUrls, candidateData, sampleJobDescriptions);
    
    logger.info('Batch application test completed', {
      total: result.summary.total,
      successful: result.summary.successful,
      failed: result.summary.failed,
      successRate: result.summary.successRate,
    });
    
    // Log individual results
    result.results.forEach((appResult, index) => {
      logger.info(`Job ${index + 1} result`, {
        jobUrl: sampleJobUrls[index],
        status: appResult.status,
        applicationId: appResult.confirmationDetails?.applicationId,
        error: appResult.errorDetails?.errorMessage,
      });
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in batch application test', { error: error.message });
    throw error;
  }
}

async function testErrorHandling() {
  logger.info('Testing error handling');
  
  try {
    // Load sample candidate data
    const candidateData = JSON.parse(
      readFileSync('./data/sample_candidate.json', 'utf8')
    );
    
    // Test with invalid URL
    const invalidJobUrl = 'https://invalid-job-url.com/job/123';
    
    logger.info('Starting error handling test', { jobUrl: invalidJobUrl });
    
    const result = await applyToJob(invalidJobUrl, candidateData);
    
    logger.info('Error handling test completed', {
      status: result.status,
      errorType: result.errorDetails?.errorType,
      errorMessage: result.errorDetails?.errorMessage,
      suggestions: result.errorDetails?.suggestions,
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in error handling test', { error: error.message });
    throw error;
  }
}

async function testJobApplication() {
  console.log('🧪 Testing Job Application Workflow');
  console.log('=====================================');
  
  console.log('\n📋 Candidate Data:');
  console.log(JSON.stringify(testCandidateData, null, 2));
  
  console.log('\n🔗 Job URL:', testJobUrl);
  
  try {
    console.log('\n🚀 Starting application process...');
    
    const result = await applyToJob(testJobUrl, testCandidateData);
    
    console.log('\n✅ Application Result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n📊 Summary:');
    console.log(`Status: ${result.status}`);
    console.log(`Application ID: ${result.confirmationDetails?.applicationId || 'N/A'}`);
    console.log(`Error: ${result.errorDetails?.errorMessage || 'None'}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Main test function
async function runTests() {
  logger.info('Starting application workflow tests');
  
  try {
    // Test 1: Single application
    console.log('\n=== Test 1: Single Job Application ===');
    await testSingleApplication();
    
    // Test 2: Error handling
    console.log('\n=== Test 2: Error Handling ===');
    await testErrorHandling();
    
    // Test 3: Batch application (commented out to avoid rate limiting)
    // console.log('\n=== Test 3: Batch Job Application ===');
    // await testBatchApplication();
    
    // Test 4: Job application with test candidate data
    console.log('\n=== Test 4: Job Application with Test Candidate Data ===');
    await testJobApplication();
    
    logger.info('All tests completed successfully');
    
  } catch (error) {
    logger.error('Test execution failed', { error: error.message });
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export {
  testSingleApplication,
  testBatchApplication,
  testErrorHandling,
  runTests,
  testJobApplication,
}; 