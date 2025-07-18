/**
 * Metadata Constructor Node
 * 
 * Purpose: Build structured metadata and append to CSV with all discovered data
 * from previous nodes in the career discovery workflow.
 */

import { logger } from '../../../../src/shared/utils/logger.js';
import { chatCompletion } from '../../../../src/shared/utils/openai.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_CSV = "https://www.ibm.com/in-en/careers/search?q=software%20engineer, this url specified has q as query parameter that takes search query";

const metadataConstructorNode = async (state) => {
  const { 
    companyName, 
    careerPageUrl, 
    jobListingsUrl, 
    filteredJobUrl,
    urlParameters,
    filters
  } = state;
  
  logger.info('Starting Metadata Constructor Node', { companyName });
  logger.info('Metadata Constructor - Input State:', { 
    companyName: state.companyName,
    page: state.page ? 'Page exists' : 'No page',
    status: state.status,
    currentStep: state.currentStep,
    careerPageUrl: state.careerPageUrl,
    jobListingsUrl: state.jobListingsUrl,
    filteredJobUrl: state.filteredJobUrl,
    metadata: state.metadata,
    errors: state.errors
  });
  
  try {
    // Step 1: Validate inputs
    if (!companyName) {
      throw new Error('Company name is required');
    }

    // Step 2: Build Filter Summary (handle missing data gracefully)
    const metadata = await buildFilterSummary(filters, urlParameters, jobListingsUrl, companyName);
    

    // Step 3: Append to CSV File (only if we have a job listings URL)
    if (jobListingsUrl) {
      const csvResult = await appendToCSV(jobListingsUrl, metadata, companyName);
      
      if (!csvResult.success) {
        logger.error('Failed to append to CSV', { 
          companyName, 
          error: csvResult.error 
        });
        
        return {
          ...state,
          metadata,
          status: 'metadata_construction_failed',
          errors: [...(state.errors || []), `CSV append failed: ${csvResult.error}`],
          currentStep: 'metadata_constructor'
        };
      }
      
      logger.info(`CSV row appended successfully for ${companyName}`);
    } else {
      logger.info(`Skipping CSV write for ${companyName} - no job listings URL found`);
    }

    // Step 4: Update Status
    logger.info('Metadata construction completed successfully', { 
        companyName,
        metadata,
    });
    
    logger.info(`CSV row appended successfully for ${companyName}`);

    return {
      ...state,
      metadata,
      status: 'metadata_constructed',
      currentStep: 'metadata_constructor'
    };

  } catch (error) {
    logger.error('Metadata Constructor Node failed', { 
      companyName, 
      error: error.message 
    });
    
    return {
      ...state,
      status: 'metadata_construction_failed',
      errors: [...(state.errors || []), `Metadata construction failed: ${error.message}`],
      currentStep: 'metadata_constructor'
    };
  }
};

/**
 * Step 2: Build Filter Summary
 */
async function buildFilterSummary(filters, url, jobListingsUrl, companyName) {
  try {
    // Handle missing data gracefully
    const filtersStr = filters ? JSON.stringify(filters) : 'No filters found';
    const urlStr = url || jobListingsUrl || 'No URL found';
    
    const prompt = `Build metadata for the job search URL for company ${companyName}. 
    Filter list: ${filtersStr}
    URL: ${urlStr}
    Example format: ${MOCK_CSV}
    
    Return a simple string describing the job search capabilities.`;
    
    const { success, data, error } = await chatCompletion([
      {
        role: 'user',
        content: prompt
      }
    ], {
      model: 'gpt-4o-mini',
      responseFormat: { type: 'text' }
    });

    if (success) {
      return data;
    }

    // Fallback if AI call fails
    return `Job search metadata for ${companyName}: ${urlStr}`;
    
  } catch (error) {
    logger.warn('Failed to build filter summary with AI, using fallback', { 
      companyName, 
      error: error.message 
    });
    
    // Fallback metadata
    return `Job search metadata for ${companyName}: ${jobListingsUrl || 'No URL found'}`;
  }
}
/**
 * Step 3: Append to CSV File
 */
async function appendToCSV(url, metadata, companyName) {
  try {
    const csvFilePath = path.join(__dirname, '../../../../data/job_discovery_urls.csv');
    
    // Check if file exists, create with headers if not
    let fileExists = false;
    try {
      await fs.access(csvFilePath);
      fileExists = true;
    } catch (error) {
      // File doesn't exist, will create it
    }
    
    // Prepare CSV row with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const csvRow = [
      `"${companyName}"`,
      `"${url || ''}"`,
      `"${metadata || ''}"`,
      `"${currentDate}"`,
      `"completed"`
    ].join(',');
    
    if (!fileExists) {
      // Create new file with headers
      const headers = [
        'company_name',
        'job_listings_url',
        'metadata',
        'discovery_date',
        'status'
      ].join(',');
      
      await fs.writeFile(csvFilePath, headers + '\n' + csvRow + '\n');
      logger.info('Created new CSV file with headers', { filePath: csvFilePath });
    } else {
      // Append to existing file
      await fs.appendFile(csvFilePath, csvRow + '\n');
      logger.info('Appended row to existing CSV file', { filePath: csvFilePath });
    }
    
    return {
      success: true,
      filePath: csvFilePath
    };
    
  } catch (error) {
    logger.error('Failed to write to CSV file', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

export default metadataConstructorNode; 