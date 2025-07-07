import { StateGraph, END } from '@langchain/langgraph';
import { config } from './config/environment.js';
import { logger } from './utils/logger.js';
import { readJobUrlsFromCSV, mockJobUrls } from './utils/csvReader.js';
import { urlProcessorNode } from './nodes/urlProcessor.js';
import { jobScraperNode } from './nodes/jobScraper.js';
import { dataProcessorNode } from './nodes/dataProcessor.js';
import { outputGeneratorNode } from './nodes/outputGenerator.js';
import { enhancedStagehandClient } from './shared/utils/enhancedStagehand.js';

// Define the state schema
const stateSchema = {
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
};

// Create the workflow graph
function createJobScrapingGraph() {
  const workflow = new StateGraph({
    channels: stateSchema,
  });

  // Add nodes to the graph
  workflow.addNode('urlProcessor', urlProcessorNode);
  workflow.addNode('jobScraper', jobScraperNode);
  workflow.addNode('dataProcessor', dataProcessorNode);
  workflow.addNode('outputGenerator', outputGeneratorNode);

  // Define the workflow edges
  workflow.addEdge('urlProcessor', 'jobScraper');
  workflow.addEdge('jobScraper', 'dataProcessor');
  workflow.addEdge('dataProcessor', 'outputGenerator');
  workflow.addEdge('outputGenerator', END);

  // Set the entry point
  workflow.setEntryPoint('urlProcessor');

  return workflow.compile();
}

// Main function to process a single job URL
async function processJobUrl(jobUrl) {
  logger.info('Starting job processing workflow', { jobUrl });
  
  try {
    const graph = createJobScrapingGraph();
    
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
    };

    const result = await graph.invoke(initialState);
    
    logger.info('Job processing workflow completed', {
      jobUrl,
      isValid: result.isValid,
      scraped: result.scraped,
      processed: result.processed,
      saved: result.saved,
      outputFile: result.outputFile,
      error: result.error,
    });

    return result;
    
  } catch (error) {
    logger.error('Error in job processing workflow', {
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

// Function to process multiple job URLs
async function processJobUrls(jobUrls) {
  logger.info('Starting batch job processing', { totalUrls: jobUrls.length });
  
  const results = [];
  const summary = {
    total: jobUrls.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < jobUrls.length; i++) {
    const jobUrl = jobUrls[i];
    logger.info(`Processing job ${i + 1}/${jobUrls.length}`, { jobUrl });
    
    try {
      const result = await processJobUrl(jobUrl);
      results.push(result);
      
      if (result.saved) {
        summary.successful++;
      } else {
        summary.failed++;
        if (result.error) {
          summary.errors.push({ jobUrl, error: result.error });
        }
      }
      
      // Add a small delay between requests to be respectful
      if (i < jobUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      logger.error('Error processing job URL', { jobUrl, error: error.message });
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

  logger.info('Batch job processing completed', summary);
  return { results, summary };
}

// Main application entry point
async function main() {
  try {
    // Configuration is already validated in environment.js
    logger.info('Configuration validated successfully');
    
    // Check if we should use mock data or CSV
    const useMockData = process.argv.includes('--mock');
    
    let jobUrls;
    if (useMockData) {
      logger.info('Using mock job URLs for testing');
      jobUrls = mockJobUrls;
    } else {
      // Read job URLs from CSV
      jobUrls = await readJobUrlsFromCSV(config.paths.csvInput);
    }
    
    if (!jobUrls || jobUrls.length === 0) {
      logger.error('No job URLs found to process');
      process.exit(1);
    }
    
    // Process the job URLs
    const { results, summary } = await processJobUrls(jobUrls);
    
    // Print summary
    console.log('\n=== JOB PROCESSING SUMMARY ===');
    console.log(`Total URLs: ${summary.total}`);
    console.log(`Successful: ${summary.successful}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Success Rate: ${((summary.successful / summary.total) * 100).toFixed(1)}%`);
    
    if (summary.errors.length > 0) {
      console.log('\n=== ERRORS ===');
      summary.errors.forEach(({ jobUrl, error }) => {
        console.log(`- ${jobUrl}: ${error}`);
      });
    }
    
    console.log('\nProcessing completed!');
    
  } catch (error) {
    logger.error('Application error', { error: error.message });
    console.error('Application failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up Stagehand client
    await enhancedStagehandClient.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await enhancedStagehandClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await enhancedStagehandClient.close();
  process.exit(0);
});

// Run the application if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processJobUrl, processJobUrls, createJobScrapingGraph }; 