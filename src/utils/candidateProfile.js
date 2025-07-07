import { logger } from './logger.js';

export class CandidateProfile {
  constructor(candidateData) {
    this.personal = candidateData.personal || {};
    this.experience = candidateData.experience || [];
    this.education = candidateData.education || [];
    this.skills = candidateData.skills || [];
    this.resume = candidateData.resume || null;
    this.coverLetter = candidateData.coverLetter || null;
    this.customFields = candidateData.customFields || {};
  }

  // Generate form data based on form fields
  generateFormData(formFields) {
    const formData = {};
    
    formFields.forEach(field => {
      const value = this.getFieldValue(field);
      if (value) {
        formData[field.name] = value;
      }
    });
    
    return formData;
  }

  // Get value for a specific field
  getFieldValue(field) {
    const fieldMappings = {
      // Personal information
      'first-name': this.personal.firstName,
      'last-name': this.personal.lastName,
      'full-name': `${this.personal.firstName} ${this.personal.lastName}`,
      'email': this.personal.email,
      'phone': this.personal.phone,
      'mobile': this.personal.phone,
      'location': this.personal.location,
      'city': this.personal.city,
      'state': this.personal.state,
      'country': this.personal.country,
      'zip': this.personal.zipCode,
      'address': this.personal.address,
      
      // Experience
      'years-experience': this.getTotalExperience(),
      'current-role': this.getCurrentRole(),
      'current-company': this.getCurrentCompany(),
      'experience-summary': this.getExperienceSummary(),
      
      // Education
      'highest-degree': this.getHighestDegree(),
      'university': this.getLatestUniversity(),
      'graduation-year': this.getGraduationYear(),
      'gpa': this.getGPA(),
      
      // Skills
      'skills': this.skills.join(', '),
      'technical-skills': this.getTechnicalSkills(),
      'soft-skills': this.getSoftSkills(),
      
      // Custom fields
      'linkedin': this.personal.linkedin,
      'portfolio': this.personal.portfolio,
      'github': this.personal.github,
      'website': this.personal.website,
    };
    
    return fieldMappings[field.name] || this.customFields[field.name] || '';
  }

  // Generate cover letter based on job description
  generateCoverLetter(jobDescription, companyName) {
    if (this.coverLetter) {
      return this.coverLetter;
    }
    
    const template = this.getCoverLetterTemplate(jobDescription, companyName);
    return this.fillCoverLetterTemplate(template, jobDescription, companyName);
  }

  // Get cover letter template
  getCoverLetterTemplate(jobDescription, companyName) {
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobDescription.title} position at ${companyName}. With my background in ${this.getRelevantSkills(jobDescription)} and ${this.getTotalExperience()} years of experience, I am confident in my ability to contribute effectively to your team.

${this.getExperienceParagraph(jobDescription)}

${this.getSkillsParagraph(jobDescription)}

${this.getClosingParagraph(companyName)}

Thank you for considering my application. I look forward to discussing how my skills and experience align with your needs.

Best regards,
${this.personal.firstName} ${this.personal.lastName}
${this.personal.email}
${this.personal.phone}`;
  }

  // Fill cover letter template with personalized content
  fillCoverLetterTemplate(template, jobDescription, companyName) {
    return template
      .replace('${jobDescription.title}', jobDescription.title || 'the position')
      .replace('${companyName}', companyName || 'your company')
      .replace('${this.getRelevantSkills(jobDescription)}', this.getRelevantSkills(jobDescription))
      .replace('${this.getTotalExperience()}', this.getTotalExperience())
      .replace('${this.getExperienceParagraph(jobDescription)}', this.getExperienceParagraph(jobDescription))
      .replace('${this.getSkillsParagraph(jobDescription)}', this.getSkillsParagraph(jobDescription))
      .replace('${this.getClosingParagraph(companyName)}', this.getClosingParagraph(companyName))
      .replace('${this.personal.firstName}', this.personal.firstName)
      .replace('${this.personal.lastName}', this.personal.lastName)
      .replace('${this.personal.email}', this.personal.email)
      .replace('${this.personal.phone}', this.personal.phone);
  }

  // Helper methods for cover letter generation
  getRelevantSkills(jobDescription) {
    const relevantSkills = this.skills.filter(skill => 
      jobDescription.description?.toLowerCase().includes(skill.toLowerCase())
    );
    return relevantSkills.length > 0 ? relevantSkills.join(', ') : this.skills.slice(0, 3).join(', ');
  }

  getExperienceParagraph(jobDescription) {
    const currentRole = this.getCurrentRole();
    const currentCompany = this.getCurrentCompany();
    
    return `In my current role as ${currentRole} at ${currentCompany}, I have developed expertise in ${this.getRelevantSkills(jobDescription)}. My experience includes ${this.getExperienceSummary()}, which directly aligns with the requirements for this position.`;
  }

  getSkillsParagraph(jobDescription) {
    const relevantSkills = this.getRelevantSkills(jobDescription);
    return `My technical skills include ${relevantSkills}, and I have a proven track record of ${this.getAchievementSummary()}. I am particularly skilled in ${this.getTopSkills(jobDescription)}.`;
  }

  getClosingParagraph(companyName) {
    return `I am excited about the opportunity to join ${companyName} and contribute to your team's success. I am confident that my background and enthusiasm make me an excellent candidate for this position.`;
  }

  // Experience helper methods
  getTotalExperience() {
    if (this.experience.length === 0) return 0;
    
    return this.experience.reduce((total, exp) => {
      const startYear = new Date(exp.startDate).getFullYear();
      const endYear = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
      return total + (endYear - startYear);
    }, 0);
  }

  getCurrentRole() {
    const currentExp = this.experience.find(exp => !exp.endDate);
    return currentExp ? currentExp.title : 'Software Engineer';
  }

  getCurrentCompany() {
    const currentExp = this.experience.find(exp => !exp.endDate);
    return currentExp ? currentExp.company : 'Current Company';
  }

  getExperienceSummary() {
    if (this.experience.length === 0) return 'software development';
    
    const roles = this.experience.slice(0, 3).map(exp => exp.title);
    return roles.join(', ');
  }

  getAchievementSummary() {
    if (this.experience.length === 0) return 'delivering high-quality solutions';
    
    const achievements = this.experience
      .flatMap(exp => exp.achievements || [])
      .slice(0, 2);
    
    return achievements.length > 0 ? achievements.join(' and ') : 'delivering high-quality solutions';
  }

  // Education helper methods
  getHighestDegree() {
    if (this.education.length === 0) return 'Bachelor\'s Degree';
    
    const degrees = this.education.map(edu => edu.degree);
    const degreeOrder = ['PhD', 'Master\'s', 'Bachelor\'s', 'Associate\'s'];
    
    for (const degree of degreeOrder) {
      if (degrees.some(d => d.includes(degree))) {
        return degree;
      }
    }
    
    return degrees[0] || 'Bachelor\'s Degree';
  }

  getLatestUniversity() {
    if (this.education.length === 0) return 'University';
    
    const latestEducation = this.education
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];
    
    return latestEducation.institution || 'University';
  }

  getGraduationYear() {
    if (this.education.length === 0) return new Date().getFullYear();
    
    const latestEducation = this.education
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];
    
    return new Date(latestEducation.endDate).getFullYear();
  }

  getGPA() {
    if (this.education.length === 0) return '3.5';
    
    const latestEducation = this.education
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];
    
    return latestEducation.gpa || '3.5';
  }

  // Skills helper methods
  getTechnicalSkills() {
    const technicalKeywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker'];
    return this.skills.filter(skill => 
      technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    ).join(', ');
  }

  getSoftSkills() {
    const softKeywords = ['leadership', 'communication', 'teamwork', 'problem-solving', 'collaboration'];
    return this.skills.filter(skill => 
      softKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    ).join(', ');
  }

  getTopSkills(jobDescription) {
    const relevantSkills = this.skills.filter(skill => 
      jobDescription.description?.toLowerCase().includes(skill.toLowerCase())
    );
    return relevantSkills.slice(0, 3).join(', ');
  }

  // Validation methods
  validateProfile() {
    const errors = [];
    
    if (!this.personal.firstName) errors.push('First name is required');
    if (!this.personal.lastName) errors.push('Last name is required');
    if (!this.personal.email) errors.push('Email is required');
    if (!this.personal.phone) errors.push('Phone is required');
    
    if (this.experience.length === 0) errors.push('At least one work experience is required');
    if (this.education.length === 0) errors.push('At least one education entry is required');
    if (this.skills.length === 0) errors.push('At least one skill is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Export profile data
  toJSON() {
    return {
      personal: this.personal,
      experience: this.experience,
      education: this.education,
      skills: this.skills,
      resume: this.resume,
      coverLetter: this.coverLetter,
      customFields: this.customFields,
    };
  }
}

// Factory function to create candidate profile from various data sources
export function createCandidateProfile(data) {
  logger.info('Creating candidate profile', { 
    hasPersonal: !!data.personal,
    hasExperience: !!data.experience,
    hasEducation: !!data.education,
    hasSkills: !!data.skills
  });
  
  return new CandidateProfile(data);
} 