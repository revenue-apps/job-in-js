import { logger } from '../../shared/utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const { method, url, ip } = req;
  
  // Log the error
  logger.error('API Error', {
    method,
    url,
    ip,
    error: err.message,
    stack: err.stack,
    userAgent: req.get('User-Agent')
  });

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details || err.errors,
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key or authentication required',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
}; 