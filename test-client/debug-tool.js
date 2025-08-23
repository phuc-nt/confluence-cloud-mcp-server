#!/usr/bin/env node

/**
 * Debug createPage tool
 */

import { MCPTestClient } from './helpers/mcp-client.js';
import { CONFIG } from './config/test-config.js';
import { TestUtils } from './helpers/test-utils.js';

async function debugCreatePage() {
  console.log('🔍 Debug CreatePage Tool');
  console.log('========================');
  
  const client = new MCPTestClient('tools');
  
  try {
    await client.connect();
    console.log('✅ Connected to MCP server');
    
    console.log('\n📋 Calling createPage...');
    
    const testTitle = TestUtils.generateTestPageTitle();
    const testContent = TestUtils.generateTestContent();
    
    console.log(`Title: ${testTitle}`);
    console.log(`Space ID: ${CONFIG.test.spaceId}`);
    console.log(`Content: ${JSON.stringify(testContent, null, 2)}`);
    
    const response = await client.callTool('createPage', {
      spaceId: CONFIG.test.spaceId,
      title: testTitle,
      content: testContent
    });
    
    console.log('\n📤 Response:');
    console.log(JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('\n💥 Error:', error.message);
  } finally {
    await client.disconnect();
  }
}

debugCreatePage().catch(console.error);