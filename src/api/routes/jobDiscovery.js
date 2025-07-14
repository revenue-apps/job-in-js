import express from 'express';
import { readFileSync, existsSync } from 'fs';
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
      storedJobs: result.storedJobs || [], // Add the stored jobs from DynamoDB
      storageErrors: result.storageErrors || [], // Add storage errors
      count: {
        urls: processedUrls.length,
        jobs: scrapedJobs.length,
        stored: result.storedJobs?.length || 0,
        storageErrors: result.storageErrors?.length || 0
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

// GET /job-discovery/state - Get current discovery state
router.get('/state', async (req, res) => {
  try {
    const stateFile = './config/discovery_state.json';
    
    if (!existsSync(stateFile)) {
      return res.json({
        success: true,
        state: {
          currentDomainIndex: 0,
          lastRun: null,
          lastProcessedDomain: null,
          nextDomainToProcess: null
        },
        message: 'No state file found, will start from first domain'
      });
    }
    
    const stateData = readFileSync(stateFile, 'utf-8');
    const state = JSON.parse(stateData);
    
    // Load config to get domain names
    const configPath = './config/discovery_inputs.json';
    const configData = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    const enabledInputs = config.discovery_inputs.filter(input => input.enabled !== false);
    
    res.json({
      success: true,
      state: {
        ...state,
        totalDomains: enabledInputs.length,
        currentDomainName: enabledInputs[state.currentDomainIndex]?.name || 'Unknown',
        nextDomainName: enabledInputs[state.currentDomainIndex]?.name || 'Unknown'
      },
      domains: enabledInputs.map((input, index) => ({
        index,
        name: input.name,
        domain: input.domain,
        description: input.description,
        isCurrent: index === state.currentDomainIndex
      }))
    });
    
  } catch (error) {
    logger.error('❌ Failed to get discovery state:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get discovery state'
    });
  }
});

// POST /job-discovery/trigger/:domainIndex - Manually trigger specific domain
router.post('/trigger/:domainIndex', async (req, res) => {
  try {
    const domainIndex = parseInt(req.params.domainIndex);
    
    // Load config
    const configPath = './config/discovery_inputs.json';
    const configData = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    const enabledInputs = config.discovery_inputs.filter(input => input.enabled !== false);
    
    if (domainIndex < 0 || domainIndex >= enabledInputs.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid domain index',
        message: `Domain index must be between 0 and ${enabledInputs.length - 1}`
      });
    }
    
    const targetInput = enabledInputs[domainIndex];
    
    logger.info(`🔧 Manually triggering discovery for domain: ${targetInput.name}`);
    
    // Run discovery for the specific domain
    const result = await runJobDiscoveryFromConfig(
      targetInput.config_path, 
      targetInput.domain, 
      targetInput.filters
    );
    
    logger.info(`✅ Manual discovery completed for ${targetInput.name}`);
    
    res.json({
      success: true,
      domain: targetInput.name,
      domainIndex,
      result: {
        processedUrls: result.processedUrls?.length || 0,
        scrapedJobs: result.scrapedJobs?.length || 0,
        storedJobs: result.storedJobs?.length || 0,
        errors: result.errors?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ Manual discovery trigger failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Manual discovery trigger failed'
    });
  }
});

export default router; 