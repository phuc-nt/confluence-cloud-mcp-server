import { McpServerWrapper } from './index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('SearchPagesTool');

export async function searchPagesHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Searching Confluence pages');
    
    const { 
      query, 
      title, 
      spaceKey, 
      spaceId, 
      limit = 25, 
      sortBy = 'relevance' 
    } = params as {
      query?: string;
      title?: string;
      spaceKey?: string;
      spaceId?: string;
      limit?: number;
      sortBy?: 'relevance' | 'title' | 'created' | 'modified';
    };

    // Validate parameters
    if (!query && !title && !spaceKey && !spaceId) {
      throw new Error('At least one search parameter (query, title, spaceKey, or spaceId) must be provided');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('limit must be between 1 and 100');
    }

    // Convert spaceId to spaceKey if needed (for v1 API compatibility)
    let effectiveSpaceKey = spaceKey;
    if (spaceId && !spaceKey) {
      // TODO: In future, could add spaceId to spaceKey conversion
      logger.debug(`spaceId provided but spaceKey needed for search: ${spaceId}`);
    }

    // Perform search
    logger.debug(`Searching with params: query=${query}, title=${title}, spaceKey=${effectiveSpaceKey}, limit=${limit}`);
    
    const searchResults = await wrapper.apiClient.searchPages({
      query,
      title,
      spaceKey: effectiveSpaceKey,
      limit,
      sortBy
    });

    logger.info(`Search completed via ${searchResults.searchMethod}: found ${searchResults.size} results`);

    if (searchResults.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🔍 No pages found matching your search criteria`,
          },
          {
            type: 'text',
            text: `📋 Search parameters: ${JSON.stringify({ query, title, spaceKey: effectiveSpaceKey, sortBy }, null, 2)}`,
          },
          {
            type: 'text',
            text: `💡 Try: broader search terms, check space access, or use getSpaces to explore available spaces`
          },
          {
            type: 'text',
            text: `🔧 Search method used: ${searchResults.searchMethod || 'Unknown'}`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `🔍 Search Results: Found ${searchResults.size} pages`,
        },
        {
          type: 'text',
          text: `📊 Showing ${searchResults.results.length} results (limit: ${limit}, sorted by: ${sortBy})`,
        },
        {
          type: 'text',
          text: `🔧 Search method: ${searchResults.searchMethod || 'Unknown'}`,
        },
        {
          type: 'text',
          text: `📋 Results:`,
        },
        ...searchResults.results.map((page, index) => ({
          type: 'text',
          text: `  ${index + 1}. "${page.title}" (ID: ${page.id})${page.spaceKey ? ` [${page.spaceKey}]` : ''}${page.lastModified ? ` - Modified: ${new Date(page.lastModified).toLocaleDateString()}` : ''}`
        })),
        {
          type: 'text',
          text: `💡 Usage: Use page IDs with getPageContent, updatePage, or deletePage tools`
        },
        {
          type: 'text',
          text: `🔗 URLs: Page URLs available for browser access via webui links`
        }
      ],
    };
  } catch (error) {
    logger.error('Failed to search pages:', error);
    
    // Handle specific error types
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let tip = '💡 Tip: Check search parameters and API permissions';
    
    if (errorMessage.includes('API permissions')) {
      tip = '💡 Search requires API permissions. Try using getSpaces to explore spaces, then getPageContent with specific page IDs';
    } else if (errorMessage.includes('At least one search parameter')) {
      tip = '💡 Provide at least one: query (text search), title (title search), or spaceKey (space filter)';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error searching pages: ${errorMessage}`,
        },
        {
          type: 'text',
          text: tip
        },
        {
          type: 'text',
          text: `🔧 Alternative: Use getSpaces to list spaces, then explore pages manually`
        }
      ],
      isError: true,
    };
  }
}

// Tool registration metadata for MCP server
export const searchPagesToolDefinition = {
  name: 'searchPages',
  description: 'Search for Confluence pages across spaces using text queries or filters. Supports CQL search and content API fallback. Returns page IDs for use with other tools. WORKFLOW: Use this as the first step to find pages, then use page IDs with getPageContent, updatePage, deletePage, or comment tools.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search text to find in page titles and content (supports partial matches)'
      },
      title: {
        type: 'string', 
        description: 'Search specifically in page titles (alternative to query, supports partial matches)'
      },
      spaceKey: {
        type: 'string',
        description: 'Limit search to specific space key (e.g., "AWA1", "DOCS") - improves search accuracy'
      },
      spaceId: {
        type: 'string',
        description: 'Limit search to specific space ID (alternative to spaceKey, less reliable for search)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 25, max: 100)',
        default: 25,
        minimum: 1,
        maximum: 100
      },
      sortBy: {
        type: 'string',
        enum: ['relevance', 'title', 'created', 'modified'],
        description: 'Sort order for results (default: relevance for best matches)',
        default: 'relevance'
      }
    },
    // Flexible - at least one parameter required but not enforced in schema for better UX
  }
};