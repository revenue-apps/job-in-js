/**
 * Dimension Mapper Node
 * Pure function for mapping job content to role-specific dimensions using OpenAI utility
 */

import fs from 'fs/promises';
import path from 'path';
import { chatCompletion } from '../../shared/utils/openai.js';
import { formatDimensionMappingToDDBEntities } from '../../shared/utils/ddbEntitiesFormatter.js';

/**
 * Dimension Mapper Node - Pure Function
 * Takes state and returns updated state with mapped dimensions
 * @param {Object} state - Current workflow state
 * @returns {Promise<Object>} Updated state with mapped dimensions
 */
async function dimensionMapperNode(state) {
  try {
    console.log('DimensionMapperNode: Starting dimension mapping...');
    
    if (!state.analysis_results || !state.analysis_results.rawText) {
      console.error('DimensionMapperNode: No job analysis available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'dimension_mapper',
            error: 'No job analysis available for dimension mapping',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          dimension_mapper_failed: true,
          dimension_mapper_error: 'No job analysis available',
          dimension_mapper_timestamp: new Date().toISOString()
        }
      };
    }

    if (!state.domain_classification || !state.domain_classification.role) {
      console.error('DimensionMapperNode: No domain classification available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'dimension_mapper',
            error: 'No domain classification available for dimension mapping',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          dimension_mapper_failed: true,
          dimension_mapper_error: 'No domain classification available',
          dimension_mapper_timestamp: new Date().toISOString()
        }
      };
    }

    if (!state.experience_detection || !state.experience_detection.level) {
      console.error('DimensionMapperNode: No experience level detection available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'dimension_mapper',
            error: 'No experience level detection available for dimension mapping',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          dimension_mapper_failed: true,
          dimension_mapper_error: 'No experience level detection available',
          dimension_mapper_timestamp: new Date().toISOString()
        }
      };
    }

    const rawText = state.analysis_results.rawText;
    const { domain, role } = state.domain_classification;
    const { level } = state.experience_detection;
    
    console.log(`DimensionMapperNode: Mapping dimensions for role: ${role} in domain: ${domain} with experience level: ${level}`);
    
    // 1. Get dimensions from domain config
    const configPath = path.join(process.cwd(), `src/new-workflows/job-extraction/config/domains/${domain}.json`);
    const domainConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
    
    const roleConfig = domainConfig.roles[role];
    if (!roleConfig) {
      throw new Error(`Role configuration not found for: ${role} in domain: ${domain}`);
    }
    
    // Get experience-level-specific dimensions
    const experienceConfig = roleConfig.experience_levels?.[level];
    let dimensions = experienceConfig?.dimensions || roleConfig.dimensions;
    if (!dimensions) {
      throw new Error(`No dimensions found for role: ${role} at experience level: ${level}`);
    }
    
    // Build a single prompt for all dimensions
    const dimensionPrompts = Object.entries(dimensions).map(
      ([name, config]) => `- ${name}: ${config.extraction_prompt}`
    ).join('\n');

    // Build the expected JSON schema for the prompt
    const schemaFields = Object.entries(dimensions).map(
      ([name, config]) => `\"${name}\": \"...\"`
    ).join(',\n  ');

    const prompt = `Extract the following information from the job posting:\n${dimensionPrompts}\n\nReturn a JSON object with the following fields:\n{\n  ${schemaFields}\n}\nJob posting:\n${rawText.substring(0, 4000)}`;

    const messages = [
      { role: 'system', content: 'You are a job dimension extractor. Extract all requested fields as JSON.' },
      { role: 'user', content: prompt }
    ];

    const extraction = await chatCompletion(messages, {
      model: 'gpt-4o-mini',
      maxTokens: 10000,
      responseFormat: { type: 'json_object' }
    });

    if (!extraction.success) {
      console.warn(`DimensionMapperNode: Failed to extract dimensions: ${extraction.error}`);
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'dimension_mapper',
            error: extraction.error,
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          dimension_mapper_failed: true,
          dimension_mapper_error: extraction.error,
          dimension_mapper_timestamp: new Date().toISOString()
        }
      };
    }

    let extractionResult;
    try {
      extractionResult = JSON.parse(extraction.data);
    } catch (err) {
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'dimension_mapper',
            error: 'Failed to parse OpenAI response as JSON',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          dimension_mapper_failed: true,
          dimension_mapper_error: 'Failed to parse OpenAI response as JSON',
          dimension_mapper_timestamp: new Date().toISOString()
        }
      };
    }

    // Validate and format each dimension
    const mappedDimensions = {};
    for (const [dimensionName, dimensionConfig] of Object.entries(dimensions)) {
      const value = extractionResult[dimensionName];
      mappedDimensions[dimensionName] = {
        value: value || null,
        confidence: value ? 1 : 0, // You can add more sophisticated confidence extraction if needed
        required: dimensionConfig.required,
        threshold: dimensionConfig.confidence_threshold
      };
    }

    // Calculate completeness score
    const requiredDimensions = Object.entries(dimensions).filter(([_, config]) => config.required);
    const extractedRequired = Object.entries(mappedDimensions).filter(([name, data]) => {
      const dimensionConfig = dimensions[name];
      return dimensionConfig.required && data.value && data.confidence >= dimensionConfig.confidence_threshold;
    });

    const completenessScore = requiredDimensions.length > 0 
      ? extractedRequired.length / requiredDimensions.length 
      : 1.0;

    const dimensionMapping = {
      dimensions: mappedDimensions,
      total_dimensions: Object.keys(dimensions).length,
      required_dimensions: requiredDimensions.length,
      extracted_required: extractedRequired.length,
      completeness_score: completenessScore,
      mappedAt: new Date().toISOString()
    };

    console.log(`DimensionMapperNode: Mapping completed. Completeness: ${completenessScore} (${extractedRequired.length}/${requiredDimensions.length} required)`);

    // Format dimension mapping to DDB entities
    console.log('DimensionMapperNode: Starting DDB entities formatting...');
    const ddbEntities = await formatDimensionMappingToDDBEntities(dimensionMapping);
    console.log('DimensionMapperNode: DDB entities formatted successfully');
    console.log('DimensionMapperNode: Entities keys:', Object.keys(ddbEntities));
    console.log('DimensionMapperNode: Entities sample:', JSON.stringify(ddbEntities, null, 2).substring(0, 300) + '...');

    // Return updated state with dimension mapping and formatted entities
    const updatedState = {
      ...state,
      dimension_mapping: dimensionMapping,
      entities: ddbEntities,
      current_node: 'dimension_mapper',
      metadata: {
        ...state.metadata,
        dimension_mapper_completed: true,
        dimension_mapper_timestamp: new Date().toISOString(),
        total_dimensions: Object.keys(dimensions).length,
        required_dimensions: requiredDimensions.length,
        extracted_required: extractedRequired.length,
        completeness_score: completenessScore,
        entities_formatted: true,
        message: 'Dimension mapping completed successfully'
      }
    };

    console.log('DimensionMapperNode: Final state keys:', Object.keys(updatedState));
    console.log('DimensionMapperNode: Has entities in state:', !!updatedState.entities);
    console.log('DimensionMapperNode: Returning state with entities...');

    return updatedState;

  } catch (error) {
    console.error('DimensionMapperNode: Error mapping dimensions:', error);
    
    return {
      ...state,
      errors: [
        ...state.errors,
        {
          node: 'dimension_mapper',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      ],
      metadata: {
        ...state.metadata,
        dimension_mapper_failed: true,
        dimension_mapper_error: error.message,
        dimension_mapper_timestamp: new Date().toISOString()
      }
    };
  }
}

export default dimensionMapperNode; 