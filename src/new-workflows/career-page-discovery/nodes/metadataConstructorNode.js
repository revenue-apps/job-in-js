/**
 * Metadata Constructor Node
 * 
 * Purpose: Build structured metadata and append to CSV with all discovered data
 * from previous nodes in the career discovery workflow.
 */

import { logger } from '../../../../src/shared/utils/logger.js';
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
  
  try {


    // Step 2: Build Filter Summary
    const metadata = buildFilterSummary(filters, urlParameters, jobListingsUrl);
    

    // Step 4: Append to CSV File
    const csvResult = await appendToCSV(jobListingsUrl, metadata);
    
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

    // Step 5: Update Status
    logger.info('Metadata construction completed successfully', { 
        metadata,
    });
    
    logger.info(`csv row appended successfully`, { row });

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
async function buildFilterSummary(filters, url, companyName) {
  const prompt = `build metadata for the job search url for company ${companyName}. filter list are ${JSON.stringify(filters)} and url is ${url}.
  example is ${MOCK_CSV}`
  const { success, data, error } = await chatCompletion(prompt, {
    model: 'gpt-4o-mini',
    responseFormat: { type: 'string' }
  })

  if (success) {
    return data;
  }

  return null;
}
/**
 * Step 4: Append to CSV File
 */
async function appendToCSV(url, metadata) {
  try {
    const csvFilePath = path.join(__dirname, '../../../data/job_discovery_urls.csv');
    
    // Check if file exists, create with headers if not
    let fileExists = false;
    try {
      await fs.access(csvFilePath);
      fileExists = true;
    } catch (error) {
      // File doesn't exist, will create it
    }
    
    // Prepare CSV row
    const csvRow = [
      `"${url}"`,
      `"${metadata.job_listings_url}"`
    ].join(',');
    
    if (!fileExists) {
      // Create new file with headers
      const headers = [
        'company_name',
        'career_page_url', 
        'job_listings_url',
        'filtered_job_url',
        'available_filters',
        'url_parameters',
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