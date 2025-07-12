/**
 * Job Loader Node
 * Pure function for loading a single job by ID from DynamoDB
 */

import { getItem } from '../../shared/utils/dynamoDB.js';
import { logger } from '../../shared/utils/logger.js';
import { enhancedStagehandClient } from '../../shared/utils/enhancedStagehand.js';

/**
 * Job Loader Node - Pure Function
 * Takes state and returns updated state with loaded job
 * @param {Object} state - Current workflow state
 * @returns {Promise<Object>} Updated state with job data
 */
async function jobLoaderNode(state) {
  try {
    console.log('JobLoaderNode: Starting job loading...');
    
    // Configuration
    const tableName = process.env.DYNAMODB_TABLE || 'job_descriptions';
    
    // Get job ID from state or initial data
    const jobId = state.job_data?.jd_id || state.initial_job_id;
    
    if (!jobId) {
      console.error('JobLoaderNode: No job ID provided');
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'job_loader',
            error: 'No job ID provided',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          job_loader_failed: true,
          job_loader_error: 'No job ID provided',
          job_loader_timestamp: new Date().toISOString()
        }
      };
    }
    
    console.log(`JobLoaderNode: Loading job with ID: ${jobId}`);
    
    // Load single job from DynamoDB
    const job = await loadJobFromDynamoDB(tableName, jobId);
    
    if (!job) {
      console.log(`JobLoaderNode: Job with ID ${jobId} not found`);
      
      // Initialize Stagehand page object even if job not found (for testing)
      let page = null;
      try {
        await enhancedStagehandClient.start();
        page = await enhancedStagehandClient.newPage();
        console.log('JobLoaderNode: Stagehand page initialized for testing');
      } catch (error) {
        console.error('JobLoaderNode: Failed to initialize Stagehand page:', error.message);
      }
      
      return {
        ...state,
        job_data: null,
        page: page,
        current_node: 'job_loader',
        metadata: {
          ...state.metadata,
          job_loader_completed: true,
          job_loader_timestamp: new Date().toISOString(),
          message: `Job with ID ${jobId} not found`,
          job_not_found: true
        }
      };
    }

    // Validate job status
    if (job.status !== 'discovered') {
      console.error(`JobLoaderNode: Job ${jobId} has status '${job.status}', expected 'discovered'`);
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'job_loader',
            error: `Job ${jobId} has status '${job.status}', expected 'discovered'`,
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          job_loader_failed: true,
          job_loader_error: `Invalid job status: ${job.status}`,
          job_loader_timestamp: new Date().toISOString()
        }
      };
    }

    console.log(`JobLoaderNode: Successfully loaded job: ${job.jd_id} with status: ${job.status}`);
    console.log(`JobLoaderNode: Job URL: ${job.url}`);
    console.log(`JobLoaderNode: Job data structure:`, {
      jd_id: job.jd_id,
      url: job.url,
      status: job.status,
      hasUrl: !!job.url
    });
    console.log(`JobLoaderNode: Complete job object:`, JSON.stringify(job, null, 2));
    
    // Initialize Stagehand page object for content extraction
    let page = null;
    try {
      await enhancedStagehandClient.start();
      page = await enhancedStagehandClient.newPage();
      console.log('JobLoaderNode: Stagehand page initialized successfully');
    } catch (error) {
      console.error('JobLoaderNode: Failed to initialize Stagehand page:', error.message);
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'job_loader',
            error: `Failed to initialize Stagehand page: ${error.message}`,
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          job_loader_failed: true,
          job_loader_error: `Stagehand initialization failed: ${error.message}`,
          job_loader_timestamp: new Date().toISOString()
        }
      };
    }
    
    // Map source_url to url if url is missing
    const normalizedJob = {
      ...job,
      url: job.url || job.source_url, // prefer url, fallback to source_url
    };

    // Return updated state with the loaded job and page object
    const updatedState = {
      ...state,
      job_data: normalizedJob,
      page: page,
      current_node: 'job_loader',
      metadata: {
        ...state.metadata,
        job_loader_completed: true,
        job_loader_timestamp: new Date().toISOString(),
        job_id: normalizedJob.jd_id,
        job_url: normalizedJob.url,
        job_status: normalizedJob.status,
        message: `Successfully loaded job: ${normalizedJob.jd_id} with status: ${normalizedJob.status}`
      }
    };
    
    console.log('JobLoaderNode: Returning state with:');
    console.log('- job_data present:', !!updatedState.job_data);
    console.log('- job_data.url:', updatedState.job_data?.url || 'MISSING');
    console.log('- page present:', !!updatedState.page);
    console.log('- page type:', typeof updatedState.page);
    
    return updatedState;

  } catch (error) {
    console.error('JobLoaderNode: Error loading job:', error);
    
    return {
      ...state,
      errors: [
        ...state.errors,
        {
          node: 'job_loader',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      ],
      metadata: {
        ...state.metadata,
        job_loader_failed: true,
        job_loader_error: error.message,
        job_loader_timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Load a single job from DynamoDB by ID
 * @param {string} tableName - DynamoDB table name
 * @param {string} jobId - Job ID to load
 * @returns {Promise<Object|null>} Job data or null if not found
 */
async function loadJobFromDynamoDB(tableName, jobId) {
  try {
    console.log(`JobLoaderNode: Loading job with ID ${jobId} from ${tableName}`);
    
    // Get job by jd_id (primary key)
    const job = await getItem(tableName, { jd_id: jobId });

    if (!job) {
      console.log(`JobLoaderNode: Job with ID ${jobId} not found`);
      return null;
    }

    console.log(`JobLoaderNode: Found job: ${job.jd_id}, status: ${job.status}`);
    return job;
    
  } catch (error) {
    console.error(`JobLoaderNode: Failed to load job: ${error.message}`);
    throw new Error(`Failed to load job: ${error.message}`);
  }
}

export default jobLoaderNode; 