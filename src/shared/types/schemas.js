import { z } from 'zod';

// Job description schema
export const jobDescriptionSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  salary: z.string().optional(),
  type: z.string().optional(),
  url: z.string().url(),
});

// Schema for candidate personal information
export const candidatePersonalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  linkedin: z.string().url().optional(),
  portfolio: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
  expectedSalaryCtc: z.string().optional(), // Cost to Company (salary expectation)
  authorizedToWork: z.boolean().optional(), // Whether work permit is required
  requiresVisaSponsorship: z.boolean().optional(), // Whether visa sponsorship is required

});


// Schema for work experience
export const experienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  startDate: z.string(), // ISO date string
  endDate: z.string().optional(), // null for current position
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

// Schema for education
export const educationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  field: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  gpa: z.number().min(0).max(4).optional(),
  honors: z.array(z.string()).optional(),
});

// Schema for candidate profile
export const candidateProfileSchema = z.object({
  personal: candidatePersonalSchema,
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(z.string()).default([]),
  resume: z.object({
    path: z.string().optional(), // File path to resume
    content: z.string().optional(), // Base64 encoded content
    filename: z.string().optional(),
  }).optional(),
  coverLetter: z.object({
    path: z.string().optional(), // File path to cover letter
    content: z.string().optional(), // Cover letter text
    autoGenerate: z.boolean().default(true),
  }).optional(),
  customFields: z.record(z.string(), z.any()).default({}),
});

// Schema for job application input
export const jobApplicationInputSchema = z.object({
  jobUrl: z.string().url("Valid job URL is required"),
  candidateData: candidateProfileSchema,
  jobDescription: z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    description: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    location: z.string().optional(),
    salary: z.string().optional(),
    type: z.string().optional(), // full-time, part-time, contract, etc.
  }).optional(),
  applicationSettings: z.object({
    autoGenerateCoverLetter: z.boolean().default(true),
    customizeApplications: z.boolean().default(true),
    skipJobsWithLoginRequired: z.boolean().default(true),
    maxRetries: z.number().default(3),
    timeout: z.number().default(60000),
  }).optional(),
});

// Schema for batch job application input
export const batchJobApplicationInputSchema = z.object({
  jobUrls: z.array(z.string().url("Valid job URLs are required")),
  candidateData: candidateProfileSchema,
  jobDescriptions: z.array(z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    description: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    location: z.string().optional(),
    salary: z.string().optional(),
    type: z.string().optional(),
  })).optional(),
  applicationSettings: z.object({
    maxConcurrentApplications: z.number().default(1),
    delayBetweenApplications: z.number().default(2000),
    autoGenerateCoverLetter: z.boolean().default(true),
    customizeApplications: z.boolean().default(true),
    skipJobsWithLoginRequired: z.boolean().default(true),
    maxRetries: z.number().default(3),
    timeout: z.number().default(60000),
  }).optional(),
});

// Example candidate data structure
export const exampleCandidateData = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1-555-123-4567",
    location: "San Francisco, CA",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    zipCode: "94105",
    address: "123 Main St, San Francisco, CA 94105",
    linkedin: "https://linkedin.com/in/johndoe",
    portfolio: "https://johndoe.dev",
    github: "https://github.com/johndoe",
    website: "https://johndoe.com",
    ctc: "$120,000 - $150,000", // Cost to Company (salary expectation)
    workPermitRequired: false, // Whether work permit is required
  },
  experience: [
    {
      title: "Senior Software Engineer",
      company: "Tech Corp",
      startDate: "2022-01-01",
      endDate: null, // Current position
      description: "Led development of scalable web applications",
      achievements: [
        "Reduced application load time by 40%",
        "Mentored 5 junior developers",
        "Implemented CI/CD pipeline"
      ],
      skills: ["JavaScript", "React", "Node.js", "AWS"]
    },
    {
      title: "Software Engineer",
      company: "Startup Inc",
      startDate: "2020-06-01",
      endDate: "2021-12-31",
      description: "Full-stack development for SaaS platform",
      achievements: [
        "Built customer dashboard from scratch",
        "Improved test coverage to 90%"
      ],
      skills: ["Python", "Django", "PostgreSQL", "Docker"]
    }
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of California, Berkeley",
      field: "Computer Science",
      startDate: "2016-09-01",
      endDate: "2020-05-15",
      gpa: 3.8,
      honors: ["Dean's List", "Computer Science Honor Society"]
    }
  ],
  skills: [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Django",
    "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git",
    "REST APIs", "GraphQL", "Microservices", "Agile", "Scrum"
  ],
  resume: {
    path: "./data/resume.pdf", // Path to resume file
    filename: "john_doe_resume.pdf"
  },
  coverLetter: {
    autoGenerate: true, // Let the system generate cover letter
    content: null // Will be auto-generated based on job description
  },
  customFields: {
    "years-of-experience": "3",
    "preferred-location": "Remote",
    "salary-expectation": "$120,000 - $150,000"
  }
};

// Example job application input
export const exampleJobApplicationInput = {
  jobUrl: "https://linkedin.com/jobs/view/123456789",
  candidateData: exampleCandidateData,
  jobDescription: {
    title: "Senior Full Stack Engineer",
    company: "Tech Company",
    description: "We are looking for a senior engineer to join our team...",
    requirements: [
      "5+ years of experience with JavaScript and React",
      "Experience with Node.js and backend development",
      "Knowledge of cloud platforms (AWS, GCP, or Azure)"
    ],
    location: "San Francisco, CA",
    salary: "$130,000 - $160,000",
    type: "full-time"
  },
  applicationSettings: {
    autoGenerateCoverLetter: true,
    customizeApplications: true,
    skipJobsWithLoginRequired: true,
    maxRetries: 3,
    timeout: 60000
  }
};

// Application result schema
export const applicationResultSchema = z.object({
  success: z.boolean(),
  applicationId: z.string().optional(),
  confirmationMessage: z.string().optional(),
  nextSteps: z.string().optional(),
  contactInfo: z.string().optional(),
  error: z.string().optional(),
});

// Error details schema
export const errorDetailsSchema = z.object({
  errorType: z.string(),
  errorMessage: z.string(),
  errorCode: z.string(),
  suggestions: z.array(z.string()),
  applicationType: z.string().optional(),
  routingReason: z.string().optional(),
  timestamp: z.string(),
});

// Job classification schema
export const jobClassificationSchema = z.object({
  applicationType: z.enum(['easy_apply', 'form_submission', 'resume_upload', 'oauth_required', 'external_redirect', 'unknown']),
  confidence: z.number().min(0).max(1),
  requiresLogin: z.boolean(),
  hasApplyButton: z.boolean(),
  hasForm: z.boolean(),
  hasFileUpload: z.boolean(),
  platform: z.string(),
  reasoning: z.string(),
});

// Form requirements schema
export const formRequirementsSchema = z.object({
  requiredFields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'email', 'phone', 'select', 'textarea', 'file', 'date']),
    label: z.string(),
    required: z.boolean(),
  })),
  optionalFields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'email', 'phone', 'select', 'textarea', 'file', 'date']),
    label: z.string(),
    required: z.boolean(),
  })),
  fileUploads: z.array(z.object({
    name: z.string(),
    label: z.string(),
    acceptedTypes: z.array(z.string()),
    required: z.boolean(),
  })),
  additionalQuestions: z.array(z.object({
    question: z.string(),
    type: z.string(),
    required: z.boolean(),
  })),
  platform: z.string(),
  formAction: z.string().optional(),
}); 