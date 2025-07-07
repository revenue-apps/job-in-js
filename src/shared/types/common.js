// Common state types shared across workflows
export const commonStateTypes = {
  // Basic job information
  jobUrl: { type: 'string' },
  jobDescription: { type: 'object', optional: true },
  
  // Processing status
  processed: { type: 'boolean', optional: true },
  error: { type: 'string', optional: true },
  
  // Output information
  outputFile: { type: 'string', optional: true },
  outputPath: { type: 'string', optional: true },
  filename: { type: 'string', optional: true },
  saved: { type: 'boolean', optional: true },
  savedAt: { type: 'string', optional: true },
  
  // Timestamps
  timestamp: { type: 'string' },
  processedAt: { type: 'string', optional: true },
};

// Common error types
export const errorTypes = {
  NETWORK_ERROR: 'network_error',
  VALIDATION_ERROR: 'validation_error',
  API_ERROR: 'api_error',
  TIMEOUT_ERROR: 'timeout_error',
  WORKFLOW_ERROR: 'workflow_error',
  UNKNOWN_ERROR: 'unknown_error',
};

// Common status types
export const statusTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  FAILED: 'failed',
  PROCESSING: 'processing',
  PENDING: 'pending',
}; 