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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Step 1: Validate Input Data
    const validationResult = validateInputData(state);
    if (!validationResult.isValid) {
      logger.error('Input validation failed', { 
        companyName, 
        errors: validationResult.errors 
      });
      
      return {
        ...state,
        status: 'metadata_construction_failed',
        errors: [...(state.errors || []), ...validationResult.errors],
        currentStep: 'metadata_constructor'
      };
    }

    // Step 2: Build Filter Summary
    const availableFilters = buildFilterSummary(filters, urlParameters);
    
    // Step 3: Create CSV Row
    const metadata = createCSVRow({
      companyName,
      careerPageUrl,
      jobListingsUrl,
      filteredJobUrl,
      availableFilters,
      urlParameters
    });

    // Step 4: Append to CSV File
    const csvResult = await appendToCSV(metadata);
    
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
      companyName,
      availableFilters,
      csvFile: csvResult.filePath
    });
    
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
 * Step 1: Validate Input Data
 */
function validateInputData(state) {
  const errors = [];
  const required = ['companyName', 'careerPageUrl', 'jobListingsUrl', 'filteredJobUrl'];
  
  for (const field of required) {
    if (!state[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate URL formats
  if (state.careerPageUrl && !isValidUrl(state.careerPageUrl)) {
    errors.push(`Invalid career page URL: ${state.careerPageUrl}`);
  }
  
  if (state.jobListingsUrl && !isValidUrl(state.jobListingsUrl)) {
    errors.push(`Invalid job listings URL: ${state.jobListingsUrl}`);
  }
  
  if (state.filteredJobUrl && !isValidUrl(state.filteredJobUrl)) {
    errors.push(`Invalid filtered job URL: ${state.filteredJobUrl}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Step 2: Build Filter Summary
 */
function buildFilterSummary(filters, urlParameters) {
  const filterTypes = [];
  
  // Extract filter types from filters object
  if (filters) {
    Object.entries(filters).forEach(([key, filter]) => {
      if (filter && filter.isFound) {
        switch (key) {
          case 'domain':
            filterTypes.push('search');
            break;
          case 'location':
            filterTypes.push('location');
            break;
          case 'department':
            filterTypes.push('department');
            break;
          default:
            filterTypes.push(key);
        }
      }
    });
  }
  
  // Extract from URL parameters if filters object is empty
  if (filterTypes.length === 0 && urlParameters) {
    Object.keys(urlParameters).forEach(key => {
      switch (key) {
        case 'domain':
        case 'search':
          filterTypes.push('search');
          break;
        case 'location':
          filterTypes.push('location');
          break;
        case 'department':
          filterTypes.push('department');
          break;
        case 'jobType':
          filterTypes.push('job_type');
          break;
        default:
          filterTypes.push(key);
      }
    });
  }
  
  // Remove duplicates and return pipe-separated string
  return [...new Set(filterTypes)].join('|');
}

/**
 * Step 3: Create CSV Row
 */
function createCSVRow(data) {
  const discoveryDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Build URL parameters string
  let urlParamsString = '';
  if (data.urlParameters && Object.keys(data.urlParameters).length > 0) {
    urlParamsString = Object.entries(data.urlParameters)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }
  
  return {
    company_name: data.companyName,
    career_page_url: data.careerPageUrl,
    job_listings_url: data.jobListingsUrl,
    filtered_job_url: data.filteredJobUrl,
    available_filters: data.availableFilters,
    url_parameters: urlParamsString,
    discovery_date: discoveryDate,
    status: 'discovered'
  };
}

/**
 * Step 4: Append to CSV File
 */
async function appendToCSV(metadata) {
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
      `"${metadata.company_name}"`,
      `"${metadata.career_page_url}"`,
      `"${metadata.job_listings_url}"`,
      `"${metadata.filtered_job_url}"`,
      `"${metadata.available_filters}"`,
      `"${metadata.url_parameters}"`,
      `"${metadata.discovery_date}"`,
      `"${metadata.status}"`
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

/**
 * Helper: Validate URL format
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export default metadataConstructorNode; 