import { stagehandClient } from '../utils/stagehand.js';
import { logger } from '../utils/logger.js';

/**
 * Job Scraper Node
 * 
 * Input: { jobUrl: string, isValid: boolean }
 * Output: { jobUrl: string, jobData: object, scraped: boolean, error?: string }
 */
export async function jobScraperNode(state) {
  const nodeName = 'jobScraper';
  logger.langgraph(nodeName, 'Starting job scraping', { jobUrl: state.jobUrl });
  
  try {
    const { jobUrl, isValid } = state;
    
    // Skip scraping if URL is invalid
    if (!isValid) {
      logger.langgraph(nodeName, 'Skipping invalid URL', { jobUrl });
      return {
        ...state,
        jobData: null,
        scraped: false,
        error: 'Invalid URL format',
      };
    }
    
    // Call Stagehand API
    const jobData = await stagehandClient.scrapeJob(jobUrl);
    
    if (!jobData) {
      logger.langgraph(nodeName, 'Stagehand scraping failed', { jobUrl });
      return {
        ...state,
        jobData: null,
        scraped: false,
        error: 'Stagehand API failed to return data',
      };
    }
    
    logger.langgraph(nodeName, 'Job scraping completed successfully', { 
      jobUrl,
      title: jobData.title,
      company: jobData.company,
    });
    
    return {
      ...state,
      jobData,
      scraped: true,
      scrapedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    logger.langgraph(nodeName, 'Error in job scraping', { 
      error: error.message, 
      jobUrl: state.jobUrl 
    });
    
    return {
      ...state,
      jobData: null,
      scraped: false,
      error: error.message,
      scrapedAt: new Date().toISOString(),
    };
  }
} 