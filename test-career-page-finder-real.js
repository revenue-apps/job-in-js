#!/usr/bin/env node

/**
 * Real Career Page Finder Test
 * 
 * Tests Node 1 with actual company names and real Stagehand pages
 */

import { Stagehand } from '@browserbasehq/stagehand';
import { config } from './src/shared/config/environment.js';
import { logger } from './src/shared/utils/logger.js';
import careerPageFinderNode from './src/new-workflows/job-discovery/nodes/careerPageFinderNode.js';

// Test companies
const testCompanies = [
  'Google',
  'Microsoft', 
  'Apple',
  'Amazon',
  'Meta',
  'Netflix',
  'Tesla',
  'SpaceX'
];

async function testWithRealStagehand() {
  logger.info('Starting real Career Page Finder test');
  
  let stagehand = null;
  
  try {
    // Initialize Stagehand
    logger.info('Initializing Stagehand client');
    stagehand = new Stagehand({
      env: "LOCAL",
      apiKey: config.stagehand.browserbaseApiKey,
      projectId: config.stagehand.projectId,
      modelName: "openai/gpt-4o-mini",
      modelClientOptions: {
        apiKey: config.stagehand.openaiApiKey,
      },
    });

    await stagehand.init();
    logger.info('Stagehand initialized successfully');

    // Test each company
    for (const companyName of testCompanies) {
      console.log(`\n🧪 Testing: ${companyName}`);
      console.log('=' .repeat(50));
      
      try {
        // Use the main page for each company
        const page = stagehand.page;
        
        // Create test state
        const state = {
          companyName,
          page,
          status: 'pending',
          errors: [],
          currentStep: 'career_page_finder'
        };

        // Run the node
        const startTime = Date.now();
        const result = await careerPageFinderNode(state);
        const endTime = Date.now();
        
        // Log results
        console.log(`✅ Status: ${result.status}`);
        console.log(`🌐 Career URL: ${result.careerPageUrl || 'Not found'}`);
        console.log(`⏱️  Time: ${endTime - startTime}ms`);
        
        if (result.errors && result.errors.length > 0) {
          console.log(`❌ Errors: ${result.errors.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`💥 Error testing ${companyName}: ${error.message}`);
      }
      
      // Small delay between companies
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    logger.error('Test failed', { error: error.message });
    console.error('💥 Test failed:', error.message);
  } finally {
    if (stagehand) {
      await stagehand.close();
      logger.info('Stagehand client closed');
    }
  }
}

// Test with specific company
async function testSingleCompany(companyName) {
  logger.info(`Testing single company: ${companyName}`);
  
  let stagehand = null;
  
  try {
    // Initialize Stagehand
    stagehand = new Stagehand({
      env: "LOCAL",
      apiKey: config.stagehand.browserbaseApiKey,
      projectId: config.stagehand.projectId,
      modelName: "openai/gpt-4o-mini",
      modelClientOptions: {
        apiKey: config.stagehand.openaiApiKey,
      },
    });

    await stagehand.init();
    
    // Use the main page
    const page = stagehand.page;
    
    // Create test state
    const state = {
      companyName,
      page,
      status: 'pending',
      errors: [],
      currentStep: 'career_page_finder'
    };

    console.log(`\n🧪 Testing: ${companyName}`);
    console.log('=' .repeat(50));
    
    // Run the node
    const startTime = Date.now();
    const result = await careerPageFinderNode(state);
    const endTime = Date.now();
    
    // Log results
    console.log(`✅ Status: ${result.status}`);
    console.log(`🌐 Career URL: ${result.careerPageUrl || 'Not found'}`);
    console.log(`⏱️  Time: ${endTime - startTime}ms`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`❌ Errors: ${result.errors.join(', ')}`);
    }
    
  } catch (error) {
    logger.error('Single company test failed', { companyName, error: error.message });
    console.error('💥 Test failed:', error.message);
  } finally {
    if (stagehand) {
      await stagehand.close();
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const companyArg = args.find(arg => arg.startsWith('--company='));

if (companyArg) {
  const companyName = companyArg.split('=')[1];
  testSingleCompany(companyName);
} else {
  testWithRealStagehand();
} 