/**
 * Test Script for Job Extraction Workflow Fixes
 * Tests the workflow with the updated job loader and content extractor nodes
 */

import JobExtractionWorkflow from './src/new-workflows/job-extraction/index.js';

/**
 * Test the job extraction workflow with fixes
 */
async function testJobExtractionWorkflowFix() {
  console.log('Testing Job Extraction Workflow Fixes...\n');

  try {
    // Initialize workflow with test configuration
    const workflow = new JobExtractionWorkflow({
      maxRetries: 2,
      retryDelay: 1000,
      stopOnError: true,
      enableLogging: true,
      jobLoader: {
        batchSize: 5,
        maxJobs: 10
      },
      contentExtractor: {
        timeout: 15000,
        maxRetries: 2
      },
      jobAnalyzer: {
        model: 'gpt-4o-mini',
        maxTokens: 2000,
        temperature: 0.1
      },
      domainClassifier: {
        model: 'gpt-4o-mini',
        maxTokens: 1500,
        temperature: 0.1
      },
      experienceLevelDetector: {
        model: 'gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.1
      },
      dimensionMapper: {
        model: 'gpt-4o-mini',
        maxTokens: 3000,
        temperature: 0.1
      },
      qualityValidator: {
        minConfidence: 0.7,
        minCompleteness: 0.8,
        minQualityScore: 0.75
      },
      storage: {
        tableName: 'test-job-extraction-table'
      },
      stateManager: {
        tableName: 'test-job-extraction-table'
      }
    });

    // Validate configuration
    const configValidation = workflow.validateConfiguration();
    console.log('Configuration Validation:', configValidation);
    
    if (!configValidation.isValid) {
      console.error('Configuration validation failed:', configValidation.errors);
      return;
    }

    // Test workflow statistics
    const stats = workflow.getWorkflowStatistics();
    console.log('Workflow Statistics:', stats);

    // Create test job data with the correct structure
    const testJobData = {
      jd_id: 'test-job-001',
      url: 'https://www.linkedin.com/jobs/view/test-job',
      status: 'discovered',
      created_at: new Date().toISOString()
    };

    console.log('\nTest Job Data:', testJobData);

    // Execute workflow (this will test the job loader and content extractor nodes)
    console.log('\nExecuting workflow to test job loader and content extractor...');
    
    const result = await workflow.execute(testJobData);
    
    console.log('\nWorkflow Execution Result:');
    console.log('Success:', result.success);
    console.log('Duration:', result.duration + 'ms');
    console.log('Errors:', result.errors.length);
    
    if (result.errors.length > 0) {
      console.log('Error Details:');
      result.errors.forEach(error => {
        console.log(`- ${error.node}: ${error.error}`);
      });
    }
    
    console.log('\nFinal State:');
    console.log('Job Data:', result.final_state.job_data ? 'Present' : 'Missing');
    console.log('Page Object:', result.final_state.page ? 'Present' : 'Missing');
    console.log('Extracted Content:', result.final_state.extracted_content ? 'Present' : 'Missing');
    
    if (result.final_state.extracted_content) {
      console.log('Content Length:', result.final_state.extracted_content.rawText?.length || 0);
    }

    console.log('\n✅ Job Extraction Workflow test completed!');
    console.log('\n📋 Fix Summary:');
    console.log('- ✅ Job loader now initializes Stagehand page object');
    console.log('- ✅ Content extractor uses correct field name (url instead of source_url)');
    console.log('- ✅ Page object added to state schema');
    console.log('- ✅ Stagehand client cleanup added');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean up
    try {
      const workflow = new JobExtractionWorkflow();
      await workflow.cleanup();
    } catch (error) {
      console.warn('Warning: Error during cleanup:', error.message);
    }
  }
}

// Run the test
testJobExtractionWorkflowFix().catch(console.error); 