import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fieldListPath = join(__dirname, 'fieldList.json');
const fieldList = JSON.parse(readFileSync(fieldListPath, 'utf8'));

export async function analyzeFormNode(state) {
    console.log('🔍 AnalyzeFormNode: Starting form analysis...');

    try {
        const { page, pageLoadAnalysis } = state;

        if (!page) {
            throw new Error('No page reference found in state');
        }

        if (!pageLoadAnalysis?.hasForm) {
            console.log('No form detected, skipping form analysis');
            return {
                ...state,
                formAnalysis: {
                    success: false,
                    fields: [],
                    error: 'No form detected'
                },
                currentStep: 'form_analysis_skipped'
            };
        }

        console.log('Analyzing form fields with AI...');

            // Use Stagehand's extract method with correct Zod schema
    const formAnalysis = await page.extract({
      instruction: `Look for form fields on this job application page. Common field names to look for: ${getAllFieldNames().slice(0, 20).join(', ')}. 
      
For each field found, extract:
- Field name
- Field type (text, email, select, textarea, etc.)
- For SELECT fields only: also extract the available options

Focus on text, email, textarea, and select fields.`,
      schema: z.object({
        fields: z.array(z.object({
          name: z.string(),
          type: z.string(),
          options: z.array(z.string()).optional()
        }))
      })
    });

        //         // Parse the AI response to extract field information
        const fields = parseFormFields(formAnalysis);

        console.log(`✅ Form Analysis: Found ${fields.length} fields`);

        return {
            ...state,
            formAnalysis: {
                success: true,
                fields: fields,
                fieldCount: fields.length,
                requiredFields: fields.filter(f => f.required).length,
                optionalFields: fields.filter(f => !f.required).length,
                fieldTypes: getFieldTypeSummary(fields),
                aiResponse: formAnalysis
            },
            currentStep: 'form_analyzed'
        };

    } catch (error) {
        console.error('❌ AnalyzeFormNode error:', error.message);
        return {
            ...state,
            formAnalysis: {
                success: false,
                fields: [],
                error: error.message
            },
            error: error.message
        };
    }
}

// Enhanced helper function to parse AI response into structured field data
function parseFormFields(aiResponse) {
    const fields = [];

    try {
        // Handle the new structured format with field objects
        if (aiResponse.fields && Array.isArray(aiResponse.fields)) {
            return aiResponse.fields.map(field => ({
                name: field.name,
                type: field.type || getFieldType(field.name),
                label: field.name,
                placeholder: field.name,
                required: false,
                validation: '',
                value: '',
                id: field.name,
                options: field.options || [] // Include dropdown options for select fields
            }));
        }

        // Fallback for string response
        if (typeof aiResponse === 'string') {
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsedFields = JSON.parse(jsonMatch[0]);
                return parsedFields.map(field => {
                    if (typeof field === 'string') {
                        return {
                            name: field,
                            type: getFieldType(field),
                            label: field,
                            placeholder: field,
                            required: false,
                            validation: '',
                            value: '',
                            id: field,
                            options: []
                        };
                    } else {
                        return {
                            name: field.name,
                            type: field.type || getFieldType(field.name),
                            label: field.name,
                            placeholder: field.name,
                            required: false,
                            validation: '',
                            value: '',
                            id: field.name,
                            options: field.options || []
                        };
                    }
                });
            }
        }
    } catch (e) {
        console.log('Could not parse as structured data, using fallback parsing');
    }

    // Fallback parsing using imported field list
    for (const fieldName of fieldList) {
        if (JSON.stringify(aiResponse).toLowerCase().includes(fieldName)) {
            fields.push({
                name: fieldName,
                type: getFieldType(fieldName),
                label: fieldName,
                placeholder: fieldName,
                required: false,
                validation: '',
                value: '',
                id: fieldName,
                options: []
            });
        }
    }

    return fields;
}

// Helper function to determine field type based on field name
function getFieldType(fieldName) {
    const fieldNameLower = fieldName.toLowerCase();

    if (fieldNameLower.includes('email')) return 'email';
    if (fieldNameLower.includes('phone') || fieldNameLower.includes('mobile') || fieldNameLower.includes('telephone')) return 'phone';
    if (fieldNameLower.includes('resume') || fieldNameLower.includes('cv') || fieldNameLower.includes('file')) return 'file';
    if (fieldNameLower.includes('coverletter') || fieldNameLower.includes('description') || fieldNameLower.includes('about')) return 'textarea';
    if (fieldNameLower.includes('dob') || fieldNameLower.includes('birthdate') || fieldNameLower.includes('date')) return 'date';
    if (fieldNameLower.includes('age') || fieldNameLower.includes('years') || fieldNameLower.includes('experience')) return 'number';
    if (fieldNameLower.includes('gender') || fieldNameLower.includes('country') || fieldNameLower.includes('state')) return 'select';

    return 'text';
}

// Helper function to get field type summary
function getFieldTypeSummary(fields) {
    const typeCount = {};
    fields.forEach(field => {
        typeCount[field.type] = (typeCount[field.type] || 0) + 1;
    });
    return typeCount;
}

// Helper function to get all field names from the JSON file
export function getAllFieldNames() {
  return fieldList;
}

// Helper function to find field by name in the JSON file
export function findFieldByName(name) {
  return fieldList.includes(name) ? name : null;
}

// Helper function to check if field exists in the JSON file
export function hasField(name) {
  return fieldList.includes(name);
} 