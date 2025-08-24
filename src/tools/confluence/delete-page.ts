import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('DeletePageTool');

export async function deletePageHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Deleting Confluence page');
    
    const { pageId, draft } = params as {
      pageId: string;
      draft?: boolean;
    };

    // Validate required parameters
    if (!pageId) {
      throw new Error('Missing required parameter: pageId is required');
    }

    // Get page info before deletion for confirmation
    let pageInfo;
    try {
      pageInfo = await wrapper.apiClient.getPageContent(pageId);
    } catch (error) {
      // If we can't get page info, it might not exist
      logger.warn(`Could not retrieve page ${pageId} before deletion:`, error);
    }

    logger.debug(`Deleting page ${pageId}${draft ? ' (moving to draft)' : ''}`);
    
    // Call API to delete page
    await wrapper.apiClient.deletePage(pageId);

    logger.info(`Page deleted successfully: ${pageId}`);

    const pageTitle = pageInfo?.title || 'Unknown page';
    const spaceId = pageInfo?.spaceId || 'Unknown space';

    return {
      content: [
        {
          type: 'text',
          text: `✅ Page "${pageTitle}" deleted successfully!`,
        },
        {
          type: 'text', 
          text: `📄 Deleted Page ID: ${pageId}`,
        },
        {
          type: 'text',
          text: `🏠 From Space ID: ${spaceId}`,
        },
        {
          type: 'text',
          text: `🗑️ Action: ${draft ? 'Moved to draft' : 'Permanently deleted'}`,
        },
        {
          type: 'text',
          text: `⚠️  Note: This action cannot be undone through the API`,
        },
      ],
    };
  } catch (error) {
    logger.error('Failed to delete page:', error);
    
    // Check for common error scenarios
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFound = errorMessage.includes('404') || errorMessage.includes('not found');
    const isPermission = errorMessage.includes('403') || errorMessage.includes('permission');
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error deleting page: ${errorMessage}`,
        },
        ...(isNotFound ? [{
          type: 'text',
          text: `💡 Tip: Page might already be deleted or the ID is incorrect`,
        }] : []),
        ...(isPermission ? [{
          type: 'text',
          text: `💡 Tip: Check if you have delete permissions for this page`,
        }] : []),
      ],
      isError: true,
    };
  }
}

// Tool registration metadata for MCP server
export const deletePageToolDefinition = {
  name: 'deletePage',
  description: 'Delete a Confluence page permanently. This action cannot be undone. WORKFLOW: Use searchPages or getPageContent first to confirm page ID, then call deletePage.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'Confluence page ID to delete',
      },
      draft: {
        type: 'boolean',
        description: 'Move to draft instead of permanent deletion (optional, default: false)',
        default: false,
      },
    },
    required: ['pageId'],
  },
};