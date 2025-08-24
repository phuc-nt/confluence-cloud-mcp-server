import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('CreatePageTool');

export async function createPageHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Creating new Confluence page');
    
    const { spaceId, title, content, parentId } = params as {
      spaceId: string;
      title: string;
      content: string;
      parentId?: string;
    };

    // Validate required parameters
    if (!spaceId || !title || !content) {
      throw new Error('Missing required parameters: spaceId, title, and content are required');
    }

    // Create page data according to Confluence API v2 format
    const pageData = {
      spaceId,
      status: 'current' as const,
      title,
      parentId,
      body: {
        representation: 'storage' as const,
        value: content,
      },
    };

    logger.debug('Creating page with data:', { spaceId, title, parentId });
    
    // Call API to create page
    const createdPage = await wrapper.apiClient.createPage(pageData);

    logger.info(`Page created successfully: ${createdPage.id}`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Page "${title}" created successfully!`,
        },
        {
          type: 'text', 
          text: `📄 Page ID: ${createdPage.id}`,
        },
        {
          type: 'text',
          text: `🔗 View page: ${createdPage._links?.webui || `View in Confluence`}`,
        },
        {
          type: 'text',
          text: `📊 Page details: Space ID ${createdPage.spaceId}, Version ${createdPage.version?.number || 1}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Failed to create page:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error creating page: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

// Tool registration metadata for MCP server
export const createPageToolDefinition = {
  name: 'createPage',
  description: 'Create a new Confluence page in a specified space. WORKFLOW: Use getSpaces first to get space ID, then createPage to create the page.',
  inputSchema: {
    type: 'object',
    properties: {
      spaceId: {
        type: 'string',
        description: 'Confluence space ID where the page will be created',
      },
      title: {
        type: 'string', 
        description: 'Title of the new page',
      },
      content: {
        type: 'string',
        description: 'Page content in Confluence storage format (XML-like HTML)',
      },
      parentId: {
        type: 'string',
        description: 'Optional parent page ID for creating child pages',
      },
    },
    required: ['spaceId', 'title', 'content'],
  },
};