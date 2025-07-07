import { config } from '../config/environment.js';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = logLevels[config.logging.level] || logLevels.info;

function formatMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 
    ? ` | ${JSON.stringify(context)}` 
    : '';
  
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
}

export const logger = {
  error: (message, context = {}) => {
    if (currentLevel >= logLevels.error) {
      console.error(formatMessage('error', message, context));
    }
  },
  
  warn: (message, context = {}) => {
    if (currentLevel >= logLevels.warn) {
      console.warn(formatMessage('warn', message, context));
    }
  },
  
  info: (message, context = {}) => {
    if (currentLevel >= logLevels.info) {
      console.info(formatMessage('info', message, context));
    }
  },
  
  debug: (message, context = {}) => {
    if (currentLevel >= logLevels.debug) {
      console.debug(formatMessage('debug', message, context));
    }
  },
  
  // Special logger for Stagehand operations
  stagehand: (message, jobUrl = '', context = {}) => {
    const fullContext = { ...context, jobUrl };
    logger.info(`[Stagehand] ${message}`, fullContext);
  },
  
  // Special logger for LangGraph operations
  langgraph: (nodeName, message, context = {}) => {
    const fullContext = { ...context, node: nodeName };
    logger.info(`[LangGraph:${nodeName}] ${message}`, fullContext);
  }
}; 