import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '../shared/config/environment.js';
import { logger } from '../shared/utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { validateApiKey } from './middleware/validateApiKey.js';
import jobApplicationRoutes from './routes/jobApplication.js';
import healthRoutes from './routes/health.js';
import { enhancedStagehandClient } from '../shared/utils/enhancedStagehand.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(requestLogger);

// API key validation for protected routes
app.use('/api/v1', validateApiKey);

// Health check route (no auth required)
app.use('/health', healthRoutes);

// API routes
app.use('/api/v1/job-application', jobApplicationRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  try {
    await enhancedStagehandClient.close();
    logger.info('Stagehand client closed successfully');
  } catch (error) {
    logger.warn('Error closing Stagehand client:', error.message);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  try {
    await enhancedStagehandClient.close();
    logger.info('Stagehand client closed successfully');
  } catch (error) {
    logger.warn('Error closing Stagehand client:', error.message);
  }
  process.exit(0);
});

// Start server function
function startServer() {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      logger.info('🚀 Job Application API server started successfully');
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API docs: http://localhost:${PORT}/api/v1/docs`);
      logger.info(`🌐 Server running on: http://localhost:${PORT}`);
      resolve(server);
    });

    server.on('error', (error) => {
      logger.error('❌ Server failed to start:', error.message);
      reject(error);
    });
  });
}

// Start server only when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
    .then(() => {
      logger.info('✅ Server is ready to handle requests');
    })
    .catch((error) => {
      logger.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });
}

export default app; 