import express from 'express';
import { logger } from '../../shared/utils/logger.js';

const router = express.Router();

// Get job status
router.get('/status', async (req, res) => {
  try {
    // Import job manager dynamically to avoid circular dependencies
    const { JobManager } = await import('../../../jobs/index.js');
    const jobManager = new JobManager();
    
    const status = jobManager.getStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
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

// Manually trigger discovery job
router.post('/discovery/trigger', async (req, res) => {
  try {
    // Import job manager dynamically to avoid circular dependencies
    const { JobManager } = await import('../../../jobs/index.js');
    const jobManager = new JobManager();
    
    logger.info('🔍 Manual discovery trigger requested');
    
    const result = await jobManager.triggerDiscovery();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
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

// Manually trigger processor job
router.post('/processor/trigger', async (req, res) => {
  try {
    // Import job manager dynamically to avoid circular dependencies
    const { JobManager } = await import('../../../jobs/index.js');
    const jobManager = new JobManager();
    
    logger.info('🔧 Manual processor trigger requested');
    
    const result = await jobManager.triggerProcessor();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
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