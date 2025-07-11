import { z } from 'zod';

export const jobDiscoveryStateSchema = {
  // Input configuration
  configPath: z.string().describe('Path to the CSV file containing job discovery URLs'),
  domain: z.string().optional().describe('Target domain for job search (e.g., "software engineering", "data science")'),
  filters: z.record(z.any()).optional().describe('Search filters like keywords, location, experience level, etc.'),
  
  // Browser automation
  page: z.any().optional().describe('Browser page instance'),
  agent: z.any().optional().describe('Browser agent instance'),
  
  // Workflow state
  currentStep: z.string().describe('Current step in the workflow'),
  
  // Processed data
  processedUrls: z.array(z.object({
    originalTemplate: z.string(),
    finalUrl: z.string(),
    description: z.string(),
    domain: z.string().optional(),
    filters: z.record(z.any()).optional()
  })).optional().describe('URLs processed and ready for scraping'),
  
  scrapedJobs: z.array(z.object({
    url: z.string().optional(),
    title: z.string(),
    company: z.string().optional(),
    description: z.string().optional(),
    salary: z.string().optional(),
    postedDate: z.string().optional(),
    source: z.string(),
    scrapedAt: z.string()
  })).optional().describe('Jobs scraped from job sites'),
  
  jobDescriptions: z.array(z.object({
    url: z.string(),
    company: z.string(),
    domain: z.string().optional(),
    filters: z.record(z.any()).optional(),
    source: z.string().optional()
  })).optional().describe('Job descriptions with company, domain, filters'),
  
  storedJobs: z.array(z.record(z.any())).optional().describe('Jobs stored in DynamoDB'),
  storageErrors: z.array(z.record(z.any())).optional().describe('Errors from DynamoDB storage'),
  
  // Error handling
  errors: z.array(z.object({
    step: z.string(),
    error: z.string(),
    timestamp: z.string()
  })).optional().describe('Errors encountered during processing')
}; 