import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('GetPageCommentsTool');

export async function getPageCommentsHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Getting page comments');
    
    const { pageId, limit = 25, cursor } = params as {
      pageId: string;
      limit?: number;
      cursor?: string;
    };

    // Validate required parameters
    if (!pageId) {
      throw new Error('pageId is required');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('limit must be between 1 and 100');
    }

    // Get comments from Confluence API
    const commentsData = await wrapper.apiClient.getPageComments(pageId, limit, cursor);

    logger.info(`Retrieved ${commentsData.size} comments for page ${pageId}`);

    // Handle no comments case
    if (commentsData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `💬 No comments found on page ${pageId}`,
          },
          {
            type: 'text',
            text: `📋 The page exists but has no footer comments yet`,
          },
          {
            type: 'text',
            text: `💡 Use addComment tool to start a conversation on this page`
          }
        ]
      };
    }

    // Format comments for display
    const commentsList = commentsData.results.map((comment: any, index: number) => {
      const createdDate = comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown';
      const authorName = comment.authorId || 'Unknown Author';
      const version = comment.version?.number || 1;
      const contentPreview = comment.body?.storage?.value 
        ? comment.body.storage.value.replace(/<[^>]*>/g, '').substring(0, 100) + (comment.body.storage.value.length > 100 ? '...' : '')
        : '[No content]';

      return {
        type: 'text',
        text: `  ${index + 1}. Comment ID: ${comment.id} (v${version})
     Author: ${authorName} | Created: ${createdDate}
     Content: ${contentPreview}`
      };
    });

    // Pagination info
    const hasNext = commentsData._links?.next;
    const paginationInfo = hasNext 
      ? '\n💡 More comments available - use cursor parameter for pagination'
      : '\n📄 All comments displayed';

    return {
      content: [
        {
          type: 'text',
          text: `💬 Page Comments: Found ${commentsData.size} comment(s)`,
        },
        {
          type: 'text',
          text: `📋 Comments on page ${pageId} (limit: ${limit})`,
        },
        {
          type: 'text',
          text: `📝 Comment List:`,
        },
        ...commentsList,
        {
          type: 'text',
          text: `💡 Usage: Use comment IDs with updateComment or deleteComment tools${paginationInfo}`
        },
        {
          type: 'text',
          text: `🔗 Integration: Comments can be analyzed alongside page content from getPageContent`
        }
      ],
    };
  } catch (error) {
    logger.error('Failed to get page comments:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error getting page comments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        {
          type: 'text',
          text: `💡 Tip: Ensure the page ID exists and you have permission to view comments`
        }
      ],
      isError: true,
    };
  }
}

export const getPageCommentsToolDefinition = {
  name: 'getPageComments',
  description: 'Retrieve all footer comments for a specific Confluence page. Returns comment IDs, content previews, authors, and creation dates for analysis and management.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'The ID of the Confluence page to get comments from'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of comments to return (default: 25, max: 100)',
        default: 25,
        minimum: 1,
        maximum: 100
      },
      cursor: {
        type: 'string',
        description: 'Pagination cursor for retrieving next batch of comments (optional)'
      }
    },
    required: ['pageId']
  }
};