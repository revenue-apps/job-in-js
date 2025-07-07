import fs from 'fs';
import csv from 'csv-parser';
import { logger } from './logger.js';

export async function readJobUrlsFromCSV(filePath) {
  logger.info('Reading job URLs from CSV', { filePath });
  
  return new Promise((resolve, reject) => {
    const urls = [];
    
    if (!fs.existsSync(filePath)) {
      logger.error('CSV file not found', { filePath });
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Assuming the CSV has a 'url' column
        // You can modify this based on your CSV structure
        const url = row.url || row.URL || row.link || row.Link;
        if (url && isValidUrl(url)) {
          urls.push(url.trim());
        } else if (url) {
          logger.warn('Invalid URL found in CSV', { url, row });
        }
      })
      .on('end', () => {
        logger.info('CSV reading completed', { 
          totalUrls: urls.length,
          filePath 
        });
        resolve(urls);
      })
      .on('error', (error) => {
        logger.error('Error reading CSV file', { error: error.message, filePath });
        reject(error);
      });
  });
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Mock data for development/testing
export const mockJobUrls = [
  'https://www.linkedin.com/jobs/view/software-engineer-at-google',
  'https://careers.microsoft.com/jobs/12345/senior-developer',
  'https://jobs.apple.com/position/67890/ios-engineer',
]; 