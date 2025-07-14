import { logger } from '../../shared/utils/logger.js';
import { z } from 'zod';

export const paginationScraperNode = async (state) => {
  const { currentUrl, pagination = {}, page, agent } = state;
  
  logger.info('Starting pagination scraper node');
  logger.info(`Current URL: ${currentUrl?.finalUrl}`);
  logger.info(`Current Page: ${pagination.currentPage || 1}`);
  
  try {
    const currentPage = pagination.currentPage || 1;
    
    // Check pagination limit (max 10 pages per URL)
    const MAX_PAGES_PER_URL = 2;
    if (currentPage >= MAX_PAGES_PER_URL) {
      logger.info(`Reached pagination limit of ${MAX_PAGES_PER_URL} pages for current URL`);
      return {
        ...state,
        pagination: {
          ...pagination,
          hasMorePages: false,
          nextPageUrl: null,
          currentPage: currentPage
        },
        currentStep: 'pagination_limit_reached'
      };
    }
    
    const nextPageUrl = await detectNextPage(page, agent, currentUrl?.finalUrl, currentPage);
    
    const hasMorePages = !!nextPageUrl;
    
    logger.info(`Pagination result: hasMorePages=${hasMorePages}, nextPageUrl=${nextPageUrl}`);
    
    // If we found a next page, update the currentUrl to point to the next page
    let updatedCurrentUrl = currentUrl;
    if (hasMorePages && nextPageUrl) {
      updatedCurrentUrl = {
        ...currentUrl,
        finalUrl: nextPageUrl,
        originalTemplate: currentUrl.originalTemplate,
        description: currentUrl.description,
        company: currentUrl.company,
        domain: currentUrl.domain,
        filters: currentUrl.filters,
        urlType: currentUrl.urlType
      };
      logger.info(`Updated currentUrl to next page: ${nextPageUrl}`);
    }
    
    return {
      ...state,
      currentUrl: updatedCurrentUrl,
      pagination: {
        ...pagination,
        hasMorePages,
        nextPageUrl,
        currentPage: currentPage + 1
      },
      currentStep: 'pagination_complete'
    };
    
  } catch (error) {
    logger.error('Pagination scraper failed:', error.message);
    
    return {
      ...state,
      pagination: {
        ...pagination,
        hasMorePages: false,
        nextPageUrl: null,
        currentPage: (pagination.currentPage || 1) + 1
      },
      errors: [...(state.errors || []), {
        step: 'pagination_scraper',
        error: error.message,
        timestamp: new Date().toISOString()
      }],
      currentStep: 'pagination_failed'
    };
  }
};

/**
 * Detect next page URL using AI prompt with fallback selectors
 */
async function detectNextPage(page, agent, currentUrl, currentPage) {
  try {
    // Primary: AI-based detection
    const aiResult = await detectNextPageWithAI(page, agent, currentUrl, currentPage);
    if (aiResult) {
      logger.info(`AI detected next page: ${aiResult}`);
      return aiResult;
    }
    
    // Fallback: Selector-based detection
    const selectorResult = await detectNextPageWithSelectors(page);
    if (selectorResult) {
      logger.info(`Selector detected next page: ${selectorResult}`);
      return selectorResult;
    }
    
    logger.info('No next page detected');
    return null;
    
  } catch (error) {
    logger.error('Next page detection failed:', error.message);
    return null;
  }
}

/**
 * Use AI to detect next page URL
 */
async function detectNextPageWithAI(page, agent, currentUrl, currentPage) {
  try {
    const result = await page.extract({
      instruction: `You are a pagination detection expert. Analyze this job listing page and find the next page URL.

Current URL: ${currentUrl}
Current Page: ${currentPage}

Your task:
1. Look for pagination controls on the page
2. Find "Next" buttons, page numbers, or pagination links
3. Determine if there are more pages available
4. Extract the URL for the next page

IMPORTANT: 
- Look for actual "Next" buttons or links on the page
- Don't just append "&page=X" to the current URL
- Find the actual href attribute of next page links
- If you see "Next" button, extract its href value
- If you see page numbers, find the next page number link

Look for these elements:
- "Next" buttons or links with href attributes
- Page numbers (current + 1) with href attributes
- Pagination controls with actual links
- "Load more" buttons
- Navigation arrows with href

Return the actual next page URL if found, or indicate no more pages.
do not return url by appending page number to the current url. it should be the actual next page url.
`,
      schema: z.object({
        nextPageUrl: z.string().optional(),
        hasMorePages: z.boolean(),
        reasoning: z.string().optional(),
        foundElements: z.array(z.string()).optional()
      })
    });
    
    logger.info(`🔍 AI Pagination Debug:`);
    logger.info(`- hasMorePages: ${result.hasMorePages}`);
    logger.info(`- nextPageUrl: ${result.nextPageUrl}`);
    logger.info(`- reasoning: ${result.reasoning}`);
    logger.info(`- foundElements: ${result.foundElements?.join(', ')}`);
    
    if (result.hasMorePages && result.nextPageUrl && isValidUrl(result.nextPageUrl)) {
      // Validate that the next URL is actually different from current
      if (result.nextPageUrl !== currentUrl) {
        logger.info(`🔄 Pagination scraper: Next page URL: ${result.nextPageUrl}`);
        logger.info(`🔄 Pagination scraper: Current page URL: ${currentUrl}`);
        return result.nextPageUrl;
      } else {
        logger.info(`⚠️ AI returned same URL as current, ignoring`);
        return null;
      }
    }
    
    return null;
    
  } catch (error) {
    logger.error('AI pagination detection failed:', error.message);
    return null;
  }
}

/**
 * Fallback: Use selectors to detect next page
 */
async function detectNextPageWithSelectors(page) {
  const selectors = [
    // Next buttons - generic patterns
    'a[href*="next"]',
    'button[aria-label*="next"]',
    '.pagination a[href*="next"]',
    '.pagination-next',
    '.next-page',
    '[data-testid*="next"]',
    '[data-pagination*="next"]',
    
    // Page numbers - generic patterns
    'a[href*="page="]',
    'a[href*="p="]',
    '.pagination a[href]',
    
    // Generic pagination
    '.pagination a',
    '[data-page]',
    '[data-pagination]',
    
    // Navigation arrows and buttons
    'a[aria-label*="next"]',
    'button[aria-label*="next"]',
    'a[title*="next"]',
    'button[title*="next"]',
    
    // Common pagination classes
    '.pagination a',
    '.pager a',
    '.nav a',
    '.navigation a',
    
    // Generic next indicators
    'a:contains("Next")',
    'button:contains("Next")',
    'a:contains(">")',
    'button:contains(">")'
  ];
  
  for (const selector of selectors) {
    try {
      // Use page.evaluate() for Stagehand compatibility
      const element = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.href : null;
      }, selector);
      
      if (element && isValidUrl(element)) {
        return element;
      }
    } catch (error) {
      // Continue to next selector
      continue;
    }
  }
  
  return null;
}

/**
 * Validate if URL is properly formatted
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
} 