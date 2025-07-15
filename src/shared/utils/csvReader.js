import fs from 'fs';
import csv from 'csv-parser';
import { logger } from './logger.js';

export async function readCsvFile(filePath) {
  logger.info('Reading CSV file', { filePath });
  
  return new Promise((resolve, reject) => {
    const data = [];
    
    if (!fs.existsSync(filePath)) {
      logger.error('CSV file not found', { filePath });
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        logger.info('CSV reading completed', { 
          totalRows: data.length,
          filePath 
        });
        resolve(data);
      })
      .on('error', (error) => {
        logger.error('Error reading CSV file', { error: error.message, filePath });
        reject(error);
      });
  });
}

export async function readJobUrlsFromCSV(filePath) {
  logger.info('Reading job URLs from CSV', { filePath });
  
  return new Promise((resolve, reject) => {
    const jobData = [];
    
    if (!fs.existsSync(filePath)) {
      logger.error('CSV file not found', { filePath });
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Read both URL and company columns
        const url = row.url || row.URL || row.link || row.Link;
        const company = row.company || row.Company || row.COMPANY || '';
        
        if (url && isValidUrl(url)) {
          jobData.push({
            url: url.trim(),
            company: company.trim()
          });
        } else if (url) {
          logger.warn('Invalid URL found in CSV', { url, row });
        }
      })
      .on('end', () => {
        logger.info('CSV reading completed', { 
          totalJobs: jobData.length,
          filePath 
        });
        resolve(jobData);
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