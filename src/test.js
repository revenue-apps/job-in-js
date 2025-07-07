import { processJobUrl, processJobUrls } from './index.js';
import { mockJobUrls } from './utils/csvReader.js';
import { logger } from './utils/logger.js';

async function runTests() {
  console.log('🧪 Starting LangGraph Job Scraping Tests\n');
  
  try {
    // Test 1: Single job URL processing
    console.log('📋 Test 1: Single Job URL Processing');
    console.log('=' .repeat(50));
    
    const testUrl = mockJobUrls[0];
    console.log(`Testing with URL: ${testUrl}`);
    
    const result = await processJobUrl(testUrl);
    
    console.log('\nResult:');
    console.log(`- Valid URL: ${result.isValid}`);
    console.log(`- Scraped: ${result.scraped}`);
    console.log(`- Processed: ${result.processed}`);
    console.log(`- Saved: ${result.saved}`);
    console.log(`- Output File: ${result.outputFile || 'N/A'}`);
    
    if (result.error) {
      console.log(`- Error: ${result.error}`);
    }
    
    console.log('\n');
    
    // Test 2: Batch processing with mock data
    console.log('📋 Test 2: Batch Processing with Mock Data');
    console.log('=' .repeat(50));
    
    const { results, summary } = await processJobUrls(mockJobUrls);
    
    console.log('\nBatch Processing Summary:');
    console.log(`- Total URLs: ${summary.total}`);
    console.log(`- Successful: ${summary.successful}`);
    console.log(`- Failed: ${summary.failed}`);
    console.log(`- Success Rate: ${((summary.successful / summary.total) * 100).toFixed(1)}%`);
    
    if (summary.errors.length > 0) {
      console.log('\nErrors:');
      summary.errors.forEach(({ jobUrl, error }) => {
        console.log(`- ${jobUrl}: ${error}`);
      });
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    logger.error('Test execution failed', { error: error.message });
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests }; 