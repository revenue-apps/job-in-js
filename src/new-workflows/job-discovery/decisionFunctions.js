/**
 * Decision Functions for Career Discovery Workflow
 * Simple linear flow - no complex routing needed
 */

export const afterCareerPageFinderDecision = (state) => {
  const { status } = state;
  
  if (status === 'career_page_found') {
    console.log('✅ Career page found, proceeding to job listings navigator');
    return 'job_listings_navigator';
  } else {
    console.log('❌ Career page not found, ending workflow');
    return 'end';
  }
};

export const afterJobListingsNavigatorDecision = (state) => {
  const { status } = state;
  
  if (status === 'job_listings_found') {
    console.log('✅ Job listings found, proceeding to filter analyzer');
    return 'filter_analyzer';
  } else {
    console.log('❌ Job listings not found, ending workflow');
    return 'end';
  }
};

export const afterFilterAnalyzerDecision = (state) => {
  const { status } = state;
  
  if (status === 'filters_analyzed') {
    console.log('✅ Filters analyzed, proceeding to metadata constructor');
    return 'metadata_constructor';
  } else {
    console.log('❌ Filter analysis failed, ending workflow');
    return 'end';
  }
};

export const afterMetadataConstructorDecision = (state) => {
  const { status } = state;
  
  if (status === 'metadata_constructed') {
    console.log('✅ Metadata constructed, workflow complete');
    return 'end';
  } else {
    console.log('❌ Metadata construction failed, ending workflow');
    return 'end';
  }
}; 