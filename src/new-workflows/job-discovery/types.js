/**
 * Career Discovery State Schema
 * Following job-discovery pattern with LangGraph channels
 */

const careerDiscoveryStateSchema = {
  // Input
  companyName: { type: 'string' },
  companies: { type: 'array' },
  currentCompanyIndex: { type: 'number' },
  
  // Browser
  page: { type: 'any' },
  agent: { type: 'any' },
  
  // Discovery results
  careerPageUrl: { type: 'string' },
  jobListingsUrl: { type: 'string' },
  filteredJobUrl: { type: 'string' },
  urlParameters: { type: 'object' },
  
  // Workflow state
  currentStep: { type: 'string' },
  status: { type: 'string' },
  errors: { type: 'array' },
  metadata: { type: 'object' }
};

module.exports = {
  careerDiscoveryStateSchema
}; 