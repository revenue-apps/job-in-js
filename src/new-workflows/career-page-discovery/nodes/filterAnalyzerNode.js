/**
 * Filter Analyzer Node
 * 
 * Purpose: Analyze job listings pages to identify available filters and URL parameters
 * for job search functionality. This helps understand how to construct filtered job URLs.
 */

import { logger } from '../../../../src/shared/utils/logger.js';
import { z } from 'zod';

const ARBITRARY_FILTERS = {
  domain: "software engineer",
  location: "remote",
  department: "engineering",
}

const filterAnalyzerNode = async (state) => {
  const { jobListingsUrl, page } = state;
  
  logger.info('Starting Filter Analyzer Node', { jobListingsUrl });
  
  try {
    if (!page) {
      throw new Error('No Stagehand page provided');
    }

    if (!jobListingsUrl) {
      throw new Error('No job listings URL provided from previous node');
    }

    // Navigate to job listings page
    await page.goto(jobListingsUrl);
    
    // Analyze the page for available filters
    const filters = await analyzeJobFilters(page, jobListingsUrl);

    const values = {};

    Object.keys(ARBITRARY_FILTERS).forEach(key => {
      if (filters[key] && filters[key].isFound) {
        values[key] = ARBITRARY_FILTERS[key];
      }
    });

    const url = await constructAndValidateUrl(page, values, filters);

    const isValidUrl = await validateJobListingUrl(url, page, filters);

    logger.info('Validating job listing url', { url, isValidUrl });

    if (url === jobListingsUrl || !isValidUrl) {
      logger.error('Applying filters did not change the URL; filters may not be functional or detectable', { jobListingsUrl });
      const errors = [];
      if (url === jobListingsUrl) {
        errors.push('Applying filters did not change the URL; unable to validate filter functionality.');
      }
      if (!isValidUrl) {
        errors.push('Applying filters did not show list of jobs as per the filters.');
      }

      return await tryWithFullPrompt(page, url, {
        ...state,
        filteredJobUrl: jobListingsUrl,
        urlParameters: {},
        filters: {},
        pageValidated: false,
        status: 'filters_analyzed',
        errors: [...(state.errors || []), ...errors],
        currentStep: 'filter_analyzer'

      });
    }

    logger.info('Filters applied successfully', { url });

    return {
      ...state,
      filteredJobUrl: url,
      urlParameters: values,
      filters: filters,
      pageValidated: true,
      status: 'success',
      currentStep: 'filter_analyzer'
    };
    
  } catch (error) {
    logger.error('Filter Analyzer Node failed', { 
      jobListingsUrl, 
      error: error.message 
    });
    
    return {
      ...state,
      filteredJobUrl: jobListingsUrl,
      urlParameters: {},
      filters: {},
      pageValidated: false,
      status: 'filters_analyzed',
      errors: [...(state.errors || []), `Filter analysis failed: ${error.message}`],
      currentStep: 'filter_analyzer'
    };
  }
};

/**
 * Analyze job listings page for available filters
 */
async function analyzeJobFilters(page, jobListingsUrl) {
  try {
    logger.info('Analyzing job filters on page', { jobListingsUrl });

    const filters = {};

    // extract search bar
    const searchBar = await page.extract({
      instruction: `Identify the search input field (search bar) on the page that allows users to search for job roles or keywords. This is typically a text box where users can type job titles or skills. If such a search bar exists, set isFound to true and return its selector and field name. If not found, set isFound to false and searchBar to an empty string. Ensure the output strictly matches the following format: { searchBar: string, isFound: boolean, selector: string } as per the provided schema.`,
      schema: z.object({
        searchBar: z.string(),
        isFound: z.boolean(),
        selector: z.string()
      })
    });

    filters.domain = {
      isFound: searchBar.isFound,
      selector: searchBar.selector,
      field: searchBar.searchBar
    };

    // extract location filter
    const locationFilter = await page.extract({
      instruction: `Identify the location filter on the page that allows users to filter jobs by location. This is typically a dropdown or a list of locations. If such a filter exists, set isFound to true and return its selector and field name. If not found, set isFound to false and locationFilter to an empty string. Ensure the output strictly matches the following format: { locationFilter: string, isFound: boolean, selector: string, fieldName: string } as per the provided schema.`,
      schema: z.object({
        locationFilter: z.string(),
        isFound: z.boolean(),
        selector: z.string()
      })
    });

    filters.location = {
      isFound: locationFilter.isFound,
      selector: locationFilter.selector,
      field: locationFilter.locationFilter
    };

    // extract department filter
    const departmentFilter = await page.extract({
      instruction: `Identify the department filter on the page that allows users to filter jobs by department. This is typically a dropdown or a list of departments. If such a filter exists, set isFound to true and return its selector and field name. If not found, set isFound to false and departmentFilter to an empty string. Ensure the output strictly matches the following format: { departmentFilter: string, isFound: boolean, selector: string, fieldName: string } as per the provided schema.`,
      schema: z.object({
        departmentFilter: z.string(),
        isFound: z.boolean(),
        selector: z.string()  
      })
    });

    filters.department = {
      isFound: departmentFilter.isFound,
      selector: departmentFilter.selector,
      field: departmentFilter.departmentFilter
    };

    logger.info('Filters found', { filters });

    return filters;
  } catch (error) {
    logger.warn('Filter analysis failed', { jobListingsUrl, error: error.message });
    return null;
  }
}

async function constructAndValidateUrl(page, values, filters) {
  
  let prompt = `fill up these fields with the value provided. \n`;
  const fields = {}
  for (const key in values) {
    fields[filters[key].field] = values[key];
  }

  prompt += `\n${JSON.stringify(fields)} \n`;

  await page.act({  
    action: `fill in the form with the following values: ${Object.entries(fields).map(([k, v]) => `%${k}%`).join(', ')}`,
    variables: fields,
  });

  await page.act({
    action: `click the submit button or search job button to get jobs as per the filters. if no such button is found, hit enter while keeping focus on search input`,
  });

  logger.info('Waiting for 5 seconds to let the page load');
  await new Promise(resolve => setTimeout(resolve, 5000));


  const urlResult = await page.extract({
    instruction: `get current url for the page`,
    schema: z.object({
      url: z.string()
    })
  });

  logger.info('Current url', { url: urlResult.url });

  return urlResult.url;
}

async function validateJobListingUrl(url, page, filters) {
  let prompt = `check if the url is a valid job listing url. it should show list of jobs\n`;

  const result = await page.extract({
    instruction: prompt,
    schema: z.object({
      isValid: z.boolean()
    })
  });

  return result.isValid;
}

async function tryWithFullPrompt(page, url, state, filters) {
  await page.goto(url);
  const observations = await page.observe({
    instruction: `understand the page, and get the action to search for jobs as per the filters`,
  });

  logger.info('Observations', { observations });

  await page.act({
    action: `try filling filters with values`,
    variables: {
      ...filters,
    }
  });

  await page.act({
    action: `try submitting the form. submit cna be a button click or keyboard enter keystroke on the search input`
  })

  const result = await page.extract({
    instruction: `get the url of the page after the filters are applied`,
    schema: z.object({
      url: z.string()
    })
  });

  if (result.url === url) {
    logger.error('Applying filters did not change the URL; filters may not be functional or detectable', { jobListingsUrl: url });
    return state;
  }

  logger.info('Filters applied on full prompt successfully', { url: result.url });

  return {
    ...state,
    filteredJobUrl: result.url,
    urlParameters: filters,
    filters: filters,
    pageValidated: true,
    status: 'success',
    currentStep: 'filter_analyzer'
  }
  
}

export default filterAnalyzerNode; 