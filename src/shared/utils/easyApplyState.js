// State schema for easy apply workflow (LangGraph compatible format)
export const easyApplyStateSchema = {
  // Workflow state
  currentStep: { type: 'string', optional: true },
  isComplete: { type: 'boolean', optional: true },
  error: { type: 'string', optional: true },
  
  // Page context
  page: { type: 'any', optional: true }, // Stagehand page reference
  url: { type: 'string' },
  
  // Analysis data from nodes
  pageLoadAnalysis: { type: 'object', optional: true },
  
  formAnalysis: { type: 'object', optional: true },
  
  fieldMapping: { type: 'object', optional: true },
  
  formFilled: { type: 'boolean', optional: true },
  formFillAnalysis: { type: 'object', optional: true },
  
  submissionAnalysis: { type: 'object', optional: true },
  
  // Candidate data
  candidateData: { type: 'object' }
}; 