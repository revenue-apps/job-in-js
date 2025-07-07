import { logger } from '../../../shared/utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Output Generator Node
 * 
 * Input: { jobUrl: string, processedJob: object, processed: boolean }
 * Output: { jobUrl: string, outputFile: string, saved: boolean, error?: string }
 */
export async function outputGeneratorNode(state) {
  const { 
    jobUrl, 
    jobDescription, 
    candidateData,
    applicationResult, 
    confirmationDetails, 
    errorDetails,
    classification,
    requirements,
    candidateProfile,
    applicationType,
    routingReason,
    timestamp = new Date().toISOString()
  } = state;

  logger.info('Generating application output', { jobUrl });

  try {
    // Determine output type and content
    let outputData;
    let status;

    if (errorDetails) {
      // Error case
      status = 'error';
      outputData = {
        status: 'error',
        jobUrl,
        jobDescription: jobDescription || {},
        candidateInfo: candidateData ? {
          name: `${candidateData.personal?.firstName} ${candidateData.personal?.lastName}`,
          email: candidateData.personal?.email,
        } : null,
        error: {
          type: errorDetails.errorType,
          message: errorDetails.errorMessage,
          code: errorDetails.errorCode,
          suggestions: errorDetails.suggestions,
          applicationType: errorDetails.applicationType,
          routingReason: errorDetails.routingReason,
        },
        classification: errorDetails.classification,
        timestamp: errorDetails.timestamp,
        processingTime: new Date().getTime() - new Date(timestamp).getTime(),
      };
    } else if (confirmationDetails && confirmationDetails.success) {
      // Successful application
      status = 'success';
      outputData = {
        status: 'success',
        jobUrl,
        jobDescription: jobDescription || {},
        candidateInfo: confirmationDetails.candidateInfo,
        application: {
          id: confirmationDetails.applicationId,
          type: applicationType,
          message: confirmationDetails.confirmationMessage,
          nextSteps: confirmationDetails.nextSteps,
          contactInfo: confirmationDetails.contactInfo,
          trackingNumber: confirmationDetails.trackingNumber,
          estimatedResponseTime: confirmationDetails.estimatedResponseTime,
          recruiterEmail: confirmationDetails.recruiterEmail,
          recruiterPhone: confirmationDetails.recruiterPhone,
          nextInterviewDate: confirmationDetails.nextInterviewDate,
          additionalDocuments: confirmationDetails.additionalDocuments,
        },
        classification,
        requirements: requirements || {},
        candidateProfile: candidateProfile || {},
        submittedAt: confirmationDetails.submittedAt,
        timestamp,
        processingTime: new Date().getTime() - new Date(timestamp).getTime(),
      };
    } else if (applicationResult && !applicationResult.success) {
      // Application failed
      status = 'failed';
      outputData = {
        status: 'failed',
        jobUrl,
        jobDescription: jobDescription || {},
        candidateInfo: candidateData ? {
          name: `${candidateData.personal?.firstName} ${candidateData.personal?.lastName}`,
          email: candidateData.personal?.email,
        } : null,
        application: {
          type: applicationType,
          error: applicationResult.error,
          message: applicationResult.confirmationMessage,
        },
        classification,
        requirements: requirements || {},
        candidateProfile: candidateProfile || {},
        timestamp,
        processingTime: new Date().getTime() - new Date(timestamp).getTime(),
      };
    } else {
      // Unknown state
      status = 'unknown';
      outputData = {
        status: 'unknown',
        jobUrl,
        jobDescription: jobDescription || {},
        candidateInfo: candidateData ? {
          name: `${candidateData.personal?.firstName} ${candidateData.personal?.lastName}`,
          email: candidateData.personal?.email,
        } : null,
        message: 'Application status could not be determined',
        classification,
        requirements: requirements || {},
        timestamp,
        processingTime: new Date().getTime() - new Date(timestamp).getTime(),
      };
    }

    // Generate filename
    const jobId = jobUrl.split('/').pop() || 'unknown';
    const candidateName = candidateData?.personal?.firstName || 'candidate';
    const filename = `application_${candidateName}_${jobId}_${Date.now()}.json`;
    const outputPath = path.join(process.cwd(), 'output', 'applications', filename);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write output file
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));

    logger.info('Output generated successfully', {
      jobUrl,
      status,
      outputPath,
      filename
    });

    return {
      ...state,
      outputData,
      outputPath,
      filename,
      status,
    };

  } catch (error) {
    logger.error('Error generating output', { jobUrl, error: error.message });

    // Create minimal error output
    const errorOutput = {
      status: 'output_error',
      jobUrl,
      error: `Output generation failed: ${error.message}`,
      timestamp: new Date().toISOString(),
    };

    try {
      const filename = `error_${Date.now()}.json`;
      const outputPath = path.join(process.cwd(), 'output', 'applications', filename);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(errorOutput, null, 2));
      
      return {
        ...state,
        outputData: errorOutput,
        outputPath,
        filename,
        status: 'output_error',
      };
    } catch (writeError) {
      logger.error('Failed to write error output', { error: writeError.message });
      return {
        ...state,
        outputData: errorOutput,
        status: 'output_error',
      };
    }
  }
}

function generateOutputFilename(processedJob) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const company = processedJob.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
  const title = processedJob.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
  
  // Truncate long names
  const shortCompany = company.length > 20 ? company.substring(0, 20) : company;
  const shortTitle = title.length > 30 ? title.substring(0, 30) : title;
  
  return `${timestamp}_${shortCompany}_${shortTitle}.json`;
}

// Helper function to get summary of saved job
export function getJobSummary(processedJob) {
  return {
    title: processedJob.title,
    company: processedJob.company,
    location: processedJob.location,
    wordCount: processedJob.wordCount,
    hasRequirements: processedJob.hasRequirements,
    hasResponsibilities: processedJob.hasResponsibilities,
    url: processedJob.url,
  };
} 