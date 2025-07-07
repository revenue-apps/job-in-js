#!/usr/bin/env node

import { applyToJob, applyToMultipleJobs } from '../workflows/job-application/index.js';
import { readJobUrlsFromCsv } from '../shared/utils/csvReader.js';
import { logger } from '../shared/utils/logger.js';
import { config } from '../shared/config/environment.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const useMock = args.includes('--mock');
  const batchMode = args.includes('--batch');
  
  logger.info('Starting job applicator', { useMock, batchMode });
  
  try {
    // Load candidate data
    const candidatePath = path.join(config.paths.dataDir, 'sample_candidate.json');
    const candidateData = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
    logger.info('Loaded candidate data', { path: candidatePath });
    
    if (batchMode) {
      // Batch application mode
      let jobUrls;
      
      if (useMock) {
        // Use mock data for testing
        jobUrls = [
          'https://www.linkedin.com/jobs/view/software-engineer-at-google',
          'https://jobs.lever.co/company/senior-developer',
          'https://boards.greenhouse.io/company/jobs/12345',
        ];
        logger.info('Using mock job URLs for batch application', { count: jobUrls.length });
      } else {
        // Read job URLs from CSV file
        const csvPath = path.join(config.paths.dataDir, 'job_urls.csv');
        jobUrls = await readJobUrlsFromCsv(csvPath);
        logger.info('Read job URLs from CSV for batch application', { count: jobUrls.length, path: csvPath });
      }
      
      if (jobUrls.length === 0) {
        logger.warn('No job URLs found for batch application');
        return;
      }
      
      // Process batch applications
      const result = await applyToMultipleJobs(jobUrls, candidateData);
      
      // Log results
      logger.info('Batch application completed', result.summary);
      
      if (result.errors.length > 0) {
        logger.warn('Some applications failed', { errors: result.errors.length });
        result.errors.forEach(error => {
          logger.error('Application error', { jobUrl: error.jobUrl, error: error.error });
        });
      }
      
      // Save batch summary to file
      const summaryPath = path.join(config.paths.outputDir, 'applications', 'batch-summary.json');
      await fs.mkdir(path.dirname(summaryPath), { recursive: true });
      await fs.writeFile(summaryPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: result.summary,
        errors: result.errors,
        candidateInfo: {
          name: `${candidateData.personal.firstName} ${candidateData.personal.lastName}`,
          email: candidateData.personal.email,
        },
      }, null, 2));
      
      logger.info('Batch summary saved', { path: summaryPath });
      
    } else {
      // Single application mode
      const jobUrl = args[0];
      
      if (!jobUrl) {
        logger.error('Job URL is required for single application mode');
        console.log('Usage: node jobApplicator.js <job-url> [--mock]');
        process.exit(1);
      }
      
      logger.info('Processing single job application', { jobUrl });
      
      // Process single application
      const result = await applyToJob(jobUrl, candidateData);
      
      // Log result
      logger.info('Single application completed', {
        status: result.status,
        applicationId: result.confirmationDetails?.applicationId,
        error: result.errorDetails?.errorMessage,
      });
      
      // Save result to file
      const jobId = jobUrl.split('/').pop() || 'unknown';
      const candidateName = candidateData.personal.firstName;
      const filename = `application_${candidateName}_${jobId}_${Date.now()}.json`;
      const outputPath = path.join(config.paths.outputDir, 'applications', filename);
      
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
      
      logger.info('Application result saved', { path: outputPath });
    }
    
  } catch (error) {
    logger.error('Job applicator failed', { error: error.message });
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 