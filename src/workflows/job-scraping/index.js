import { StateGraph, END } from '@langchain/langgraph';
import { urlProcessorNode } from './nodes/urlProcessor.js';
import { jobScraperNode } from './nodes/jobScraper.js';
import { dataProcessorNode } from './nodes/dataProcessor.js';
import { outputGeneratorNode } from './nodes/outputGenerator.js';
import { jobScrapingStateSchema } from './types.js';

export function createJobScrapingWorkflow() {
  const workflow = new StateGraph({
    channels: jobScrapingStateSchema,
  });

  // Add nodes
  workflow.addNode('urlProcessor', urlProcessorNode);
  workflow.addNode('jobScraper', jobScraperNode);
  workflow.addNode('dataProcessor', dataProcessorNode);
  workflow.addNode('outputGenerator', outputGeneratorNode);

  // Define the workflow edges
  workflow.setEntryPoint('urlProcessor');
  workflow.addEdge('urlProcessor', 'jobScraper');
  workflow.addEdge('jobScraper', 'dataProcessor');
  workflow.addEdge('dataProcessor', 'outputGenerator');
  workflow.addEdge('outputGenerator', END);

  return workflow.compile();
}

// Main processing function
export async function processJobUrl(jobUrl) {
  const workflow = createJobScrapingWorkflow();
  
  const initialState = {
    jobUrl,
  };
  
  const result = await workflow.invoke(initialState);
  return result;
}

// Batch processing function
export async function processJobUrls(jobUrls) {
  const results = [];
  const errors = [];
  
  for (const jobUrl of jobUrls) {
    try {
      const result = await processJobUrl(jobUrl);
      results.push(result);
    } catch (error) {
      errors.push({ jobUrl, error: error.message });
    }
  }
  
  return {
    results,
    errors,
    summary: {
      total: jobUrls.length,
      successful: results.length,
      failed: errors.length,
    },
  };
} 