import { logger } from '../../shared/utils/logger.js';
import { insertJobDescriptions } from '../../shared/utils/dynamoDB.js';
import crypto from 'crypto';

export const storageNode = async (state) => {
  const { scrapedJobs = [], currentUrl } = state;
  
  logger.info('Starting job discovery storage node');
  logger.info(`Storing ${scrapedJobs.length} discovered jobs`);
  
  try {
    if (!scrapedJobs || scrapedJobs.length === 0) {
      logger.info('No jobs to store');
      return {
        ...state,
        currentStep: 'storage_complete',
        storedJobs: [],
        storageErrors: []
      };
    }
    
    // Format jobs for DynamoDB storage
    const jobDescriptions = scrapedJobs.map((job, index) => ({
      jd_id: crypto.randomUUID(), // Generate proper UUID
      url: job.url,
      company: job.company,
      domain: currentUrl?.domain,
      filters: currentUrl?.filters,
      status: 'discovered',
      discoveredAt: new Date().toISOString()
    }));
    
    // Store job descriptions in DynamoDB
    let storedJobs = [];
    let storageErrors = [];
    
    try {
      const storageResult = await insertJobDescriptions(jobDescriptions);
      storedJobs = storageResult.results;
      storageErrors = storageResult.errors;
      
      logger.info(`Stored ${storedJobs.length} jobs in DynamoDB, ${storageErrors.length} failed`);
    } catch (error) {
      logger.error('Failed to store jobs in DynamoDB:', error.message);
      storageErrors.push({ error: error.message });
    }
    
    return {
      ...state,
      storedJobs,
      storageErrors,
      currentStep: 'storage_complete'
    };
    
  } catch (error) {
    logger.error('Job discovery storage failed:', error.message);
    
    return {
      ...state,
      errors: [...(state.errors || []), {
        step: 'storage',
        error: error.message,
        timestamp: new Date().toISOString()
      }],
      currentStep: 'storage_failed'
    };
  }
}; 