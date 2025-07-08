import { z } from 'zod';
import OpenAI from 'openai';
import { config } from '../../shared/config/environment.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  defaultModel: 'gpt-4o', // Set default model for all requests
});

export async function fieldMappingNode(state) {
  console.log('🗺️ FieldMappingNode: Starting field mapping...');
  
  try {
    const { formAnalysis, candidateData } = state;
    
    if (!formAnalysis?.success || !formAnalysis.fields || formAnalysis.fields.length === 0) {
      console.log('No form fields detected, skipping field mapping');
      return {
        ...state,
        fieldMapping: {
          success: false,
          mappings: [],
          error: 'No form fields detected'
        },
        currentStep: 'field_mapping_skipped'
      };
    }
    
    if (!candidateData) {
      console.log('No candidate data provided, skipping field mapping');
      return {
        ...state,
        fieldMapping: {
          success: false,
          mappings: [],
          error: 'No candidate data provided'
        },
        currentStep: 'field_mapping_skipped'
      };
    }
    
    // Filter fields for mapping (text, email, textarea, and select fields)
    const mappableFields = formAnalysis.fields.filter(field => 
      field.type === 'text' || field.type === 'email' || field.type === 'textarea' || field.type === 'select'
    );
    
    const nonMappableFields = formAnalysis.fields.filter(field => 
      field.type !== 'text' && field.type !== 'email' && field.type !== 'textarea' && field.type !== 'select'
    );
    
    // Use OpenAI to map fields to candidate data
    const mappings = await mapFieldsWithOpenAI(mappableFields, candidateData);
    
    const mappedCount = mappings.filter(m => m.mapped).length;
    console.log(`✅ Field Mapping: ${mappedCount}/${mappableFields.length} fields mapped`);
    console.log('📊 Field Mapping State:', {
      success: true,
      mappedFields: mappedCount,
      unmappedFields: mappings.filter(m => !m.mapped).length,
      totalFields: mappings.length,
      mappedFieldsList: mappings.filter(m => m.mapped).map(m => ({ fieldName: m.fieldName, value: m.value, confidence: m.confidence }))
    });
    
    return {
      ...state,
      fieldMapping: {
        success: true,
        mappings: mappings,
        mappedFields: mappings.filter(m => m.mapped).length,
        unmappedFields: mappings.filter(m => !m.mapped).length,
        totalFields: mappings.length,
        unfilledFields: nonMappableFields.map(field => ({
          fieldName: field.name,
          fieldType: field.type,
          reason: 'Non-mappable field - requires special handling'
        }))
      },
      currentStep: 'fields_mapped'
    };
    
  } catch (error) {
    console.error('❌ FieldMappingNode error:', error.message);
    return {
      ...state,
      fieldMapping: {
        success: false,
        mappings: [],
        error: error.message
      },
      error: error.message
    };
  }
}

// Helper function to map fields using OpenAI
async function mapFieldsWithOpenAI(detectedFields, candidateData) {
  try {
    const prompt = `
You are mapping form fields to candidate data for a job application.

DETECTED FORM FIELDS:
${detectedFields.map(field => {
  if (field.type === 'select' && field.options && field.options.length > 0) {
    return `- ${field.name} (${field.type}) - Options: ${field.options.join(', ')}`;
  }
  return `- ${field.name} (${field.type})`;
}).join('\n')}

CANDIDATE DATA:
${JSON.stringify(candidateData, null, 2)}

TASK: For each detected field, determine if there's a matching candidate data field and provide the actual value.

RULES:
1. Map exact matches (e.g., "email" field → "john@example.com")
2. Map similar fields (e.g., "firstname" → "John")
3. Map compound fields (e.g., "fullname" → "John Doe")
4. For text areas, map to longer text (e.g., "coverletter" → "I am excited to apply...")

COMPLEX MAPPINGS:
5. Extract first name from full name: "John Doe" → "John" for firstname field
6. Calculate age from DOB: "1990-05-15" → "34" for age field
7. Infer country from city: "Chennai" → "India", "New York" → "USA", "London" → "UK"
8. Extract skills from experience: skills array → "JavaScript, React, Node.js"
9. Combine education: degree + institution → "Bachelor of Science, Stanford University"

SELECT FIELD HANDLING:
10. For select fields, choose the best matching option from the available dropdown options
11. If no exact match, choose the closest option or leave unmapped
12. For country fields: match "India" to "India" option, "USA" to "United States" option
13. For gender fields: match "Male" to "Male" option, "Female" to "Female" option
14. For experience fields: choose appropriate range like "3-5 years" from available options

EXPERIENCE & SKILLS DECISION MAKING:
15. For experience questions: Look at experience.years, experience array, and make intelligent decisions
16. For skill questions: Look at experience.skills, education, and decide based on context
17. For education questions: Look at education array and make informed decisions
18. CONFIDENCE: Even 50% confidence is acceptable - make your best guess based on available data
19. CONTEXT: Use all available information (experience, education, skills) to answer questions

Return a JSON array of mappings with this structure:
[
  {
    "fieldName": "email",
    "fieldType": "email", 
    "mapped": true,
    "value": "john@example.com",
    "confidence": 0.95
  }
]

IMPORTANT: 
- Provide the actual values, not field references
- For experience/skills questions, make intelligent decisions even with 50% confidence
- Use all available candidate data to make informed guesses
- Examples:
  - "firstname": "John" (not "candidateData.personal.firstName")
  - "email": "john@example.com" (not "candidateData.personal.email")
  - "skills": "JavaScript, React, Node.js" (not "candidateData.experience.skills")
  - "experience": "5 years" (based on experience.years)
  - "programming_languages": "JavaScript, Python" (based on skills array)
  - "country": "India" (for select field with options: ["USA", "India", "UK"])
  - "gender": "Male" (for select field with options: ["Male", "Female", "Other"])
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a field mapping expert. Return ONLY valid JSON arrays without any markdown formatting, code blocks, or extra text. Just the JSON array.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
    //   max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    // Clean the response to extract JSON
    let jsonContent = content;
    
    // Remove markdown code blocks if present
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0];
    }
    
    // Clean up any extra whitespace
    jsonContent = jsonContent.trim();
    
    // Parse the JSON response
    let mappings;
    try {
      mappings = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError.message);
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
    }
    // return detectedFields.map(field => {
    //   const mapping = mappings.find(m => m.fieldName === field.name);
      
    //   if (mapping && mapping.mapped) {
    //     return {
    //       fieldName: field.name,
    //       fieldType: field.type,
    //       mapped: true,
    //       value: mapping.value,
    //       confidence: mapping.confidence || 0.8,
    //       options: field.options || [] // Include dropdown options for select fields
    //     };
    //   } else {
    //     return {
    //       fieldName: field.name,
    //       fieldType: field.type,
    //       mapped: false,
    //       value: null,
    //       confidence: 0,
    //       options: field.options || [] // Include dropdown options for select fields
    //     };
    //   }
    // });

    return mappings.filter(m => m.mapped);
    
  } catch (error) {
    console.error('Error in OpenAI field mapping:', error.message);
    
    // Fallback: simple field matching without hardcoded checks
    return detectedFields.map(field => {
      return {
        fieldName: field.name,
        fieldType: field.type,
        mapped: false,
        value: null,
        confidence: 0
      };
    });
  }
} 