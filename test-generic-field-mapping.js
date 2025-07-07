import { fieldMappingTool } from './src/shared/utils/fieldMappingTool.js';

// Test the generic field mapping tool with various scenarios
async function testGenericFieldMapping() {
  console.log('🧪 Testing Generic Field Mapping Tool...\n');
  
  // Test scenarios
  const testScenarios = [
    {
      name: "Basic Personal Info",
      candidateData: {
        name: "john doe",
        location: "chennai, tamil nadu, india",
        dob: "15-oct-2015",
        email: "john@example.com",
        phone: "+91-9876543210"
      },
      formFields: [
        { name: "firstname", type: "text" },
        { name: "lastname", type: "text" },
        { name: "country", type: "text" },
        { name: "age", type: "number" },
        { name: "email_address", type: "email" },
        { name: "mobile_number", type: "tel" }
      ]
    },
    {
      name: "Professional Profile",
      candidateData: {
        name: "sarah smith",
        experience: "5 years",
        skills: ["JavaScript", "React", "Node.js"],
        education: "Bachelor's in Computer Science",
        university: "MIT",
        linkedin: "linkedin.com/in/sarahsmith",
        github: "github.com/sarahsmith"
      },
      formFields: [
        { name: "full_name", type: "text" },
        { name: "years_experience", type: "number" },
        { name: "technical_skills", type: "text" },
        { name: "degree", type: "text" },
        { name: "college", type: "text" },
        { name: "linkedin_profile", type: "url" },
        { name: "github_url", type: "url" }
      ]
    },
    {
      name: "Unknown Fields",
      candidateData: {
        name: "alex brown",
        location: "new york, ny, usa",
        email: "alex@example.com",
        experience: "3 years",
        skills: ["Python", "Django", "AWS"]
      },
      formFields: [
        { name: "applicant_name", type: "text" },
        { name: "contact_info", type: "text" },
        { name: "work_location", type: "text" },
        { name: "time_in_field", type: "text" },
        { name: "capabilities", type: "text" },
        { name: "unknown_field", type: "text" }
      ]
    },
    {
      name: "Minimal Data",
      candidateData: {
        name: "jane wilson",
        email: "jane@example.com"
      },
      formFields: [
        { name: "name", type: "text" },
        { name: "email", type: "email" },
        { name: "phone", type: "tel" },
        { name: "address", type: "text" },
        { name: "experience", type: "text" }
      ]
    }
  ];
  
  // Run each test scenario
  for (const scenario of testScenarios) {
    console.log(`📋 Test Scenario: ${scenario.name}`);
    console.log('='.repeat(50));
    
    console.log('📝 Input Data:');
    console.log('Candidate Data:', scenario.candidateData);
    console.log('Form Fields:', scenario.formFields.map(f => f.name));
    console.log('\n🔧 Running Field Mapping Tool...\n');
    
    try {
      // Call the field mapping tool
      const result = await fieldMappingTool.invoke({
        formFields: scenario.formFields,
        candidateData: scenario.candidateData
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
      
      console.log('\n' + '='.repeat(50) + '\n');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.log('\n' + '='.repeat(50) + '\n');
    }
  }
}

// Run the test
testGenericFieldMapping(); 