import { logger } from '../../shared/utils/logger.js';
import { z } from 'zod';
import { insertJobDescriptions } from '../../shared/utils/dynamoDB.js';
import { chatCompletion } from '../../shared/utils/openai.js';

export const jobListingScraperNode = async (state) => {
  const { currentUrl, page, agent, scrapedJobs = [] } = state;
  
  try {
    if (!currentUrl || !currentUrl.finalUrl) {
      logger.error('No current URL to process');
      return {
        ...state,
        errors: [...(state.errors || []), {
          step: 'job_scraping',
          error: 'No current URL to process',
          timestamp: new Date().toISOString()
        }],
        currentStep: 'job_scraping_failed'
      };
    }
    
    // Navigate to the current job search page
    await page.goto(currentUrl.finalUrl, { waitUntil: 'networkidle' });
    
    // Use page.evaluate() to get ALL URLs from the page
    const allUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.map(link => link.href).filter(href => href && href.length > 10);
    });

    logger.info(`Raw URL extraction response: ${allUrls.join(', ')}`);

    logger.info(`Found ${allUrls.length} URLs on the page`);
    if (allUrls.length > 0) {
      logger.info(`Sample URLs: ${allUrls.slice(0, 3).join(', ')}`);
    }

    // Use OpenAI to filter URLs to get only job detail URLs
    const filterPrompt = `You are a URL filter for job platforms. I will give you a list of URLs from a job listing page. Your task is to filter and return only the URLs that point to individual job detail pages.

Look for URLs that point to pages with:
- Specific job titles
- Job descriptions
- Apply buttons
- Individual job postings

Return a JSON object with this structure:
{
  "jobDetailUrls": ["url1", "url2", ...],
  "reasoning": "Brief explanation of filtering logic"
}

URLs to filter:
${allUrls.join('\n')}`;

    const filterResult = await chatCompletion([
      { role: 'user', content: filterPrompt }
    ], {
      maxTokens: 2000,
      temperature: 0.1
    });

    let jobDetailUrls = [];
    let reasoning = '';

    if (filterResult.success) {
      logger.info(`OpenAI response: ${filterResult.data}`);
      try {
        const parsed = JSON.parse(filterResult.data);
        jobDetailUrls = parsed.jobDetailUrls || [];
        reasoning = parsed.reasoning || '';
        logger.info(`OpenAI filtering reasoning: ${reasoning}`);
      } catch (error) {
        logger.error('Failed to parse OpenAI filtering response:', error.message);
        logger.error('Raw OpenAI response:', filterResult.data);
        // Fallback: treat all URLs as potential job details
        jobDetailUrls = allUrls;
      }
    } else {
      logger.error('OpenAI filtering failed:', filterResult.error);
      // Fallback: treat all URLs as potential job details
      jobDetailUrls = allUrls;
    }

    logger.info(`AI filtered to ${jobDetailUrls.length} JobDetail URLs`);
    if (jobDetailUrls.length > 0) {
      logger.info(`Sample job detail URLs: ${jobDetailUrls.slice(0, 3).join(', ')}`);
    }

    // Convert URLs to job format with company mapping
    const newJobs = jobDetailUrls.map((url, index) => ({
      title: `Job ${index + 1}`,
      url: url,
      company: currentUrl.company || extractCompanyFromUrl(url),
      scrapedAt: new Date().toISOString()
    }));
    
    // Add new jobs to existing scraped jobs
    const updatedScrapedJobs = [...scrapedJobs, ...newJobs];
    
    logger.info(`Job scraping completed for current URL. Found ${newJobs.length} new jobs. Total jobs: ${updatedScrapedJobs.length}`);
    
    return {
      ...state,
      scrapedJobs: updatedScrapedJobs,
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