import { z } from 'zod';

export async function fillFormNode(state) {
  console.log('📝 FillFormNode: Starting form filling...');
  
  try {
    const { page, fieldMapping, pageLoadAnalysis } = state;
    
    if (!page) {
      throw new Error('No page reference found in state');
    }
    
    if (!pageLoadAnalysis?.hasForm) {
      console.log('No form detected, skipping form filling');
      return {
        ...state,
        formFilled: false,
        formFillAnalysis: {
          success: false,
          fieldsFilled: 0,
          error: 'No form detected'
        },
        currentStep: 'form_fill_skipped'
      };
    }
    
    if (!fieldMapping?.success || !fieldMapping?.mappings) {
      console.log('No field mapping available, skipping form filling');
      return {
        ...state,
        formFilled: false,
        formFillAnalysis: {
          success: false,
          fieldsFilled: 0,
          error: 'No field mapping available'
        },
        currentStep: 'form_fill_skipped'
      };
    }
    
    console.log('Filling form with mapped fields:', fieldMapping.mappings);
    
    // Fill the form using the mapped fields
    const formFillResult = await fillFormWithMappedFields(page, fieldMapping.mappings);
    
    console.log('Form fill result:', formFillResult);
    
    return {
      ...state,
      formFilled: formFillResult.success,
      formFillAnalysis: formFillResult,
      currentStep: 'form_filled'
    };
    
  } catch (error) {
    console.error('❌ FillFormNode error:', error.message);
    return {
      ...state,
      formFilled: false,
      formFillAnalysis: {
        success: false,
        fieldsFilled: 0,
        error: error.message
      },
      error: error.message
    };
  }
}

// Helper function to fill form using AI-powered Stagehand
async function fillFormWithMappedFields(page, mappedFields) {
  try {
    let fieldsFilled = 0;
    const filledFields = [];
    
    // Filter only mapped fields with high confidence
    const fieldsToFill = mappedFields.filter(field => field.mapped && field.confidence > 0.5);
    
    if (fieldsToFill.length === 0) {
      console.log('No fields to fill - all fields have low confidence or are unmapped');
      return {
        success: false,
        fieldsFilled: 0,
        fieldsMapped: [],
        issues: ['No fields with sufficient confidence to fill'],
        reasoning: 'No fields met the confidence threshold for filling'
      };
    }
    
    // Create a detailed prompt for AI-powered form filling
    const fieldDetails = fieldsToFill.map(field => 
      `- ${field.fieldName} (${field.fieldType}): "${field.value}" (confidence: ${field.confidence})`
    ).join('\n');
    
    // Use Stagehand's AI-powered form filling
    const fillResult = await page.extract({
      instruction: `Fill out this job application form with the provided candidate data. 
      
FIELDS TO FILL:
${fieldDetails}

INSTRUCTIONS:
1. Find each field on the page and fill it with the provided value
2. For text fields: Enter the exact value provided
3. For email fields: Enter the email address
4. For select/dropdown fields: Choose the option that best matches the provided value
5. For textarea fields: Enter the full text content
6. For file upload fields: Skip for now (handled separately)
7. Be precise and accurate with the data provided
8. If a field is not found, skip it and continue with others

IMPORTANT: Only fill the fields listed above. Do not fill any other fields on the page.`,
      schema: z.object({
        fieldsFilled: z.array(z.object({
          fieldName: z.string(),
          value: z.string(),
          success: z.boolean(),
          reason: z.string().optional()
        })),
        totalFields: z.number(),
        success: z.boolean(),
        issues: z.array(z.string()).optional()
      })
    });
    
    // Process the AI response
    if (fillResult.fieldsFilled) {
      fieldsFilled = fillResult.fieldsFilled.filter(f => f.success).length;
      filledFields = fillResult.fieldsFilled.map(f => ({
        field: f.fieldName,
        value: f.value,
        success: f.success,
        reason: f.reason
      }));
    }
    
    const success = fillResult.success || fieldsFilled > 0;
    console.log(`✅ Form Filling: ${fieldsFilled}/${fieldsToFill.length} fields filled`);
    
    return {
      success: success,
      fieldsFilled: fieldsFilled,
      fieldsMapped: filledFields,
      issues: fillResult.issues || [],
      reasoning: `AI-powered form filling completed. Filled ${fieldsFilled} fields out of ${fieldsToFill.length} provided fields.`
    };
    
  } catch (error) {
    console.error('Error during AI-powered form filling:', error.message);
    return {
      success: false,
      fieldsFilled: 0,
      fieldsMapped: [],
      issues: [error.message],
      reasoning: 'AI-powered form filling failed'
    };
  }
} 