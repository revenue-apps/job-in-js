import { logger } from '../utils/logger.js';

/**
 * Reflection Node - AI Agent Self-Evaluation
 * 
 * Input: { jobUrl: string, processedJob: object, processed: boolean, error?: string }
 * Output: { jobUrl: string, reflection: object, shouldRetry: boolean, improvement: string }
 */
export async function reflectionNode(state) {
  const nodeName = 'reflection';
  logger.langgraph(nodeName, 'Starting reflection process', { jobUrl: state.jobUrl });
  
  try {
    const { jobUrl, processedJob, processed, error, scraped, jobData } = state;
    
    // Analyze the current state and performance
    const reflection = await analyzePerformance({
      jobUrl,
      processedJob,
      processed,
      error,
      scraped,
      jobData
    });
    
    // Determine if we should retry with a different approach
    const shouldRetry = determineRetryStrategy(reflection);
    
    // Generate improvement suggestions
    const improvement = generateImprovementPlan(reflection);
    
    logger.langgraph(nodeName, 'Reflection completed', { 
      jobUrl,
      quality: reflection.quality,
      shouldRetry,
      improvement: improvement.substring(0, 100) + '...'
    });
    
    return {
      ...state,
      reflection,
      shouldRetry,
      improvement,
      reflectedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    logger.langgraph(nodeName, 'Error in reflection', { 
      error: error.message, 
      jobUrl: state.jobUrl 
    });
    
    return {
      ...state,
      reflection: { quality: 'unknown', issues: ['reflection_failed'] },
      shouldRetry: false,
      improvement: 'Reflection process failed',
      reflectedAt: new Date().toISOString(),
    };
  }
}

async function analyzePerformance(state) {
  const { jobUrl, processedJob, processed, error, scraped, jobData } = state;
  
  const analysis = {
    quality: 'unknown',
    issues: [],
    strengths: [],
    dataCompleteness: 0,
    confidence: 0,
  };
  
  // Check if scraping was successful
  if (!scraped) {
    analysis.quality = 'poor';
    analysis.issues.push('scraping_failed');
    return analysis;
  }
  
  // Check if processing was successful
  if (!processed || !processedJob) {
    analysis.quality = 'poor';
    analysis.issues.push('processing_failed');
    return analysis;
  }
  
  // Analyze data completeness
  const completeness = calculateDataCompleteness(processedJob);
  analysis.dataCompleteness = completeness;
  
  // Analyze data quality
  const quality = analyzeDataQuality(processedJob);
  analysis.quality = quality.level;
  analysis.confidence = quality.confidence;
  
  // Identify specific issues
  if (completeness < 0.7) {
    analysis.issues.push('incomplete_data');
  }
  
  if (processedJob.wordCount < 100) {
    analysis.issues.push('short_description');
  }
  
  if (!processedJob.hasRequirements && !processedJob.hasResponsibilities) {
    analysis.issues.push('missing_structured_data');
  }
  
  // Identify strengths
  if (completeness > 0.8) {
    analysis.strengths.push('high_completeness');
  }
  
  if (processedJob.wordCount > 500) {
    analysis.strengths.push('detailed_description');
  }
  
  if (processedJob.hasRequirements && processedJob.hasResponsibilities) {
    analysis.strengths.push('structured_data_present');
  }
  
  return analysis;
}

function calculateDataCompleteness(processedJob) {
  const requiredFields = ['title', 'company', 'description.full'];
  let completedFields = 0;
  
  requiredFields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], processedJob);
    if (value && value.trim().length > 0) {
      completedFields++;
    }
  });
  
  return completedFields / requiredFields.length;
}

function analyzeDataQuality(processedJob) {
  let confidence = 0;
  let level = 'poor';
  
  // Title quality
  if (processedJob.title && processedJob.title.length > 5) {
    confidence += 0.2;
  }
  
  // Company quality
  if (processedJob.company && processedJob.company.length > 2) {
    confidence += 0.2;
  }
  
  // Description quality
  if (processedJob.description?.full && processedJob.wordCount > 200) {
    confidence += 0.3;
  }
  
  // Structured data quality
  if (processedJob.description?.requirements || processedJob.description?.responsibilities) {
    confidence += 0.3;
  }
  
  // Determine quality level
  if (confidence >= 0.8) level = 'excellent';
  else if (confidence >= 0.6) level = 'good';
  else if (confidence >= 0.4) level = 'fair';
  else level = 'poor';
  
  return { level, confidence };
}

function determineRetryStrategy(reflection) {
  // Retry if quality is poor or we have specific issues
  if (reflection.quality === 'poor') {
    return true;
  }
  
  // Retry if data is incomplete
  if (reflection.dataCompleteness < 0.7) {
    return true;
  }
  
  // Retry if we're missing structured data
  if (reflection.issues.includes('missing_structured_data')) {
    return true;
  }
  
  return false;
}

function generateImprovementPlan(reflection) {
  const improvements = [];
  
  if (reflection.issues.includes('scraping_failed')) {
    improvements.push('Try different scraping strategy or wait for page to load');
  }
  
  if (reflection.issues.includes('incomplete_data')) {
    improvements.push('Use more comprehensive extraction prompts');
  }
  
  if (reflection.issues.includes('missing_structured_data')) {
    improvements.push('Add specific extraction for requirements and responsibilities');
  }
  
  if (reflection.issues.includes('short_description')) {
    improvements.push('Look for additional content sections or expand search area');
  }
  
  if (improvements.length === 0) {
    improvements.push('Data quality is acceptable, no improvements needed');
  }
  
  return improvements.join('; ');
} 