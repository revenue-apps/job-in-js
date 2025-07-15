/**
 * Metadata Constructor Node (Dummy)
 * Will be implemented in Epic Task 5
 */

const metadataConstructorNode = async (state) => {
  console.log('Dummy: Metadata Constructor Node');
  return { 
    ...state, 
    status: 'metadata_constructed' 
  };
};

export default metadataConstructorNode; 