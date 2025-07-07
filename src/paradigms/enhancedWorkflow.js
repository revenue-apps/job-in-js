import { StateGraph, END } from '@langchain/langgraph';
import { validateConfig } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { readJobUrlsFromCSV, mockJobUrls } from '../utils/csvReader.js';
import { urlProcessorNode } from '../nodes/urlProcessor.js';
import { jobScraperNode } from '../nodes/jobScraper.js';
import { dataProcessorNode } from '../nodes/dataProcessor.js';
import { outputGeneratorNode } from '../nodes/outputGenerator.js';
import { enhancedStagehandClient } from '../shared/utils/enhancedStagehand.js';

// Import AI Agent Paradigms
import { reflectionNode } from './reflectionNode.js';
import { planningNode } from './planningNode.js';
import { memoryNode } from './memoryNode.js';

// Enhanced state schema with AI agent paradigms
const enhancedStateSchema = {
  // Original state fields
  jobUrl: { value: '' },
  isValid: { value: false },
  jobData: { value: null },
  scraped: { value: false },
  processedJob: { value: null },
  processed: { value: false },
  outputFile: { value: null },
  saved: { value: false },
  error: { value: null },
  processedAt: { value: null },
  scrapedAt: { value: null },
  savedAt: { value: null },
  
  // AI Agent Paradigm fields
  plan: { value: null },
  strategy: { value: '' },
  approach: { value: '' },
  plannedAt: { value: null },
  
  memory: { value: null },
  learnedPatterns: { value: [] },
  recommendations: { value: [] },
  rememberedAt: { value: null },
  
  reflection: { value: null },
  shouldRetry: { value: false },
  improvement: { value: '' },
  reflectedAt: { value: null },
  
  // Enhanced workflow control
  attemptCount: { value: 0 },
  maxAttempts: { value: 3 },
  workflowPhase: { value: 'initial' },
};

// Create the enhanced workflow graph with AI agent paradigms
function createEnhancedJobScrapingGraph() {
  const workflow = new StateGraph({
    channels: enhancedStateSchema,
  });

  // Add original nodes
  workflow.addNode('urlProcessor', urlProcessorNode);
  workflow.addNode('jobScraper', jobScraperNode);
  workflow.addNode('dataProcessor', dataProcessorNode);
  workflow.addNode('outputGenerator', outputGeneratorNode);

  // Add AI agent paradigm nodes
  workflow.addNode('planning', planningNode);
  workflow.addNode('memory', memoryNode);
  workflow.addNode('reflection', reflectionNode);

  // Define the enhanced workflow edges
  workflow.addEdge('urlProcessor', 'planning');
  workflow.addEdge('planning', 'memory');
  workflow.addEdge('memory', 'jobScraper');
  workflow.addEdge('jobScraper', 'dataProcessor');
  workflow.addEdge('dataProcessor', 'reflection');
  
  // Conditional edge based on reflection
  workflow.addConditionalEdges(
    'reflection',
    (state) => {
      if (state.shouldRetry && state.attemptCount < state.maxAttempts) {
        return 'retry_scraper';
      }
      return 'outputGenerator';
    }
  );
  
  // Retry path
  workflow.addEdge('retry_scraper', 'jobScraper');
  
  // Final output
  workflow.addEdge('outputGenerator', END);

  // Set the entry point
  workflow.setEntryPoint('urlProcessor');

  return workflow.compile();
}

// Enhanced job scraper node that uses planning and memory
async function enhancedJobScraperNode(state) {
  const nodeName = 'enhancedJobScraper';
  logger.langgraph(nodeName, 'Starting enhanced job scraping', { 
    jobUrl: state.jobUrl,
    strategy: state.strategy,
    approach: state.approach,
    attemptCount: state.attemptCount
  });
  
  try {
    const { jobUrl, isValid, strategy, approach, recommendations, attemptCount } = state;
    
    // Skip scraping if URL is invalid
    if (!isValid) {
      logger.langgraph(nodeName, 'Skipping invalid URL', { jobUrl });
      return {
        ...state,
        jobData: null,
        scraped: false,
        error: 'Invalid URL format',
        attemptCount: attemptCount + 1,
      };
    }
    
    // Apply recommendations from memory
    const enhancedJobData = await scrapeWithRecommendations(jobUrl, strategy, approach, recommendations);
    
    if (!enhancedJobData) {
      logger.langgraph(nodeName, 'Enhanced scraping failed', { jobUrl });
      return {
        ...state,
        jobData: null,
        scraped: false,
        error: 'Enhanced scraping failed',
        attemptCount: attemptCount + 1,
      };
    }
    
    logger.langgraph(nodeName, 'Enhanced job scraping completed successfully', { 
      jobUrl,
      title: enhancedJobData.title,
      company: enhancedJobData.company,
      strategy,
      approach,
    });
    
    return {
      ...state,
      jobData: enhancedJobData,
      scraped: true,
      scrapedAt: new Date().toISOString(),
      attemptCount: attemptCount + 1,
    };
    
  } catch (error) {
    logger.langgraph(nodeName, 'Error in enhanced job scraping', { 
      error: error.message, 
      jobUrl: state.jobUrl 
    });
    
    return {
      ...state,
      jobData: null,
      scraped: false,
      error: error.message,
      scrapedAt: new Date().toISOString(),
      attemptCount: state.attemptCount + 1,
    };
  }
}

// Enhanced scraping function that uses recommendations
async function scrapeWithRecommendations(jobUrl, strategy, approach, recommendations) {
  logger.info('Applying recommendations for enhanced scraping', { 
    jobUrl, 
    strategy, 
    approach, 
    recommendations 
  });
  
  // Apply strategy-specific modifications
  const scrapingConfig = getScrapingConfig(strategy, approach);
  
  // Apply memory-based recommendations
  const enhancedConfig = applyRecommendations(scrapingConfig, recommendations);
  
  // Perform the enhanced scraping
      const jobData = await enhancedStagehandClient.scrapeJob(jobUrl);
  
  // Apply post-processing based on recommendations
  return applyPostProcessing(jobData, enhancedConfig);
}

function getScrapingConfig(strategy, approach) {
  const configs = {
    optimistic: {
      fast_extraction: {
        waitTime: 2000,
        retryAttempts: 1,
        extractionScope: 'focused'
      },
      thorough_extraction: {
        waitTime: 5000,
        retryAttempts: 2,
        extractionScope: 'comprehensive'
      }
    },
    cautious: {
      thorough_extraction: {
        waitTime: 8000,
        retryAttempts: 3,
        extractionScope: 'comprehensive'
      },
      fallback_extraction: {
        waitTime: 10000,
        retryAttempts: 5,
        extractionScope: 'fallback'
      }
    },
    defensive: {
      fallback_extraction: {
        waitTime: 15000,
        retryAttempts: 5,
        extractionScope: 'fallback'
      },
      basic_scraping: {
        waitTime: 3000,
        retryAttempts: 1,
        extractionScope: 'basic'
      }
    }
  };
  
  return configs[strategy]?.[approach] || configs.optimistic.fast_extraction;
}

function applyRecommendations(config, recommendations) {
  const enhancedConfig = { ...config };
  
  recommendations.forEach(recommendation => {
    switch (recommendation) {
      case 'increase_wait_time':
        enhancedConfig.waitTime *= 1.5;
        break;
      case 'use_alternative_approach':
        enhancedConfig.extractionScope = 'alternative';
        break;
      case 'prefer_thorough_extraction':
        enhancedConfig.extractionScope = 'comprehensive';
        enhancedConfig.retryAttempts = Math.max(enhancedConfig.retryAttempts, 3);
        break;
      case 'consider_delaying_until_better_time':
        enhancedConfig.waitTime += 5000; // Add 5 second delay
        break;
    }
  });
  
  return enhancedConfig;
}

function applyPostProcessing(jobData, config) {
  if (!jobData) return null;
  
  // Apply scope-specific processing
  if (config.extractionScope === 'comprehensive') {
    // Add additional data extraction
    jobData.extractionMethod = 'comprehensive';
    jobData.extractionConfig = config;
  } else if (config.extractionScope === 'fallback') {
    // Use fallback processing
    jobData.extractionMethod = 'fallback';
    jobData.extractionConfig = config;
  }
  
  return jobData;
}

// Main function to process a single job URL with AI agent paradigms
async function processJobUrlWithParadigms(jobUrl) {
  logger.info('Starting enhanced job processing workflow with AI paradigms', { jobUrl });
  
  try {
    const graph = createEnhancedJobScrapingGraph();
    
    const initialState = {
      jobUrl,
      isValid: false,
      jobData: null,
      scraped: false,
      processedJob: null,
      processed: false,
      outputFile: null,
      saved: false,
      error: null,
      processedAt: null,
      scrapedAt: null,
      savedAt: null,
      
      // AI Agent Paradigm initial state
      plan: null,
      strategy: '',
      approach: '',
      plannedAt: null,
      
      memory: null,
      learnedPatterns: [],
      recommendations: [],
      rememberedAt: null,
      
      reflection: null,
      shouldRetry: false,
      improvement: '',
      reflectedAt: null,
      
      // Enhanced workflow control
      attemptCount: 0,
      maxAttempts: 3,
      workflowPhase: 'initial',
    };

    const result = await graph.invoke(initialState);
    
    logger.info('Enhanced job processing workflow completed', {
      jobUrl,
      isValid: result.isValid,
      scraped: result.scraped,
      processed: result.processed,
      saved: result.saved,
      outputFile: result.outputFile,
      error: result.error,
      strategy: result.strategy,
      approach: result.approach,
      attemptCount: result.attemptCount,
      shouldRetry: result.shouldRetry,
    });

    return result;
    
  } catch (error) {
    logger.error('Error in enhanced job processing workflow', {
      jobUrl,
      error: error.message,
    });
    
    return {
      jobUrl,
      error: error.message,
      isValid: false,
      scraped: false,
      processed: false,
      saved: false,
    };
  }
}

// Function to process multiple job URLs with AI agent paradigms
async function processJobUrlsWithParadigms(jobUrls) {
  logger.info('Starting enhanced batch job processing with AI paradigms', { totalUrls: jobUrls.length });
  
  const results = [];
  const summary = {
    total: jobUrls.length,
    successful: 0,
    failed: 0,
    retried: 0,
    errors: [],
    strategies: {},
    paradigms: {
      planningUsed: 0,
      memoryUsed: 0,
      reflectionUsed: 0,
    }
  };

  for (let i = 0; i < jobUrls.length; i++) {
    const jobUrl = jobUrls[i];
    logger.info(`Processing job ${i + 1}/${jobUrls.length} with AI paradigms`, { jobUrl });
    
    try {
      const result = await processJobUrlWithParadigms(jobUrl);
      results.push(result);
      
      if (result.saved) {
        summary.successful++;
      } else {
        summary.failed++;
        if (result.error) {
          summary.errors.push({ jobUrl, error: result.error });
        }
      }
      
      // Track strategy usage
      if (result.strategy) {
        summary.strategies[result.strategy] = (summary.strategies[result.strategy] || 0) + 1;
      }
      
      // Track paradigm usage
      if (result.plan) summary.paradigms.planningUsed++;
      if (result.memory) summary.paradigms.memoryUsed++;
      if (result.reflection) summary.paradigms.reflectionUsed++;
      if (result.attemptCount > 1) summary.retried++;
      
      // Add a small delay between requests to be respectful
      if (i < jobUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      logger.error('Error processing job URL with AI paradigms', { jobUrl, error: error.message });
      summary.failed++;
      summary.errors.push({ jobUrl, error: error.message });
      
      results.push({
        jobUrl,
        error: error.message,
        isValid: false,
        scraped: false,
        processed: false,
        saved: false,
      });
    }
  }

  logger.info('Enhanced batch job processing completed', summary);
  return { results, summary };
}

// Enhanced main application entry point
async function mainWithParadigms() {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated successfully for enhanced workflow');
    
    // Check if we should use mock data or CSV
    const useMockData = process.argv.includes('--mock');
    
    let jobUrls;
    if (useMockData) {
      logger.info('Using mock job URLs for enhanced testing');
      jobUrls = mockJobUrls;
    } else {
      // Read job URLs from CSV
      const envModule = await import('../config/environment.js');
      jobUrls = await readJobUrlsFromCSV(envModule.config.paths.csvInput);
    }
    
    if (!jobUrls || jobUrls.length === 0) {
      logger.error('No job URLs found to process');
      process.exit(1);
    }
    
    // Process the job URLs with AI agent paradigms
    const { results, summary } = await processJobUrlsWithParadigms(jobUrls);
    
    // Print enhanced summary
    console.log('\n=== ENHANCED JOB PROCESSING SUMMARY (with AI Paradigms) ===');
    console.log(`Total URLs: ${summary.total}`);
    console.log(`Successful: ${summary.successful}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Retried: ${summary.retried}`);
    console.log(`Success Rate: ${((summary.successful / summary.total) * 100).toFixed(1)}%`);
    
    console.log('\n=== AI PARADIGM USAGE ===');
    console.log(`Planning Used: ${summary.paradigms.planningUsed}`);
    console.log(`Memory Used: ${summary.paradigms.memoryUsed}`);
    console.log(`Reflection Used: ${summary.paradigms.reflectionUsed}`);
    
    console.log('\n=== STRATEGY DISTRIBUTION ===');
    Object.entries(summary.strategies).forEach(([strategy, count]) => {
      console.log(`${strategy}: ${count}`);
    });
    
    if (summary.errors.length > 0) {
      console.log('\n=== ERRORS ===');
      summary.errors.forEach(({ jobUrl, error }) => {
        console.log(`- ${jobUrl}: ${error}`);
      });
    }
    
    console.log('\nEnhanced processing completed!');
    
  } catch (error) {
    logger.error('Enhanced application error', { error: error.message });
    console.error('Enhanced application failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up Stagehand client
    await enhancedStagehandClient.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down enhanced workflow gracefully...');
  await enhancedStagehandClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down enhanced workflow gracefully...');
  await enhancedStagehandClient.close();
  process.exit(0);
});

// Export enhanced functions
export { 
  processJobUrlWithParadigms, 
  processJobUrlsWithParadigms, 
  createEnhancedJobScrapingGraph,
  mainWithParadigms 
}; 