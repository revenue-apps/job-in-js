/**
 * Experience Level Detector Node
 * Pure function for detecting job experience level using OpenAI utility
 */

import { chatCompletion } from '../../shared/utils/openai.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Experience Level Detector Node - Pure Function
 * Takes state and returns updated state with experience level detection
 * @param {Object} state - Current workflow state
 * @returns {Promise<Object>} Updated state with experience level detection
 */
async function experienceLevelDetectorNode(state) {
  try {
    console.log('ExperienceLevelDetectorNode: Starting experience level detection...');
    
    if (!state.analysis_results || !state.analysis_results.rawText) {
      console.error('ExperienceLevelDetectorNode: No job analysis available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'experience_level_detector',
            error: 'No job analysis available for experience level detection',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          experience_level_detector_failed: true,
          experience_level_detector_error: 'No job analysis available',
          experience_level_detector_timestamp: new Date().toISOString()
        }
      };
    }

    if (!state.domain_classification || !state.domain_classification.role) {
      console.error('ExperienceLevelDetectorNode: No domain classification available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'experience_level_detector',
            error: 'No domain classification available for experience level detection',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          experience_level_detector_failed: true,
          experience_level_detector_error: 'No domain classification available',
          experience_level_detector_timestamp: new Date().toISOString()
        }
      };
    }

    const rawText = state.analysis_results.rawText;
    const { domain, role } = state.domain_classification;
    
    console.log(`ExperienceLevelDetectorNode: Detecting experience level for role: ${role} in domain: ${domain}`);
    
    // Load domain configuration to get available experience levels
    const configPath = path.join(process.cwd(), `src/new-workflows/job-extraction/config/domains/${domain}.json`);
    const domainConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
    
    const roleConfig = domainConfig.roles[role];
    if (!roleConfig) {
      throw new Error(`Role configuration not found for: ${role} in domain: ${domain}`);
    }
    
    const availableLevels = Object.keys(roleConfig.experience_levels || {});
    if (availableLevels.length === 0) {
      throw new Error(`No experience levels defined for role: ${role} in domain: ${domain}`);
    }
    
    console.log(`ExperienceLevelDetectorNode: Available levels for ${role}: ${availableLevels.join(', ')}`);
    
    // Build classification prompt with available levels
    const levelsList = availableLevels.join(', ');
    const prompt = `Analyze this job posting and determine the experience level. Consider job title, requirements, responsibilities, and years of experience mentioned.

Available experience levels: ${levelsList}

Job posting:
${rawText.substring(0, 4000)}

Return a JSON object with the experience level: {"level": "selected_level"}`;

    const messages = [
      { role: 'system', content: 'You are an experience level classifier. Return a JSON object with the experience level.' },
      { role: 'user', content: prompt }
    ];
    
    const classification = await chatCompletion(messages, {
      model: 'gpt-4o-mini',
      maxTokens: 10000,
      responseFormat: { type: 'json_object' }
    });
    
    if (!classification.success) {
      throw new Error(`Experience level classification failed: ${classification.error}`);
    }
    
    let detectedLevel;
    try {
      const result = JSON.parse(classification.data);
      detectedLevel = result.level;
    } catch (error) {
      console.warn(`ExperienceLevelDetectorNode: Failed to parse JSON response: ${classification.data}`);
      // If JSON parsing fails, try to extract level from plain text
      const response = classification.data.toLowerCase();
      detectedLevel = availableLevels.find(level => response.includes(level));
    }
    
    if (!detectedLevel || !availableLevels.includes(detectedLevel)) {
      console.warn(`ExperienceLevelDetectorNode: Invalid level detected: ${detectedLevel}, using default: ${availableLevels[0]}`);
      detectedLevel = availableLevels[0]; // Use first available level as default
    }
    
    const detectionResult = {
      level: detectedLevel,
      confidence: 0.8, // Default confidence for classification
      reasoning: `Classified as ${detectedLevel} based on job requirements and experience criteria`,
      detectedAt: new Date().toISOString()
    };
    
    console.log(`ExperienceLevelDetectorNode: Successfully detected experience level: ${detectionResult.level}`);
    
    // Return updated state with experience level detection
    return {
      ...state,
      experience_detection: detectionResult,
      current_node: 'experience_level_detector',
      metadata: {
        ...state.metadata,
        experience_level_detector_completed: true,
        experience_level_detector_timestamp: new Date().toISOString(),
        detected_level: detectionResult.level,
        confidence_score: detectionResult.confidence,
        message: 'Experience level detection completed successfully'
      }
    };

  } catch (error) {
    console.error('ExperienceLevelDetectorNode: Error detecting experience level:', error);
    
    return {
      ...state,
      errors: [
        ...state.errors,
        {
          node: 'experience_level_detector',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      ],
      metadata: {
        ...state.metadata,
        experience_level_detector_failed: true,
        experience_level_detector_error: error.message,
        experience_level_detector_timestamp: new Date().toISOString()
      }
    };
  }
}

export default experienceLevelDetectorNode; 