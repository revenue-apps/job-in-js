import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const config = {
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.1,
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
  },

  // Stagehand configuration
  stagehand: {
    env: process.env.STAGEHAND_ENV || 'production',
    modelName: process.env.STAGEHAND_MODEL_NAME || 'gpt-4o-mini',
    openaiApiKey: process.env.OPENAI_API_KEY,
    browserbaseApiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    timeout: parseInt(process.env.STAGEHAND_TIMEOUT) || 30000,
    retries: parseInt(process.env.STAGEHAND_RETRIES) || 3,
  },

  // Application settings
  application: {
    maxConcurrentApplications: parseInt(process.env.MAX_CONCURRENT_APPLICATIONS) || 1,
    delayBetweenApplications: parseInt(process.env.DELAY_BETWEEN_APPLICATIONS) || 2000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    timeout: parseInt(process.env.APPLICATION_TIMEOUT) || 60000,
  },

  // File paths
  paths: {
    dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data'),
    outputDir: process.env.OUTPUT_DIR || path.join(process.cwd(), 'output'),
    downloadsDir: process.env.DOWNLOADS_DIR || path.join(process.cwd(), 'downloads'),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'application.log'),
  },

  // Validation
  validation: {
    requireResume: process.env.REQUIRE_RESUME === 'true',
    requireCoverLetter: process.env.REQUIRE_COVER_LETTER === 'false',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['.pdf', '.doc', '.docx'],
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'BROWSERBASE_API_KEY',
  'BROWSERBASE_PROJECT_ID',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

export { config }; 