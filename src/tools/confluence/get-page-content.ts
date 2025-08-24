import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('GetPageContentTool');

export async function getPageContentHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Retrieving Confluence page content');
    
    const { pageId, bodyFormat } = params as {
      pageId: string;
      bodyFormat?: 'storage' | 'atlas_doc_format';
    };

    // Validate required parameters
    if (!pageId) {
      throw new Error('Missing required parameter: pageId is required');
    }

    const format = bodyFormat || 'storage';
    logger.debug(`Retrieving page ${pageId} with format ${format}`);
    
    // Call API to get page content
    const page = await wrapper.apiClient.getPageContent(pageId, format);

    logger.info(`Page content retrieved successfully: ${page.id}`);

    // Format content for display
    const content = page.body?.storage?.value || page.body?.atlas_doc_format?.value || 'No content available';
    
    return {
      content: [
        {
          type: 'text',
          text: `📄 Page: "${page.title}"`,
        },
        {
          type: 'text',
          text: `🆔 Page ID: ${page.id}`,
        },
        {
          type: 'text',
          text: `🏠 Space ID: ${page.spaceId}`,
        },
        {
          type: 'text',
          text: `📊 Status: ${page.status} | Version: ${page.version?.number || 1}`,
        },
        {
          type: 'text',
          text: `👤 Author: ${page.authorId}`,
        },
        {
          type: 'text',
          text: `📅 Created: ${page.createdAt ? new Date(page.createdAt).toLocaleDateString() : 'Unknown'}`,
        },
        {
          type: 'text',
          text: `🔗 View page: ${page._links?.webui || 'View in Confluence'}`,
        },
        {
          type: 'text',
          text: '📝 Content:',
        },
        {
          type: 'text',
          text: content,
        },
      ],
    };
  } catch (error) {
    logger.error('Failed to retrieve page content:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error retrieving page content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

// Tool registration metadata for MCP server
export const getPageContentToolDefinition = {
  name: 'getPageContent',
  description: 'Retrieve complete content and metadata of a Confluence page. Provides page version for updatePage operations. WORKFLOW: Use searchPages first to find page ID, then getPageContent to retrieve content and version.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'Confluence page ID to retrieve content from',
      },
      bodyFormat: {
        type: 'string',
        enum: ['storage', 'atlas_doc_format'],
        description: 'Content format to retrieve (default: storage)',
        default: 'storage',
      },
    },
    required: ['pageId'],
  },
};