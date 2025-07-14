import express from 'express';
import { logger } from '../../shared/utils/logger.js';
import JobManager from '../../../jobs/index.js';

const router = express.Router();
const jobManager = new JobManager();

/**
 * GET /api/v1/jobs/status
 * Get status of background jobs
 */
router.get('/status', async (req, res) => {
  try {
    const status = jobManager.getStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'Job status retrieved successfully'
    });
    
  } catch (error) {
    logger.error('Failed to get job status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/jobs/discovery/trigger
 * Manually trigger discovery job
 */
router.post('/discovery/trigger', async (req, res) => {
  try {
    logger.info('🔧 Manual discovery trigger requested');
    
    await jobManager.triggerDiscovery();
    
    res.json({
      success: true,
      message: 'Discovery job triggered successfully'
    });
    
  } catch (error) {
    logger.error('Failed to trigger discovery job:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger discovery job',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/jobs/processor/trigger
 * Manually trigger processor job
 */
router.post('/processor/trigger', async (req, res) => {
  try {
    logger.info('🔧 Manual processor trigger requested');
    
    await jobManager.triggerProcessor();
    
    res.json({
      success: true,
      message: 'Processor job triggered successfully'
    });
    
  } catch (error) {
    logger.error('Failed to trigger processor job:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger processor job',
      message: error.message
    });
  }
});

export default router; 