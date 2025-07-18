/**
 * Job Listings Navigator Node
 * 
 * Purpose: Find the job listings page from the career homepage using CTA phrase matching
 * and fallback strategies.
 */

import { logger } from '../../../../src/shared/utils/logger.js';
import { z } from 'zod';
import { readCsvFile } from '../../../../src/shared/utils/csvReader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jobListingsNavigatorNode = async (state) => {
  const { careerPageUrl, page } = state;
  
  logger.info('Starting Job Listings Navigator Node', { careerPageUrl });
  logger.info('Job Listings Navigator - Input State:', { 
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
    if (!page) {
      throw new Error('No Stagehand page provided');
    }

    if (!careerPageUrl) {
      throw new Error('No career page URL provided from previous node');
    }

    // Strategy 1: CTA phrase matching
    const jobListingsUrl = await findJobListingsWithCTA(page, careerPageUrl);
    
    if (jobListingsUrl) {
      logger.info('Job listings page found via CTA matching', { 
        careerPageUrl, 
        jobListingsUrl 
      });
      
      return {
        ...state,
        jobListingsUrl,
        status: 'job_listings_found',
        currentStep: 'job_listings_navigator'
      };
    }

    // Strategy 2: Fallback URL patterns
    const fallbackUrl = await findJobListingsWithFallback(page, careerPageUrl);
    
    if (fallbackUrl) {
      logger.info('Job listings page found via fallback strategy', { 
        careerPageUrl, 
        jobListingsUrl: fallbackUrl 
      });
      
      return {
        ...state,
        jobListingsUrl: fallbackUrl,
        status: 'job_listings_found',
        currentStep: 'job_listings_navigator'
      };
    }

    // No job listings page found
    logger.warn('No job listings page found', { careerPageUrl });
    
    return {
      ...state,
      jobListingsUrl: null,
      status: 'job_listings_failed',
      errors: [...(state.errors || []), `No job listings page found for ${careerPageUrl}`],
      currentStep: 'job_listings_navigator'
    };

  } catch (error) {
    logger.error('Job Listings Navigator Node failed', { 
      careerPageUrl, 
      error: error.message 
    });
    
    return {
      ...state,
      jobListingsUrl: null,
      status: 'job_listings_failed',
      errors: [...(state.errors || []), `Job listings navigation failed: ${error.message}`],
      currentStep: 'job_listings_navigator'
    };
  }
};

/**
 * Strategy 1: CTA phrase matching for job listings discovery
 */
async function findJobListingsWithCTA(page, careerPageUrl) {
  try {
    logger.info('Attempting CTA phrase matching for job listings', { careerPageUrl });
    
    // Load CTA phrases from CSV
    const ctaPhrases = await loadCTAPhrases();
    logger.info('Loaded CTA phrases', { count: ctaPhrases.length });
    
    // Navigate to career page
    await page.goto(careerPageUrl);
    
    // Use AI to find the single best clickable link matching CTA phrases
    const { link } = await page.extract({
      instruction: `You are on the company's career or jobs landing page. Identify the single best clickable link or button that will take you to the actual job listings page — the one that displays open roles or search results.
Avoid links that loop back to the same page or lead to generic descriptions. Focus on CTAs like "Search Jobs", "Browse Openings", "View Opportunities", etc.
Return the absolute URL (starting with http:// or https://) of that link.`,
      schema: z.object({
        link: z.string().url()
      }),
    });

    if (link && typeof link === 'string') {
      logger.info('Job listings CTA link selected by AI', { link });

      try {
        await page.goto(link);

        const { isValid } = await page.extract({
          instruction: `Verify this page is a job listings or job search page by checking for:
            - Multiple job titles or roles listed
            - Job filters, locations, or departments
            - "Apply" buttons or links
            Return true if this is a job listings/search results page.`,
          schema: z.object({ isValid: z.boolean() })
        });

        if (isValid) {
          logger.info('Validated job listings page', { link });
          return link;
        }

        logger.warn('Link did not pass validation as job listings page', { link });
      } catch (error) {
        logger.warn('Error while validating potential job listings link', { link, error: error.message });
      }
    }

    return null;
    
  } catch (error) {
    logger.warn('CTA phrase matching failed', { careerPageUrl, error: error.message });
    return null;
  }
}

/**
 * Load CTA phrases from CSV file
 */
async function loadCTAPhrases() {
  try {
    const csvPath = path.join(__dirname, '../config/job_listings_cta_phrases.csv');
    const phrases = await readCsvFile(csvPath);
    return phrases.map(row => row.phrase).filter(phrase => phrase && phrase.trim());
  } catch (error) {
    logger.warn('Failed to load CTA phrases from CSV, using defaults', { error: error.message });
    // Fallback to hardcoded phrases
    return [
      'View Jobs',
      'Open Positions', 
      'Browse Jobs',
      'Search Jobs',
      'Find Jobs',
      'Job Opportunities',
      'Current Openings',
      'Job Search'
    ];
  }
}

/**
 * Strategy 2: Fallback URL patterns
 */
async function findJobListingsWithFallback(page, careerPageUrl) {
  const commonPatterns = [
    '/jobs',
    '/careers/jobs',
    '/openings',
    '/positions',
    '/opportunities',
    '/search',
    '/job-search',
    '/careers/search',
    '/jobs/search',
    '/find-jobs',
    '/browse-jobs',
    '/job-listings',
    '#openings',
    '#jobs',
    '/intl/en-in/careers',
    '/intl/en-us/careers',
    '/careers#openings',
    '/careers#jobs'
  ];
  
  logger.info('Attempting fallback URL patterns', { 
    careerPageUrl, 
    patternsCount: commonPatterns.length 
  });
  
  for (const pattern of commonPatterns) {
    try {
      const testUrl = new URL(pattern, careerPageUrl).href;
      logger.info('Testing fallback URL pattern', { pattern, testUrl });
      
      // Navigate to the test URL
      const response = await page.goto(testUrl);
      
      if (response && response.ok) {
        // Validate the page is a job listings page
        const { isValid } = await page.extract({
          instruction: `Quickly check if this page has job listings or job search functionality.
            Look for job postings, search boxes, or job-related content.
            Return true if this appears to be a job listings page.`,
          schema: z.object({ isValid: z.boolean() })
        });
        
        if (isValid) {
          logger.info('Fallback URL pattern worked', { pattern, testUrl });
          return testUrl;
        }
      }
      
    } catch (error) {
      logger.debug('Fallback URL pattern failed', { pattern, error: error.message });
      continue;
    }
  }
  
  return null;
}

export default jobListingsNavigatorNode; 