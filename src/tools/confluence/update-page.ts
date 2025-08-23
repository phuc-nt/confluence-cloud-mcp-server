import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('UpdatePageTool');

export async function updatePageHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Updating Confluence page');
    
    const { pageId, title, content, version, versionMessage } = params as {
      pageId: string;
      title?: string;
      content?: string;
      version: number;
      versionMessage?: string;
    };

    // Validate required parameters
    if (!pageId || !version) {
      throw new Error('Missing required parameters: pageId and version are required');
    }

    if (!title && !content) {
      throw new Error('At least one of title or content must be provided for update');
    }

    // First, get current page to preserve existing data
    logger.debug(`Getting current page data for ${pageId}`);
    const currentPage = await wrapper.apiClient.getPageContent(pageId);

    // Create update data with current or new values
    const updateData = {
      id: pageId,
      status: 'current' as const,
      title: title || currentPage.title,
      body: {
        representation: 'storage' as const,
        value: content || currentPage.body?.storage?.value || '',
      },
      version: {
        number: version,
        message: versionMessage || `Updated page via MCP`,
      },
    };

    logger.debug(`Updating page ${pageId} with version ${version}`);
    
    // Call API to update page
    const updatedPage = await wrapper.apiClient.updatePage(pageId, updateData);

    logger.info(`Page updated successfully: ${updatedPage.id} (version ${updatedPage.version?.number})`);

    const changes = [];
    if (title && title !== currentPage.title) {
      changes.push(`Title: "${currentPage.title}" → "${title}"`);
    }
    if (content) {
      changes.push(`Content updated`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Page "${updatedPage.title}" updated successfully!`,
        },
        {
          type: 'text', 
          text: `📄 Page ID: ${updatedPage.id}`,
        },
        {
          type: 'text',
          text: `📊 Version: ${currentPage.version?.number || 1} → ${updatedPage.version?.number || version}`,
        },
        {
          type: 'text',
          text: `🔄 Changes: ${changes.length > 0 ? changes.join(', ') : 'Page updated'}`,
        },
        {
          type: 'text',
          text: `🔗 View page: ${updatedPage._links?.webui || 'View in Confluence'}`,
        },
        {
          type: 'text',
          text: `💬 Update message: ${versionMessage || 'Updated page via MCP'}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Failed to update page:', error);
    
    // Check if it's a version conflict error
    const isVersionConflict = error instanceof Error && 
      (error.message.includes('version') || error.message.includes('conflict'));
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error updating page: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        ...(isVersionConflict ? [{
          type: 'text',
          text: `💡 Tip: Get current page content first to check the latest version number`,
        }] : []),
      ],
      isError: true,
    };
  }
}

// Tool registration metadata for MCP server
export const updatePageToolDefinition = {
  name: 'updatePage',
  description: 'Update title and/or content of an existing Confluence page',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'Confluence page ID to update',
      },
      title: {
        type: 'string',
        description: 'New page title (optional if only updating content)',
      },
      content: {
        type: 'string',
        description: 'New page content in Confluence storage format (optional if only updating title)',
      },
      version: {
        type: 'number',
        description: 'Current page version number (required for optimistic locking)',
      },
      versionMessage: {
        type: 'string',
        description: 'Optional message describing the changes made',
        default: 'Updated page via MCP',
      },
    },
    required: ['pageId', 'version'],
  },
};