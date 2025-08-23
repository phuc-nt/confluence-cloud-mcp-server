import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

export const CONFIG = {
  // Confluence Configuration
  confluence: {
    siteName: process.env.CONFLUENCE_SITE_NAME,
    apiToken: process.env.CONFLUENCE_API_TOKEN,
    baseUrl: `https://${process.env.CONFLUENCE_SITE_NAME}/wiki`
  },

  // Test Environment 
  test: {
    spaceId: process.env.TEST_SPACE_ID,
    spaceKey: process.env.TEST_SPACE_KEY,
    pageTitlePrefix: process.env.TEST_PAGE_TITLE_PREFIX || 'MCP Test -',
    timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
    cleanupTestData: process.env.CLEANUP_TEST_DATA === 'true',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true'
  },

  // MCP Server Configuration
  mcpServer: {
    name: process.env.MCP_SERVER_NAME || 'confluence-cloud-mcp-server',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
    // Path to compiled MCP server
    serverPath: path.resolve(__dirname, '../../dist/index.js'),
    // Environment variables for MCP server (connection test)
    serverEnvConnectionTest: {
      CONFLUENCE_SITE_NAME: process.env.CONFLUENCE_SITE_NAME,
      CONFLUENCE_API_TOKEN: process.env.CONFLUENCE_API_TOKEN,
      SKIP_API_CONNECTION_TEST: 'true' // For connection testing only
    },
    // Environment variables for MCP server (tools test)
    serverEnvToolsTest: {
      CONFLUENCE_SITE_NAME: process.env.CONFLUENCE_SITE_NAME,
      CONFLUENCE_EMAIL: process.env.CONFLUENCE_EMAIL,
      CONFLUENCE_API_TOKEN: process.env.CONFLUENCE_API_TOKEN
      // No skip flag - need real API connection
    }
  }
};

export function validateConfig() {
  const required = [
    'CONFLUENCE_SITE_NAME',
    'CONFLUENCE_EMAIL',
    'CONFLUENCE_API_TOKEN',
    'TEST_SPACE_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
}

export function logConfig() {
  if (CONFIG.test.verboseLogging) {
    console.log('🔧 Test Configuration:');
    console.log(`   Site: ${CONFIG.confluence.siteName}`);
    console.log(`   Test Space: ${CONFIG.test.spaceKey} (${CONFIG.test.spaceId})`);
    console.log(`   Server Path: ${CONFIG.mcpServer.serverPath}`);
    console.log(`   Timeout: ${CONFIG.test.timeout}ms`);
    console.log(`   Cleanup: ${CONFIG.test.cleanupTestData}`);
  }
}