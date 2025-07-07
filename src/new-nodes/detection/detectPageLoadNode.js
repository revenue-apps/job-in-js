import { z } from 'zod';

// No logger import needed for now

export async function detectPageLoadNode(state) {
  console.log('🔍 DetectPageLoadNode: Starting page load detection...');
  
  try {
    // console.log("state", JSON.stringify(state, null, 2));
    const { url, page } = state;
    
    if (!page) {
      throw new Error('No page reference found in state');
    }
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Analyze the page for forms and actual blockers using AI
    const analysis = await page.evaluate(() => {
      const hasForm = document.querySelector('form') !== null;
      const formType = hasForm ? 'standard' : 'none';
      
      return {
        isLoaded: true,
        hasForm,
        formType,
        error: null
      };
    });
    
    // Use AI to visually analyze the page for blockers
    const blockers = await detectBlockersWithAI(page);
    
    console.log(`✅ Page Load: Form detected: ${analysis.hasForm}, Blockers: ${Object.values(blockers).filter(b => b).length}`);
    
    return {
      ...state,
      pageLoadAnalysis: {
        ...analysis,
        blockers
      },
      currentStep: 'page_loaded'
    };
    
  } catch (error) {
    console.error('❌ DetectPageLoadNode error:', error.message);
    return {
      ...state,
      pageLoadAnalysis: {
        isLoaded: false,
        hasForm: false,
        formType: null,
        blockers: {
          hasLoginRequired: false,
          hasGoogleOAuth: false,
          hasEmailVerification: false,
          hasRegistrationRequired: false,
          hasBlockingModal: false
        },
        error: error.message
      },
      error: error.message
    };
  }
}

// Helper function to detect blockers using AI visual analysis
async function detectBlockersWithAI(page) {
  try {
    const blockerAnalysis = await page.extract({
      instruction: `Check for visible popups/modals that block job application submission:
- Login popups/modals
- Google OAuth buttons
- Email verification prompts
- Registration required popups
- Any modal that prevents form submission: should be only login or otp modal, else we can consider non blocking

Report only visible popups that block the application process.`,
      schema: z.object({
        hasLoginRequired: z.boolean(),
        hasGoogleOAuth: z.boolean(),
        hasEmailVerification: z.boolean(),
        hasRegistrationRequired: z.boolean(),
        hasBlockingModal: z.boolean(),
        reasoning: z.string()
      })
    });
    
    return {
      hasLoginRequired: blockerAnalysis.hasLoginRequired || false,
      hasGoogleOAuth: blockerAnalysis.hasGoogleOAuth || false,
      hasEmailVerification: blockerAnalysis.hasEmailVerification || false,
      hasRegistrationRequired: blockerAnalysis.hasRegistrationRequired || false,
      hasBlockingModal: blockerAnalysis.hasBlockingModal || false
    };
    
  } catch (error) {
    console.log('Error during AI blocker detection:', error.message);
    return {
      hasLoginRequired: false,
      hasGoogleOAuth: false,
      hasEmailVerification: false,
      hasRegistrationRequired: false,
      hasBlockingModal: false
    };
  }
} 