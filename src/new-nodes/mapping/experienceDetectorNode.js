/**
 * Experience Level Detector Node
 * Pure function for detecting job experience level based on role configuration
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Experience Level Detector Node - Pure Function
 * Takes state and returns updated state with experience level classification
 * @param {Object} state - Current workflow state
 * @returns {Promise<Object>} Updated state with experience level
 */
async function experienceDetectorNode(state) {
  try {
    console.log('ExperienceDetectorNode: Starting experience level detection...');
    
    if (!state.job_analysis || !state.job_analysis.rawText) {
      console.error('ExperienceDetectorNode: No job analysis available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'experience_detector',
            error: 'No job analysis available for experience level detection',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          experience_detector_failed: true,
          experience_detector_error: 'No job analysis available',
          experience_detector_timestamp: new Date().toISOString()
        }
      };
    }

    if (!state.domain_classification || !state.domain_classification.role) {
      console.error('ExperienceDetectorNode: No domain classification available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'experience_detector',
            error: 'No domain classification available for experience level detection',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          experience_detector_failed: true,
          experience_detector_error: 'No domain classification available',
          experience_detector_timestamp: new Date().toISOString()
        }
      };
    }

    const rawText = state.job_analysis.rawText;
    const { domain, role } = state.domain_classification;
    
    console.log(`ExperienceDetectorNode: Analyzing content for role: ${role} in domain: ${domain}`);
    
    // Load domain configuration
    const configPath = path.join(process.cwd(), `src/new-workflows/job-extraction/config/domains/${domain}.json`);
    const domainConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
    
    // Get role configuration
    const roleConfig = domainConfig.roles[role];
    if (!roleConfig) {
      throw new Error(`Role configuration not found for: ${role} in domain: ${domain}`);
    }
    
    // Get experience levels for this role
    const experienceLevels = roleConfig.experience_levels;
    console.log(`ExperienceDetectorNode: Available experience levels for ${role}: ${Object.keys(experienceLevels).join(', ')}`);
    
    // Build classification prompt based on role's experience levels
    let classificationPrompt = `Classify the experience level for this ${role} job posting. Available levels:\n\n`;
    for (const [level, config] of Object.entries(experienceLevels)) {
      classificationPrompt += `${level}: ${config.keywords.join(', ')}\n`;
    }
    
    // Use OpenAI utility to classify experience level
    const messages = [
      { role: 'system', content: 'You are an experience level classifier. Return JSON with level and confidence.' },
      { role: 'user', content: `${classificationPrompt}\n\nJob posting:\n${rawText.substring(0, 4000)}\n\nReturn JSON: {"level": "one_of_available_levels", "confidence": 0.0-1.0, "reasoning": "..."}` }
    ];
    
    const { chatCompletion } = await import('../../shared/utils/openai.js');
    const classification = await chatCompletion(messages, {
      model: 'gpt-4o-mini',
      maxTokens: 150,
      responseFormat: { type: 'json_object' }
    });
    
    if (!classification.success) {
      throw new Error(`Experience level classification failed: ${classification.error}`);
    }
    
    const classificationResult = JSON.parse(classification.data);
    const { level: selectedLevel, confidence: levelConfidence, reasoning } = classificationResult;
    
    // Validate the classification against role's available levels
    if (!Object.keys(experienceLevels).includes(selectedLevel)) {
      throw new Error(`Invalid experience level: ${selectedLevel} for role: ${role}. Available: ${Object.keys(experienceLevels).join(', ')}`);
    }
    
    if (levelConfidence < 0 || levelConfidence > 1) {
      throw new Error(`Invalid confidence score: ${levelConfidence}`);
    }
    
    // Get the selected level's configuration
    const selectedLevelConfig = experienceLevels[selectedLevel];
    
    const experienceClassification = {
      level: selectedLevel,
      confidence: levelConfidence,
      reasoning: reasoning || '',
      required_dimensions: selectedLevelConfig.required_dimensions,
      analysis_depth: selectedLevelConfig.analysis_depth,
      detectedAt: new Date().toISOString()
    };
    
    console.log(`ExperienceDetectorNode: Successfully classified as: ${selectedLevel} (confidence: ${levelConfidence})`);
    console.log(`ExperienceDetectorNode: Required dimensions: ${selectedLevelConfig.required_dimensions}, Analysis depth: ${selectedLevelConfig.analysis_depth}`);
    
    // Return updated state with experience level classification
    return {
      ...state,
      experience_classification: experienceClassification,
      current_node: 'experience_detector',
      metadata: {
        ...state.metadata,
        experience_detector_completed: true,
        experience_detector_timestamp: new Date().toISOString(),
        experience_level: selectedLevel,
        experience_confidence: levelConfidence,
        required_dimensions: selectedLevelConfig.required_dimensions,
        analysis_depth: selectedLevelConfig.analysis_depth,
        message: 'Experience level detection completed successfully'
      }
    };

  } catch (error) {
    console.error('ExperienceDetectorNode: Error detecting experience level:', error);
    
    return {
      ...state,
      errors: [
        ...state.errors,
        {
          node: 'experience_detector',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      ],
      metadata: {
        ...state.metadata,
        experience_detector_failed: true,
        experience_detector_error: error.message,
        experience_detector_timestamp: new Date().toISOString()
      }
    };
  }
}

export default experienceDetectorNode; 