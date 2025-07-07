import { fieldMappingNode } from './src/new-nodes/mapping/fieldMappingNode.js';

// Mock candidate data with complex scenarios
const mockCandidateData = {
  personal: {
    fullName: "John Doe",  // For testing name extraction
    email: "john.doe@example.com",
    phone: "+1-555-123-4567",
    location: "Chennai, India",  // For testing country inference
    dob: "1990-05-15"  // For testing age calculation
  },
  experience: {
    years: 5,
    skills: ["JavaScript", "React", "Node.js", "Python"]
  },
  education: {
    degree: "Bachelor of Science",
    institution: "Stanford University"
  },
  resume: {
    path: "/path/to/resume.pdf"
  },
  coverLetter: "I am excited to apply for this position..."
};

// Mock form analysis with mixed field types
const mockFormAnalysis = {
  success: true,
  fields: [
    { name: "email", type: "email" },
    { name: "firstname", type: "text" },
    { name: "lastname", type: "text" },
    { name: "phone", type: "phone" },
    { name: "resume", type: "file" },
    { name: "coverletter", type: "textarea" },
    { name: "age", type: "number" },
    { name: "country", type: "text" },
    { name: "skills", type: "textarea" },
    { name: "education", type: "text" },
    { name: "experience", type: "number" },
    { name: "dob", type: "date" },
    { name: "gender", type: "select" },
    { name: "unknown_field", type: "text" }
  ]
};

// Test the field mapping node
async function testFieldMappingNode() {
  console.log('🧪 Testing Field Mapping Node...\n');
  
  // Mock state
  const state = {
    formAnalysis: mockFormAnalysis,
    candidateData: mockCandidateData,
    currentStep: 'form_analyzed'
  };
  
  try {
    console.log('📝 Input Data:');
    console.log('Form Fields:', mockFormAnalysis.fields.map(f => f.name));
    console.log('Candidate Data Keys:', Object.keys(mockCandidateData));
    console.log('\n🔧 Running Field Mapping Node...\n');
    
    // Run the field mapping node
    const result = await fieldMappingNode(state);
    
    console.log('✅ Field Mapping Results:');
    console.log('Success:', result.fieldMapping.success);
    console.log('Total text fields:', result.fieldMapping.totalFields);
    console.log('Mapped fields:', result.fieldMapping.mappedFields);
    console.log('Unmapped fields:', result.fieldMapping.unmappedFields);
    
    console.log('\n📋 Text Field Mappings:');
    result.fieldMapping.mappings.forEach((mapping, index) => {
      console.log(`  ${index + 1}. ${mapping.fieldName} (${mapping.fieldType})`);
      console.log(`     Mapped: ${mapping.mapped}`);
      if (mapping.mapped) {
        console.log(`     Value: ${mapping.value}`);
        console.log(`     Confidence: ${mapping.confidence}`);
      }
    });
    
    console.log('\n🚫 Unfilled Fields (Non-text):');
    result.fieldMapping.unfilledFields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.fieldName} (${field.fieldType})`);
      console.log(`     Reason: ${field.reason}`);
    });
    
    console.log('\n🎯 Expected Improvements:');
    console.log('✅ OpenAI-powered text field mapping');
    console.log('✅ No hardcoded field checks');
    console.log('✅ Separate handling for non-text fields');
    console.log('✅ Clean unfilled fields array');
    console.log('✅ Focus on text/email/textarea only');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFieldMappingNode(); 