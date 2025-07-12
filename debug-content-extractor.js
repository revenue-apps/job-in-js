/**
 * Debug Script for Content Extractor Node
 * Tests the content extractor node directly to see what's in the state
 */

import contentExtractorNode from './src/new-nodes/processing/contentExtractorNode.js';
import { enhancedStagehandClient } from './src/shared/utils/enhancedStagehand.js';

/**
 * Debug the content extractor node
 */
async function debugContentExtractor() {
  console.log('Debugging Content Extractor Node...\n');

  try {
    // Initialize Stagehand
    await enhancedStagehandClient.start();
    const page = await enhancedStagehandClient.newPage();
    
    // Create test state with job data and page
    const testState = {
      job_data: {
        jd_id: 'test-job-001',
        url: 'https://www.linkedin.com/jobs/view/4253471300',
        status: 'discovered',
        created_at: new Date().toISOString()
      },
      page: page,
      current_node: 'job_loader',
      errors: [],
      metadata: {
        workflow_start: new Date().toISOString(),
        workflow_id: `workflow_${Date.now()}`
      }
    };

    console.log('Test State:');
    console.log('- job_data:', testState.job_data ? 'Present' : 'Missing');
    console.log('- job_data.url:', testState.job_data?.url || 'Missing');
    console.log('- page:', testState.page ? 'Present' : 'Missing');
    console.log('- page type:', typeof testState.page);
    
    // Test the content extractor node
    console.log('\nTesting content extractor node...');
    const result = await contentExtractorNode(testState);
    
    console.log('\nResult:');
    console.log('- Success:', !result.errors.some(e => e.node === 'content_extractor'));
    console.log('- Errors:', result.errors.length);
    console.log('- Extracted Content:', result.extracted_content ? 'Present' : 'Missing');
    
    if (result.extracted_content) {
      console.log('- Content Length:', result.extracted_content.rawText?.length || 0);
      console.log('- Page Title:', result.extracted_content.pageTitle || 'N/A');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean up
    try {
      await enhancedStagehandClient.close();
      console.log('Debug cleanup completed');
    } catch (error) {
      console.warn('Warning: Error during cleanup:', error.message);
    }
  }
}

// Run the debug
debugContentExtractor().catch(console.error); 