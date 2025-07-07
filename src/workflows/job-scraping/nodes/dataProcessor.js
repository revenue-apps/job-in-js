import { logger } from '../../../shared/utils/logger.js';

/**
 * Data Processor Node
 * 
 * Input: { jobUrl: string, jobData: object, scraped: boolean }
 * Output: { jobUrl: string, processedJob: object, processed: boolean, error?: string }
 */
export async function dataProcessorNode(state) {
  const { jobUrl, scrapedJob } = state;
  
  logger.info('Processing job data', { jobUrl });
  
  try {
    if (!scrapedJob) {
      logger.warn('No scraped job data to process', { jobUrl });
      return {
        ...state,
        processedJob: null,
        processed: false,
        error: 'No scraped job data available',
      };
    }
    
    // Process and structure the job data
    const processedJob = {
      metadata: {
        scrapedAt: new Date().toISOString(),
        sourceUrl: jobUrl,
        platform: extractPlatform(jobUrl),
      },
      basic: {
        title: scrapedJob.title || 'Unknown Title',
        company: scrapedJob.company || 'Unknown Company',
        location: scrapedJob.location || 'Unknown Location',
        type: scrapedJob.type || 'Unknown Type',
        salary: scrapedJob.salary || 'Not specified',
      },
      description: {
        full: scrapedJob.description || '',
        summary: extractSummary(scrapedJob.description),
        requirements: extractRequirements(scrapedJob.description),
        responsibilities: extractResponsibilities(scrapedJob.description),
      },
      analysis: {
        wordCount: scrapedJob.description ? scrapedJob.description.split(' ').length : 0,
        hasSalary: !!scrapedJob.salary,
        hasRequirements: extractRequirements(scrapedJob.description).length > 0,
        hasResponsibilities: extractResponsibilities(scrapedJob.description).length > 0,
      },
    };
    
    logger.info('Job data processing completed', { 
      jobUrl, 
      title: processedJob.basic.title,
      company: processedJob.basic.company,
      wordCount: processedJob.analysis.wordCount 
    });
    
    return {
      ...state,
      processedJob,
      processed: true,
    };
    
  } catch (error) {
    logger.error('Error in job data processing', { jobUrl, error: error.message });
    
    return {
      ...state,
      processedJob: null,
      processed: false,
      error: `Data processing failed: ${error.message}`,
    };
  }
}

// Helper functions
function extractPlatform(url) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();
  
  if (hostname.includes('linkedin')) return 'LinkedIn';
  if (hostname.includes('indeed')) return 'Indeed';
  if (hostname.includes('glassdoor')) return 'Glassdoor';
  if (hostname.includes('microsoft')) return 'Microsoft Careers';
  if (hostname.includes('apple')) return 'Apple Jobs';
  if (hostname.includes('google')) return 'Google Careers';
  if (hostname.includes('amazon')) return 'Amazon Jobs';
  if (hostname.includes('netflix')) return 'Netflix Jobs';
  if (hostname.includes('meta')) return 'Meta Careers';
  if (hostname.includes('github')) return 'GitHub Jobs';
  
  return 'Unknown';
}

function extractSummary(description) {
  if (!description) return '';
  
  // Extract first paragraph or first 200 characters
  const paragraphs = description.split('\n\n').filter(p => p.trim());
  if (paragraphs.length > 0) {
    return paragraphs[0].substring(0, 200) + (paragraphs[0].length > 200 ? '...' : '');
  }
  
  return description.substring(0, 200) + (description.length > 200 ? '...' : '');
}

function extractRequirements(description) {
  if (!description) return [];
  
  const requirements = [];
  const lines = description.split('\n');
  
  let inRequirements = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('requirements') || lowerLine.includes('qualifications') || lowerLine.includes('what you need')) {
      inRequirements = true;
      continue;
    }
    
    if (inRequirements) {
      if (lowerLine.includes('responsibilities') || lowerLine.includes('what you will do') || lowerLine.includes('about the role')) {
        break;
      }
      
      if (line.trim() && line.trim().length > 10) {
        requirements.push(line.trim());
      }
    }
  }
  
  return requirements;
}

function extractResponsibilities(description) {
  if (!description) return [];
  
  const responsibilities = [];
  const lines = description.split('\n');
  
  let inResponsibilities = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('responsibilities') || lowerLine.includes('what you will do') || lowerLine.includes('about the role')) {
      inResponsibilities = true;
      continue;
    }
    
    if (inResponsibilities) {
      if (lowerLine.includes('requirements') || lowerLine.includes('qualifications') || lowerLine.includes('what you need')) {
        break;
      }
      
      if (line.trim() && line.trim().length > 10) {
        responsibilities.push(line.trim());
      }
    }
  }
  
  return responsibilities;
} 