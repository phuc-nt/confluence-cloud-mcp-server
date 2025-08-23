import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('GetPageVersionsTool');

export async function getPageVersionsHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Getting page version history');
    
    const { pageId, limit = 10 } = params as {
      pageId: string;
      limit?: number;
    };

    // Validate parameters
    if (!pageId) {
      throw new Error('pageId is required');
    }

    if (limit < 1 || limit > 50) {
      throw new Error('limit must be between 1 and 50');
    }

    // Get version history
    logger.debug(`Getting version history for page ${pageId} with limit ${limit}`);
    const versionsData = await wrapper.apiClient.getPageVersions(pageId, limit);

    logger.info(`Retrieved ${versionsData.results?.length || 0} versions for page ${pageId}`);

    if (!versionsData.results || versionsData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `📚 No version history found for page ${pageId}`,
          },
          {
            type: 'text',
            text: `💡 This might be a new page with only one version, or the page doesn't exist`,
          }
        ]
      };
    }

    // Sort versions by number (latest first)
    const sortedVersions = versionsData.results.sort((a, b) => b.number - a.number);
    const latestVersion = sortedVersions[0];

    return {
      content: [
        {
          type: 'text',
          text: `📚 Version History for Page ${pageId}`,
        },
        {
          type: 'text',
          text: `📊 Found ${sortedVersions.length} version${sortedVersions.length === 1 ? '' : 's'} (showing latest ${Math.min(limit, sortedVersions.length)})`,
        },
        {
          type: 'text',
          text: `🔢 Current Version: ${latestVersion.number}`,
        },
        {
          type: 'text',
          text: `📋 Version Details:`,
        },
        ...sortedVersions.map((version, index) => ({
          type: 'text',
          text: `  ${index === 0 ? '→' : ' '} Version ${version.number} - ${new Date(version.createdAt).toLocaleString()}${version.message ? ` - "${version.message}"` : ''}${index === 0 ? ' (CURRENT)' : ''}`
        })),
        {
          type: 'text',
          text: `💡 Usage: For updatePage, use version ${latestVersion.number + 1} (next version)`
        },
        {
          type: 'text',
          text: `🔍 Note: For historical content, use getPageContent with version parameter (e.g., version=${latestVersion.number})`
        }
      ],
    };
  } catch (error) {
    logger.error('Failed to get page versions:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error getting version history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        {
          type: 'text',
          text: `💡 Tip: Verify page ID exists and you have read permissions`
        }
      ],
      isError: true,
    };
  }
}

// Tool registration metadata for MCP server
export const getPageVersionsToolDefinition = {
  name: 'getPageVersions',
  description: 'Get version history metadata for a Confluence page. Returns version numbers, dates, and messages. Use this before updatePage to get current version number, or to explore page edit history.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'Confluence page ID to get version history for',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of versions to return (default: 10, max: 50)',
        default: 10,
        minimum: 1,
        maximum: 50
      }
    },
    required: ['pageId'],
  },
};