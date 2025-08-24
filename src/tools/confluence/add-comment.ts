import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('AddCommentTool');

export async function addCommentHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Adding comment to page');
    
    const { pageId, content, parentId } = params as {
      pageId: string;
      content: string;
      parentId?: string;
    };

    // Validate required parameters
    if (!pageId) {
      throw new Error('pageId is required');
    }

    if (!content) {
      throw new Error('content is required');
    }

    // Validate content is not empty after stripping HTML
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (textContent.length === 0) {
      throw new Error('content cannot be empty');
    }

    // Add comment via Confluence API
    const commentData = await wrapper.apiClient.addComment(pageId, content, parentId);

    logger.info(`Successfully added comment: ${commentData.id}`);

    // Format response
    const createdDate = commentData.createdAt ? new Date(commentData.createdAt).toLocaleString() : 'Just now';
    const version = commentData.version?.number || 1;
    const isReply = parentId ? ' (reply)' : '';

    return {
      content: [
        {
          type: 'text',
          text: `✅ Comment added successfully${isReply}`,
        },
        {
          type: 'text',
          text: `📋 Comment Details:`,
        },
        {
          type: 'text',
          text: `   ID: ${commentData.id}`,
        },
        {
          type: 'text',
          text: `   Page: ${pageId}`,
        },
        {
          type: 'text',
          text: `   Version: ${version}`,
        },
        {
          type: 'text',
          text: `   Created: ${createdDate}`,
        },
        ...(parentId ? [{
          type: 'text',
          text: `   Parent Comment: ${parentId}`
        }] : []),
        {
          type: 'text',
          text: `   Content Preview: ${textContent.substring(0, 100)}${textContent.length > 100 ? '...' : ''}`,
        },
        {
          type: 'text',
          text: `💡 Usage: Use comment ID ${commentData.id} with updateComment or deleteComment tools`
        },
        {
          type: 'text',
          text: `🔗 Integration: Verify comment with getPageComments tool`
        }
      ],
    };
  } catch (error) {
    logger.error('Failed to add comment:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error adding comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        {
          type: 'text',
          text: `💡 Tip: Ensure the page exists and you have permission to add comments`
        }
      ],
      isError: true,
    };
  }
}

export const addCommentToolDefinition = {
  name: 'addComment',
  description: 'Add a new footer comment to a Confluence page. Supports both top-level comments and replies to existing comments. Content should be in Confluence storage format. WORKFLOW: For replies, use getPageComments first to get parent comment ID.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'The ID of the Confluence page to add the comment to'
      },
      content: {
        type: 'string',
        description: 'The comment content in Confluence storage format (HTML). Example: "<p>This is a comment</p>"'
      },
      parentId: {
        type: 'string',
        description: 'Optional ID of parent comment to reply to (creates a threaded reply)'
      }
    },
    required: ['pageId', 'content']
  }
};