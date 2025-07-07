import { runEasyApplyWorkflow } from './src/new-workflows/easyApply/index.js';
import { enhancedStagehandClient } from './src/shared/utils/enhancedStagehand.js';
import fs from 'fs';
const candidateData = JSON.parse(fs.readFileSync('./data/sample_candidate.json', 'utf8'));

async function testEasyApply() {
  console.log('🧪 Testing Easy Apply Workflow\n');
  
  try {
    // Initialize Stagehand
    await enhancedStagehandClient.initialize();
    
    // Test with Clipboard Health job
    const jobUrl = 'https://job-boards.greenhouse.io/clipboardhealth/jobs/5570020004';
    
    console.log(`Testing with job URL: ${jobUrl}`);
    
    const result = await runEasyApplyWorkflow(jobUrl, candidateData, enhancedStagehandClient);
    
    console.log('\n✅ Workflow completed!');
    console.log('Final Analysis:', JSON.stringify(result.analysis, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up
    try {
      await enhancedStagehandClient.close();
    } catch (error) {
      console.warn('Warning: Error closing Stagehand client:', error.message);
    }
  }
}

// Run the test
testEasyApply(); 