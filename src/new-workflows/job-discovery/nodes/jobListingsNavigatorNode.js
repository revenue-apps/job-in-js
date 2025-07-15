/**
 * Job Listings Navigator Node (Dummy)
 * Will be implemented in Epic Task 3
 */

const jobListingsNavigatorNode = async (state) => {
  console.log('Dummy: Job Listings Navigator Node');
  return { 
    ...state, 
    jobListingsUrl: 'https://careers.google.com/jobs', 
    status: 'job_listings_found' 
  };
};

export default jobListingsNavigatorNode; 