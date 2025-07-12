/**
 * Configuration Loader Utility
 * Loads and validates domain-specific configurations
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Load domain configuration
 * @param {string} domain - Domain name
 * @returns {Promise<Object>} Domain configuration
 */
async function loadDomainConfig(domain) {
  try {
    const configPath = path.join(__dirname, '../config/domains', `${domain}.json`);
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // Validate configuration structure
    validateDomainConfig(config);
    
    return config;
  } catch (error) {
    throw new Error(`Failed to load domain config for ${domain}: ${error.message}`);
  }
}

/**
 * Load quality configuration
 * @returns {Promise<Object>} Quality configuration
 */
async function loadQualityConfig() {
  try {
    const configPath = path.join(__dirname, '../config/quality.json');
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // Validate quality configuration
    validateQualityConfig(config);
    
    return config;
  } catch (error) {
    throw new Error(`Failed to load quality config: ${error.message}`);
  }
}

/**
 * Load all available domain configurations
 * @returns {Promise<Object>} All domain configurations
 */
async function loadAllDomainConfigs() {
  try {
    const domainsPath = path.join(__dirname, '../config/domains');
    const files = await fs.readdir(domainsPath);
    
    const configs = {};
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const domain = file.replace('.json', '');
        configs[domain] = await loadDomainConfig(domain);
      }
    }
    
    return configs;
  } catch (error) {
    throw new Error(`Failed to load domain configs: ${error.message}`);
  }
}

/**
 * Validate domain configuration structure
 * @param {Object} config - Domain configuration
 */
function validateDomainConfig(config) {
  const requiredFields = ['domain', 'sub_domains', 'core_dimensions'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate sub-domains structure
  for (const [subDomain, subConfig] of Object.entries(config.sub_domains)) {
    if (!subConfig.dimensions || !subConfig.experience_levels) {
      throw new Error(`Invalid sub-domain config for ${subDomain}`);
    }
    
    // Validate dimensions
    for (const [dimension, dimConfig] of Object.entries(subConfig.dimensions)) {
      if (typeof dimConfig.required !== 'boolean') {
        throw new Error(`Invalid required field for dimension ${dimension}`);
      }
      if (typeof dimConfig.confidence_threshold !== 'number') {
        throw new Error(`Invalid confidence threshold for dimension ${dimension}`);
      }
      if (!dimConfig.extraction_prompt) {
        throw new Error(`Missing extraction prompt for dimension ${dimension}`);
      }
    }
    
    // Validate experience levels
    for (const [level, levelConfig] of Object.entries(subConfig.experience_levels)) {
      if (typeof levelConfig.required_dimensions !== 'number') {
        throw new Error(`Invalid required dimensions for level ${level}`);
      }
      if (!levelConfig.analysis_depth) {
        throw new Error(`Missing analysis depth for level ${level}`);
      }
    }
  }
}

/**
 * Validate quality configuration structure
 * @param {Object} config - Quality configuration
 */
function validateQualityConfig(config) {
  const requiredFields = ['confidence_thresholds', 'completeness_thresholds', 'quality_metrics'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate confidence thresholds
  for (const [key, value] of Object.entries(config.confidence_thresholds)) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error(`Invalid confidence threshold for ${key}`);
    }
  }
  
  // Validate completeness thresholds
  for (const [key, value] of Object.entries(config.completeness_thresholds)) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error(`Invalid completeness threshold for ${key}`);
    }
  }
}

/**
 * Get domain configuration for a specific job
 * @param {string} domain - Domain name
 * @param {string} subDomain - Sub-domain name (optional)
 * @returns {Promise<Object>} Domain configuration
 */
async function getDomainConfig(domain, subDomain = null) {
  const config = await loadDomainConfig(domain);
  
  if (subDomain) {
    if (!config.sub_domains[subDomain]) {
      throw new Error(`Sub-domain ${subDomain} not found in domain ${domain}`);
    }
    return {
      ...config,
      current_sub_domain: subDomain,
      sub_domain_config: config.sub_domains[subDomain]
    };
  }
  
  return config;
}

/**
 * Get available domains
 * @returns {Promise<Array<string>>} List of available domains
 */
async function getAvailableDomains() {
  try {
    const domainsPath = path.join(__dirname, '../config/domains');
    const files = await fs.readdir(domainsPath);
    
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    throw new Error(`Failed to get available domains: ${error.message}`);
  }
}

export {
  loadDomainConfig,
  loadQualityConfig,
  loadAllDomainConfigs,
  getDomainConfig,
  getAvailableDomains,
  validateDomainConfig,
  validateQualityConfig
}; 