// State schema for job application workflow
export const jobApplicationStateSchema = {
  jobUrl: { type: 'string' },
  candidateData: { type: 'object' },
  jobDescription: { type: 'object', optional: true },
  timestamp: { type: 'string' },
  
  // Classification results
  classification: { type: 'object', optional: true },
  requirements: { type: 'object', optional: true },
  canApply: { type: 'boolean', optional: true },
  applicationType: { type: 'string', optional: true },
  requiresLogin: { type: 'boolean', optional: true },
  platform: { type: 'string', optional: true },
  confidence: { type: 'number', optional: true },
  
  // Routing
  nextNode: { type: 'string', optional: true },
  routingReason: { type: 'string', optional: true },
  
  // Application results
  applicationResult: { type: 'object', optional: true },
  candidateProfile: { type: 'object', optional: true },
  
  // Confirmation details
  confirmationDetails: { type: 'object', optional: true },
  
  // Error details
  errorDetails: { type: 'object', optional: true },
  error: { type: 'string', optional: true },
  
  // Output
  outputData: { type: 'object', optional: true },
  outputPath: { type: 'string', optional: true },
  filename: { type: 'string', optional: true },
  status: { type: 'string', optional: true },
}; 