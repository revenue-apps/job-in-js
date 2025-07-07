import fs from 'fs';
import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';

/**
 * Memory Node - AI Agent Learning and Experience
 * 
 * Input: { jobUrl: string, plan: object, strategy: string, approach: string }
 * Output: { jobUrl: string, memory: object, learnedPatterns: array, recommendations: array }
 */
export async function memoryNode(state) {
  const nodeName = 'memory';
  logger.langgraph(nodeName, 'Starting memory retrieval', { jobUrl: state.jobUrl });
  
  try {
    const { jobUrl, plan, strategy, approach } = state;
    
    // Load historical data and patterns
    const memory = await loadMemory();
    
    // Find relevant past experiences
    const relevantExperiences = findRelevantExperiences(memory, jobUrl, strategy);
    
    // Extract learned patterns
    const learnedPatterns = extractLearnedPatterns(relevantExperiences);
    
    // Generate recommendations based on past success/failure
    const recommendations = generateRecommendations(learnedPatterns, plan);
    
    // Update memory with current context
    await updateMemory(memory, {
      jobUrl,
      strategy,
      approach,
      timestamp: new Date().toISOString()
    });
    
    logger.langgraph(nodeName, 'Memory processing completed', { 
      jobUrl,
      relevantExperiences: relevantExperiences.length,
      learnedPatterns: learnedPatterns.length,
      recommendations: recommendations.length
    });
    
    return {
      ...state,
      memory,
      learnedPatterns,
      recommendations,
      rememberedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    logger.langgraph(nodeName, 'Error in memory processing', { 
      error: error.message, 
      jobUrl: state.jobUrl 
    });
    
    return {
      ...state,
      memory: { experiences: [], patterns: [] },
      learnedPatterns: [],
      recommendations: ['use_default_approach'],
      rememberedAt: new Date().toISOString(),
    };
  }
}

async function loadMemory() {
  const memoryPath = `${config.paths.outputDir}/memory.json`;
  
  try {
    if (fs.existsSync(memoryPath)) {
      const memoryData = fs.readFileSync(memoryPath, 'utf8');
      return JSON.parse(memoryData);
    }
  } catch (error) {
    logger.warn('Failed to load memory file', { error: error.message });
  }
  
  // Return default memory structure
  return {
    experiences: [],
    patterns: [],
    statistics: {
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      averageQuality: 0,
      platformSuccess: {},
      strategySuccess: {}
    },
    lastUpdated: new Date().toISOString()
  };
}

function findRelevantExperiences(memory, jobUrl, strategy) {
  const url = new URL(jobUrl);
  const domain = url.hostname.toLowerCase();
  
  return memory.experiences.filter(exp => {
    // Match by domain/platform
    const expDomain = new URL(exp.jobUrl).hostname.toLowerCase();
    if (expDomain.includes(domain.split('.')[0])) {
      return true;
    }
    
    // Match by strategy
    if (exp.strategy === strategy) {
      return true;
    }
    
    // Match by recent experiences (last 7 days)
    const expDate = new Date(exp.timestamp);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (expDate > weekAgo) {
      return true;
    }
    
    return false;
  });
}

function extractLearnedPatterns(experiences) {
  const patterns = [];
  
  // Analyze success patterns
  const successfulExperiences = experiences.filter(exp => exp.success);
  const failedExperiences = experiences.filter(exp => !exp.success);
  
  // Platform-specific patterns
  const platformPatterns = analyzePlatformPatterns(experiences);
  patterns.push(...platformPatterns);
  
  // Strategy effectiveness patterns
  const strategyPatterns = analyzeStrategyPatterns(experiences);
  patterns.push(...strategyPatterns);
  
  // Timing patterns
  const timingPatterns = analyzeTimingPatterns(experiences);
  patterns.push(...timingPatterns);
  
  // Error patterns
  const errorPatterns = analyzeErrorPatterns(failedExperiences);
  patterns.push(...errorPatterns);
  
  return patterns;
}

function analyzePlatformPatterns(experiences) {
  const patterns = [];
  const platformStats = {};
  
  experiences.forEach(exp => {
    const domain = new URL(exp.jobUrl).hostname.toLowerCase();
    const platform = getPlatformFromDomain(domain);
    
    if (!platformStats[platform]) {
      platformStats[platform] = { success: 0, total: 0, avgQuality: 0 };
    }
    
    platformStats[platform].total++;
    if (exp.success) platformStats[platform].success++;
    if (exp.quality) platformStats[platform].avgQuality += exp.quality;
  });
  
  Object.entries(platformStats).forEach(([platform, stats]) => {
    const successRate = stats.success / stats.total;
    const avgQuality = stats.avgQuality / stats.total;
    
    patterns.push({
      type: 'platform_success',
      platform,
      successRate,
      avgQuality,
      confidence: stats.total / 10, // More data = higher confidence
      recommendation: successRate > 0.8 ? 'continue_current_approach' : 'try_alternative_strategy'
    });
  });
  
  return patterns;
}

function analyzeStrategyPatterns(experiences) {
  const patterns = [];
  const strategyStats = {};
  
  experiences.forEach(exp => {
    if (!strategyStats[exp.strategy]) {
      strategyStats[exp.strategy] = { success: 0, total: 0 };
    }
    
    strategyStats[exp.strategy].total++;
    if (exp.success) strategyStats[exp.strategy].success++;
  });
  
  Object.entries(strategyStats).forEach(([strategy, stats]) => {
    const successRate = stats.success / stats.total;
    
    patterns.push({
      type: 'strategy_effectiveness',
      strategy,
      successRate,
      confidence: stats.total / 5,
      recommendation: successRate > 0.7 ? 'prefer_this_strategy' : 'avoid_this_strategy'
    });
  });
  
  return patterns;
}

function analyzeTimingPatterns(experiences) {
  const patterns = [];
  const timeSlots = {
    morning: { success: 0, total: 0 },
    afternoon: { success: 0, total: 0 },
    evening: { success: 0, total: 0 },
    night: { success: 0, total: 0 }
  };
  
  experiences.forEach(exp => {
    const hour = new Date(exp.timestamp).getHours();
    let timeSlot;
    
    if (hour >= 6 && hour < 12) timeSlot = 'morning';
    else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
    else if (hour >= 18 && hour < 22) timeSlot = 'evening';
    else timeSlot = 'night';
    
    timeSlots[timeSlot].total++;
    if (exp.success) timeSlots[timeSlot].success++;
  });
  
  Object.entries(timeSlots).forEach(([slot, stats]) => {
    if (stats.total > 0) {
      const successRate = stats.success / stats.total;
      patterns.push({
        type: 'timing_effectiveness',
        timeSlot: slot,
        successRate,
        recommendation: successRate > 0.8 ? 'prefer_this_time' : 'avoid_this_time'
      });
    }
  });
  
  return patterns;
}

function analyzeErrorPatterns(failedExperiences) {
  const patterns = [];
  const errorTypes = {};
  
  failedExperiences.forEach(exp => {
    const errorType = categorizeError(exp.error);
    errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
  });
  
  Object.entries(errorTypes).forEach(([errorType, count]) => {
    patterns.push({
      type: 'error_pattern',
      errorType,
      frequency: count,
      recommendation: getErrorRecommendation(errorType)
    });
  });
  
  return patterns;
}

function generateRecommendations(learnedPatterns, currentPlan) {
  const recommendations = [];
  
  // Strategy recommendations
  const strategyPatterns = learnedPatterns.filter(p => p.type === 'strategy_effectiveness');
  const bestStrategy = strategyPatterns
    .filter(p => p.confidence > 0.5)
    .sort((a, b) => b.successRate - a.successRate)[0];
  
  if (bestStrategy && bestStrategy.successRate > 0.8) {
    recommendations.push(`prefer_strategy_${bestStrategy.strategy}`);
  }
  
  // Platform-specific recommendations
  const platformPatterns = learnedPatterns.filter(p => p.type === 'platform_success');
  platformPatterns.forEach(pattern => {
    if (pattern.successRate < 0.5) {
      recommendations.push(`use_alternative_approach_for_${pattern.platform}`);
    }
  });
  
  // Timing recommendations
  const timingPatterns = learnedPatterns.filter(p => p.type === 'timing_effectiveness');
  const currentHour = new Date().getHours();
  let currentTimeSlot;
  
  if (currentHour >= 6 && currentHour < 12) currentTimeSlot = 'morning';
  else if (currentHour >= 12 && currentHour < 18) currentTimeSlot = 'afternoon';
  else if (currentHour >= 18 && currentHour < 22) currentTimeSlot = 'evening';
  else currentTimeSlot = 'night';
  
  const timePattern = timingPatterns.find(p => p.timeSlot === currentTimeSlot);
  if (timePattern && timePattern.successRate < 0.6) {
    recommendations.push('consider_delaying_until_better_time');
  }
  
  // Error prevention recommendations
  const errorPatterns = learnedPatterns.filter(p => p.type === 'error_pattern');
  errorPatterns.forEach(pattern => {
    if (pattern.frequency > 3) {
      recommendations.push(pattern.recommendation);
    }
  });
  
  return recommendations.length > 0 ? recommendations : ['use_default_approach'];
}

async function updateMemory(memory, newExperience) {
  memory.experiences.push(newExperience);
  
  // Keep only last 1000 experiences to prevent memory bloat
  if (memory.experiences.length > 1000) {
    memory.experiences = memory.experiences.slice(-1000);
  }
  
  memory.lastUpdated = new Date().toISOString();
  
  // Save updated memory
  const memoryPath = `${config.paths.outputDir}/memory.json`;
  try {
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  } catch (error) {
    logger.warn('Failed to save memory', { error: error.message });
  }
}

// Helper functions
function getPlatformFromDomain(domain) {
  if (domain.includes('linkedin')) return 'linkedin';
  if (domain.includes('indeed')) return 'indeed';
  if (domain.includes('glassdoor')) return 'glassdoor';
  if (domain.includes('microsoft')) return 'microsoft';
  if (domain.includes('apple')) return 'apple';
  return 'other';
}

function categorizeError(error) {
  if (error.includes('timeout')) return 'timeout';
  if (error.includes('not found')) return 'not_found';
  if (error.includes('auth')) return 'authentication';
  if (error.includes('blocked')) return 'blocked';
  return 'unknown';
}

function getErrorRecommendation(errorType) {
  const recommendations = {
    timeout: 'increase_wait_time',
    not_found: 'verify_url_validity',
    authentication: 'use_authenticated_session',
    blocked: 'use_different_ip_or_delay',
    unknown: 'retry_with_different_approach'
  };
  
  return recommendations[errorType] || 'retry_with_different_approach';
} 