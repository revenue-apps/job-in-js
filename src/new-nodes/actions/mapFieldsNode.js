import { fieldMappingTool } from '../../shared/utils/fieldMappingTool.js';

export async function mapFieldsNode(state) {
  console.log('🗺️ MapFieldsNode: Starting field mapping...');
  
  try {
    const { formAnalysis, candidateData } = state;
    
    if (!formAnalysis?.success || !formAnalysis?.fields) {
      console.log('No form analysis available, skipping field mapping');
      return {
        ...state,
        fieldMapping: {
          success: false,
          mappedFields: [],
          unmappedFields: [],
          error: 'No form analysis available'
        },
        currentStep: 'field_mapping_skipped'
      };
    }
    
    console.log('Mapping form fields to candidate data using AI...');
    console.log('Candidate data:', candidateData);
    console.log('Form fields:', formAnalysis.fields);
    
    // Use the field mapping tool
    const mappingResult = await fieldMappingTool.invoke({
      formFields: formAnalysis.fields,
      candidateData: candidateData
    });
    
    console.log('Field mapping result:', mappingResult);
    
    return {
      ...state,
      fieldMapping: mappingResult,
      currentStep: 'fields_mapped'
    };
    
  } catch (error) {
    console.error('❌ MapFieldsNode error:', error.message);
    return {
      ...state,
      fieldMapping: {
        success: false,
        mappedFields: [],
        unmappedFields: [],
        error: error.message
      },
      error: error.message
    };
  }
} 