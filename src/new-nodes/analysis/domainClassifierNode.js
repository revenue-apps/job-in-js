/**
 * Domain Classifier Node
 * Pure function for classifying jobs into supported domains using OpenAI utility
 */

import { chatCompletion } from '../../shared/utils/openai.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Domain Classifier Node - Pure Function
 * Takes state and returns updated state with domain classification
 * @param {Object} state - Current workflow state
 * @returns {Promise<Object>} Updated state with domain classification
 */
async function domainClassifierNode(state) {
  try {
    console.log('DomainClassifierNode: Starting domain classification...');
    console.log('DomainClassifierNode: State:', JSON.stringify(state, null, 2));
    console.log('DomainClassifierNode: analysis_results present:', !!state.analysis_results);
    console.log('DomainClassifierNode: analysis_results keys:', state.analysis_results ? Object.keys(state.analysis_results) : 'N/A');
    console.log('DomainClassifierNode: analysis_results.rawText:', state.analysis_results?.rawText ? `${state.analysis_results.rawText.length} characters` : 'MISSING');
    
    if (!state.analysis_results || !state.analysis_results.rawText) {
      console.error('DomainClassifierNode: No job analysis available');
      console.error('DomainClassifierNode: analysis_results:', state.analysis_results);
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            node: 'domain_classifier',
            error: 'No job analysis available for domain classification',
            timestamp: new Date().toISOString()
          }
        ],
        metadata: {
          ...state.metadata,
          domain_classifier_failed: true,
          domain_classifier_error: 'No job analysis available',
          domain_classifier_timestamp: new Date().toISOString()
        }
      };
    }

    const rawText = state.analysis_results.rawText;
    
    console.log(`DomainClassifierNode: Classifying content with ${rawText.length} characters`);
    
    // Load supported domains hierarchy
    const domainsPath = path.join(process.cwd(), 'src/new-workflows/job-extraction/config/supported_domains.json');
    const domainsData = JSON.parse(await fs.readFile(domainsPath, 'utf8'));
    const supportedDomains = Object.keys(domainsData.supported_domains);
    
    console.log(`DomainClassifierNode: Available domains: ${supportedDomains.join(', ')}`);
    
    // Build hierarchical classification prompt
    let hierarchyPrompt = 'Classify this job posting into the hierarchical structure:\n\n';
    for (const domain of supportedDomains) {
      hierarchyPrompt += `${domain}:\n`;
      const subDomains = domainsData.supported_domains[domain].sub_domains;
      for (const [subDomain, subData] of Object.entries(subDomains)) {
        hierarchyPrompt += `  ${subDomain}:\n`;
        hierarchyPrompt += `    ${subData.roles.join(', ')}\n`;
      }
      hierarchyPrompt += '\n';
    }
    
    // Use OpenAI utility to classify the job hierarchically
    const messages = [
      { role: 'system', content: 'You are a job domain classifier. Even if a job includes ML systems or AI infra, do not restrict to backend roles. Instead, match role like ml_engineer or ai_engineer from data_science if it fits better. Return JSON with domain, sub_domain, and role. Use only the domain, sub_domain, and role that are in the hierarchyPrompt.' },
      { role: 'user', content: `${hierarchyPrompt}\n\nJob posting:\n${rawText.substring(0, 4000)}\n\nReturn JSON: {"domain": "...", "sub_domain": "...", "role": "..."}` }
    ];
    
    const classification = await chatCompletion(messages, {
      model: 'gpt-4o-mini',
      maxTokens: 10000,
      responseFormat: { type: 'json_object' }
    });
    
    if (!classification.success) {
      throw new Error(`Classification failed: ${classification.error}`);
    }
    
    const classificationResult = JSON.parse(classification.data);
    const { domain: selectedDomain, sub_domain: selectedSubDomain, role: selectedRole } = classificationResult;
    
    // Validate the classification against our hierarchy
    const domainConfig = domainsData.supported_domains[selectedDomain];
    if (!domainConfig) {
      throw new Error(`Invalid domain: ${selectedDomain}`);
    }
    
    const subDomainConfig = domainConfig.sub_domains[selectedSubDomain];
    if (!subDomainConfig) {
      throw new Error(`Invalid sub-domain: ${selectedSubDomain} for domain: ${selectedDomain}`);
    }
    
    if (!subDomainConfig.roles.includes(selectedRole)) {
      throw new Error(`Invalid role: ${selectedRole} for sub-domain: ${selectedSubDomain}`);
    }
    
    const domainClassification = {
      domain: selectedDomain,
      sub_domain: selectedSubDomain,
      role: selectedRole,
      confidence: 0.8, // Default confidence for hierarchical classification
      classifiedAt: new Date().toISOString()
    };
    
    console.log(`DomainClassifierNode: Successfully classified job as: ${selectedDomain} > ${selectedSubDomain} > ${selectedRole}`);
    
    // Return updated state with domain classification
    return {
      ...state,
      domain_classification: domainClassification,
      current_node: 'domain_classifier',
      metadata: {
        ...state.metadata,
        domain_classifier_completed: true,
        domain_classifier_timestamp: new Date().toISOString(),
        selected_domain: selectedDomain,
        selected_sub_domain: selectedSubDomain,
        selected_role: selectedRole,
        message: 'Hierarchical domain classification completed successfully'
      }
    };

  } catch (error) {
    console.error('DomainClassifierNode: Error classifying domain:', error);
    
    return {
      ...state,
      errors: [
        ...state.errors,
        {
          node: 'domain_classifier',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      ],
      metadata: {
        ...state.metadata,
        domain_classifier_failed: true,
        domain_classifier_error: error.message,
        domain_classifier_timestamp: new Date().toISOString()
      }
    };
  }
}

export default domainClassifierNode; 