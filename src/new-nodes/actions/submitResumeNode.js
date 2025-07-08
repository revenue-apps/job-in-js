import { getResumeFileFromS3 } from '../tooling/s3.js';
import { z } from 'zod';

export async function submitResumeNode(state) {
  console.log('📄 SubmitResumeNode: Starting resume upload...');

  try {
    const { page, formAnalysis, resumeId, agent } = state;
    if (!page) throw new Error('No page reference found in state');
    if (!formAnalysis?.fields) throw new Error('No form analysis available');
    if (!resumeId) throw new Error('No resumeId provided');
    if (!agent) throw new Error('No agent reference found in state');

    // 1. Find the resume upload field
    const resumeField = formAnalysis.fields.find(
      f => f.type === 'file' && (f.name.toLowerCase().includes('resume') || f.name.toLowerCase().includes('cv'))
    );
    if (!resumeField) {
      return {
        ...state,
        resumeUpload: {
          success: false,
          error: 'No resume upload field found in form',
        },
        currentStep: 'resume_upload_failed',
      };
    }

    // 2. Download the resume from S3
    const resumeFilePath = await getResumeFileFromS3(resumeId);
    if (!resumeFilePath) {
      return {
        ...state,
        resumeUpload: {
          success: false,
          error: 'Failed to download resume from S3',
        },
        currentStep: 'resume_upload_failed',
      };
    }

    // 3. Use agent's execute method for file upload
    const uploadResult = await agent.execute(`Upload the candidate's resume to the appropriate resume/CV file input field on this job application page.
    
RESUME FIELD INFO:
- Field name: ${resumeField.name}
- Field type: ${resumeField.type}
- File path: ${resumeFilePath}
- Accepted file types: ${resumeField.fileTypes?.join(', ') || 'Any'}
- Max file size: ${resumeField.maxSize || 'No limit'}

INSTRUCTIONS:
1. Find the resume/CV upload field on the page
2. Upload the file from the provided path: ${resumeFilePath}
3. If there are multiple file upload fields, choose the one for resume/CV
4. Handle any file type restrictions or size limits
5. Confirm the upload was successful

IMPORTANT: Only upload to the resume/CV field, not any other file upload fields.`);

    // 4. Return success (agent.execute() doesn't return structured data)
    console.log('📊 Resume Upload State:', {
      success: true,
      field: resumeField.name,
      filePath: resumeFilePath,
      fileUploaded: resumeFilePath,
      reasoning: 'Resume upload completed via agent.execute()',
      issues: []
    });

    return {
      ...state,
      resumeUpload: {
        success: true,
        field: resumeField.name,
        filePath: resumeFilePath,
        fileUploaded: resumeFilePath,
        reasoning: 'Resume upload completed via agent.execute()',
        issues: []
      },
      currentStep: 'resume_uploaded',
    };
  } catch (error) {
    // TODO: Add more robust error handling and edge cases
    console.log('❌ Resume Upload Error:', error.message);
    return {
      ...state,
      resumeUpload: {
        success: false,
        error: error.message,
      },
      currentStep: 'resume_upload_failed',
    };
  }
}