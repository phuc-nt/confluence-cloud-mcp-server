import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ConfluenceApiClient } from '../../utils/confluence-api.js';
import { Logger } from '../../utils/logger.js';
import { createPageHandler, createPageToolDefinition } from './create-page.js';
import { getPageContentHandler, getPageContentToolDefinition } from './get-page-content.js';
import { updatePageHandler, updatePageToolDefinition } from './update-page.js';
import { deletePageHandler, deletePageToolDefinition } from './delete-page.js';
import { getSpacesHandler, getSpacesToolDefinition } from './get-spaces.js';

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
    
    // Register all Sprint 1 tools
    logger.info('Registering all Sprint 1 tools: createPage, getPageContent, updatePage, deletePage, getSpaces');
    // Tools will be registered through the main server handler
    
    logger.info('Tool registration infrastructure ready');
    logger.info('5 tools ready: createPage, getPageContent, updatePage, deletePage, getSpaces');
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
    deletePageToolDefinition,
    getSpacesToolDefinition,
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
    
    case 'deletePage':
      return deletePageHandler(params, wrapper);
    
    case 'getSpaces':
      return getSpacesHandler(params, wrapper);
    
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