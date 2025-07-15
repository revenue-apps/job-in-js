#!/usr/bin/env node

/**
 * Career Discovery Node Test Runner
 * 
 * Usage:
 *   node test-career-discovery-nodes.js                    # Run all tests
 *   node test-career-discovery-nodes.js --node=1           # Test only Node 1 (Career Page Finder)
 *   node test-career-discovery-nodes.js --node=2           # Test only Node 2 (Job Listings Navigator)
 *   node test-career-discovery-nodes.js --node=3           # Test only Node 3 (Filter Analyzer)
 *   node test-career-discovery-nodes.js --node=4           # Test only Node 4 (Metadata Constructor)
 *   node test-career-discovery-nodes.js --integration      # Test only integration
 */

import { 
  testCareerPageFinderNode,
  testJobListingsNavigatorNode,
  testFilterAnalyzerNode,
  testMetadataConstructorNode,
  testNodeIntegration,
  runAllNodeTests
} from './src/tests/workflows/career-discovery-node.test.js';

// Parse command line arguments
const args = process.argv.slice(2);
const nodeArg = args.find(arg => arg.startsWith('--node='));
const integrationArg = args.find(arg => arg === '--integration');

async function runSelectedTests() {
  console.log('🧪 Career Discovery Node Test Runner\n');
  
  try {
    if (integrationArg) {
      console.log('Running Integration Test Only...\n');
      const result = await testNodeIntegration();
      console.log('\n📊 Integration Test Result:', result.success ? '✅ PASSED' : '❌ FAILED');
      return result;
    }
    
    if (nodeArg) {
      const nodeNumber = nodeArg.split('=')[1];
      console.log(`Running Node ${nodeNumber} Test Only...\n`);
      
      let result;
      switch (nodeNumber) {
        case '1':
          result = await testCareerPageFinderNode();
          console.log('\n📊 Node 1 (Career Page Finder) Result:', result.success ? '✅ PASSED' : '❌ FAILED');
          break;
        case '2':
          result = await testJobListingsNavigatorNode();
          console.log('\n📊 Node 2 (Job Listings Navigator) Result:', result.success ? '✅ PASSED' : '❌ FAILED');
          break;
        case '3':
          result = await testFilterAnalyzerNode();
          console.log('\n📊 Node 3 (Filter Analyzer) Result:', result.success ? '✅ PASSED' : '❌ FAILED');
          break;
        case '4':
          result = await testMetadataConstructorNode();
          console.log('\n📊 Node 4 (Metadata Constructor) Result:', result.success ? '✅ PASSED' : '❌ FAILED');
          break;
        default:
          console.log('❌ Invalid node number. Use --node=1, --node=2, --node=3, or --node=4');
          return { success: false, error: 'Invalid node number' };
      }
      
      if (result?.error) {
        console.log(`Error: ${result.error}`);
      }
      
      return result;
    }
    
    // Run all tests by default
    console.log('Running All Career Discovery Node Tests...\n');
    return await runAllNodeTests();
    
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Show usage if no arguments or help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Career Discovery Node Test Runner

Usage:
  node test-career-discovery-nodes.js                    # Run all tests
  node test-career-discovery-nodes.js --node=1           # Test only Node 1 (Career Page Finder)
  node test-career-discovery-nodes.js --node=2           # Test only Node 2 (Job Listings Navigator)
  node test-career-discovery-nodes.js --node=3           # Test only Node 3 (Filter Analyzer)
  node test-career-discovery-nodes.js --node=4           # Test only Node 4 (Metadata Constructor)
  node test-career-discovery-nodes.js --integration      # Test only integration
  node test-career-discovery-nodes.js --help             # Show this help

Node Descriptions:
  Node 1: Career Page Finder - Discovers company career pages
  Node 2: Job Listings Navigator - Navigates to job listings pages
  Node 3: Filter Analyzer - Analyzes and applies job search filters
  Node 4: Metadata Constructor - Constructs final metadata for CSV output
  `);
  process.exit(0);
}

// Run the tests
runSelectedTests().then(result => {
  if (result?.success) {
    console.log('\n🎉 Tests completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Tests completed with failures.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test runner crashed:', error.message);
  process.exit(1);
}); 