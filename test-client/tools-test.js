#!/usr/bin/env node

/**
 * MCP Server Tools Integration Test
 * 
 * Tests all Sprint 1 tools with real Confluence API data.
 * Validates CRUD operations and ensures proper cleanup.
 */

import { MCPTestClient } from './helpers/mcp-client.js';
import { TestUtils } from './helpers/test-utils.js';
import { CONFIG, validateConfig, logConfig } from './config/test-config.js';

// Test data tracking để cleanup
const testData = {
  createdPages: []
};

async function testGetSpaces(client) {
  TestUtils.logTest('getSpaces', 'RUNNING');
  
  const response = await client.callTool('getSpaces');
  TestUtils.validateResponse(response); // No expected fields - just check success
  
  // Check that we got content back
  if (!response.content || response.content.length === 0) {
    throw new Error('getSpaces returned no content');
  }
  
  // Look for our test space in the response text
  const responseText = response.content.map(c => c.text).join(' ');
  const hasTestSpace = responseText.includes(CONFIG.test.spaceKey) || 
                      responseText.includes(CONFIG.test.spaceId);
  
  if (!hasTestSpace) {
    throw new Error(`Test space not found in response: ${CONFIG.test.spaceKey} (${CONFIG.test.spaceId})`);
  }

  console.log(`   ✅ Found test space ${CONFIG.test.spaceKey} in spaces list`);

  return {
    responseText: responseText,
    hasTestSpace: hasTestSpace
  };
}

async function testCreatePage(client) {
  TestUtils.logTest('createPage', 'RUNNING');
  
  const testTitle = TestUtils.generateTestPageTitle();
  const testContent = TestUtils.generateTestContent();
  
  const response = await client.callTool('createPage', {
    spaceId: CONFIG.test.spaceId,
    title: testTitle,
    content: testContent
  });
  
  TestUtils.validateResponse(response); // Just check success
  
  // Extract page ID from response text (MCP tools return human-readable format)
  const responseText = response.content.map(c => c.text).join(' ');
  
  // Look for page ID in response (format varies by tool)
  const pageIdMatch = responseText.match(/Page ID[:\s]+(\d+)/i) || 
                      responseText.match(/ID[:\s]+(\d+)/i) ||
                      responseText.match(/page[:\s]+(\d+)/i);
  
  if (!pageIdMatch) {
    throw new Error(`Could not extract page ID from response: ${responseText}`);
  }
  
  const pageId = pageIdMatch[1];
  
  // Track created page để cleanup
  testData.createdPages.push({
    id: pageId,
    title: testTitle
  });
  
  console.log(`   ✅ Created page: ${testTitle} (ID: ${pageId})`);
  
  return {
    pageId: pageId,
    title: testTitle
  };
}

async function testGetPageContent(client, pageId) {
  TestUtils.logTest('getPageContent', 'RUNNING');
  
  const response = await client.callTool('getPageContent', {
    pageId: pageId
  });
  
  TestUtils.validateResponse(response); // Just check success
  
  // Extract info from response text
  const responseText = response.content.map(c => c.text).join(' ');
  
  // Look for page ID in response
  const hasPageId = responseText.includes(pageId);
  if (!hasPageId) {
    throw new Error(`Page ID ${pageId} not found in response`);
  }
  
  // Look for version info (for update test)
  const versionMatch = responseText.match(/Version[:\s]+(\d+)/i);
  const version = versionMatch ? { number: parseInt(versionMatch[1]) } : { number: 1 };
  
  console.log(`   ✅ Retrieved page content for ID: ${pageId}`);
  
  return {
    pageId: pageId,
    hasContent: true,
    version: version
  };
}

async function testUpdatePage(client, pageId, currentVersion) {
  TestUtils.logTest('updatePage', 'RUNNING');
  
  const updatedTitle = `${TestUtils.generateTestPageTitle()} - UPDATED`;
  const updatedContent = '<p>UPDATED: This page has been updated by the MCP test client</p>';
  
  const response = await client.callTool('updatePage', {
    pageId: pageId,
    title: updatedTitle,
    content: updatedContent,
    version: currentVersion.number + 1
  });
  
  TestUtils.validateResponse(response); // Just check success
  
  // Extract info from response text
  const responseText = response.content.map(c => c.text).join(' ');
  
  // Check if page ID is in response
  if (!responseText.includes(pageId)) {
    throw new Error(`Page ID ${pageId} not found in update response`);
  }
  
  // Update tracking data
  const trackedPage = testData.createdPages.find(p => p.id === pageId);
  if (trackedPage) {
    trackedPage.title = updatedTitle;
  }
  
  console.log(`   ✅ Updated page: ${updatedTitle} (ID: ${pageId})`);
  
  return {
    pageId: pageId,
    title: updatedTitle
  };
}

async function testDeletePage(client, pageId) {
  TestUtils.logTest('deletePage', 'RUNNING');
  
  const response = await client.callTool('deletePage', {
    pageId: pageId
  });
  
  TestUtils.validateResponse(response); // Just check success
  
  // Remove from tracking
  testData.createdPages = testData.createdPages.filter(p => p.id !== pageId);
  
  console.log(`   ✅ Deleted page ID: ${pageId}`);
  
  return { 
    deleted: true,
    pageId: pageId 
  };
}

async function cleanupTestData(client) {
  if (!CONFIG.test.cleanupTestData) {
    console.log('⚠️  Cleanup disabled - test pages left in space');
    return;
  }

  console.log('\\n🧹 Cleaning up test data...');
  
  const remainingPages = [...testData.createdPages];
  for (const page of remainingPages) {
    try {
      await client.callTool('deletePage', { pageId: page.id });
      console.log(`✅ Deleted page: ${page.title} (${page.id})`);
    } catch (error) {
      console.warn(`⚠️  Failed to delete page ${page.id}: ${error.message}`);
    }
  }
  
  testData.createdPages = [];
  console.log('🧹 Cleanup completed');
}

async function runCrudWorkflow(client) {
  TestUtils.logSection('CRUD Workflow Test');
  
  let pageId, pageVersion;
  
  // 1. Create page
  const createResult = await testCreatePage(client);
  pageId = createResult.pageId;
  
  // 2. Get page content
  const getResult = await testGetPageContent(client, pageId);
  pageVersion = getResult.version;
  
  // 3. Update page
  const updateResult = await testUpdatePage(client, pageId, pageVersion);
  
  // 4. Get updated content
  await testGetPageContent(client, pageId);
  
  // 5. Delete page
  await testDeletePage(client, pageId);
  
  return {
    workflowCompleted: true,
    pageId: pageId
  };
}

async function runToolsTests() {
  console.log('🧪 MCP Server Tools Integration Test');
  console.log('====================================');
  
  let client;
  
  try {
    // Validate required credentials
    validateConfig();
    logConfig();
    
    console.log('\\n🔧 Testing tools with real Confluence API...');
    
    client = new MCPTestClient('tools');
    await client.connect();
    
    const tests = [
      {
        name: 'Get Spaces',
        fn: () => testGetSpaces(client)
      },
      {
        name: 'Complete CRUD Workflow',
        fn: () => runCrudWorkflow(client)
      }
    ];

    const results = await TestUtils.executeTestSuite(tests);
    
    const success = TestUtils.printTestSummary(results);
    
    if (success) {
      console.log('\\n🎉 All tools tests passed! Sprint 1 is ready for production.');
    } else {
      console.log('\\n💥 Some tools tests failed. Check implementation.');
    }
    
    return success;
    
  } catch (error) {
    console.error('\\n💥 Tools test suite failed:', error.message);
    throw error;
  } finally {
    if (client) {
      await cleanupTestData(client);
      await client.disconnect();
    }
  }
}

// Cleanup handler cho Ctrl+C
process.on('SIGINT', async () => {
  console.log('\\n\\n🛑 Test interrupted - cleaning up...');
  if (testData.createdPages.length > 0) {
    const client = new MCPTestClient('tools');
    try {
      await client.connect();
      await cleanupTestData(client);
      await client.disconnect();
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  }
  process.exit(1);
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runToolsTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}