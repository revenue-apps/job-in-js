export const afterPageLoadDecision = (state) => {
  console.log('🤔 AfterPageLoadDecision: Analyzing page load results...');
  
  const { pageLoadAnalysis } = state;
  
  if (!pageLoadAnalysis) {
    console.log('No page load analysis found, ending workflow');
    return 'end';
  }
  
  if (pageLoadAnalysis.error) {
    console.log('Page load failed, ending workflow');
    return 'end';
  }
  
  if (!pageLoadAnalysis.isLoaded) {
    console.log('Page not loaded, ending workflow');
    return 'end';
  }
  
  // Check for blockers first
  const { blockers } = pageLoadAnalysis;
  
  if (blockers?.hasCaptcha) {
    console.log('CAPTCHA detected, switching to captcha workflow');
    return 'switch_to_captcha_workflow';
  }
  
  if (blockers?.hasAntiBot) {
    console.log('Anti-bot protection detected, switching to anti-bot workflow');
    return 'switch_to_anti_bot_workflow';
  }
  
  if (blockers?.hasLoginRequired) {
    console.log('Login required detected, switching to login workflow');
    return 'switch_to_login_workflow';
  }
  
  if (blockers?.hasGoogleOAuth) {
    console.log('Google OAuth required, switching to oauth workflow');
    return 'switch_to_oauth_workflow';
  }
  
  if (blockers?.hasEmailVerification) {
    console.log('Email verification required, switching to email verification workflow');
    return 'switch_to_email_verification_workflow';
  }
  
  // If no blockers, check for forms
  if (pageLoadAnalysis.hasForm) {
    console.log('Form detected, proceeding to form analysis');
    return 'analyze_form';
  } else {
    console.log('No form detected, ending workflow');
    return 'end';
  }
}; 