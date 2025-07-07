import { StateGraph } from '@langchain/langgraph';
import { detectPageLoadNode } from '../../new-nodes/detection/detectPageLoadNode.js';
import { analyzeFormNode } from '../../new-nodes/detection/analyzeFormNode.js';
import { fieldMappingNode } from '../../new-nodes/mapping/fieldMappingNode.js';
import { fillFormNode } from '../../new-nodes/actions/fillFormNode.js';
import { afterPageLoadDecision } from './decisionFunctions.js';
import { easyApplyStateSchema } from '../../shared/utils/easyApplyState.js';

const createEasyApplyWorkflow = () => {
  const workflow = new StateGraph({
    channels: easyApplyStateSchema
  });
  
  // Add nodes
  workflow.addNode('detect_page_load', detectPageLoadNode);
  workflow.addNode('analyze_form', analyzeFormNode);
  workflow.addNode('field_mapping', fieldMappingNode);
  workflow.addNode('fill_form', fillFormNode);
  
  // Add edges
  workflow.addConditionalEdges(
    'detect_page_load',
    afterPageLoadDecision,
    {
      'analyze_form': 'analyze_form',
      'switch_to_captcha_workflow': '__end__',
      'switch_to_anti_bot_workflow': '__end__',
      'switch_to_login_workflow': '__end__',
      'switch_to_oauth_workflow': '__end__',
      'switch_to_email_verification_workflow': '__end__',
      'end': '__end__'
    }
  );
  
  // Add edge from analyze_form to field_mapping
  workflow.addEdge('analyze_form', 'field_mapping');
  
  // Add edge from field_mapping to fill_form
  workflow.addEdge('field_mapping', 'fill_form');
  
  // Add edge from fill_form to end
  workflow.addEdge('fill_form', '__end__');
  
  // Set entry point
  workflow.setEntryPoint('detect_page_load');
  
  return workflow.compile();
};

export const runEasyApplyWorkflow = async (jobUrl, candidateData, stagehandClient) => {
  console.log('🚀 Starting Easy Apply Workflow');
  
  await stagehandClient.start();
  try {
    // Initialize page
    const page = await stagehandClient.newPage();
    
    // Create initial state
    const initialState = {
      url: jobUrl,
      candidateData,
      page,
      currentStep: 'start'
    };
    
    // Run workflow
    const workflow = createEasyApplyWorkflow();
    const result = await workflow.invoke(initialState);
    
    console.log('✅ Easy Apply Workflow completed');
    console.log('Final state:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Easy Apply Workflow failed:', error.message);
    throw error;
  } finally {
    await stagehandClient.stop();
  }
}; 