import { fieldMappingTool } from './src/shared/utils/fieldMappingTool.js';

// Test the field mapping tool with your example
async function testFieldMapping() {
  console.log('🧪 Testing Field Mapping Tool...\n');
  
  // Your example candidate data
  const candidateData = {
    name: "john doe",
    location: "chennai",
    dob: "15-oct-2015"
  };
  
  // Example form fields (what the form analysis would return)
  const formFields = [
    { name: "firstname", type: "text", placeholder: "First Name" },
    { name: "lastname", type: "text", placeholder: "Last Name" },
    { name: "country", type: "text", placeholder: "Country" },
    { name: "age", type: "number", placeholder: "Age" }
  ];
  
  console.log('📝 Input Data:');
  console.log('Candidate Data:', candidateData);
  console.log('Form Fields:', formFields);
  console.log('\n🔧 Running Field Mapping Tool...\n');
  
  try {
    // Call the field mapping tool
    const result = await fieldMappingTool.invoke({
      formFields: formFields,
      candidateData: candidateData
    });
    
    console.log('✅ Mapping Results:');
    console.log('Success:', result.success);
    console.log('Mapped Fields:', result.mappedFields.length);
    console.log('Unmapped Fields:', result.unmappedFields.length);
    console.log('Reasoning:', result.reasoning);
    
    console.log('\n📋 Detailed Mappings:');
    result.mappedFields.forEach(field => {
      console.log(`  ${field.fieldName} → "${field.candidateValue}" (confidence: ${field.confidence})`);
      console.log(`    Reasoning: ${field.reasoning}`);
    });
    
    if (result.unmappedFields.length > 0) {
      console.log('\n❌ Unmapped Fields:');
      result.unmappedFields.forEach(field => {
        console.log(`  - ${field}`);
      });
    }
    
    console.log('\n🎯 Expected Results:');
    console.log('  firstname → "john" (from "john doe")');
    console.log('  lastname → "doe" (from "john doe")');
    console.log('  country → "chennai" (from location)');
    console.log('  age → "8" (calculated from "15-oct-2015")');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFieldMapping(); 