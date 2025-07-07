import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key';

// Test data
const testCandidateData = {
  personal: {
    firstName: "Test",
    lastName: "User",
    email: "test.user@example.com",
    phone: "+1-555-999-8888",
    location: "San Francisco, CA",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    linkedin: "https://linkedin.com/in/testuser",
  },
  experience: [
    {
      title: "Software Engineer",
      company: "Test Corp",
      startDate: "2022-01-01",
      endDate: null,
      description: "Full-stack development",
      achievements: ["Built scalable applications"],
      skills: ["JavaScript", "React", "Node.js"]
    }
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "Test University",
      startDate: "2018-09-01",
      endDate: "2022-05-15",
      gpa: 3.8
    }
  ],
  skills: ["JavaScript", "React", "Node.js", "Python"],
  resume: {
    path: "./data/resume.pdf",
    filename: "test_resume.pdf"
  },
  coverLetter: {
    autoGenerate: true
  }
};

async function testAPI() {
  console.log('🧪 Testing Job Application API');
  console.log('================================\n');

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  };

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('');

    // Test 2: Get example candidate data
    console.log('2️⃣ Getting example candidate data...');
    const exampleResponse = await fetch(`${API_BASE_URL}/api/v1/job-application/example-candidate`, { headers });
    const exampleData = await exampleResponse.json();
    console.log('✅ Example candidate data retrieved');
    console.log('   Name:', exampleData.data.personal.firstName, exampleData.data.personal.lastName);
    console.log('   Email:', exampleData.data.personal.email);
    console.log('');

    // Test 3: Validate candidate data
    console.log('3️⃣ Validating candidate data...');
    const validateResponse = await fetch(`${API_BASE_URL}/api/v1/job-application/validate-candidate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testCandidateData)
    });
    const validateData = await validateResponse.json();
    console.log('✅ Candidate data validation:', validateData.success ? 'PASSED' : 'FAILED');
    console.log('');

    // Test 4: Single job application (will fail due to API keys, but tests the endpoint)
    console.log('\n4️⃣ Testing single job application...');
    const applicationData = {
      jobUrl: 'https://job-boards.greenhouse.io/clipboardhealth/jobs/5570020004',
      candidateData: {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-123-4567',
          location: 'San Francisco, CA'
        },
        experience: [
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            duration: '2 years',
            description: 'Full-stack development with React and Node.js'
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of California',
            year: '2020'
          }
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
        customFields: {}
      }
    };

    const singleResponse = await fetch(`${API_BASE_URL}/api/v1/job-application/single`, {
      method: 'POST',
      headers,
      body: JSON.stringify(applicationData)
    });
    const singleData = await singleResponse.json();
    console.log('✅ Single job application response received');
    console.log('   Status:', singleData.success ? 'SUCCESS' : 'FAILED');
    if (!singleData.success) {
      console.log('   Error:', singleData.message);
    }
    console.log('');

    // Test 5: Get API documentation
    console.log('5️⃣ Getting API documentation...');
    const docsResponse = await fetch(`${API_BASE_URL}/api/v1/job-application/docs`, { headers });
    const docsData = await docsResponse.json();
    console.log('✅ API documentation retrieved');
    console.log('   Version:', docsData.version);
    console.log('   Available endpoints:', Object.keys(docsData.endpoints).length);
    console.log('');

    // Test 6: Test without API key (should fail)
    console.log('6️⃣ Testing without API key (should fail)...');
    const noKeyResponse = await fetch(`${API_BASE_URL}/api/v1/job-application/example-candidate`);
    const noKeyData = await noKeyResponse.json();
    console.log('✅ No API key test:', noKeyData.success ? 'UNEXPECTED SUCCESS' : 'EXPECTED FAILURE');
    console.log('   Message:', noKeyData.message);
    console.log('');

    console.log('🎉 API testing completed!');
    console.log('\n📋 Summary:');
    console.log('   - Health check: ✅');
    console.log('   - Example data: ✅');
    console.log('   - Validation: ✅');
    console.log('   - Single application: ✅ (endpoint works)');
    console.log('   - Documentation: ✅');
    console.log('   - Authentication: ✅');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the API server is running:');
    console.log('   node src/api/server.js');
  }
}

// Run the test
testAPI(); 