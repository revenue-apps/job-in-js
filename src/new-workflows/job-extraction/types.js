/**
 * Job Extraction Workflow Types
 * Type definitions for the job extraction workflow system
 */

/**
 * @typedef {Object} JobData
 * @property {string} id - Unique job identifier
 * @property {string} url - Job posting URL
 * @property {string} status - Current status (discovered, extracted, failed)
 * @property {string} title - Job title
 * @property {string} company - Company name
 * @property {string} location - Job location
 * @property {string} [salary] - Salary information
 * @property {string} [experience_level] - Experience level
 * @property {Object} [extracted_data] - Domain-specific extracted data
 * @property {Object} [metadata] - Additional metadata
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} WorkflowState
 * @property {JobData} job_data - Current job data
 * @property {string} current_node - Current processing node
 * @property {Object} extracted_content - Raw extracted content
 * @property {Object} analysis_results - Analysis results
 * @property {Object} domain_classification - Domain classification results
 * @property {Object} dimension_mapping - Dimension mapping results
 * @property {Object} quality_metrics - Quality validation metrics
 * @property {Array<Error>} errors - Processing errors
 * @property {Object} metadata - Additional state metadata
 */

/**
 * @typedef {Object} NodeResult
 * @property {boolean} success - Whether the node executed successfully
 * @property {Object} data - Node output data
 * @property {string} [error] - Error message if failed
 * @property {Object} [metadata] - Additional node metadata
 */

/**
 * @typedef {Object} DomainConfig
 * @property {string} domain - Domain name
 * @property {Object} sub_domains - Sub-domain configurations
 * @property {Array<string>} core_dimensions - Core dimensions to extract
 * @property {Object} extraction_patterns - Platform-specific extraction patterns
 */

/**
 * @typedef {Object} SubDomainConfig
 * @property {Object} dimensions - Dimension configurations
 * @property {Object} experience_levels - Experience level configurations
 */

/**
 * @typedef {Object} DimensionConfig
 * @property {boolean} required - Whether this dimension is required
 * @property {number} confidence_threshold - Minimum confidence threshold
 * @property {string} extraction_prompt - AI extraction prompt
 */

/**
 * @typedef {Object} ExperienceLevelConfig
 * @property {number} required_dimensions - Number of required dimensions
 * @property {string} analysis_depth - Analysis depth level
 * @property {Array<string>} [keywords] - Keywords for level detection
 */

/**
 * @typedef {Object} QualityConfig
 * @property {Object} confidence_thresholds - Confidence thresholds
 * @property {Object} completeness_thresholds - Completeness thresholds
 * @property {Object} quality_metrics - Quality metrics
 * @property {Object} validation_rules - Validation rules
 * @property {Object} error_handling - Error handling configuration
 * @property {Object} performance_limits - Performance limits
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {string} dimension - Dimension name
 * @property {any} value - Extracted value
 * @property {number} confidence - Confidence score (0-1)
 * @property {string} source - Data source
 * @property {Object} [metadata] - Additional extraction metadata
 */

/**
 * @typedef {Object} DomainClassificationResult
 * @property {string} primary_domain - Primary domain classification
 * @property {string} sub_domain - Sub-domain classification
 * @property {number} confidence - Classification confidence
 * @property {Object} scores - Domain scores
 * @property {Object} [metadata] - Additional classification metadata
 */

/**
 * @typedef {Object} QualityMetrics
 * @property {number} confidence_score - Overall confidence score
 * @property {number} completeness_score - Completeness score
 * @property {number} quality_score - Overall quality score
 * @property {Object} dimension_scores - Per-dimension scores
 * @property {Array<string>} missing_required - Missing required dimensions
 * @property {Array<string>} low_confidence - Low confidence dimensions
 */

/**
 * @typedef {Object} DynamoDBItem
 * @property {string} id - Item ID
 * @property {string} url - Job URL
 * @property {string} status - Job status
 * @property {Object} data - Job data
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Update timestamp
 * @property {string} [domain] - Job domain
 * @property {string} [sub_domain] - Job sub-domain
 * @property {Object} [extracted_dimensions] - Extracted dimensions
 * @property {Object} [quality_metrics] - Quality metrics
 */

/**
 * @typedef {Object} NodeConfig
 * @property {string} name - Node name
 * @property {string} type - Node type
 * @property {Object} config - Node configuration
 * @property {Array<string>} dependencies - Node dependencies
 * @property {Object} [error_handling] - Error handling configuration
 */

/**
 * @typedef {Object} WorkflowConfig
 * @property {string} name - Workflow name
 * @property {Array<NodeConfig>} nodes - Workflow nodes
 * @property {Object} config - Workflow configuration
 * @property {Object} quality_config - Quality configuration
 * @property {Object} error_handling - Error handling configuration
 */

module.exports = {
  // Export types for use in other modules
  JobData: 'JobData',
  WorkflowState: 'WorkflowState',
  NodeResult: 'NodeResult',
  DomainConfig: 'DomainConfig',
  SubDomainConfig: 'SubDomainConfig',
  DimensionConfig: 'DimensionConfig',
  ExperienceLevelConfig: 'ExperienceLevelConfig',
  QualityConfig: 'QualityConfig',
  ExtractionResult: 'ExtractionResult',
  DomainClassificationResult: 'DomainClassificationResult',
  QualityMetrics: 'QualityMetrics',
  DynamoDBItem: 'DynamoDBItem',
  NodeConfig: 'NodeConfig',
  WorkflowConfig: 'WorkflowConfig'
}; 