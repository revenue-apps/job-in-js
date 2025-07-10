import { StateGraph } from '@langchain/langgraph';
import { urlConstructionNode } from '../../new-nodes/processing/urlConstructionNode.js';
import { jobListingScraperNode } from '../../new-nodes/scraping/jobListingScraperNode.js';
import { jobDiscoveryStateSchema } from '../../shared/utils/jobDiscoveryState.js';
import { enhancedStagehandClient } from '../../shared/utils/enhancedStagehand.js';

const createJobDiscoveryWorkflow = () => {
  const workflow = new StateGraph({
    channels: jobDiscoveryStateSchema
  });
  
  // Add nodes
  workflow.addNode('url_construction', urlConstructionNode);
  workflow.addNode('job_scraper', jobListingScraperNode);
  
  // Add edges
  workflow.addEdge('url_construction', 'job_scraper');
  workflow.addEdge('job_scraper', '__end__');
  
  // Set entry point
  workflow.setEntryPoint('url_construction');
  
  return workflow.compile();
};

export const runJobDiscoveryWorkflow = async (configPath, domain = null, filters = {}) => {
  console.log('🚀 Starting Job Discovery Workflow');
  
  try {
    // Use enhanced stagehand client
    await enhancedStagehandClient.start();
    
    // Initialize page and agent
    const page = await enhancedStagehandClient.newPage();
    const agent = await enhancedStagehandClient.newAgent();
    
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
      errors: []
    };
    
    // Run workflow
    const workflow = createJobDiscoveryWorkflow();
    const result = await workflow.invoke(initialState);
    
    console.log('✅ Job Discovery Workflow completed');
    console.log(`📊 Processed ${result.processedUrls?.length || 0} URLs`);
    console.log(`💼 Scraped ${result.scrapedJobs?.length || 0} jobs`);
    console.log(JSON.stringify(result.scrapedJobs, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Job Discovery Workflow failed:', error.message);
    throw error;
  }
};

export const runJobDiscoveryFromConfig = async (configPath, domain = null, filters = {}) => {
  return await runJobDiscoveryWorkflow(configPath, domain, filters);
};
