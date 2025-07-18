/**
 * Career Page Finder Node
 * 
 * Purpose: Find the career page URL for a given company name using AI-powered search
 * and fallback domain construction strategies.
 */

import { logger } from '../../../../src/shared/utils/logger.js';
import { z } from 'zod';

const careerPageFinderNode = async (state) => {
  const { companyName, page } = state;
  
  logger.info('Starting Career Page Finder Node', { companyName });
  logger.info('Career Page Finder - Input State:', { 
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

    // Strategy 1: AI-powered Google search
    const careerPageUrl = await findCareerPageWithAI(page, companyName);
    
    if (careerPageUrl) {
      logger.info('Career page found via AI search', { 
        companyName, 
        careerPageUrl 
      });
      
      return {
        ...state,
        careerPageUrl,
        status: 'career_page_found',
        currentStep: 'career_page_finder'
      };
    }

    // Strategy 2: Fallback domain construction
    const fallbackUrl = await findCareerPageWithFallback(page, companyName);
    
    if (fallbackUrl) {
      logger.info('Career page found via fallback strategy', { 
        companyName, 
        careerPageUrl: fallbackUrl 
      });
      
      return {
        ...state,
        careerPageUrl: fallbackUrl,
        status: 'career_page_found',
        currentStep: 'career_page_finder'
      };
    }

    // No career page found
    logger.warn('No career page found for company', { companyName });
    
    return {
      ...state,
      careerPageUrl: null,
      status: 'career_page_failed',
      errors: [...(state.errors || []), `No career page found for ${companyName}`],
      currentStep: 'career_page_finder'
    };

  } catch (error) {
    logger.error('Career Page Finder Node failed', { 
      companyName, 
      error: error.message 
    });
    
    return {
      ...state,
      careerPageUrl: null,
      status: 'career_page_failed',
      errors: [...(state.errors || []), `Career page discovery failed: ${error.message}`],
      currentStep: 'career_page_finder'
    };
  }
};

/**
 * Strategy 1: AI-powered Google search for career pages using Stagehand's observe()
 */
async function findCareerPageWithAI(page, companyName) {
  try {
    logger.info('Attempting AI-powered career page search via observe()', { companyName });

    const searchQuery = `${companyName} careers`;
    await page.goto('https://www.google.com');
    await page.waitForSelector('input[name="q"]');
    await page.type('input[name="q"]', searchQuery);
    await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    const { link } = await page.observe({
      instruction: `From the search results page, identify and return the best link that leads to the official careers or jobs page for ${companyName}.
        Prefer links that mention "careers", "jobs", "employment", or "work with us". Avoid aggregator sites like Glassdoor, Indeed, or LinkedIn.`,
      schema: z.object({ link: z.string() }),
    });

    if (link && link.startsWith('http')) {
      logger.info('Career page link chosen by AI observe()', { companyName, careerUrl: link });
      await page.goto(link);
      return link;
    }

    return null;
  } catch (error) {
    logger.warn('AI observe() based search failed', { companyName, error: error.message });
    return null;
  }
}

/**
 * Strategy 2: Fallback domain construction with common patterns
 */
async function findCareerPageWithFallback(page, companyName) {
  const commonPatterns = [
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/intl/en-in/careers`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/intl/en-us/careers`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/careers`,
    `https://careers.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/jobs`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/join-us`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/work-with-us`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/employment`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/opportunities`,
    `https://jobs.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/career`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/team`
  ];
  
  logger.info('Attempting fallback domain construction', { 
    companyName, 
    patternsCount: commonPatterns.length 
  });
  
  for (const url of commonPatterns) {
    try {
      logger.info('Testing fallback URL', { companyName, url });
      
      // Just check if the URL is accessible (basic HTTP check)
      const response = await page.goto(url);
      
      if (response && response.ok) {
        logger.info('Fallback URL is accessible', { companyName, url });
        return url;
      }
      
    } catch (error) {
      logger.debug('Fallback URL test failed', { companyName, url, error: error.message });
      continue;
    }
  }
  
  return null;
}

export default careerPageFinderNode; 