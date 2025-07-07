// Field Mapping Tool - AI-powered field mapping for job applications
import { config } from '../config/environment.js';

export const fieldMappingTool = {
  name: "map_form_fields",
  description: "Intelligently map candidate data to form fields using AI analysis",
  
  invoke: async (input) => {
    const { formFields, candidateData } = input;
    
    console.log('🔧 FieldMappingTool: Mapping fields...');
    console.log('Form fields:', formFields);
    console.log('Candidate data:', candidateData);
    
    try {
      // Use AI to map fields intelligently
      const mappingResult = await mapFieldsWithAI(formFields, candidateData);
      
      console.log('✅ FieldMappingTool: Mapping completed');
      console.log('Mapped fields:', mappingResult.mappedFields.length);
      console.log('Unmapped fields:', mappingResult.unmappedFields.length);
      
      return mappingResult;
      
    } catch (error) {
      console.error('❌ FieldMappingTool error:', error.message);
      return {
        success: false,
        mappedFields: [],
        unmappedFields: formFields.map(f => f.name),
        error: error.message
      };
    }
  }
};

// AI-powered field mapping function
async function mapFieldsWithAI(formFields, candidateData) {
  // Create a comprehensive mapping prompt
  const mappingPrompt = `
You are an expert at mapping candidate data to job application form fields.

CANDIDATE DATA:
${JSON.stringify(candidateData, null, 2)}

FORM FIELDS:
${JSON.stringify(formFields, null, 2)}

TASK: Map the candidate data to the form fields intelligently.

RULES:
1. Look for semantic matches (e.g., "firstname" matches "name", "dob" matches "age")
2. Handle variations in field names (e.g., "first_name", "firstName", "first name")
3. Calculate derived values (e.g., "dob" can calculate "age", "name" can split into "firstname" and "lastname")
4. Handle location fields (e.g., "location" can map to "city", "country", "address")
5. Only map if you're confident (confidence > 0.7)

OUTPUT FORMAT:
{
  "mappedFields": [
    {
      "fieldName": "form field name",
      "fieldType": "text/email/phone/etc",
      "candidateValue": "value from candidate data",
      "confidence": 0.9,
      "reasoning": "why this mapping was chosen"
    }
  ],
  "unmappedFields": ["list of form fields that couldn't be mapped"],
  "reasoning": "overall mapping strategy explanation"
}

Analyze the fields and provide the mapping:`;

  // For now, implement intelligent mapping logic
  // In a real implementation, this would call an AI model
  const mappingResult = await intelligentMapping(formFields, candidateData);
  
  return {
    success: true,
    mappedFields: mappingResult.mappedFields,
    unmappedFields: mappingResult.unmappedFields,
    reasoning: mappingResult.reasoning,
    totalFields: formFields.length,
    mappedCount: mappingResult.mappedFields.length,
    unmappedCount: mappingResult.unmappedFields.length
  };
}

// Intelligent mapping logic (can be replaced with AI model call)
async function intelligentMapping(formFields, candidateData) {
  const mappedFields = [];
  const unmappedFields = [];
  
  // Extract and normalize candidate data
  const candidate = normalizeCandidateData(candidateData);
  
  // Map each form field
  for (const field of formFields) {
    const fieldName = field.name.toLowerCase();
    const fieldType = field.type || 'text';
    
    // Try to find a mapping for this field
    const mapping = findFieldMapping(fieldName, fieldType, candidate);
    
    if (mapping && mapping.confidence > 0.5) {
      mappedFields.push({
        fieldName: field.name,
        fieldType: field.type || 'text',
        candidateValue: mapping.value,
        confidence: mapping.confidence,
        reasoning: mapping.reasoning
      });
    } else {
      unmappedFields.push(field.name);
    }
  }
  
  return {
    mappedFields,
    unmappedFields,
    reasoning: `Mapped ${mappedFields.length} fields using intelligent pattern matching and semantic analysis.`
  };
}

// Normalize candidate data for consistent processing
function normalizeCandidateData(candidateData) {
  const candidate = {
    // Personal info
    name: candidateData.name || '',
    firstName: '',
    lastName: '',
    email: candidateData.email || '',
    phone: candidateData.phone || '',
    mobile: candidateData.mobile || candidateData.phone || '',
    
    // Location info
    location: candidateData.location || '',
    address: candidateData.address || candidateData.location || '',
    city: '',
    state: '',
    country: '',
    zipCode: candidateData.zipCode || candidateData.zip || '',
    
    // Demographics
    dob: candidateData.dob || candidateData.dateOfBirth || '',
    age: '',
    gender: candidateData.gender || '',
    
    // Professional info
    experience: candidateData.experience || candidateData.yearsExperience || '',
    skills: candidateData.skills || [],
    education: candidateData.education || '',
    degree: candidateData.degree || '',
    university: candidateData.university || candidateData.college || '',
    
    // Social/Online
    linkedin: candidateData.linkedin || '',
    github: candidateData.github || '',
    portfolio: candidateData.portfolio || candidateData.website || '',
    
    // Custom fields
    ...candidateData
  };
  
  // Parse name into components
  if (candidate.name) {
    const nameParts = candidate.name.split(' ').filter(part => part.trim());
    candidate.firstName = nameParts[0] || '';
    candidate.lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // Parse location into components
  if (candidate.location) {
    const locationParts = candidate.location.split(',').map(part => part.trim());
    candidate.city = locationParts[0] || '';
    candidate.state = locationParts[1] || '';
    candidate.country = locationParts[locationParts.length - 1] || '';
  }
  
  // Calculate age from DOB
  if (candidate.dob) {
    try {
      const dobDate = new Date(candidate.dob);
      const today = new Date();
      candidate.age = Math.floor((today - dobDate) / (365.25 * 24 * 60 * 60 * 1000)).toString();
    } catch (e) {
      console.log('Could not calculate age from DOB:', candidate.dob);
    }
  }
  
  return candidate;
}

// Find the best mapping for a field
function findFieldMapping(fieldName, fieldType, candidate) {
  // Enhanced field mapping patterns for better matching
  const fieldMappings = [
    // Name variations
    { 
      patterns: ['firstname', 'first_name', 'first name', 'given name', 'fname', 'first'],
      value: candidate.firstName,
      confidence: 0.9,
      reasoning: 'First name from full name'
    },
    { 
      patterns: ['lastname', 'last_name', 'last name', 'family name', 'surname', 'lname', 'last'],
      value: candidate.lastName,
      confidence: 0.9,
      reasoning: 'Last name from full name'
    },
    { 
      patterns: ['fullname', 'full_name', 'name', 'full name', 'complete name', 'applicant_name'],
      value: candidate.name,
      confidence: 0.95,
      reasoning: 'Full name directly'
    },
    
    // Contact variations
    { 
      patterns: ['email', 'e-mail', 'email address', 'mail', 'email_address'],
      value: candidate.email,
      confidence: 0.95,
      reasoning: 'Email address'
    },
    { 
      patterns: ['phone', 'telephone', 'mobile', 'cell', 'phone number', 'contact number', 'mobile_number'],
      value: candidate.phone || candidate.mobile,
      confidence: 0.9,
      reasoning: 'Phone number'
    },
    
    // Location variations
    { 
      patterns: ['city', 'town', 'municipality'],
      value: candidate.city,
      confidence: 0.8,
      reasoning: 'City from location'
    },
    { 
      patterns: ['state', 'province', 'region'],
      value: candidate.state,
      confidence: 0.8,
      reasoning: 'State from location'
    },
    { 
      patterns: ['country', 'nation'],
      value: candidate.country,
      confidence: 0.8,
      reasoning: 'Country from location'
    },
    { 
      patterns: ['location', 'address', 'place', 'residence', 'work_location'],
      value: candidate.location || candidate.address,
      confidence: 0.85,
      reasoning: 'Full location/address'
    },
    { 
      patterns: ['zip', 'zipcode', 'postal code', 'pincode'],
      value: candidate.zipCode,
      confidence: 0.9,
      reasoning: 'Postal code'
    },
    
    // Demographics
    { 
      patterns: ['age', 'years old', 'current age'],
      value: candidate.age,
      confidence: 0.9,
      reasoning: 'Age calculated from DOB'
    },
    { 
      patterns: ['dob', 'date of birth', 'birth date', 'birthday', 'birth'],
      value: candidate.dob,
      confidence: 0.95,
      reasoning: 'Date of birth'
    },
    { 
      patterns: ['gender', 'sex'],
      value: candidate.gender,
      confidence: 0.9,
      reasoning: 'Gender'
    },
    
    // Professional
    { 
      patterns: ['experience', 'years experience', 'work experience', 'professional experience', 'years_experience', 'time_in_field'],
      value: candidate.experience,
      confidence: 0.8,
      reasoning: 'Years of experience'
    },
    { 
      patterns: ['skills', 'technologies', 'technical skills', 'competencies', 'capabilities'],
      value: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills,
      confidence: 0.7,
      reasoning: 'Skills and technologies'
    },
    { 
      patterns: ['education', 'degree', 'qualification'],
      value: candidate.education || candidate.degree,
      confidence: 0.8,
      reasoning: 'Education/degree'
    },
    { 
      patterns: ['university', 'college', 'institution', 'school'],
      value: candidate.university,
      confidence: 0.8,
      reasoning: 'University/college'
    },
    
    // File uploads
    { 
      patterns: ['resume', 'cv', 'resume/cv', 'resume_cv'],
      value: candidate.resume || 'resume.pdf',
      confidence: 0.9,
      reasoning: 'Resume file'
    },
    { 
      patterns: ['coverletter', 'cover letter', 'cover_letter', 'cover'],
      value: candidate.coverLetter || candidate.coverletter || '',
      confidence: 0.9,
      reasoning: 'Cover letter'
    },
    { 
      patterns: ['portfolio', 'website', 'personal website', 'portfolio_url'],
      value: candidate.portfolio,
      confidence: 0.9,
      reasoning: 'Portfolio/website'
    },
    
    // Social/Online
    { 
      patterns: ['linkedin', 'linkedin profile', 'linkedin url', 'linkedin_profile'],
      value: candidate.linkedin,
      confidence: 0.9,
      reasoning: 'LinkedIn profile'
    },
    { 
      patterns: ['github', 'github profile', 'github url', 'github_url'],
      value: candidate.github,
      confidence: 0.9,
      reasoning: 'GitHub profile'
    },
    
    // Contact info variations
    { 
      patterns: ['contact_info', 'contact information', 'contact'],
      value: candidate.email || candidate.phone,
      confidence: 0.7,
      reasoning: 'Contact information'
    },
    
    // Generic patterns for unknown fields
    { 
      patterns: ['required', 'mandatory', 'necessary'],
      value: 'Yes',
      confidence: 0.6,
      reasoning: 'Generic required field'
    },
    { 
      patterns: ['optional', 'additional', 'extra'],
      value: 'No',
      confidence: 0.6,
      reasoning: 'Generic optional field'
    }
  ];
  
  // Try to find a match
  for (const mapping of fieldMappings) {
    for (const pattern of mapping.patterns) {
      if (fieldName.includes(pattern) || pattern.includes(fieldName)) {
        if (mapping.value && mapping.value.toString().trim()) {
          return {
            value: mapping.value,
            confidence: mapping.confidence,
            reasoning: mapping.reasoning
          };
        }
      }
    }
  }
  
  // If no exact match, try semantic matching
  const semanticMatch = findSemanticMatch(fieldName, candidate);
  if (semanticMatch) {
    return semanticMatch;
  }
  
  return null;
}

// Semantic matching for unknown fields
function findSemanticMatch(fieldName, candidate) {
  // Common field name patterns and their semantic meanings
  const semanticPatterns = [
    {
      keywords: ['name', 'full', 'complete'],
      value: candidate.name,
      confidence: 0.7,
      reasoning: 'Semantic match: name-related field'
    },
    {
      keywords: ['contact', 'reach', 'get'],
      value: candidate.email || candidate.phone,
      confidence: 0.6,
      reasoning: 'Semantic match: contact-related field'
    },
    {
      keywords: ['where', 'place', 'based'],
      value: candidate.location,
      confidence: 0.6,
      reasoning: 'Semantic match: location-related field'
    },
    {
      keywords: ['how long', 'time', 'duration'],
      value: candidate.experience,
      confidence: 0.6,
      reasoning: 'Semantic match: experience-related field'
    },
    {
      keywords: ['what', 'which', 'describe'],
      value: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills,
      confidence: 0.5,
      reasoning: 'Semantic match: descriptive field'
    }
  ];
  
  for (const pattern of semanticPatterns) {
    for (const keyword of pattern.keywords) {
      if (fieldName.includes(keyword)) {
        if (pattern.value && pattern.value.toString().trim()) {
          return {
            value: pattern.value,
            confidence: pattern.confidence,
            reasoning: pattern.reasoning
          };
        }
      }
    }
  }
  
  return null;
} 