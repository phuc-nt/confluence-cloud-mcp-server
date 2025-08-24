import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ConfluenceApiClient } from '../../utils/confluence-api.js';
import { Logger } from '../../utils/logger.js';
import { createPageHandler, createPageToolDefinition } from './create-page.js';
import { getPageContentHandler, getPageContentToolDefinition } from './get-page-content.js';
import { updatePageHandler, updatePageToolDefinition } from './update-page.js';
import { deletePageHandler, deletePageToolDefinition } from './delete-page.js';
import { getSpacesHandler, getSpacesToolDefinition } from './get-spaces.js';
import { getPageVersionsHandler, getPageVersionsToolDefinition } from './get-page-versions.js';
import { searchPagesHandler, searchPagesToolDefinition } from './search-pages.js';
import { getPageCommentsHandler, getPageCommentsToolDefinition } from './get-page-comments.js';
import { addCommentHandler, addCommentToolDefinition } from './add-comment.js';
import { updateCommentHandler, updateCommentToolDefinition } from './update-comment.js';
import { deleteCommentHandler, deleteCommentToolDefinition } from './delete-comment.js';

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
    
    // Register all Sprint 1 tools + Sprint 2 additions
    logger.info('Registering tools: createPage, getPageContent, updatePage, deletePage, getSpaces, getPageVersions, searchPages');
    // Tools will be registered through the main server handler
    
    logger.info('Tool registration infrastructure ready');
    logger.info('7 tools ready: createPage, getPageContent, updatePage, deletePage, getSpaces, getPageVersions, searchPages');
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
    getPageVersionsToolDefinition,
    searchPagesToolDefinition,
    getPageCommentsToolDefinition,
    addCommentToolDefinition,
    updateCommentToolDefinition,
    deleteCommentToolDefinition,
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
    
    case 'getPageVersions':
      return getPageVersionsHandler(params, wrapper);
    
    case 'searchPages':
      return searchPagesHandler(params, wrapper);
    
    case 'getPageComments':
      return getPageCommentsHandler(params, wrapper);
    
    case 'addComment':
      return addCommentHandler(params, wrapper);
    
    case 'updateComment':
      return updateCommentHandler(params, wrapper);
    
    case 'deleteComment':
      return deleteCommentHandler(params, wrapper);
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Get list of available tools (for debugging/status)
 */
export function getAvailableTools(): string[] {
  return [
    // Sprint 1 tools (completed)
    'createPage',
    'getPageContent', 
    'updatePage',
    'deletePage',
    'getSpaces',
    // Sprint 2.2 addition
    'getPageVersions',
    // Sprint 2.3 addition
    'searchPages'
  ];
}