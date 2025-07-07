import { logger } from '../utils/logger.js';

/**
 * Planning Node - AI Agent Strategic Planning
 * 
 * Input: { jobUrl: string, reflection?: object, shouldRetry?: boolean }
 * Output: { jobUrl: string, plan: object, strategy: string, approach: string }
 */
export async function planningNode(state) {
  const nodeName = 'planning';
  logger.langgraph(nodeName, 'Starting planning process', { jobUrl: state.jobUrl });
  
  try {
    const { jobUrl, reflection, shouldRetry } = state;
    
    // Analyze the job URL to determine the best approach
    const urlAnalysis = analyzeJobUrl(jobUrl);
    
    // Create a strategic plan based on context
    const plan = createStrategicPlan({
      urlAnalysis,
      reflection,
      shouldRetry,
      jobUrl
    });
    
    // Determine the best strategy
    const strategy = determineStrategy(plan);
    
    // Choose the specific approach
    const approach = chooseApproach(strategy, urlAnalysis);
    
    logger.langgraph(nodeName, 'Planning completed', { 
      jobUrl,
      strategy,
      approach,
      confidence: plan.confidence
    });
    
    return {
      ...state,
      plan,
      strategy,
      approach,
      plannedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    logger.langgraph(nodeName, 'Error in planning', { 
      error: error.message, 
      jobUrl: state.jobUrl 
    });
    
    return {
      ...state,
      plan: { confidence: 0, steps: ['fallback_approach'] },
      strategy: 'fallback',
      approach: 'basic_scraping',
      plannedAt: new Date().toISOString(),
    };
  }
}

function analyzeJobUrl(jobUrl) {
  const url = new URL(jobUrl);
  const domain = url.hostname.toLowerCase();
  
  const analysis = {
    platform: 'unknown',
    complexity: 'medium',
    requiresAuth: false,
    dynamicContent: false,
    knownPatterns: [],
    estimatedLoadTime: 3000,
  };
  
  // Platform-specific analysis
  if (domain.includes('linkedin.com')) {
    analysis.platform = 'linkedin';
    analysis.complexity = 'high';
    analysis.requiresAuth = true;
    analysis.dynamicContent = true;
    analysis.knownPatterns = ['job-title', 'company-name', 'description-section'];
    analysis.estimatedLoadTime = 5000;
  } else if (domain.includes('indeed.com')) {
    analysis.platform = 'indeed';
    analysis.complexity = 'medium';
    analysis.dynamicContent = true;
    analysis.knownPatterns = ['job-header', 'job-description', 'requirements'];
    analysis.estimatedLoadTime = 4000;
  } else if (domain.includes('glassdoor.com')) {
    analysis.platform = 'glassdoor';
    analysis.complexity = 'medium';
    analysis.knownPatterns = ['job-title', 'company-info', 'job-details'];
    analysis.estimatedLoadTime = 3500;
  } else if (domain.includes('careers.microsoft.com')) {
    analysis.platform = 'microsoft';
    analysis.complexity = 'low';
    analysis.knownPatterns = ['job-title', 'location', 'description'];
    analysis.estimatedLoadTime = 2000;
  } else if (domain.includes('jobs.apple.com')) {
    analysis.platform = 'apple';
    analysis.complexity = 'low';
    analysis.knownPatterns = ['position-title', 'team', 'description'];
    analysis.estimatedLoadTime = 2500;
  }
  
  return analysis;
}

function createStrategicPlan(context) {
  const { urlAnalysis, reflection, shouldRetry, jobUrl } = context;
  
  const plan = {
    confidence: 0.8,
    steps: [],
    fallbackSteps: [],
    timeEstimate: 0,
    riskLevel: 'low',
  };
  
  // Base strategy for first attempt
  if (!reflection) {
    plan.steps = [
      'wait_for_page_load',
      'extract_basic_info',
      'look_for_structured_sections',
      'extract_full_description',
      'validate_data_quality'
    ];
    plan.timeEstimate = urlAnalysis.estimatedLoadTime + 2000;
    plan.confidence = 0.8;
  }
  
  // Retry strategy with improvements
  if (shouldRetry && reflection) {
    plan.steps = [
      'wait_longer_for_page_load',
      'try_alternative_selectors',
      'scroll_page_for_more_content',
      'extract_with_broader_scope',
      'use_fallback_extraction_method'
    ];
    plan.fallbackSteps = [
      'manual_content_extraction',
      'partial_data_save'
    ];
    plan.timeEstimate = urlAnalysis.estimatedLoadTime * 2 + 3000;
    plan.confidence = 0.6;
    plan.riskLevel = 'medium';
  }
  
  // Platform-specific adjustments
  if (urlAnalysis.platform === 'linkedin') {
    plan.steps.unshift('handle_linkedin_auth_check');
    plan.steps.push('extract_linkedin_specific_fields');
  }
  
  if (urlAnalysis.dynamicContent) {
    plan.steps.unshift('wait_for_dynamic_content');
    plan.steps.push('retry_if_content_missing');
  }
  
  return plan;
}

function determineStrategy(plan) {
  if (plan.confidence >= 0.8) {
    return 'optimistic';
  } else if (plan.confidence >= 0.6) {
    return 'cautious';
  } else {
    return 'defensive';
  }
}

function chooseApproach(strategy, urlAnalysis) {
  switch (strategy) {
    case 'optimistic':
      return 'fast_extraction';
    case 'cautious':
      return 'thorough_extraction';
    case 'defensive':
      return 'fallback_extraction';
    default:
      return 'basic_scraping';
  }
}

// Helper function to get strategy description
export function getStrategyDescription(strategy, approach) {
  const descriptions = {
    optimistic: {
      fast_extraction: 'Quick extraction with high confidence in success',
      thorough_extraction: 'Comprehensive extraction with detailed analysis'
    },
    cautious: {
      thorough_extraction: 'Careful extraction with multiple validation steps',
      fallback_extraction: 'Conservative approach with backup methods'
    },
    defensive: {
      fallback_extraction: 'Multiple fallback methods to ensure data capture',
      basic_scraping: 'Simple extraction with minimal risk'
    }
  };
  
  return descriptions[strategy]?.[approach] || 'Standard extraction approach';
} 