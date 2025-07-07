import fs from 'fs/promises';
import { logger } from '../../../shared/utils/logger.js';
import { config } from '../../../shared/config/environment.js';
import path from 'path';

/**
 * Output Generator Node
 * 
 * Saves processed job data to JSON files in the output directory.
 * Handles file naming, directory creation, and error handling.
 */
export async function outputGeneratorNode(state) {
  const { jobUrl, processedJob, processed } = state;
  
  logger.info('Starting output generation', { jobUrl });
  
  try {
    // Skip output generation if processing failed
    if (!processed || !processedJob) {
      logger.warn('Skipping output generation - no processed data', { jobUrl });
      return {
        ...state,
        outputFile: null,
        saved: false,
        error: 'No processed job data to save',
      };
    }

    // Generate output filename
    const outputFile = generateOutputFilename(processedJob);
    const outputPath = path.join(config.paths.outputDir, 'scraped-jobs', outputFile);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Create output data structure
    const outputData = {
      metadata: {
        processedAt: new Date().toISOString(),
        sourceUrl: jobUrl,
        version: '1.0.0',
      },
      job: processedJob,
      status: {
        scraped: true,
        processed: true,
        saved: true,
      },
    };
    
    // Save to file
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));

    logger.info('Output generation completed', { 
      jobUrl,
      outputFile,
      outputPath,
    });

    return {
      ...state,
      outputFile,
      outputPath,
      saved: true,
      savedAt: new Date().toISOString(),
    };

  } catch (error) {
    logger.error('Error in output generation', { 
      error: error.message, 
      jobUrl: state.jobUrl 
    });
    
    return {
      ...state,
      outputFile: null,
      saved: false,
      error: error.message,
      savedAt: new Date().toISOString(),
    };
  }
}

/**
 * Generate a filename for the output JSON file
 * @param {Object} processedJob - The processed job data
 * @returns {string} - The generated filename
 */
function generateOutputFilename(processedJob) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const company = processedJob.basic?.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
  const title = processedJob.basic?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
  
  return `${company}_${title}_${timestamp}.json`;
}

// Helper function to get summary of saved job
export function getJobSummary(processedJob) {
  return {
    title: processedJob.title,
    company: processedJob.company,
    location: processedJob.location,
    wordCount: processedJob.wordCount,
    hasRequirements: processedJob.hasRequirements,
    hasResponsibilities: processedJob.hasResponsibilities,
    url: processedJob.url,
  };
} 