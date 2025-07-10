import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import OpenAI from 'openai';
import { logger } from '../../shared/utils/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const urlConstructionNode = async (state) => {
  const { configPath, domain, filters = {}, urlType = 'job_discovery' } = state;
  
  logger.info('Starting URL construction node');
  
  try {
    // Read the CSV file containing URL templates
    const csvContent = readFileSync(configPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    logger.info(`Loaded ${records.length} URL templates from CSV`);
    
    const processedUrls = [];
    
    // Process each URL template
    for (const record of records) {
      const { url: urlTemplate, description, company } = record;
      
      // Generate the final URL using OpenAI
      const finalUrl = await generateUrlWithOpenAI(urlTemplate, description, domain, filters, urlType);
      
      if (finalUrl) {
        processedUrls.push({
          originalTemplate: urlTemplate,
          finalUrl,
          description,
          company: company || extractCompanyFromUrl(urlTemplate),
          domain,
          filters,
          urlType
        });
      }
    }
    
    logger.info(`URL construction completed. Generated ${processedUrls.length} URLs`);
    
    return {
      ...state,
      processedUrls,
      currentStep: 'url_construction_complete'
    };
    
  } catch (error) {
    logger.error('URL construction failed:', error.message);
    
    return {
      ...state,
      errors: [...(state.errors || []), {
        step: 'url_construction',
        error: error.message,
        timestamp: new Date().toISOString()
      }],
      currentStep: 'url_construction_failed'
    };
  }
};

async function generateUrlWithOpenAI(urlTemplate, description, domain, filters, urlType) {
  try {
    const prompt = `
You are a URL generation expert. Given a URL template with parameters and specific filters, generate the final URL.

URL Template: ${urlTemplate}
Description: ${description}
Target Domain: ${domain}
URL Type: ${urlType}
Filters: ${JSON.stringify(filters, null, 2)}

Instructions:
1. Analyze the URL template and identify all parameter placeholders (e.g., {keywords}, {location}, {experience})
2. Use the provided filters to fill in these parameters appropriately
3. If a parameter doesn't have a corresponding filter, use sensible defaults based on the domain and URL type
4. Ensure the final URL is properly encoded and valid
5. Return ONLY the final URL, nothing else

Example:
- Template: https://example.com/jobs?q={keywords}&l={location}
- Filters: {keywords: "software engineer", location: "San Francisco"}
- Result: https://example.com/jobs?q=software%20engineer&l=San%20Francisco

Generate the final URL:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a URL generation expert. Return only the final URL, no explanations or additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const finalUrl = completion.choices[0].message.content.trim();
    
    // Validate the URL
    if (!isValidUrl(finalUrl)) {
      logger.warn(`Generated URL appears invalid: ${finalUrl}`);
      return null;
    }
    
    return finalUrl;
    
  } catch (error) {
    logger.error('OpenAI URL generation failed:', error.message);
    return null;
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function extractCompanyFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Extract company from various URL patterns
    if (hostname.includes('google.com')) {
      return 'Google';
    } else if (hostname.includes('metacareers.com') || hostname.includes('meta.com')) {
      return 'Meta';
    } else if (hostname.includes('airbnb.com')) {
      return 'Airbnb';
    } else if (hostname.includes('microsoft.com')) {
      return 'Microsoft';
    } else if (hostname.includes('apple.com')) {
      return 'Apple';
    } else if (hostname.includes('amazon.com')) {
      return 'Amazon';
    } else if (hostname.includes('netflix.com')) {
      return 'Netflix';
    } else if (hostname.includes('github.com')) {
      return 'GitHub';
    } else if (hostname.includes('linkedin.com')) {
      return 'LinkedIn';
    } else if (hostname.includes('indeed.com')) {
      return 'Indeed';
    } else if (hostname.includes('glassdoor.com')) {
      return 'Glassdoor';
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