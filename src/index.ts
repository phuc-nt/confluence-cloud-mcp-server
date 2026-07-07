#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { Logger } from './utils/logger.js';
import { ConfluenceApiClient, ConfluenceConfig } from './utils/confluence-api.js';
import { registerConfluenceTools, getToolDefinitions, handleToolCall } from './tools/confluence/index.js';

// Read own package.json for serverInfo.version (ESM-safe require)
const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version: string };

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['CONFLUENCE_SITE_NAME', 'CONFLUENCE_EMAIL', 'CONFLUENCE_API_TOKEN'];;
const logger = new Logger('ConfluenceMCPServer');

// Global API client instance
let confluenceClient: ConfluenceApiClient;

function validateEnvironment(): void {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    logger.error('Please check your .env file or environment configuration');
    process.exit(1);
  }
  
  // Validate API token format (should not be empty or default value)
  const apiToken = process.env.CONFLUENCE_API_TOKEN;
  if (apiToken === 'your-api-token' || apiToken!.length < 10) {
    logger.error('CONFLUENCE_API_TOKEN appears to be invalid or not set');
    logger.error('Please generate a proper API token from Atlassian');
    process.exit(1);
  }
  
  // Validate email format
  const email = process.env.CONFLUENCE_EMAIL;
  if (!email?.includes('@')) {
    logger.error('CONFLUENCE_EMAIL must be a valid email address');
    process.exit(1);
  }
  
  logger.info('Environment validation successful');
}

async function initializeApiClient(): Promise<void> {
  const config: ConfluenceConfig = {
    siteName: process.env.CONFLUENCE_SITE_NAME!,
    email: process.env.CONFLUENCE_EMAIL!,      // Added email for Basic Auth
    apiToken: process.env.CONFLUENCE_API_TOKEN!,
  };

  confluenceClient = new ConfluenceApiClient(config);

  // Backward-compat: SKIP_API_CONNECTION_TEST=true still skips (now a no-op since
  // skipping is the default), but log a one-line deprecation notice.
  if (process.env.SKIP_API_CONNECTION_TEST === 'true') {
    logger.info('SKIP_API_CONNECTION_TEST is deprecated: boot no longer tests the API connection ' +
      'by default. This flag is now a no-op; remove it. To opt back into a boot-time connection ' +
      'check, set API_CONNECTION_TEST=true instead.');
    return;
  }

  // Boot-time connection test is now opt-in. By default, no network call is made at
  // boot (env presence is still validated via validateEnvironment()); auth/network
  // failures surface at the first tool call instead, avoiding a network round-trip
  // and a boot-time failure mode on every spawn-per-call invocation.
  if (process.env.API_CONNECTION_TEST !== 'true') {
    logger.info('Skipping boot-time Confluence API connection test (default). ' +
      'Set API_CONNECTION_TEST=true to opt into a fail-fast boot check.');
    return;
  }

  // Test the connection
  logger.info('Testing Confluence API connection...');
  const isConnected = await confluenceClient.testConnection();

  if (!isConnected) {
    logger.error('Failed to connect to Confluence API');
    logger.error('Please check your CONFLUENCE_SITE_NAME, CONFLUENCE_EMAIL and CONFLUENCE_API_TOKEN');
    process.exit(1);
  }

  logger.info('Confluence API connection established successfully');
}

const server = new Server(
  {
    name: 'confluence-cloud-mcp-server',
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const toolDefinitions = getToolDefinitions();
  logger.debug(`Listing ${toolDefinitions.length} available tools`);
  
  return {
    tools: toolDefinitions,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: params } = request.params;
  
  try {
    logger.debug(`Calling tool: ${name}`);
    
    // Create wrapper with API client
    const wrapper = {
      server,
      apiClient: confluenceClient,
    };
    
    return await handleToolCall(name, params, wrapper);
  } catch (error) {
    logger.error(`Tool ${name} failed:`, error);
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool ${name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
});

async function main() {
  try {
    // Validate environment before starting
    validateEnvironment();
    
    // Initialize and test API client
    await initializeApiClient();
    
    // Register tools with the server
    await registerConfluenceTools({
      server,
      apiClient: confluenceClient,
    });
    
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Exit cleanly when stdin closes (e.g. parent process pipe closed). The SDK
    // does not exit automatically on EOF, which can leave orphaned processes
    // under spawn-per-call usage.
    process.stdin.on('end', () => process.exit(0));

    logger.info('Confluence Cloud MCP Server started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Execute main if this file is run directly  
if (process.argv[1] && (process.argv[1].includes('index.js') || process.argv[1].includes('confluence-cloud-mcp-server'))) {
  main().catch(console.error);
}