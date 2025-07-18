import { StateGraph, END } from '@langchain/langgraph';
import { urlConstructionNode } from '../../new-nodes/processing/urlConstructionNode.js';
import { jobListingScraperNode } from '../../new-nodes/scraping/jobListingScraperNode.js';
import { paginationScraperNode } from '../../new-nodes/scraping/paginationScraperNode.js';
import { urlIteratorNode } from './urlIteratorNode.js';
import { storageNode } from './storageNode.js';
import { jobDiscoveryStateSchema } from '../../shared/utils/jobDiscoveryState.js';
import { enhancedStagehandClient } from '../../shared/utils/enhancedStagehand.js';
import { logger } from '../../shared/utils/logger.js';

const createJobDiscoveryWorkflow = (urlCount = 5) => {
  const workflow = new StateGraph({
    channels: jobDiscoveryStateSchema
  });

  // Add nodes
  workflow.addNode('url_construction', urlConstructionNode);
  workflow.addNode('url_iterator', urlIteratorNode);
  workflow.addNode('job_scraper', jobListingScraperNode);
  workflow.addNode('pagination_scraper', paginationScraperNode);
  workflow.addNode('storage', storageNode);

  // Add edges
  workflow.addEdge('url_construction', 'url_iterator');
  workflow.addConditionalEdges('url_iterator', shouldContinueToNextUrl);
  workflow.addEdge('job_scraper', 'pagination_scraper');
  workflow.addConditionalEdges('pagination_scraper', shouldContinueToNextPage);
  workflow.addEdge('storage', END);

  // Set entry point
  workflow.setEntryPoint('url_construction');

  // Calculate recursion limit dynamically
  const MAX_PAGES_PER_URL = 10;
  const totalIterations = urlCount + (urlCount * MAX_PAGES_PER_URL); // URLs + pages
  const recursionLimit = Math.max(100, totalIterations + 100); // Minimum 100, add buffer

  logger.info(`📊 Dynamic recursion limit calculation:`);
  logger.info(`- URLs: ${urlCount}`);
  logger.info(`- Max pages per URL: ${MAX_PAGES_PER_URL}`);
  logger.info(`- Total iterations: ${totalIterations}`);
  logger.info(`- Recursion limit: ${recursionLimit}`);

  const compiledWorkflow = workflow.compile({
    recursionLimit: recursionLimit,
    checkpointer: undefined
  });

  logger.info(`📊 Compiled workflow recursion limit: ${recursionLimit}`);

  return compiledWorkflow;
};

export const runJobDiscoveryWorkflow = async (configPath, domain = null, filters = {}) => {
  logger.info('🚀 Starting Job Discovery Workflow');

  try {
    // Use enhanced stagehand client
    await enhancedStagehandClient.start();

    // Initialize page and agent
    const page = await enhancedStagehandClient.newPage();
    const agent = await enhancedStagehandClient.newAgent();

    // Read CSV to get URL count for recursion limit
    const { readFileSync } = await import('fs');
    const { parse } = await import('csv-parse/sync');

    const csvContent = readFileSync(configPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    const urlCount = records.length;
    logger.info(`📊 Found ${urlCount} URLs in config file`);

    // Create initial state
    const initialState = {
      configPath,
      domain,
      filters,
      page,
      agent,
      currentStep: 'start',
      processedUrls: [],
      scrapedJobs: [],
      errors: [],
      currentUrlIndex: 0
    };

    // Run workflow with dynamic recursion limit
    const workflow = createJobDiscoveryWorkflow(urlCount);
    logger.info(`📊 About to invoke workflow with ${urlCount} URLs`);
    const result = await workflow.invoke(initialState, {
      recursionLimit: Math.max(100, urlCount * 15) // Ensure high enough limit
    });

    logger.info('✅ Job Discovery Workflow completed');
    logger.info(`�� Processed ${result.processedUrls?.length || 0} URLs`);
    logger.info(`💼 Scraped ${result.scrapedJobs?.length || 0} jobs`);

    return result;

  } catch (error) {
    logger.error('❌ Job Discovery Workflow failed:', error.message);
    throw error;
  }
};

// Conditional edge functions
const shouldContinueToNextPage = (state) => {
  const hasMorePages = state.pagination?.hasMorePages || false;
  const nextPageUrl = state.pagination?.nextPageUrl;

  logger.info(`Pagination decision: hasMorePages=${hasMorePages}, nextPageUrl=${nextPageUrl}`);

  if (hasMorePages && nextPageUrl) {
    logger.info('🔄 Continuing to next page for current URL');
    return 'job_scraper';
  } else {
    logger.info('✅ No more pages for current URL, moving to next URL');
    return 'url_iterator';
  }
};

const shouldContinueToNextUrl = (state) => {
  const processedUrls = state.processedUrls || [];
  const currentUrlIndex = state.currentUrlIndex;

  logger.info(`URL iteration decision: currentUrlIndex=${currentUrlIndex}, totalUrls=${processedUrls.length}`);
  const { currentStep } = state;
  if (currentStep === 'url_iterator_complete') {
    logger.info('✅ All URLs processed, moving to storage');
    return 'storage';
  } else {
    logger.info('🔄 Continuing to next URL');
    return 'job_scraper'
  }
};

export const runJobDiscoveryFromConfig = async (configPath, domain = null, filters = {}) => {
  return await runJobDiscoveryWorkflow(configPath, domain, filters);
};
