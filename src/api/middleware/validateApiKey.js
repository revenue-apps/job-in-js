import { logger } from '../../shared/utils/logger.js';

export const validateApiKey = (req, res, next) => {
  // Skip validation for health check
  if (req.path === '/health') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    logger.warn('API request without API key', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    });
    
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API key is required',
      timestamp: new Date().toISOString()
    });
  }

  // For now, accept any API key (you can implement proper validation later)
  // In production, you'd validate against a database or environment variable
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || ['test-api-key'];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key used', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      providedKey: apiKey.substring(0, 8) + '...'
    });
    
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key',
      timestamp: new Date().toISOString()
    });
  }

  // Add API key info to request for logging
  req.apiKey = apiKey.substring(0, 8) + '...';
  
  next();
}; 