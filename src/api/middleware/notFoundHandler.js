export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: {
      health: 'GET /health',
      'single-application': 'POST /api/v1/job-application/single',
      'batch-application': 'POST /api/v1/job-application/batch',
      'application-status': 'GET /api/v1/job-application/status/:id'
    }
  });
}; 