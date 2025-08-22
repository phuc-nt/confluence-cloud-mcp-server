import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ConfluenceApiClient } from '../../utils/confluence-api.js';
import { Logger } from '../../utils/logger.js';

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
    
    // Sprint 1 tools will be registered here
    // registerCreatePageTool(wrapper);
    // registerGetPageContentTool(wrapper);
    // registerUpdatePageTool(wrapper);
    // registerDeletePageTool(wrapper);
    // registerGetSpacesTool(wrapper);
    
    logger.info('Tool registration infrastructure ready');
    logger.info('Waiting for tool implementations in Sprint 1.2...');
  } catch (error) {
    logger.error('Failed to register tools:', error);
    throw error;
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