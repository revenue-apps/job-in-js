// State schema for job scraping workflow
export const jobScrapingStateSchema = {
  jobUrl: { type: 'string' },
  processedJob: { type: 'object', optional: true },
  processed: { type: 'boolean', optional: true },
  error: { type: 'string', optional: true },
  outputFile: { type: 'string', optional: true },
  saved: { type: 'boolean', optional: true },
  savedAt: { type: 'string', optional: true },
}; 