import { analyzeFormNode } from './src/new-nodes/detection/analyzeFormNode.js';

// Mock page object for testing
const mockPage = {
  ask: async (prompt) => {
    console.log('🤖 AI Prompt:', prompt);
    
    // Mock AI response with JSON format
    return `[
      {
        "name": "firstname",
        "type": "text",
        "label": "First Name",
        "placeholder": "Enter your first name",
        "required": true,
        "validation": "Required field"
      },
      {
        "name": "lastname", 
        "type": "text",
        "label": "Last Name",
        "placeholder": "Enter your last name",
        "required": true,
        "validation": "Required field"
      },
      {
        "name": "email",
        "type": "email",
        "label": "Email Address",
        "placeholder": "your.email@example.com",
        "required": true,
        "validation": "Valid email required"
      },
      {
        "name": "phone",
        "type": "phone",
        "label": "Phone Number",
        "placeholder": "+1 (555) 123-4567",
        "required": false,
        "validation": "Optional"
      },
      {
        "name": "location",
        "type": "text",
        "label": "Location",
        "placeholder": "City, State, Country",
        "required": false,
        "validation": "Optional"
      },
      {
        "name": "experience",
        "type": "number",
        "label": "Years of Experience",
        "placeholder": "5",
        "required": true,
        "validation": "Number required"
      },
      {
        "name": "resume",
        "type": "file",
        "label": "Resume/CV",
        "placeholder": "Upload your resume",
        "required": true,
        "validation": "PDF or DOC required"
      },
      {
        "name": "coverletter",
        "type": "textarea",
        "label": "Cover Letter",
        "placeholder": "Tell us why you're interested...",
        "required": false,
        "validation": "Optional"
      }
    ]`;
  }
};

// Test the enhanced analyzeFormNode
async function testEnhancedFormAnalysis() {
  console.log('🧪 Testing Enhanced Form Analysis...\n');
  
  // Mock state
  const state = {
    page: mockPage,
    pageLoadAnalysis: {
      hasForm: true,
      isLoaded: true
    },
    currentStep: 'page_loaded'
  };
  
  try {
    console.log('📝 Input State:');
    console.log('- Page loaded:', state.pageLoadAnalysis.isLoaded);
    console.log('- Has form:', state.pageLoadAnalysis.hasForm);
    console.log('\n🔧 Running Enhanced AnalyzeFormNode...\n');
    
    // Run the enhanced analyzeFormNode
    const result = await analyzeFormNode(state);
    
    console.log('✅ Form Analysis Results:');
    console.log('Success:', result.formAnalysis.success);
    console.log('Total fields:', result.formAnalysis.fieldCount);
    console.log('Required fields:', result.formAnalysis.requiredFields);
    console.log('Optional fields:', result.formAnalysis.optionalFields);
    console.log('Field types:', result.formAnalysis.fieldTypes);
    
    console.log('\n📋 Detailed Field Analysis:');
    result.formAnalysis.fields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.name} (${field.type})`);
      console.log(`     Label: ${field.label}`);
      console.log(`     Required: ${field.required}`);
      console.log(`     Validation: ${field.validation}`);
    });
    
    console.log('\n🎯 Expected Improvements:');
    console.log('✅ JSON parsing for structured field data');
    console.log('✅ Field type detection (text, email, phone, file, etc.)');
    console.log('✅ Required/optional field detection');
    console.log('✅ Validation hint extraction');
    console.log('✅ Better field name and label extraction');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEnhancedFormAnalysis(); 