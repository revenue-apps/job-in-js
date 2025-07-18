import express from 'express';
import { logger } from '../../shared/utils/logger.js';
import { runCareerDiscovery } from '../../new-workflows/career-page-discovery/index.js';
import CareerDiscoveryJob from '../../../jobs/career-discovery.js';

const router = express.Router();

// Initialize career discovery job instance
const careerDiscoveryJob = new CareerDiscoveryJob();

/**
 * GET /api/career-discovery/status
 * Get current career discovery job status
 */
router.get('/status', async (req, res) => {
  try {
    const status = careerDiscoveryJob.getStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get career discovery status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get career discovery status',
      message: error.message
    });
  }
});

/**
 * POST /api/career-discovery/trigger
 * Manually trigger career discovery for one company
 */
router.post('/trigger', async (req, res) => {
  try {
    // Check if job is already running
    if (careerDiscoveryJob.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Career discovery job is already running',
        message: 'Please wait for the current job to complete'
      });
    }

    logger.info('🚀 Manual career discovery trigger requested');
    
    // Run career discovery for one company
    const result = await careerDiscoveryJob.runCareerDiscovery();
    
    // Get updated status
    const status = careerDiscoveryJob.getStatus();
    
    res.json({
      success: true,
      data: {
        result,
        status,
        message: 'Career discovery triggered successfully'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to trigger career discovery:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger career discovery',
      message: error.message
    });
  }
});

/**
 * POST /api/career-discovery/start
 * Start the career discovery cron job
 */
router.post('/start', async (req, res) => {
  try {
    careerDiscoveryJob.start();
    
    res.json({
      success: true,
      data: {
        message: 'Career discovery cron job started successfully',
        interval: 'Every 1 hour (0 * * * *)'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to start career discovery cron job:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to start career discovery cron job',
      message: error.message
    });
  }
});

/**
 * POST /api/career-discovery/stop
 * Stop the career discovery cron job
 */
router.post('/stop', async (req, res) => {
  try {
    careerDiscoveryJob.stop();
    
    res.json({
      success: true,
      data: {
        message: 'Career discovery cron job stopped successfully'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to stop career discovery cron job:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to stop career discovery cron job',
      message: error.message
    });
  }
});

/**
 * POST /api/career-discovery/reset
 * Reset career discovery state to start from first company
 */
router.post('/reset', async (req, res) => {
  try {
    const initialState = { 
      csvRowIndex: 1, 
      csvFilePath: null, 
      totalRows: 0,
      lastRun: null 
    };
    
    careerDiscoveryJob.saveState(initialState);
    
    res.json({
      success: true,
      data: {
        message: 'Career discovery state reset successfully',
        state: initialState
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to reset career discovery state:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to reset career discovery state',
      message: error.message
    });
  }
});

export default router; 