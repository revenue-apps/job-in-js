import fetch from 'node-fetch';

class JobApplicationAPI {
  constructor(baseURL = 'http://localhost:3000', apiKey = 'test-api-key') {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey
    };
  }

  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }

  async getExampleCandidate() {
    const response = await fetch(`${this.baseURL}/api/v1/job-application/example-candidate`, {
      headers: this.headers
    });
    return response.json();
  }

  async validateCandidate(candidateData) {
    const response = await fetch(`${this.baseURL}/api/v1/job-application/validate-candidate`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(candidateData)
    });
    return response.json();
  }

  async applyToSingleJob(jobUrl, candidateData, jobDescription = null) {
    const payload = {
      jobUrl,
      candidateData,
      ...(jobDescription && { jobDescription })
    };

    const response = await fetch(`${this.baseURL}/api/v1/job-application/single`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload)
    });
    return response.json();
  }

  async applyToMultipleJobs(jobUrls, candidateData, jobDescriptions = null) {
    const payload = {
      jobUrls,
      candidateData,
      ...(jobDescriptions && { jobDescriptions })
    };

    const response = await fetch(`${this.baseURL}/api/v1/job-application/batch`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload)
    });
    return response.json();
  }

  async getDocumentation() {
    const response = await fetch(`${this.baseURL}/api/v1/job-application/docs`, {
      headers: this.headers
    });
    return response.json();
  }
}

// Example usage
async function example() {
  console.log('🚀 Job Application API Client Example');
  console.log('=====================================\n');

  const api = new JobApplicationAPI();

  try {
    // 1. Check API health
    console.log('1️⃣ Checking API health...');
    const health = await api.healthCheck();
    console.log('✅ Health:', health.status);
    console.log('');

    // 2. Get example candidate data
    console.log('2️⃣ Getting example candidate data...');
    const example = await api.getExampleCandidate();
    console.log('✅ Example candidate:', example.data.personal.firstName, example.data.personal.lastName);
    console.log('');

    // 3. Create a custom candidate
    const customCandidate = {
      personal: {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1-555-987-6543",
        location: "New York, NY",
        city: "New York",
        state: "NY",
        country: "USA",
        linkedin: "https://linkedin.com/in/janesmith"
      },
      experience: [
        {
          title: "Full Stack Developer",
          company: "Innovation Labs",
          startDate: "2021-03-01",
          endDate: null,
          description: "Developed and maintained web applications",
          achievements: ["Led migration to microservices", "Improved performance by 60%"],
          skills: ["React", "Node.js", "TypeScript", "MongoDB"]
        }
      ],
      education: [
        {
          degree: "Master of Science in Computer Science",
          institution: "New York University",
          startDate: "2019-09-01",
          endDate: "2021-05-15",
          gpa: 3.9
        }
      ],
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "MongoDB", "AWS"],
      resume: {
        path: "./data/jane_smith_resume.pdf",
        filename: "jane_smith_resume.pdf"
      },
      coverLetter: {
        autoGenerate: true
      }
    };

    // 4. Validate candidate data
    console.log('3️⃣ Validating custom candidate data...');
    const validation = await api.validateCandidate(customCandidate);
    console.log('✅ Validation:', validation.success ? 'PASSED' : 'FAILED');
    console.log('');

    // 5. Apply to a single job
    console.log('4️⃣ Applying to a single job...');
    const singleResult = await api.applyToSingleJob(
      'https://linkedin.com/jobs/view/123456789',
      customCandidate,
      {
        title: 'Senior Software Engineer',
        company: 'Tech Innovations Inc',
        description: 'We are seeking a senior engineer to join our team...'
      }
    );
    console.log('✅ Single application result:', singleResult.success ? 'SUCCESS' : 'FAILED');
    if (!singleResult.success) {
      console.log('   Error:', singleResult.message);
    }
    console.log('');

    // 6. Apply to multiple jobs
    console.log('5️⃣ Applying to multiple jobs...');
    const batchResult = await api.applyToMultipleJobs(
      [
        'https://linkedin.com/jobs/view/123456789',
        'https://linkedin.com/jobs/view/987654321',
        'https://linkedin.com/jobs/view/456789123'
      ],
      customCandidate
    );
    console.log('✅ Batch application result:', batchResult.success ? 'SUCCESS' : 'FAILED');
    if (batchResult.success) {
      console.log('   Total jobs:', batchResult.data.summary.total);
      console.log('   Successful:', batchResult.data.summary.successful);
      console.log('   Failed:', batchResult.data.summary.failed);
      console.log('   Success rate:', batchResult.data.summary.successRate.toFixed(1) + '%');
    }
    console.log('');

    // 7. Get API documentation
    console.log('6️⃣ Getting API documentation...');
    const docs = await api.getDocumentation();
    console.log('✅ Documentation retrieved');
    console.log('   Version:', docs.version);
    console.log('   Available endpoints:', Object.keys(docs.endpoints).length);
    console.log('');

    console.log('🎉 API client example completed successfully!');

  } catch (error) {
    console.error('❌ API client example failed:', error.message);
    console.log('\n💡 Make sure the API server is running:');
    console.log('   npm run api');
  }
}

// Export the class and example function
export { JobApplicationAPI, example };

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  example();
} 