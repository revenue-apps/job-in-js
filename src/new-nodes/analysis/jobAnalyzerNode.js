/**
 * Job Analyzer Node
 * Pure function for extracting company name from job content using AI prompting
 */

import { z } from 'zod';

/**
 * Job Analyzer Node - Pure Function
 * Takes state and returns updated state with extracted company name
 * @param {Object} state - Current workflow state
 * @returns {Promise<Object>} Updated state with company extraction
 */
async function jobAnalyzerNode(state) {
  try {
    console.log('JobAnalyzerNode: Starting company extraction...');
    
    if (!state.extracted_content || !state.extracted_content.rawText) {
      console.error('JobAnalyzerNode: No extracted content available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'job_analyzer',
            error: 'No extracted content available for analysis',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          job_analyzer_failed: true,
          job_analyzer_error: 'No extracted content available',
          job_analyzer_timestamp: new Date().toISOString()
        }
      };
    }

    const rawText = state.extracted_content.rawText;
    const page = state.page;
    
    console.log(`JobAnalyzerNode: Analyzing content with ${rawText.length} characters`);
    
    // Use AI prompting to extract only company name
    const analysis = await page.extract({
      instruction: "Extract only the company name from this job posting. Look for the company that is hiring or posting this job. Return just the company name, nothing else.",
      schema: z.object({
        company: z.string()
      })
    });
    
    const jobAnalysis = {
      company: analysis.company,
      rawText: rawText, // Preserve all original text
      extractedAt: new Date().toISOString()
    };
    
    console.log(`JobAnalyzerNode: Successfully extracted company: ${jobAnalysis.company}`);
    console.log(`JobAnalyzerNode: Successfully extracted company raw text: ${jobAnalysis?.rawText}`);
    
    // Return updated state with company extraction
    return {
      ...state,
      analysis_results: jobAnalysis,
      current_node: 'job_analyzer',
      metadata: {
        ...state.metadata,
        job_analyzer_completed: true,
        job_analyzer_timestamp: new Date().toISOString(),
        company_extracted: jobAnalysis.company,
        message: 'Company extraction completed successfully'
      }
    };

  } catch (error) {
    console.error('JobAnalyzerNode: Error extracting company:', error);
    
    return {
      ...state,
      errors: [
        ...state.errors,
        {
          node: 'job_analyzer',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      ],
      metadata: {
        ...state.metadata,
        job_analyzer_failed: true,
        job_analyzer_error: error.message,
        job_analyzer_timestamp: new Date().toISOString()
      }
    };
  }
}

export default jobAnalyzerNode; 