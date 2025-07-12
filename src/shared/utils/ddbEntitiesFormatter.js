import fs from 'fs/promises';
import path from 'path';

/**
 * Converts dimension mapping output to DDB entities format
 * @param {Object} dimensionMapping - Output from dimensionMapperNode
 * @returns {Object} DDB entities format
 */
export async function formatDimensionMappingToDDBEntities(dimensionMapping) {
  try {
    // Load mapping configuration
    const configPath = path.join(process.cwd(), 'src/new-workflows/job-extraction/config/domain-to-entities-mapping.json');
    const mappingConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const domainToEntitiesMapping = mappingConfig.domain_to_entities_mapping;

    // Initialize DDB entities structure
    const ddbEntities = {
      inferred_sections: {}
    };

    // Process each dimension
    console.log('DDBFormatter: Processing dimensions:', Object.keys(dimensionMapping.dimensions));
    
    for (const [dimensionName, dimensionData] of Object.entries(dimensionMapping.dimensions)) {
      const value = dimensionData.value;
      console.log(`DDBFormatter: Processing dimension "${dimensionName}" with value:`, value);
      
      // Check if dimension maps to main DDB field
      if (domainToEntitiesMapping[dimensionName]) {
        const ddbFieldName = domainToEntitiesMapping[dimensionName];
        ddbEntities[ddbFieldName] = value;
        console.log(`DDBFormatter: Mapped "${dimensionName}" to main field "${ddbFieldName}"`);
      } else {
        // Auto-go to inferred_sections
        ddbEntities.inferred_sections[dimensionName] = value;
        console.log(`DDBFormatter: Added "${dimensionName}" to inferred_sections with value:`, value);
      }
    }
    
    console.log('DDBFormatter: Final inferred_sections:', Object.keys(ddbEntities.inferred_sections));
    console.log('DDBFormatter: Final entities keys:', Object.keys(ddbEntities));

    // Ensure all main DDB fields exist (even if empty)
    const mainDDBFields = [
      'benefits', 'employment_type', 'requirements', 'workplace_type',
      'minimum_qualifications', 'equal_opportunity', 'about_company',
      'responsibilities', 'soft_skills', 'additional_qualifications',
      'what_you_will_do'
    ];

    for (const field of mainDDBFields) {
      if (!ddbEntities[field]) {
        ddbEntities[field] = [];
      }
    }

    // Ensure location is always an array
    if (ddbEntities.location && !Array.isArray(ddbEntities.location)) {
      ddbEntities.location = [ddbEntities.location];
    }

    // Ensure required_skills is always an array
    if (ddbEntities.required_skills && !Array.isArray(ddbEntities.required_skills)) {
      ddbEntities.required_skills = [ddbEntities.required_skills];
    }

    return ddbEntities;

  } catch (error) {
    console.error('Error formatting dimension mapping to DDB entities:', error);
    throw error;
  }
}

/**
 * Validates DDB entities format
 * @param {Object} ddbEntities - DDB entities object
 * @returns {boolean} Validation result
 */
export function validateDDBEntities(ddbEntities) {
  const requiredFields = ['job_title', 'company_name'];
  
  for (const field of requiredFields) {
    if (!ddbEntities[field]) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
} 