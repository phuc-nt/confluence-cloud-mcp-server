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
import { Logger } from './utils/logger.js';
import { ConfluenceApiClient, ConfluenceConfig } from './utils/confluence-api.js';
import { registerConfluenceTools, getAvailableTools } from './tools/confluence/index.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['CONFLUENCE_SITE_NAME', 'CONFLUENCE_API_TOKEN'];
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
  
  logger.info('Environment validation successful');
}

async function initializeApiClient(): Promise<void> {
  const config: ConfluenceConfig = {
    siteName: process.env.CONFLUENCE_SITE_NAME!,
    apiToken: process.env.CONFLUENCE_API_TOKEN!,
  };

  confluenceClient = new ConfluenceApiClient(config);

  // Test the connection
  logger.info('Testing Confluence API connection...');
  const isConnected = await confluenceClient.testConnection();
  
  if (!isConnected) {
    logger.error('Failed to connect to Confluence API');
    logger.error('Please check your CONFLUENCE_SITE_NAME and CONFLUENCE_API_TOKEN');
    process.exit(1);
  }
  
  logger.info('Confluence API connection established successfully');
}

const server = new Server(
  {
    name: 'confluence-cloud-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // For now, return available tools list (implementations coming in Sprint 1.2)
  const availableTools = getAvailableTools();
  logger.debug(`Listing ${availableTools.length} available tools`);
  
  return {
    tools: availableTools.map(toolName => ({
      name: toolName,
      description: `Confluence ${toolName} tool (implementation pending Sprint 1.2)`,
      inputSchema: {
        type: 'object',
        properties: {},
      },
    })),
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  
  throw new McpError(
    ErrorCode.MethodNotFound,
    `Tool ${name} not implemented yet`,
  );
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
    logger.info('Confluence Cloud MCP Server started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}