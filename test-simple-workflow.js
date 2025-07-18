/**
 * Simple Workflow Test
 * 
 * Test to verify that state is being passed correctly between nodes
 */

import { StateGraph, END } from '@langchain/langgraph';

// Simple test nodes
const testNode1 = async (state) => {
  console.log('Test Node 1 - Input state:', state);
  
  return {
    ...state,
    testValue1: 'Hello from Node 1',
    status: 'node1_completed'
  };
};

const testNode2 = async (state) => {
  console.log('Test Node 2 - Input state:', state);
  
  return {
    ...state,
    testValue2: 'Hello from Node 2',
    status: 'node2_completed'
  };
};

const testNode3 = async (state) => {
  console.log('Test Node 3 - Input state:', state);
  
  return {
    ...state,
    testValue3: 'Hello from Node 3',
    status: 'node3_completed'
  };
};

// Create simple workflow
function createSimpleWorkflow() {
  const workflow = new StateGraph({
    channels: {
      testValue1: { value: (x) => x.testValue1 },
      testValue2: { value: (x) => x.testValue2 },
      testValue3: { value: (x) => x.testValue3 },
      status: { value: (x) => x.status }
    }
  });

  // Add nodes
  workflow.addNode('test_node_1', testNode1);
  workflow.addNode('test_node_2', testNode2);
  workflow.addNode('test_node_3', testNode3);

  // Set entry point
  workflow.setEntryPoint('test_node_1');

  // Linear flow
  workflow.addEdge('test_node_1', 'test_node_2');
  workflow.addEdge('test_node_2', 'test_node_3');
  workflow.addEdge('test_node_3', END);

  return workflow.compile();
}

// Test the workflow
async function testSimpleWorkflow() {
  console.log('🧪 Testing Simple Workflow State Passing');
  console.log('========================================');
  
  try {
    const workflow = createSimpleWorkflow();
    
    const initialState = {
      companyName: 'Test Company',
      page: null, // We don't need a real page for this test
      status: 'pending',
      currentStep: 'test_node_1'
    };
    
    console.log('\n📊 Initial State:');
    console.log(JSON.stringify(initialState, null, 2));
    
    const result = await workflow.invoke(initialState);
    
    console.log('\n📊 Final Result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n✅ Simple workflow test completed!');
    
  } catch (error) {
    console.error('❌ Simple workflow test failed:', error.message);
  }
}

// Run the test
testSimpleWorkflow(); 