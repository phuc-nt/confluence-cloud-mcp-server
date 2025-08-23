import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('GetSpacesTool');

export async function getSpacesHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Retrieving Confluence spaces');
    
    const { limit } = params as {
      limit?: number;
    };

    const requestLimit = limit || 25; // Default limit
    logger.debug(`Retrieving spaces with limit: ${requestLimit}`);
    
    // Call API to get spaces
    const spacesResponse = await wrapper.apiClient.getSpaces(requestLimit);
    const spaces = spacesResponse.results;

    logger.info(`Retrieved ${spaces.length} spaces successfully`);

    if (spaces.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📂 No spaces found or no access to any spaces',
          },
          {
            type: 'text',
            text: '💡 Tip: Check your API token permissions',
          },
        ],
      };
    }

    // Create summary
    const summary = [
      {
        type: 'text',
        text: `📂 Found ${spaces.length} Confluence space${spaces.length > 1 ? 's' : ''}:`,
      },
    ];

    // Add each space details
    const spaceDetails = spaces.map((space, index) => [
      {
        type: 'text',
        text: `\n${index + 1}. 📖 ${space.name}`,
      },
      {
        type: 'text',
        text: `   🆔 Space ID: ${space.id}`,
      },
      {
        type: 'text',
        text: `   🔑 Space Key: ${space.key}`,
      },
      {
        type: 'text',
        text: `   📊 Type: ${space.type} | Status: ${space.status}`,
      },
      {
        type: 'text',
        text: `   👤 Author: ${space.authorId}`,
      },
      {
        type: 'text',
        text: `   📅 Created: ${space.createdAt ? new Date(space.createdAt).toLocaleDateString() : 'Unknown'}`,
      },
      ...(space.homepage ? [{
        type: 'text',
        text: `   🏠 Homepage: ${space.homepage.title} (ID: ${space.homepage.id})`,
      }] : []),
      {
        type: 'text',
        text: `   🔗 View: ${space._links?.webui || 'View in Confluence'}`,
      },
    ]).flat();

    // Add usage tip
    const usageTip = [
      {
        type: 'text',
        text: '\n💡 Usage Tips:',
      },
      {
        type: 'text', 
        text: '• Use Space ID for creating pages with createPage tool',
      },
      {
        type: 'text',
        text: '• Use Space Key for quick space identification',
      },
      {
        type: 'text',
        text: '• Homepage ID can be used as parentId for child pages',
      },
    ];

    return {
      content: [
        ...summary,
        ...spaceDetails,
        ...usageTip,
      ],
    };
  } catch (error) {
    logger.error('Failed to retrieve spaces:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isPermission = errorMessage.includes('403') || errorMessage.includes('permission');
    const isAuth = errorMessage.includes('401') || errorMessage.includes('unauthorized');
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error retrieving spaces: ${errorMessage}`,
        },
        ...(isAuth ? [{
          type: 'text',
          text: `💡 Tip: Check your API token authentication`,
        }] : []),
        ...(isPermission ? [{
          type: 'text',
          text: `💡 Tip: Your API token might not have permission to view spaces`,
        }] : []),
      ],
      isError: true,
    };
  }
}

// Tool registration metadata for MCP server
export const getSpacesToolDefinition = {
  name: 'getSpaces',
  description: 'List available Confluence spaces with details and permissions',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of spaces to return (default: 25)',
        default: 25,
        minimum: 1,
        maximum: 250,
      },
    },
    required: [],
  },
};