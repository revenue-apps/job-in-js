import { stagehandClient } from '../../../shared/utils/stagehand.js';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Job Scraper Node
 * 
 * Input: { jobUrl: string, isValid: boolean }
 * Output: { jobUrl: string, jobData: object, scraped: boolean, error?: string }
 */
export async function jobScraperNode(state) {
  const { jobUrl } = state;
  
  logger.info('Starting job scraping', { jobUrl });
  
  try {
    // Initialize Stagehand client
    // await stagehandClient.initialize();
    
    // Scrape job data using Stagehand
    const scrapedJob = await stagehandClient.scrapeJob(jobUrl);
    
    logger.info('Job scraping completed', { 
      jobUrl, 
      title: scrapedJob.title,
      company: scrapedJob.company 
    });
    
    return {
      ...state,
      scrapedJob,
      scraped: true,
    };
    
  } catch (error) {
    logger.error('Error in job scraping', { jobUrl, error: error.message });
    
    return {
      ...state,
      scrapedJob: null,
      scraped: false,
      error: `Scraping failed: ${error.message}`,
    };
  } finally {
    // Clean up Stagehand client
    try {
      await stagehandClient.close();
    } catch (error) {
      logger.warn('Error closing Stagehand client', { error: error.message });
    }
  }
} 