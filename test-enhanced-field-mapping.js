import { fieldMappingTool } from './src/shared/utils/fieldMappingTool.js';

// Test the enhanced field mapping tool with new field types
async function testEnhancedFieldMapping() {
  console.log('🧪 Testing Enhanced Field Mapping Tool...\n');
  
  // Enhanced form fields from our improved analyzeFormNode
  const formFields = [
    { name: "firstname", type: "text", label: "First Name", required: true },
    { name: "lastname", type: "text", label: "Last Name", required: true },
    { name: "email", type: "email", label: "Email Address", required: true },
    { name: "phone", type: "phone", label: "Phone Number", required: false },
    { name: "location", type: "text", label: "Location", required: false },
    { name: "experience", type: "number", label: "Years of Experience", required: true },
    { name: "resume", type: "file", label: "Resume/CV", required: true },
    { name: "coverletter", type: "textarea", label: "Cover Letter", required: false }
  ];
  
  // Enhanced candidate data
  const candidateData = {
    name: "john doe",
    email: "john@example.com",
    phone: "+1-555-123-4567",
    location: "new york, ny, usa",
    experience: "5 years",
    skills: ["JavaScript", "React", "Node.js"],
    resume: "john_doe_resume.pdf",
    coverLetter: "I am excited to apply for this position...",
    linkedin: "linkedin.com/in/johndoe",
    github: "github.com/johndoe"
  };
  
  console.log('📝 Input Data:');
  console.log('Form Fields:', formFields.map(f => `${f.name} (${f.type})`));
  console.log('Candidate Data:', candidateData);
  console.log('\n🔧 Running Enhanced Field Mapping Tool...\n');
  
  try {
    // Call the enhanced field mapping tool
    const result = await fieldMappingTool.invoke({
      formFields: formFields,
      candidateData: candidateData
    });
    
    console.log('✅ Enhanced Mapping Results:');
    console.log('Success:', result.success);
    console.log('Mapped Fields:', result.mappedFields.length);
    console.log('Unmapped Fields:', result.unmappedFields.length);
    console.log('Reasoning:', result.reasoning);
    
    console.log('\n📋 Detailed Mappings:');
    result.mappedFields.forEach(field => {
      console.log(`  ${field.fieldName} (${field.fieldType}) → "${field.candidateValue}" (confidence: ${field.confidence})`);
      console.log(`    Reasoning: ${field.reasoning}`);
    });
    
    if (result.unmappedFields.length > 0) {
      console.log('\n❌ Unmapped Fields:');
      result.unmappedFields.forEach(field => {
        console.log(`  - ${field}`);
      });
    }
    
    console.log('\n🎯 Expected Improvements:');
    console.log('✅ Enhanced field name patterns');
    console.log('✅ File upload field handling (resume, cover letter)');
    console.log('✅ Contact info variations');
    console.log('✅ Complex field name matching');
    console.log('✅ Better semantic matching');
    
    console.log('\n📊 Field Type Summary:');
    const fieldTypeCount = {};
    result.mappedFields.forEach(field => {
      fieldTypeCount[field.fieldType] = (fieldTypeCount[field.fieldType] || 0) + 1;
    });
    console.log('Field types mapped:', fieldTypeCount);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEnhancedFieldMapping(); 