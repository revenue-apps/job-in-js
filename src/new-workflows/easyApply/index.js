import { StateGraph } from '@langchain/langgraph';
import { detectPageLoadNode } from '../../new-nodes/detection/detectPageLoadNode.js';
import { analyzeFormNode } from '../../new-nodes/detection/analyzeFormNode.js';
import { fieldMappingNode } from '../../new-nodes/mapping/fieldMappingNode.js';
import { fillFormNode } from '../../new-nodes/actions/fillFormNode.js';
import { submitResumeNode } from '../../new-nodes/actions/submitResumeNode.js';
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
  workflow.addNode('submit_resume', submitResumeNode);
  
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
  
  // Add edge from fill_form to submit_resume
  workflow.addEdge('fill_form', 'submit_resume');
  
  // Add edge from submit_resume to end
  workflow.addEdge('submit_resume', '__end__');
  
  // Set entry point
  workflow.setEntryPoint('detect_page_load');
  
  return workflow.compile();
};

export const runEasyApplyWorkflow = async (jobUrl, candidateData, stagehandClient, resumeId = null) => {
  console.log('🚀 Starting Easy Apply Workflow');
  
  await stagehandClient.start();
  try {
    // Initialize page and agent
    const page = await stagehandClient.newPage();
    const agent = await stagehandClient.newAgent();
    
    // Create initial state
    const initialState = {
      url: jobUrl,
      candidateData,
      page,
      agent,
      resumeId,
      currentStep: 'start'
    };
    
    // Run workflow
    const workflow = createEasyApplyWorkflow();
    const result = await workflow.invoke(initialState);
    
    console.log('✅ Easy Apply Workflow completed');
    // console.log('Final state:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Easy Apply Workflow failed:', error.message);
    throw error;
  } finally {
    await stagehandClient.stop();
  }
}; 