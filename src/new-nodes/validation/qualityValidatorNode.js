/**
 * Quality Validator Node
 * Pure function for validating extraction quality and completeness
 */

/**
 * Quality Validator Node - Pure Function
 * Takes state and returns updated state with quality validation
 * @param {Object} state - Current workflow state
 * @returns {Promise<Object>} Updated state with quality validation
 */
async function qualityValidatorNode(state) {
  try {
    console.log('QualityValidatorNode: Starting quality validation...');
    
    if (!state.dimension_mapping) {
      console.error('QualityValidatorNode: No dimension mapping available');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'quality_validator',
            error: 'No dimension mapping available for quality validation',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          quality_validator_failed: true,
          quality_validator_error: 'No dimension mapping available',
          quality_validator_timestamp: new Date().toISOString()
        }
      };
    }

    const dimensionMapping = state.dimension_mapping;
    const dimensions = dimensionMapping.dimensions;
    
    console.log(`QualityValidatorNode: Validating ${Object.keys(dimensions).length} dimensions`);
    
    // Validate dimensions and calculate quality metrics
    const qualityMetrics = validateDimensions(dimensions, dimensionMapping);
    
    console.log(`QualityValidatorNode: Validation ${qualityMetrics.passed ? 'PASSED' : 'FAILED'} (score: ${qualityMetrics.quality_score})`);
    
    // Return updated state with quality validation
    return {
      ...state,
      quality_metrics: qualityMetrics,
      current_node: 'quality_validator',
      metadata: {
        ...state.metadata,
        quality_validator_completed: true,
        quality_validator_timestamp: new Date().toISOString(),
        validation_passed: qualityMetrics.passed,
        quality_score: qualityMetrics.quality_score,
        message: 'Quality validation completed successfully'
      }
    };

  } catch (error) {
    console.error('QualityValidatorNode: Error validating quality:', error);
    
    return {
      ...state,
      errors: [
        ...state.errors,
        {
          node: 'quality_validator',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      ],
      metadata: {
        ...state.metadata,
        quality_validator_failed: true,
        quality_validator_error: error.message,
        quality_validator_timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Validate dimensions and calculate quality metrics
 * @param {Object} dimensions - Mapped dimensions
 * @param {Object} dimensionMapping - Dimension mapping data
 * @returns {Object} Quality metrics
 */
function validateDimensions(dimensions, dimensionMapping) {
  const confidenceThreshold = 0.7;
  const completenessThreshold = 0.8;
  const qualityThreshold = 0.75;
  
  let totalConfidence = 0;
  let validCount = 0;
  const issues = [];

  // Validate each dimension
  for (const [dimensionName, dimensionData] of Object.entries(dimensions)) {
    const { value, confidence, required, threshold } = dimensionData;
    
    if (!value) {
      if (required) {
        issues.push(`Missing required dimension: ${dimensionName}`);
      }
      continue;
    }

    if (confidence < (threshold || confidenceThreshold)) {
      issues.push(`Low confidence for ${dimensionName}: ${confidence} < ${threshold || confidenceThreshold}`);
      continue;
    }

    validCount++;
    totalConfidence += confidence;
  }

  const averageConfidence = validCount > 0 ? totalConfidence / validCount : 0;
  const completenessScore = dimensionMapping.completeness_score;
  const requiredScore = dimensionMapping.required_dimensions > 0 
    ? dimensionMapping.extracted_required / dimensionMapping.required_dimensions 
    : 1.0;

  // Calculate overall quality score (weighted average)
  const qualityScore = (completenessScore * 0.4) + (averageConfidence * 0.4) + (requiredScore * 0.2);
  
  // Determine if validation passed
  const passed = qualityScore >= qualityThreshold && 
                 completenessScore >= completenessThreshold && 
                 dimensionMapping.extracted_required >= dimensionMapping.required_dimensions;

  return {
    passed,
    quality_score: Math.max(0, Math.min(1, qualityScore)),
    completeness_score: completenessScore,
    confidence_score: averageConfidence,
    required_dimensions_score: requiredScore,
    issues,
    total_dimensions: Object.keys(dimensions).length,
    valid_dimensions: validCount,
    required_dimensions_met: dimensionMapping.extracted_required >= dimensionMapping.required_dimensions,
    validatedAt: new Date().toISOString()
  };
}

export default qualityValidatorNode; 