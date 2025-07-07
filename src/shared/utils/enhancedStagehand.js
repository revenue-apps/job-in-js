import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import { config } from '../config/environment.js';
import { logger } from './logger.js';

class EnhancedStagehandClient {
  constructor() {
    this.stagehand = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    logger.info('Initializing Enhanced Stagehand client');
    console.log("browserbaseApiKey",  config.stagehand.browserbaseApiKey);
    console.log("projectId", config.stagehand.projectId);
    console.log("openaiApiKey", config.stagehand.openaiApiKey);
    console.log("env", config.stagehand.env);

    try {
      this.stagehand = new Stagehand({
        env: "BROWSERBASE", // Use cloud-based browser
        apiKey: config.stagehand.browserbaseApiKey,
        projectId: config.stagehand.projectId,
        modelName: "openai/gpt-4o-mini", // Use a fast model for extraction
        modelClientOptions: {
          apiKey: config.stagehand.openaiApiKey,
        },
      });

      await this.stagehand.init();
      this.isInitialized = true;

      // const health = await this.checkHealth();
      // console.log("health", health);  
      
      logger.info('Enhanced Stagehand client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Enhanced Stagehand client', { error: error.message });
      throw error;
    }
  }

  async start() {
    await this.initialize();
  }

  async stop() {
    await this.close();
  }

  // Easy Apply Handler
  // async handleEasyApply(jobUrl, candidateData) {
  //   logger.info('Handling easy apply application', { jobUrl });
    
  //   try {
  //     if (!this.isInitialized) {
  //       await this.initialize();
  //     }

  //     const page = this.stagehand.page;
  //     await page.goto(jobUrl);
      
  //     // Click apply button
  //     await page.click('button[data-control-name="jobdetails_topcard_inapply"]');
      
  //     // Fill form with candidate data
  //     const formData = this.prepareFormData(candidateData);
      
  //     for (const [fieldName, value] of Object.entries(formData)) {
  //       try {
  //         await page.fill(`[name="${fieldName}"]`, value);
  //       } catch (error) {
  //         logger.warn(`Failed to fill field ${fieldName}`, { error: error.message });
  //       }
  //     }
      
  //     // Submit application
  //     await page.click('button[type="submit"]');
      
  //     // Wait for confirmation
  //     await page.waitForSelector('.application-confirmation', { timeout: 10000 });
      
  //     const confirmation = await page.extract({
  //       instruction: "Extract the application confirmation details including any application ID, confirmation message, or next steps.",
  //       schema: z.object({
  //         applicationId: z.string().optional(),
  //         confirmationMessage: z.string(),
  //         nextSteps: z.string().optional(),
  //         contactInfo: z.string().optional(),
  //         success: z.boolean(),
  //       }),
  //     });

  //     logger.info('Easy apply completed successfully', { 
  //       jobUrl, 
  //       applicationId: confirmation.applicationId,
  //       success: confirmation.success 
  //     });

  //     return confirmation;

  //   } catch (error) {
  //     logger.error('Error in easy apply', { jobUrl, error: error.message });
  //     return {
  //       applicationId: null,
  //       confirmationMessage: 'Application failed',
  //       nextSteps: null,
  //       contactInfo: null,
  //       success: false,
  //       error: error.message,
  //     };
  //   }
  // }

  // Form Submission Handler
  // async handleFormSubmission(jobUrl, candidateData, requirements) {
  //   logger.info('Handling form submission application', { jobUrl });
    
  //   try {
  //     if (!this.isInitialized) {
  //       await this.initialize();
  //     }

  //     const page = this.stagehand.page;
  //     await page.goto(jobUrl);
      
  //     // Fill required fields
  //     for (const field of requirements.requiredFields) {
  //       const value = this.getFieldValue(candidateData, field);
  //       if (value) {
  //         try {
  //           await page.fill(`[name="${field.name}"]`, value);
  //         } catch (error) {
  //           logger.warn(`Failed to fill required field ${field.name}`, { error: error.message });
  //         }
  //       }
  //     }
      
  //     // Fill optional fields
  //     for (const field of requirements.optionalFields) {
  //       const value = this.getFieldValue(candidateData, field);
  //       if (value) {
  //         try {
  //           await page.fill(`[name="${field.name}"]`, value);
  //         } catch (error) {
  //           logger.warn(`Failed to fill optional field ${field.name}`, { error: error.message });
  //         }
  //       }
  //     }
      
  //     // Handle file uploads
  //     for (const upload of requirements.fileUploads) {
  //       if (upload.required && candidateData.resume) {
  //         try {
  //           await page.setInputFiles(`[name="${upload.name}"]`, candidateData.resume);
  //         } catch (error) {
  //           logger.warn(`Failed to upload file for ${upload.name}`, { error: error.message });
  //         }
  //       }
  //     }
      
  //     // Submit form
  //     await page.click('button[type="submit"]');
      
  //     // Wait for confirmation
  //     await page.waitForSelector('.success-message, .confirmation', { timeout: 15000 });
      
  //     const confirmation = await page.extract({
  //       instruction: "Extract the application confirmation details including any application ID, confirmation message, or next steps.",
  //       schema: z.object({
  //         applicationId: z.string().optional(),
  //         confirmationMessage: z.string(),
  //         nextSteps: z.string().optional(),
  //         contactInfo: z.string().optional(),
  //         success: z.boolean(),
  //       }),
  //     });

  //     logger.info('Form submission completed successfully', { 
  //       jobUrl, 
  //       applicationId: confirmation.applicationId,
  //       success: confirmation.success 
  //     });

  //     return confirmation;

  //   } catch (error) {
  //     logger.error('Error in form submission', { jobUrl, error: error.message });
  //     return {
  //       applicationId: null,
  //       confirmationMessage: 'Application failed',
  //       nextSteps: null,
  //       contactInfo: null,
  //       success: false,
  //       error: error.message,
  //     };
  //   }
  // }

  // Helper methods
  prepareFormData(candidateData) {
    return {
      'first-name': candidateData.personal.firstName,
      'last-name': candidateData.personal.lastName,
      'email': candidateData.personal.email,
      'phone': candidateData.personal.phone,
      'location': candidateData.personal.location,
      'experience': candidateData.experience.years,
      'education': candidateData.education.degree,
      'skills': candidateData.skills.join(', '),
    };
  }

  getFieldValue(candidateData, field) {
    const fieldMappings = {
      'first-name': candidateData.personal.firstName,
      'last-name': candidateData.personal.lastName,
      'email': candidateData.personal.email,
      'phone': candidateData.personal.phone,
      'location': candidateData.personal.location,
      'experience': candidateData.experience.years,
      'education': candidateData.education.degree,
      'skills': candidateData.skills.join(', '),
      'cover-letter': candidateData.coverLetter,
    };
    
    return fieldMappings[field.name] || '';
  }

  async newPage() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.stagehand.page;
  }

  // async checkHealth() {
  //   try {
  //     if (!this.isInitialized) {
  //       await this.initialize();
  //     }
      
  //     // Test if we can access the page
  //     const page = this.stagehand.page;
  //     if (!page) {
  //       return { status: 'error', message: 'No page available' };
  //     }
      
  //     // Try a simple operation to test connectivity
  //     await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  //     const title = await page.title();
      
  //     return { 
  //       status: 'healthy', 
  //       message: 'Stagehand is working correctly',
  //       title: title,
  //       isInitialized: this.isInitialized
  //     };
      
  //   } catch (error) {
  //     return { 
  //       status: 'error', 
  //       message: `Stagehand health check failed: ${error.message}`,
  //       isInitialized: this.isInitialized
  //     };
  //   }
  // }

  async close() {
    if (this.stagehand && this.isInitialized) {
      try {
        await this.stagehand.close();
        this.isInitialized = false;
        logger.info('Enhanced Stagehand client closed successfully');
      } catch (error) {
        logger.error('Error closing Enhanced Stagehand client', { error: error.message });
      }
    }
  }
}

export const enhancedStagehandClient = new EnhancedStagehandClient(); 