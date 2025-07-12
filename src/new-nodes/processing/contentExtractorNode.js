/**
 * Content Extractor Node
 * Pure function for extracting job content from URLs using AI prompting
 */

import { z } from 'zod';

/**
 * Content Extractor Node - Pure Function
 * Takes state and returns updated state with extracted content
 * @param {Object} state - Current workflow state
 * @returns {Promise<Object>} Updated state with extracted content
 */
async function contentExtractorNode(state) {
  try {
    console.log('ContentExtractorNode: Starting content extraction...');
    
    // Debug logging to see what's in the state
    console.log('ContentExtractorNode: State debug info:');
    console.log('- job_data present:', !!state.job_data);
    console.log('- job_data.url:', state.job_data?.url || 'MISSING');
    console.log('- page present:', !!state.page);
    console.log('- page type:', typeof state.page);
    
    // Log all fields in job_data to understand the structure
    if (state.job_data) {
      console.log('ContentExtractorNode: Job data fields:');
      console.log('- All keys:', Object.keys(state.job_data));
      console.log('- Full job_data:', JSON.stringify(state.job_data, null, 2));
    }
    
    // Handle case where job_data is null but page is available (for testing)
    if (!state.job_data && state.page) {
      console.log('ContentExtractorNode: No job data but page available, using test URL');
      const testUrl = 'https://www.linkedin.com/jobs/view/4253471300';
      
      console.log(`ContentExtractorNode: Using test URL: ${testUrl}`);
      
      try {
        const url = testUrl;
        const page = state.page;
        
        console.log(`ContentExtractorNode: About to navigate to test URL: ${url}`);
        console.log(`ContentExtractorNode: Page object type: ${typeof page}`);
        console.log(`ContentExtractorNode: Page has goto method: ${typeof page.goto === 'function'}`);
        
        // Navigate to job page
        console.log(`ContentExtractorNode: Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle' });
        
        // Wait a bit for dynamic content to load
        console.log('ContentExtractorNode: Waiting for dynamic content...');
        await page.waitForTimeout(2000);
        
        // Use AI prompting to extract raw content
        console.log('ContentExtractorNode: Extracting content with AI...');
        const extractedContent = await page.extract({
          instruction: "Extract the complete raw text content of this job posting page. Include all job description text, requirements, responsibilities, qualifications, and any other job-related information. Return the full text content as it appears on the page.",
          schema: z.object({
            rawText: z.string(),
            pageTitle: z.string().optional()
          })
        });
        
        const content = {
          url: url,
          rawText: extractedContent.rawText,
          pageTitle: extractedContent.pageTitle || '',
          extractedAt: new Date().toISOString()
        };
        
        console.log(`ContentExtractorNode: Successfully extracted ${content.rawText.length} characters of content`);
        console.log(`ContentExtractorNode: Page title: ${content.pageTitle}`);
        
        // Return updated state with extracted content
        return {
          ...state,
          extracted_content: content,
          current_node: 'content_extractor',
          metadata: {
            ...state.metadata,
            content_extractor_completed: true,
            content_extractor_timestamp: new Date().toISOString(),
            content_length: content.rawText.length,
            message: 'Content extraction completed successfully (test mode)'
          }
        };
        
      } catch (error) {
        console.error('ContentExtractorNode: Error extracting content from test URL:', error);
        console.error('ContentExtractorNode: Error details:', error.message);
        console.error('ContentExtractorNode: Error stack:', error.stack);
        
        return {
          ...state,
          errors: [
            ...state.errors,
            {
              node: 'content_extractor',
              error: `Test URL extraction failed: ${error.message}`,
              timestamp: new Date().toISOString()
            }
          ],
          metadata: {
            ...state.metadata,
            content_extractor_failed: true,
            content_extractor_error: error.message,
            content_extractor_timestamp: new Date().toISOString()
          }
        };
      }
    }
    
    if (!state.job_data || !state.job_data.url || !state.page) {
      console.error('ContentExtractorNode: Missing job URL or page');
      console.error('- job_data:', state.job_data ? 'Present' : 'Missing');
      console.error('- job_data.url:', state.job_data?.url || 'Missing');
      console.error('- page:', state.page ? 'Present' : 'Missing');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'content_extractor',
            error: 'Missing job URL or page',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          content_extractor_failed: true,
          content_extractor_error: 'Missing job URL or page',
          content_extractor_timestamp: new Date().toISOString()
        }
      };
    }

    const url = state.job_data.url;
    const page = state.page;
    
    console.log(`ContentExtractorNode: About to navigate to URL: ${url}`);
    console.log(`ContentExtractorNode: Page object type: ${typeof page}`);
    console.log(`ContentExtractorNode: Page has goto method: ${typeof page.goto === 'function'}`);
    
    // Navigate to job page with retry logic
    console.log(`ContentExtractorNode: Navigating to: ${url}`);
    
    let navigationSuccess = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!navigationSuccess && retryCount < maxRetries) {
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', // Changed from 'networkidle' to 'domcontentloaded'
          timeout: 60000 // Increased timeout to 60 seconds
        });
        navigationSuccess = true;
        console.log(`ContentExtractorNode: Navigation successful on attempt ${retryCount + 1}`);
      } catch (error) {
        retryCount++;
        console.warn(`ContentExtractorNode: Navigation attempt ${retryCount} failed:`, error.message);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        console.log(`ContentExtractorNode: Waiting 2 seconds before retry...`);
        await page.waitForTimeout(2000);
      }
    }
    
    // Wait a bit for dynamic content to load
    console.log('ContentExtractorNode: Waiting for dynamic content...');
    await page.waitForTimeout(5000); // Increased wait time to 5 seconds
    
    // Try to wait for job-specific content to load
    try {
      console.log('ContentExtractorNode: Waiting for job content to load...');
      await page.waitForSelector('h1, .job-title, .title, [data-testid*="title"], [class*="title"]', { 
        timeout: 10000 
      });
      console.log('ContentExtractorNode: Job title element found');
    } catch (error) {
      console.warn('ContentExtractorNode: Could not find job title element, proceeding anyway:', error.message);
    }
    
    // Use AI prompting to extract raw content
    console.log('ContentExtractorNode: Extracting content with AI...');
    const extractedContent = await page.extract({
      instruction: "Extract the complete raw text content of this job posting page. Include all job description text, requirements, responsibilities, qualifications, and any other job-related information. Return the full text content as it appears on the page.",
      schema: z.object({
        rawText: z.string(),
        pageTitle: z.string().optional()
      })
    });
    
    const content = {
      url: url,
      rawText: extractedContent.rawText,
      pageTitle: extractedContent.pageTitle || '',
      extractedAt: new Date().toISOString()
    };
    
    console.log(`ContentExtractorNode: Successfully extracted ${content.rawText.length} characters of content`);
    console.log(`ContentExtractorNode: Page title: ${content.pageTitle}`);
    
    // Return updated state with extracted content
    return {
      ...state,
      extracted_content: content,
      current_node: 'content_extractor',
      metadata: {
        ...state.metadata,
        content_extractor_completed: true,
        content_extractor_timestamp: new Date().toISOString(),
        content_length: content.rawText.length,
        message: 'Content extraction completed successfully'
      }
    };

  } catch (error) {
    console.error('ContentExtractorNode: Error extracting content:', error);
    console.error('ContentExtractorNode: Error details:', error.message);
    console.error('ContentExtractorNode: Error stack:', error.stack);
    
    return {
      ...state,
      errors: [
        ...state.errors,
        {
          node: 'content_extractor',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      ],
      metadata: {
        ...state.metadata,
        content_extractor_failed: true,
        content_extractor_error: error.message,
        content_extractor_timestamp: new Date().toISOString()
      }
    };
  }
}

export default contentExtractorNode; 