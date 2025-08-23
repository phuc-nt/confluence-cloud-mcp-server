#!/usr/bin/env node

/**
 * MCP Server Connection Test
 * 
 * Validates basic MCP protocol functionality without requiring service credentials.
 * Tests server startup, protocol compliance, tool discovery, and schema validation.
 */

import { MCPTestClient } from './helpers/mcp-client.js';
import { TestUtils } from './helpers/test-utils.js';
import { CONFIG, validateConfig, logConfig } from './config/test-config.js';

async function testServerStartup(client) {
  await client.connect();
  return client.connected;
}

async function testProtocolCompliance(client) {
  const pingResult = await client.ping();
  if (!pingResult.connected) {
    throw new Error('Server not responding to ping');
  }
  return pingResult;
}

async function testToolDiscovery(client) {
  const tools = await client.listTools();
  
  console.log(`\\n📋 Discovered ${tools.length} tools:`);
  tools.forEach((tool, index) => {
    console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
    if (CONFIG.test.verboseLogging && tool.inputSchema) {
      console.log(`      Input: ${JSON.stringify(Object.keys(tool.inputSchema.properties || {}))}`);
    }
  });
  
  // Sprint 1 đã implement 5 tools
  const expectedTools = [
    'createPage',
    'getPageContent', 
    'updatePage',
    'deletePage',
    'getSpaces'
  ];

  const foundTools = tools.map(t => t.name);
  const missingTools = expectedTools.filter(tool => !foundTools.includes(tool));
  const extraTools = foundTools.filter(tool => !expectedTools.includes(tool));
  
  console.log(`\\n🎯 Tool Analysis:`);
  console.log(`   Expected: ${expectedTools.length} tools`);
  console.log(`   Found: ${foundTools.length} tools`);
  
  if (missingTools.length > 0) {
    console.log(`   ❌ Missing: ${missingTools.join(', ')}`);
    throw new Error(`Missing expected tools: ${missingTools.join(', ')}`);
  }
  
  if (extraTools.length > 0) {
    console.log(`   ➕ Extra: ${extraTools.join(', ')}`);
  }
  
  console.log(`   ✅ All Sprint 1 tools discovered`);

  return {
    toolCount: tools.length,
    tools: foundTools,
    expectedTools: expectedTools,
    missingTools: missingTools,
    extraTools: extraTools,
    toolDetails: tools.map(t => ({
      name: t.name,
      description: t.description,
      hasSchema: !!t.inputSchema
    }))
  };
}

async function testSchemaValidation(client) {
  const tools = await client.listTools();
  const validationResults = [];

  console.log(`\\n🔍 Validating schemas for ${tools.length} tools:`);

  for (const tool of tools) {
    try {
      const result = await client.validateSchema(tool.name);
      validationResults.push({
        tool: tool.name,
        valid: result.valid,
        hasDescription: !!tool.description,
        hasInputSchema: !!tool.inputSchema
      });
      
      console.log(`   ✅ ${tool.name}: Valid schema`);
      if (CONFIG.test.verboseLogging && tool.inputSchema?.properties) {
        const params = Object.keys(tool.inputSchema.properties);
        console.log(`      Parameters: ${params.join(', ')}`);
      }
    } catch (error) {
      validationResults.push({
        tool: tool.name,
        valid: false,
        error: error.message
      });
      console.log(`   ❌ ${tool.name}: ${error.message}`);
    }
  }

  const invalidTools = validationResults.filter(r => !r.valid);
  if (invalidTools.length > 0) {
    throw new Error(`Tools with invalid schemas: ${invalidTools.map(t => t.tool).join(', ')}`);
  }

  console.log(`\\n✅ All ${tools.length} tool schemas are valid`);
  return validationResults;
}

async function testResourceDiscovery(client) {
  try {
    const resources = await client.listResources();
    return {
      resourceCount: resources.length,
      resources: resources.map(r => ({
        name: r.name,
        uri: r.uri,
        description: r.description
      }))
    };
  } catch (error) {
    // Resources might not be implemented yet, không fail test
    console.log('⚠️  Resource discovery not available (not implemented yet)');
    return {
      resourceCount: 0,
      resources: [],
      note: 'Resources not implemented yet'
    };
  }
}

async function runConnectionTests() {
  console.log('🧪 MCP Server Connection Test Suite');
  console.log('=====================================');
  
  try {
    // Validate config (không cần credentials cho connection test)
    logConfig();
    
    console.log('\\n🔧 Testing MCP server at:', CONFIG.mcpServer.serverPath);
    
    const client = new MCPTestClient('connection');
    
    const tests = [
      {
        name: 'Server Startup',
        fn: () => testServerStartup(client)
      },
      {
        name: 'Protocol Compliance', 
        fn: () => testProtocolCompliance(client)
      },
      {
        name: 'Tool Discovery',
        fn: () => testToolDiscovery(client)
      },
      {
        name: 'Schema Validation',
        fn: () => testSchemaValidation(client)
      },
      {
        name: 'Resource Discovery',
        fn: () => testResourceDiscovery(client)
      }
    ];

    const results = await TestUtils.executeTestSuite(tests);
    
    await client.disconnect();
    
    const success = TestUtils.printTestSummary(results);
    
    if (success) {
      console.log('\\n🎉 All connection tests passed! MCP server is ready for integration testing.');
      process.exit(0);
    } else {
      console.log('\\n💥 Some connection tests failed. Check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\\n💥 Connection test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runConnectionTests().catch(console.error);
}