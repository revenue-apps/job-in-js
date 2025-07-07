#!/usr/bin/env node

import { processJobUrl, processJobUrls } from '../workflows/job-scraping/index.js';
import { readJobUrlsFromCSV } from '../shared/utils/csvReader.js';
import { logger } from '../shared/utils/logger.js';
import { config } from '../shared/config/environment.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const useMock = args.includes('--mock');
  
  logger.info('Starting job scraper', { useMock });
  
  try {
    let jobUrls;
    
    if (useMock) {
      // Use mock data for testing
      jobUrls = [
        'https://www.linkedin.com/jobs/view/software-engineer-at-google',
        'https://careers.microsoft.com/jobs/12345/senior-developer',
        'https://jobs.apple.com/jobs/67890/ios-developer',
      ];
      logger.info('Using mock job URLs', { count: jobUrls.length });
    } else {
      // Read job URLs from CSV file
      const csvPath = path.join(config.paths.dataDir, 'job_urls.csv');
      jobUrls = await readJobUrlsFromCSV(csvPath);
      logger.info('Read job URLs from CSV', { count: jobUrls.length, path: csvPath });
    }
    
    if (jobUrls.length === 0) {
      logger.warn('No job URLs found');
      return;
    }
    
    // Process job URLs
    const { results, errors, summary } = await processJobUrls(jobUrls);
    
    // Log results
    logger.info('Job scraping completed', summary);
    
    if (errors.length > 0) {
      logger.warn('Some jobs failed to process', { errors: errors.length });
      errors.forEach(error => {
        logger.error('Job processing error', { jobUrl: error.jobUrl, error: error.error });
      });
    }
    
    // Save summary to file
    const summaryPath = path.join(config.paths.outputDir, 'scraping-summary.json');
    await fs.mkdir(path.dirname(summaryPath), { recursive: true });
    await fs.writeFile(summaryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary,
      errors: errors.map(e => ({ jobUrl: e.jobUrl, error: e.error })),
    }, null, 2));
    
    logger.info('Summary saved', { path: summaryPath });
    
  } catch (error) {
    logger.error('Job scraper failed', { error: error.message });
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 