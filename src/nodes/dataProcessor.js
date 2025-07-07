import { logger } from '../utils/logger.js';

/**
 * Data Processor Node
 * 
 * Input: { jobUrl: string, jobData: object, scraped: boolean }
 * Output: { jobUrl: string, processedJob: object, processed: boolean, error?: string }
 */
export async function dataProcessorNode(state) {
  const nodeName = 'dataProcessor';
  logger.langgraph(nodeName, 'Starting data processing', { jobUrl: state.jobUrl });
  
  try {
    const { jobUrl, jobData, scraped } = state;
    
    // Skip processing if scraping failed
    if (!scraped || !jobData) {
      logger.langgraph(nodeName, 'Skipping processing - no job data', { jobUrl });
      return {
        ...state,
        processedJob: null,
        processed: false,
        error: 'No job data to process',
      };
    }
    
    // Process and structure the job data
    const processedJob = processJobData(jobData, jobUrl);
    
    if (!processedJob) {
      logger.langgraph(nodeName, 'Job data processing failed', { jobUrl });
      return {
        ...state,
        processedJob: null,
        processed: false,
        error: 'Failed to process job data structure',
      };
    }
    
    logger.langgraph(nodeName, 'Data processing completed', { 
      jobUrl,
      title: processedJob.title,
      company: processedJob.company,
    });
    
    return {
      ...state,
      processedJob,
      processed: true,
      processedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    logger.langgraph(nodeName, 'Error in data processing', { 
      error: error.message, 
      jobUrl: state.jobUrl 
    });
    
    return {
      ...state,
      processedJob: null,
      processed: false,
      error: error.message,
      processedAt: new Date().toISOString(),
    };
  }
}

function processJobData(jobData, originalUrl) {
  try {
    // Extract and clean job description
    const description = cleanDescription(jobData.description);
    
    // Extract key information
    const processedJob = {
      // Basic information
      title: jobData.title?.trim() || '',
      company: jobData.company?.trim() || '',
      location: jobData.location?.trim() || '',
      url: jobData.url || originalUrl,
      
      // Structured description
      description: {
        full: description,
        summary: extractSummary(description),
        requirements: extractRequirements(description),
        responsibilities: extractResponsibilities(description),
      },
      
      // Metadata
      scrapedAt: jobData.scrapedAt || new Date().toISOString(),
      processedAt: new Date().toISOString(),
      
      // Analysis
      wordCount: description.split(/\s+/).length,
      hasRequirements: description.toLowerCase().includes('requirements') || 
                      description.toLowerCase().includes('qualifications'),
      hasResponsibilities: description.toLowerCase().includes('responsibilities') || 
                          description.toLowerCase().includes('duties'),
    };
    
    // Validate required fields
    if (!processedJob.title || !processedJob.company || !processedJob.description.full) {
      return null;
    }
    
    return processedJob;
    
  } catch (error) {
    logger.error('Error processing job data', { error: error.message, originalUrl });
    return null;
  }
}

function cleanDescription(description) {
  if (!description) return '';
  
  return description
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n+/g, '\n') // Normalize line breaks
    .trim();
}

function extractSummary(description) {
  // Extract first paragraph or first 200 characters
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return '';
  
  const firstSentence = sentences[0].trim();
  return firstSentence.length > 200 
    ? firstSentence.substring(0, 200) + '...'
    : firstSentence;
}

function extractRequirements(description) {
  const lowerDesc = description.toLowerCase();
  const requirements = [];
  
  // Common requirement patterns
  const patterns = [
    /requirements?[:\s]+([^.!?]+)/gi,
    /qualifications?[:\s]+([^.!?]+)/gi,
    /must have[:\s]+([^.!?]+)/gi,
    /should have[:\s]+([^.!?]+)/gi,
    /experience[:\s]+([^.!?]+)/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        requirements.push(match[1].trim());
      }
    }
  });
  
  return requirements.length > 0 ? requirements : null;
}

function extractResponsibilities(description) {
  const lowerDesc = description.toLowerCase();
  const responsibilities = [];
  
  // Common responsibility patterns
  const patterns = [
    /responsibilities?[:\s]+([^.!?]+)/gi,
    /duties?[:\s]+([^.!?]+)/gi,
    /will[:\s]+([^.!?]+)/gi,
    /responsible for[:\s]+([^.!?]+)/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        responsibilities.push(match[1].trim());
      }
    }
  });
  
  return responsibilities.length > 0 ? responsibilities : null;
} 