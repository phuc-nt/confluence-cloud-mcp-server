import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ConfluenceApiClient } from '../../utils/confluence-api.js';
import { Logger } from '../../utils/logger.js';
import { createPageHandler, createPageToolDefinition } from './create-page.js';
import { getPageContentHandler, getPageContentToolDefinition } from './get-page-content.js';
import { updatePageHandler, updatePageToolDefinition } from './update-page.js';

const logger = new Logger('ToolRegistry');

/**
 * Tool registration interface for MCP server
 */
export interface McpServerWrapper {
  server: Server;
  apiClient: ConfluenceApiClient;
}

/**
 * Register all Confluence tools with the MCP server
 * This function will be called from main server initialization
 */
export async function registerConfluenceTools(wrapper: McpServerWrapper): Promise<void> {
  try {
    logger.info('Registering Confluence tools...');
    
    // Register Sprint 1.2 tools
    logger.info('Registering Sprint 1.2 tools: createPage, getPageContent, updatePage');
    // Tools will be registered through the main server handler
    
    logger.info('Tool registration infrastructure ready');
    logger.info('3 tools ready: createPage, getPageContent, updatePage');
  } catch (error) {
    logger.error('Failed to register tools:', error);
    throw error;
  }
}

/**
 * Get tool definitions for MCP server
 */
export function getToolDefinitions() {
  return [
    createPageToolDefinition,
    getPageContentToolDefinition,
    updatePageToolDefinition,
  ];
}

/**
 * Route tool calls to appropriate handlers
 */
export async function handleToolCall(
  toolName: string, 
  params: any, 
  wrapper: McpServerWrapper
): Promise<any> {
  switch (toolName) {
    case 'createPage':
      return createPageHandler(params, wrapper);
    
    case 'getPageContent':
      return getPageContentHandler(params, wrapper);
    
    case 'updatePage':
      return updatePageHandler(params, wrapper);
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Get list of available tools (for debugging/status)
 */
export function getAvailableTools(): string[] {
  return [
    // Sprint 1 tools (to be implemented)
    'createPage',
    'getPageContent', 
    'updatePage',
    'deletePage',
    'getSpaces'
  ];
}