import express from 'express';
import { runJobDiscoveryFromConfig } from '../../new-workflows/job-discovery/index.js';
import { logger } from '../../shared/utils/logger.js';

const router = express.Router();

// POST /job-discovery
router.post('/', async (req, res) => {
  try {
    const { domain, filters = {}, configPath = './data/job_discovery_urls.csv' } = req.body;
    
    logger.info('🔍 Job Discovery API request received', {
      domain,
      filters,
      configPath
    });
    
    // Validate required fields
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is required',
        message: 'Please provide a domain for job discovery'
      });
    }
    
    // Run the job discovery workflow
    const result = await runJobDiscoveryFromConfig(configPath, domain, filters);
    
    // Extract processed URLs and scraped jobs
    const processedUrls = result.processedUrls || [];
    const scrapedJobs = result.scrapedJobs || [];
    
    logger.info(`✅ Job Discovery completed. Processed ${processedUrls.length} URLs, scraped ${scrapedJobs.length} jobs`);
    
    // Return processed URLs and scraped jobs
    res.json({
      success: true,
      domain,
      filters,
      processedUrls: processedUrls.map(url => ({
        originalTemplate: url.originalTemplate,
        finalUrl: url.finalUrl,
        description: url.description
      })),
      scrapedJobs: scrapedJobs.map(job => ({
        title: job.title,
        company: job.company,
        description: job.description,
        salary: job.salary,
        postedDate: job.postedDate,
        source: job.source,
        scrapedAt: job.scrapedAt
      })),
      jobDescriptions: result.jobDescriptions || [], // Add the complete job description format
      count: {
        urls: processedUrls.length,
        jobs: scrapedJobs.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ Job Discovery API failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Job discovery processing failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 