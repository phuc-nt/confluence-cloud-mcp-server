import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('DeleteCommentTool');

export async function deleteCommentHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Deleting comment');
    
    const { commentId } = params as {
      commentId: string;
    };

    // Validate required parameters
    if (!commentId) {
      throw new Error('commentId is required');
    }

    // Delete comment via Confluence API
    await wrapper.apiClient.deleteComment(commentId);

    logger.info(`Successfully deleted comment: ${commentId}`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Comment deleted successfully`,
        },
        {
          type: 'text',
          text: `📋 Deleted Comment Details:`,
        },
        {
          type: 'text',
          text: `   ID: ${commentId}`,
        },
        {
          type: 'text',
          text: `   Status: Permanently removed`,
        },
        {
          type: 'text',
          text: `💡 Note: Comment and all replies (if any) have been removed from the page`
        },
        {
          type: 'text',
          text: `🔗 Integration: Verify removal with getPageComments tool`
        }
      ],
    };
  } catch (error) {
    logger.error('Failed to delete comment:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error deleting comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        {
          type: 'text',
          text: `💡 Tip: Check comment ID and ensure you have permission to delete the comment`
        }
      ],
      isError: true,
    };
  }
}

export const deleteCommentToolDefinition = {
  name: 'deleteComment',
  description: 'Permanently delete a Confluence comment. This action cannot be undone and will remove the comment and all its replies. WORKFLOW: Use getPageComments first to get comment ID, then call deleteComment.',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: 'The ID of the comment to delete'
      }
    },
    required: ['commentId']
  }
};