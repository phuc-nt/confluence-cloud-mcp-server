# Confluence Cloud MCP Server - Implementation Guide

## Development Principles

### Fast Delivery Focus
- **Priority**: Feature delivery over optimization
- **Approach**: Simple, working solutions first
- **Refactoring**: Only when absolutely necessary
- **Testing**: Basic validation, no comprehensive test suites

### Code Architecture Strategy
- **Simple Design**: Single server with essential tools only
- **Tool-Only Pattern**: Direct action execution, no resources layer
- **Simple Error Handling**: Standard HTTP error responses
- **Minimal Dependencies**: Core libraries only

## Project Structure

### Directory Layout
```
src/
├── index.ts                    # Main server entry (11 tools)
├── tools/confluence/           # Individual tool implementations
│   ├── search-pages.ts         # Universal page search
│   ├── get-page-content.ts     # Page content with labels
│   ├── get-page-versions.ts    # Page version history
│   ├── get-spaces.ts           # Space listing
│   ├── create-page.ts          # Page creation
│   ├── update-page.ts          # Page modification
│   ├── delete-page.ts          # Page removal
│   ├── get-page-comments.ts    # Comment retrieval
│   ├── add-comment.ts          # Comment creation
│   ├── update-comment.ts       # Comment modification
│   └── delete-comment.ts       # Comment removal
├── utils/
│   ├── confluence-api.ts       # Unified API client
│   ├── error-handler.ts        # Error response formatting
│   └── logger.ts               # Simple logging
└── schemas/
    ├── confluence.ts           # Confluence type definitions
    └── common.ts               # Shared schemas
```

## Tool Implementation Pattern

### Standard Tool Structure
```typescript
// Example: src/tools/confluence/search-pages.ts
export function registerSearchPagesTool(server: McpServer) {
  server.tool('searchPages', 'Universal page search with filters', {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Filter by page title' },
      spaceId: { type: 'string', description: 'Filter by space ID' },
      status: { type: 'string', description: 'Filter by status (current, archived)' },
      limit: { type: 'number', default: 25, description: 'Number of results' }
    }
  }, async (params: any, context: any) => {
    try {
      const client = new ConfluenceApiClient(context.confluenceConfig);
      const pages = await client.searchPages(params);
      
      return {
        content: [
          { type: 'text', text: `Found ${pages.size} pages` },
          { type: 'json', data: pages }
        ]
      };
    } catch (error) {
      return handleError('searchPages', error);
    }
  });
}
```

### API Client Implementation
```typescript
// src/utils/confluence-api.ts
export class ConfluenceApiClient {
  private baseUrl: string;
  private auth: string;
  
  constructor(config: ConfluenceConfig) {
    this.baseUrl = `${config.baseUrl}/wiki/rest/api/v2`;
    // API token authentication - email is embedded in the token
    this.auth = Buffer.from(`${config.apiToken}`).toString('base64');
  }
  
  // Page Discovery & Search
  async searchPages(params: SearchPagesParams): Promise<PageSearchResult> {
    const queryParams = new URLSearchParams();
    if (params.title) queryParams.append('title', params.title);
    if (params.spaceId) queryParams.append('space-id', params.spaceId);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await axios.get(`${this.baseUrl}/pages?${queryParams}`, {
      headers: { Authorization: `Basic ${this.auth}` }
    });
    return response.data;
  }
  
  async getPageContent(pageId: string): Promise<PageWithContent> {
    const response = await axios.get(`${this.baseUrl}/pages/${pageId}?body-format=storage`, {
      headers: { Authorization: `Basic ${this.auth}` }
    });
    return response.data;
  }
  
  async getSpaces(params?: { limit?: number; cursor?: string }): Promise<SpacesResult> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    
    const response = await axios.get(`${this.baseUrl}/spaces?${queryParams}`, {
      headers: { Authorization: `Basic ${this.auth}` }
    });
    return response.data;
  }
  
  // Page Management
  async createPage(data: CreatePageData): Promise<Page> {
    const response = await axios.post(`${this.baseUrl}/pages`, data, {
      headers: { 
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
  
  async updatePage(pageId: string, data: UpdatePageData): Promise<Page> {
    const response = await axios.put(`${this.baseUrl}/pages/${pageId}`, data, {
      headers: { 
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
  
  async deletePage(pageId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/pages/${pageId}`, {
      headers: { Authorization: `Basic ${this.auth}` }
    });
  }
}
```

## Tool-to-API Mapping

### Complete Tool Implementation Reference

| Tool | Confluence API Endpoint | HTTP Method | Key Parameters |
|------|------------------------|-------------|----------------|
| **searchPages** | `/api/v2/pages` | GET | title, space-id, status, limit |
| **getPageContent** | `/api/v2/pages/{pageId}?body-format=storage` | GET | pageId (required) |
| **getPageVersions** | `/api/v2/pages/{pageId}/versions` | GET | pageId, limit, cursor |
| **getSpaces** | `/api/v2/spaces` | GET | limit, cursor |
| **createPage** | `/api/v2/pages` | POST | spaceId, title, body, parentId |
| **updatePage** | `/api/v2/pages/{pageId}` | PUT | pageId, title, body, version |
| **deletePage** | `/api/v2/pages/{pageId}` | DELETE | pageId |
| **getPageComments** | `/api/v2/pages/{pageId}/footer-comments`<br>`/api/v2/pages/{pageId}/inline-comments` | GET | pageId (combined results) |
| **addComment** | `/api/v2/footer-comments` | POST | pageId, body |
| **updateComment** | `/api/v2/footer-comments/{commentId}` | PUT | commentId, body, version |
| **deleteComment** | `/api/v2/footer-comments/{commentId}` | DELETE | commentId |

### API Implementation Details

#### Page Discovery & Search
```typescript
// searchPages implementation
async searchPages(params: SearchPagesParams): Promise<PageSearchResult> {
  const queryParams = new URLSearchParams();
  if (params.title) queryParams.append('title', params.title);
  if (params.spaceId) queryParams.append('space-id', params.spaceId);
  if (params.status) queryParams.append('status', params.status);
  
  const response = await axios.get(`${this.baseUrl}/pages?${queryParams}`, {
    headers: { Authorization: `Basic ${this.auth}` }
  });
  return response.data;
}

// getPageContent implementation  
async getPageContent(pageId: string): Promise<PageWithContent> {
  const response = await axios.get(`${this.baseUrl}/pages/${pageId}?body-format=storage`, {
    headers: { Authorization: `Basic ${this.auth}` }
  });
  return response.data;
}
```

#### Comment System
```typescript
// getPageComments - combines footer and inline comments
async getPageComments(pageId: string): Promise<CommentsResult> {
  const [footerResponse, inlineResponse] = await Promise.all([
    axios.get(`${this.baseUrl}/pages/${pageId}/footer-comments`, {
      headers: { Authorization: `Basic ${this.auth}` }
    }),
    axios.get(`${this.baseUrl}/pages/${pageId}/inline-comments`, {
      headers: { Authorization: `Basic ${this.auth}` }
    })
  ]);
  
  return {
    comments: [
      ...footerResponse.data.results.map(c => ({...c, type: 'footer'})),
      ...inlineResponse.data.results.map(c => ({...c, type: 'inline'}))
    ]
  };
}

// addComment implementation
async addComment(pageId: string, content: string): Promise<Comment> {
  const response = await axios.post(`${this.baseUrl}/footer-comments`, {
    pageId,
    body: { representation: 'storage', value: content }
  }, {
    headers: { 
      Authorization: `Basic ${this.auth}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}
```

### Authentication Pattern
All API calls use the same authentication pattern:
```typescript
headers: { 
  Authorization: `Basic ${Buffer.from(apiToken).toString('base64')}`,
  'Content-Type': 'application/json' // for POST/PUT requests
}
```

## Tool Categories

### Page Discovery & Access (4 tools)
```typescript
- searchPages: Universal page search with filters (title, spaceId, status)
- getPageContent: Get complete page with content body and labels  
- getPageVersions: Get page edit history and versions
- getSpaces: List available spaces for context
```

### Page Management (3 tools)  
```typescript
- createPage: Create new pages (requires spaceId)
- updatePage: Modify page title and content
- deletePage: Remove pages with proper handling
```

### Comment System (4 tools)
```typescript  
- getPageComments: Retrieve all comments (footer + inline)
- addComment: Add new footer comments
- updateComment: Modify existing comment content  
- deleteComment: Remove comments with authorization
```

## Error Handling Strategy

### Simple Error Response Format
```typescript
// src/utils/error-handler.ts
export function handleError(toolName: string, error: any): ToolResponse {
  const statusCode = error.response?.status || 500;
  const message = error.response?.data?.message || error.message;
  
  return {
    content: [
      { 
        type: 'text', 
        text: `Error in ${toolName}: ${message} (HTTP ${statusCode})` 
      }
    ],
    isError: true
  };
}
```

### Common Error Scenarios
- **401 Unauthorized**: Invalid API token
- **403 Forbidden**: Insufficient permissions  
- **404 Not Found**: Resource doesn't exist
- **429 Rate Limited**: API quota exceeded
- **500 Server Error**: Confluence service issues

## Configuration Management

### Environment Variables
```bash
CONFLUENCE_SITE_NAME=your-site.atlassian.net
CONFLUENCE_API_TOKEN=your-api-token
MCP_SERVER_NAME=confluence-cloud-mcp-server
MCP_SERVER_VERSION=1.0.0
```

### Server Initialization
```typescript
// src/index.ts - Main server setup
const confluenceConfig: ConfluenceConfig = {
  baseUrl: process.env.CONFLUENCE_SITE_NAME.includes('.atlassian.net') 
    ? `https://${process.env.CONFLUENCE_SITE_NAME}` 
    : process.env.CONFLUENCE_SITE_NAME,
  apiToken: process.env.CONFLUENCE_API_TOKEN
};

const server = new McpServer({
  name: 'confluence-cloud-mcp-server',
  version: '1.0.0',
  capabilities: { tools: {} }  // Tools-only architecture
});

// Register all tools with context injection
registerAllTools(serverWithContext);
```

## Content Format Handling

### Confluence Storage Format
Confluence uses XML-like HTML format for content:
```xml
<!-- Basic content -->
<p>Simple paragraph text</p>
<h1>Heading 1</h1>
<h2>Heading 2</h2>

<!-- Lists -->
<ul>
  <li>Bullet item 1</li>
  <li>Bullet item 2</li>
</ul>

<!-- Confluence macros -->
<ac:structured-macro ac:name="info">
  <ac:rich-text-body>
    <p>Information box content</p>
  </ac:rich-text-body>
</ac:structured-macro>
```

### Content Conversion Strategy
- **Simple Implementation**: Pass-through storage format
- **No Markdown Support**: Direct XML handling only
- **Basic Validation**: Well-formed XML checking
- **No Complex Macros**: Support basic structured macros only

## Build and Deployment

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext", 
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

### Package Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --exec ts-node --esm src/index.ts",
    "test": "basic tool validation"
  }
}
```

## Development Workflow

### Quick Implementation Process
1. **Tool Planning**: Define tool purpose and parameters
2. **API Mapping**: Map to Confluence REST API endpoint
3. **Implementation**: Create tool file with standard pattern
4. **Integration**: Register tool in main server
5. **Basic Testing**: Verify with simple API calls
6. **Documentation**: Update tool reference if needed

### Development Priority Order
1. **Page Management**: Core CRUD operations (create, update, delete)
2. **Page Discovery**: Search and content retrieval
3. **Space Operations**: Space listing for context
4. **Comment System**: Full comment management

## Integration Patterns

### MCP Client Configuration
```json
{
  "mcpServers": {
    "confluence-cloud": {
      "command": "confluence-cloud-mcp-server",
      "env": {
        "CONFLUENCE_SITE_NAME": "your-site.atlassian.net",
        "CONFLUENCE_API_TOKEN": "your-token"
      }
    }
  }
}
```

### AI Assistant Usage Examples
```
Human: Create a new page called "Project Overview" in the DEV space

AI Assistant: I'll help you create that page. Let me first get the DEV space ID, then create the page.
□ Use getSpaces to find the DEV space
□ Use createPage to create "Project Overview" page
□ Provide page URL for access

✅ Created page "Project Overview" in DEV space successfully!
```

```  
Human: Find all pages about "API documentation" and show me their content

AI Assistant: I'll search for API documentation pages and retrieve their content.
□ Use searchPages with title filter "API documentation"
□ Use getPageContent for each found page to get full content with labels
□ Format results for easy reading

Found 3 pages about API documentation with complete content and labels.
```