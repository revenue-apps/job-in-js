/**
 * Filter Analyzer Node (Dummy)
 * Will be implemented in Epic Task 4
 */

const filterAnalyzerNode = async (state) => {
  console.log('Dummy: Filter Analyzer Node');
  return { 
    ...state, 
    filteredJobUrl: 'https://careers.google.com/jobs?q=engineer&location=remote&type=full-time',
    urlParameters: { 
      q: 'job title search', 
      location: 'location filter', 
      type: 'employment type' 
    },
    status: 'filters_analyzed' 
  };
};

export default filterAnalyzerNode; 