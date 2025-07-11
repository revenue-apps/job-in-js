import { logger } from '../../shared/utils/logger.js';
import { z } from 'zod';
import OpenAI from 'openai';
import { insertJobDescriptions } from '../../shared/utils/dynamoDB.js';

export const jobListingScraperNode = async (state) => {
  const { processedUrls, page, agent } = state;
  
  logger.info('Starting job listing scraper node');
  
  try {
    const scrapedJobs = [];
    
    // Process each URL
    for (const urlData of processedUrls) {
      try {
        // Navigate to the job search page
        await page.goto(urlData.finalUrl, { waitUntil: 'networkidle' });
        
        // Get all URLs from the page
        const allUrls = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'));
          return links.map(link => link.href).filter(href => href && href.length > 10);
        });

        logger.info(`Found ${allUrls.length} URLs on the page`);

        // Generate prompt for OpenAI to classify URLs
        const promptForUrlClassification = `
You are a smart URL classifier.

I will give you a list of URLs from a career site or job platform. Your task is to analyze each URL and classify whether it points to:

1. A JobDetail page — a page that shows one specific job, including job title, description, location, qualifications, and apply button.
2. A SearchPage — a job listing, results, search, filter, or dashboard page that contains multiple jobs or filters.

For each URL, output in this format (one line per URL):
URL, Type, Reason

Where:
- URL is the original URL
- Type is either JobDetail or SearchPage
- Reason is a very short explanation (1 sentence max)

Use your understanding of URL structure and known patterns (e.g., job ID in URL, use of slugs, /jobs/results/{id} formats, presence of query params like q=, search=, etc.)

Here is the list of URLs:
${allUrls.join('\n')}
        `;


        // Use OpenAI to classify URLs
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a smart URL classifier for job platforms. Analyze URLs and classify them as JobDetail or SearchPage."
            },
            {
              role: "user",
              content: promptForUrlClassification
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        });

        const response = completion.choices[0].message.content.trim();
        
        // Parse the response to extract JobDetail URLs
        const lines = response.split('\n').filter(line => line.trim());
        const jobDetailUrls = [];
        
        for (const line of lines) {
          try {
            const [url, type, reason] = line.split(',').map(s => s.trim());
            if (type === 'JobDetail') {
              jobDetailUrls.push(url);
            }
          } catch (error) {
            // Skip invalid lines
          }
        }

        const jobUrls = jobDetailUrls;
        logger.info(`OpenAI identified ${jobUrls.length} JobDetail URLs`);

        // Convert URLs to job format with company mapping
        const jobs = jobUrls.map((url, index) => ({
          title: `Job ${index + 1}`,
          url: url,
          company: urlData.company || extractCompanyFromUrl(url),
          scrapedAt: new Date().toISOString()
        }));
        
        scrapedJobs.push(...jobs);
        
        // Rate limiting between sites
        await delay(3000);
        
      } catch (error) {
        logger.error(`Failed to scrape ${urlData.finalUrl}:`, error.message);
        
        // Continue with next URL even if one fails
        continue;
      }
    }
    
    logger.info(`Job scraping completed. Total jobs: ${scrapedJobs.length}`);
    
    // Format jobs with all original input data
    const jobDescriptions = scrapedJobs.map(job => ({
      url: job.url,
      company: job.company,
      domain: urlData.domain,
      filters: urlData.filters
    }));
    
    // Store job descriptions in DynamoDB
    let storedJobs = [];
    let storageErrors = [];
    
    if (jobDescriptions.length > 0) {
      try {
        const storageResult = await insertJobDescriptions(jobDescriptions);
        storedJobs = storageResult.results;
        storageErrors = storageResult.errors;
        
        logger.info(`Stored ${storedJobs.length} jobs in DynamoDB, ${storageErrors.length} failed`);
      } catch (error) {
        logger.error('Failed to store jobs in DynamoDB:', error.message);
        storageErrors.push({ error: error.message });
      }
    }
    
    return {
      ...state,
      scrapedJobs,
      jobDescriptions,
      storedJobs,
      storageErrors,
      currentStep: 'job_scraping_complete'
    };
    
  } catch (error) {
    logger.error('Job scraping failed:', error.message);
    
    return {
      ...state,
      errors: [...(state.errors || []), {
        step: 'job_scraping',
        error: error.message,
        timestamp: new Date().toISOString()
      }],
      currentStep: 'job_scraping_failed'
    };
  }
};





function extractCompanyFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Extract company from various URL patterns
    if (hostname.includes('linkedin.com')) {
      // LinkedIn: linkedin.com/jobs/view/... or linkedin.com/company/...
      const pathParts = urlObj.pathname.split('/');
      const companyIndex = pathParts.indexOf('company');
      if (companyIndex !== -1 && pathParts[companyIndex + 1]) {
        return pathParts[companyIndex + 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } else if (hostname.includes('indeed.com')) {
      // Indeed: indeed.com/cmp/company-name/...
      const pathParts = urlObj.pathname.split('/');
      const cmpIndex = pathParts.indexOf('cmp');
      if (cmpIndex !== -1 && pathParts[cmpIndex + 1]) {
        return pathParts[cmpIndex + 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } else if (hostname.includes('glassdoor.com')) {
      // Glassdoor: glassdoor.com/Overview/...
      const pathParts = urlObj.pathname.split('/');
      const overviewIndex = pathParts.indexOf('Overview');
      if (overviewIndex !== -1 && pathParts[overviewIndex + 1]) {
        return pathParts[overviewIndex + 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } else if (hostname.includes('careers.microsoft.com')) {
      return 'Microsoft';
    } else if (hostname.includes('jobs.apple.com')) {
      return 'Apple';
    } else if (hostname.includes('careers.google.com')) {
      return 'Google';
    } else if (hostname.includes('amazon.jobs')) {
      return 'Amazon';
    } else if (hostname.includes('jobs.netflix.com')) {
      return 'Netflix';
    } else if (hostname.includes('careers.meta.com')) {
      return 'Meta';
    } else if (hostname.includes('jobs.github.com')) {
      return 'GitHub';
    }
    
    // Fallback: extract from hostname
    const domainParts = hostname.split('.');
    if (domainParts.length > 2) {
      return domainParts[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return 'Unknown Company';
  } catch (error) {
    return 'Unknown Company';
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 