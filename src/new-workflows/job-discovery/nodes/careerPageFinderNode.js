/**
 * Career Page Finder Node (Dummy)
 * Will be implemented in Epic Task 2
 */

const careerPageFinderNode = async (state) => {
  console.log('Dummy: Career Page Finder Node');
  return { 
    ...state, 
    careerPageUrl: 'https://careers.google.com', 
    status: 'career_page_found' 
  };
};

export default careerPageFinderNode; 