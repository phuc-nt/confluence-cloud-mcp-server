import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('UpdateCommentTool');

export async function updateCommentHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Updating comment');
    
    const { commentId, content, version } = params as {
      commentId: string;
      content: string;
      version: number;
    };

    // Validate required parameters
    if (!commentId) {
      throw new Error('commentId is required');
    }

    if (!content) {
      throw new Error('content is required');
    }

    if (!version || version < 1) {
      throw new Error('version is required and must be greater than 0');
    }

    // Validate content is not empty after stripping HTML
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (textContent.length === 0) {
      throw new Error('content cannot be empty');
    }

    // Update comment via Confluence API (API expects next version number)
    const nextVersion = version + 1;
    const commentData = await wrapper.apiClient.updateComment(commentId, content, nextVersion);

    logger.info(`Successfully updated comment: ${commentData.id} to version ${commentData.version.number}`);

    // Format response
    const updatedDate = commentData.version?.createdAt ? new Date(commentData.version.createdAt).toLocaleString() : 'Just now';
    const newVersion = commentData.version?.number || version;

    return {
      content: [
        {
          type: 'text',
          text: `✅ Comment updated successfully`,
        },
        {
          type: 'text',
          text: `📋 Updated Comment Details:`,
        },
        {
          type: 'text',
          text: `   ID: ${commentData.id}`,
        },
        {
          type: 'text',
          text: `   Version: ${newVersion} (was ${version})`,
        },
        {
          type: 'text',
          text: `   Updated: ${updatedDate}`,
        },
        {
          type: 'text',
          text: `   Content Preview: ${textContent.substring(0, 100)}${textContent.length > 100 ? '...' : ''}`,
        },
        {
          type: 'text',
          text: `💡 Usage: Current version is now ${newVersion} - use this for future updates`
        },
        {
          type: 'text',
          text: `🔗 Integration: Verify changes with getPageComments tool`
        }
      ],
    };
  } catch (error) {
    logger.error('Failed to update comment:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error updating comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        {
          type: 'text',
          text: `💡 Tip: Check comment ID, version number, and ensure you have permission to edit the comment`
        }
      ],
      isError: true,
    };
  }
}

export const updateCommentToolDefinition = {
  name: 'updateComment',
  description: 'Update the content of an existing Confluence comment. Requires the comment ID and current version number for conflict resolution. WORKFLOW: Use getPageComments first to get current version, then call updateComment with that version.',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: 'The ID of the comment to update'
      },
      content: {
        type: 'string',
        description: 'The new comment content in Confluence storage format (HTML). Example: "<p>Updated comment text</p>"'
      },
      version: {
        type: 'number',
        description: 'The current version number of the comment (API will increment to next version). Get from getPageComments response.',
        minimum: 1
      }
    },
    required: ['commentId', 'content', 'version']
  }
};