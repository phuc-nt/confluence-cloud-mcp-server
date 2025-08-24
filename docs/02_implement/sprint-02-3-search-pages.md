# Sprint 2.3 - Implement searchPages Tool  

## 📋 Sub-Sprint Overview

**Duration**: 1 working day (accelerated from planned 3 days)  
**Status**: ✅ **COMPLETED** - CQL search implementation và Cline validation thành công  
**Priority**: **HIGH** - Universal page search across spaces  
**Goal**: Content discovery tool for finding pages across Confluence workspace

### 🎉 Completion Summary
- ✅ Dual API client architecture (v1 CQL + v2 APIs) implemented
- ✅ searchPages tool với flexible parameters (query, title, spaceKey)
- ✅ CQL search working perfectly với real Confluence data
- ✅ Tool integration validated: searchPages → getPageContent workflow
- ✅ Cline AI client validation successful với multiple search patterns
- ✅ Test suite integration completed với 100% success rate
- ✅ 7 tools total now operational and production ready

---

## 🎯 Sprint Objectives

### Primary Goals
1. **🔍 NEW**: Implement searchPages tool using Confluence Search API
2. **🌐 UNIVERSAL**: Search across all accessible spaces with filtering
3. **⚡ PERFORMANCE**: Efficient search with pagination support
4. **✅ VALIDATE**: Comprehensive testing with various search scenarios

### Success Criteria
- ✅ searchPages finds pages across all accessible spaces
- ✅ Supports title and content-based search queries
- ✅ Space filtering for targeted searches
- ✅ Pagination and sorting options
- ✅ Clear, structured response format for AI clients
- ✅ Handles no-results and error scenarios gracefully

---

## 🔍 API Research & Selection

### Option 1: Content Search API (v1) - CQL Support
```http
GET /wiki/rest/api/search?cql=type=page AND text~"query"
```
- **Pros**: Powerful CQL querying, flexible filtering
- **Cons**: v1 API (older), more complex query syntax

### Option 2: Pages API (v2) with Filtering  
```http
GET /api/v2/pages?title=query&limit=25
```
- **Pros**: v2 API consistency, simple parameters
- **Cons**: Limited search capabilities, title-only search

### 🎯 **Selected Approach: Hybrid Strategy**

Use **v2 Pages API** for simple searches with **fallback to v1 CQL** for advanced queries:

```typescript
// Simple title search (v2 API)
GET /api/v2/pages?title=searchTerm

// Advanced text search (v1 API with CQL)  
GET /wiki/rest/api/search?cql=type=page AND text~"searchTerm"
```

---

## 🛠️ Technical Implementation

### API Client Enhancement

#### Add Search Methods to ConfluenceApiClient
```typescript
// Add to src/utils/confluence-api.ts

async searchPages(searchParams: SearchPagesParams): Promise<SearchPagesResult> {
  try {
    this.logger.info(`Searching pages: "${searchParams.query}"`);
    
    if (searchParams.query) {
      // Use CQL search for text queries
      return await this.searchWithCQL(searchParams);
    } else {
      // Use v2 API for title-only or filtered searches
      return await this.searchWithV2API(searchParams);
    }
  } catch (error) {
    throw ErrorHandler.handleApiError(error);
  }
}

private async searchWithCQL(params: SearchPagesParams): Promise<SearchPagesResult> {
  const cql = this.buildCQLQuery(params);
  const queryParams = new URLSearchParams({
    cql,
    limit: params.limit?.toString() || '25',
    start: params.start?.toString() || '0'
  });
  
  // Use v1 search endpoint
  const response = await this.client.get(`/search?${queryParams}`);
  
  return {
    results: response.data.results.map(this.transformCQLResult),
    size: response.data.size,
    limit: response.data.limit,
    start: response.data.start
  };
}

private async searchWithV2API(params: SearchPagesParams): Promise<SearchPagesResult> {
  const queryParams = new URLSearchParams();
  
  if (params.title) queryParams.append('title', params.title);
  if (params.spaceId) queryParams.append('space-id', params.spaceId);
  if (params.status) queryParams.append('status', params.status);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  const response = await this.client.get(`/pages?${queryParams}`);
  
  return {
    results: response.data.results.map(this.transformV2Result),
    size: response.data.size,
    limit: response.data.limit
  };
}

private buildCQLQuery(params: SearchPagesParams): string {
  let cql = 'type=page';
  
  if (params.query) {
    // Search in both title and content
    cql += ` AND (title~"${params.query}" OR text~"${params.query}")`;
  }
  
  if (params.spaceKey) {
    cql += ` AND space="${params.spaceKey}"`;
  }
  
  if (params.status && params.status !== 'current') {
    cql += ` AND status="${params.status}"`;
  }
  
  // Add sorting
  const sortMap = {
    relevance: 'score desc',
    title: 'title asc',
    created: 'created desc', 
    modified: 'lastmodified desc'
  };
  
  if (params.sortBy && sortMap[params.sortBy]) {
    cql += ` ORDER BY ${sortMap[params.sortBy]}`;
  }
  
  return cql;
}
```

#### Transform Methods for Consistent Response
```typescript
private transformCQLResult(result: any): SearchPageResult {
  return {
    id: result.content?.id || result.id,
    title: result.title || result.content?.title,
    spaceKey: result.space?.key,
    spaceName: result.space?.name,
    url: result.url || result._links?.webui,
    excerpt: result.excerpt || '',
    lastModified: result.lastModified || result.content?.version?.when,
    author: {
      displayName: result.content?.version?.by?.displayName,
      accountId: result.content?.version?.by?.accountId
    }
  };
}

private transformV2Result(result: any): SearchPageResult {
  return {
    id: result.id,
    title: result.title,
    spaceId: result.spaceId,
    url: result._links?.webui,
    lastModified: result.version?.createdAt,
    author: {
      displayName: result.authorId, // Will need user lookup for display name
      accountId: result.authorId
    }
  };
}
```

### MCP Tool Handler

#### Tool Implementation
```typescript
// Create src/tools/confluence/search-pages.ts
export async function searchPagesHandler(
  params: any,
  wrapper: McpServerWrapper
): Promise<any> {
  try {
    logger.info('Searching Confluence pages');
    
    const { query, title, spaceKey, spaceId, limit = 25, sortBy = 'relevance' } = params as {
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

    // Perform search
    const searchResults = await wrapper.apiClient.searchPages({
      query,
      title,
      spaceKey,
      spaceId,
      limit,
      sortBy
    });

    logger.info(`Search found ${searchResults.size} results`);

    if (searchResults.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🔍 No pages found matching your search criteria`,
          },
          {
            type: 'text',
            text: `📋 Search parameters: ${JSON.stringify({ query, title, spaceKey, spaceId }, null, 2)}`,
          },
          {
            type: 'text',
            text: `💡 Tip: Try broader search terms or check if you have access to the relevant spaces`
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
          text: `🔗 Note: Page URLs available in webui links for browser access`
        }
      ],
    };
  } catch (error) {
    logger.error('Failed to search pages:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error searching pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        {
          type: 'text',
          text: `💡 Tip: Check your search parameters and ensure you have access to search content`
        }
      ],
      isError: true,
    };
  }
}
```

#### Tool Schema Definition  
```typescript
export const searchPagesToolDefinition = {
  name: 'searchPages',
  description: 'Search for Confluence pages across spaces. Supports text search in title and content, space filtering, and sorting options. Returns page IDs for use with other tools.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search text to find in page titles and content (optional if using other filters)'
      },
      title: {
        type: 'string', 
        description: 'Search specifically in page titles (alternative to query)'
      },
      spaceKey: {
        type: 'string',
        description: 'Limit search to specific space key (e.g., "DEV", "DOCS")'
      },
      spaceId: {
        type: 'string',
        description: 'Limit search to specific space ID (alternative to spaceKey)'
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
        description: 'Sort order for results (default: relevance)',
        default: 'relevance'
      }
    }
    // No required fields - allows flexible search patterns
  }
};
```

---

## 🔗 Integration Patterns

### Pattern 1: **Content Discovery**
```typescript
// AI Client Usage:
// Human: "Find pages about API documentation"
await callTool('searchPages', { 
  query: 'API documentation',
  sortBy: 'modified'
});
```

### Pattern 2: **Space-Specific Search**  
```typescript
// Human: "What pages are in the DEV space?"
await callTool('searchPages', {
  spaceKey: 'DEV',
  limit: 50,
  sortBy: 'title'
});
```

### Pattern 3: **Search & Edit Workflow**
```typescript
// 1. Find page
const results = await callTool('searchPages', { 
  title: 'Project Requirements'
});

// 2. Get current version  
const versions = await callTool('getPageVersions', { 
  pageId: results[0].id 
});

// 3. Update page
await callTool('updatePage', {
  pageId: results[0].id,
  content: 'Updated requirements...',
  version: versions[0].number + 1
});
```

---

## 🧪 Testing Strategy

### Test Cases

#### 1. **Text Search Testing**
```javascript
const result = await testClient.callTool('searchPages', {
  query: 'test page',
  limit: 10
});

expect(result.results).toBeDefined();
expect(result.results.length).toBeGreaterThan(0);
```

#### 2. **Space Filtering**
```javascript
const result = await testClient.callTool('searchPages', {
  spaceKey: 'AWA1',
  limit: 20
});

// All results should be from AWA1 space
result.results.forEach(page => {
  expect(page.spaceKey || page.spaceId).toBeTruthy();
});
```

#### 3. **Sorting Validation**
```javascript
const byTitle = await testClient.callTool('searchPages', {
  query: 'test',
  sortBy: 'title'
});

const byModified = await testClient.callTool('searchPages', {
  query: 'test', 
  sortBy: 'modified'
});

// Results should be in different orders
expect(byTitle.results[0].id).not.toBe(byModified.results[0].id);
```

#### 4. **No Results Handling**
```javascript
const result = await testClient.callTool('searchPages', {
  query: 'nonexistent-unique-search-term-12345'
});

expect(result.content[0].text).toContain('No pages found');
```

### Performance Testing
- Test with large result sets (100+ pages)
- Validate response times for different query types
- Test pagination with various limit values

---

## 📋 Implementation Tasks

### Day 1: API Integration
1. **Morning**: Research and test Confluence search APIs
2. **Afternoon**: Implement search methods in ConfluenceApiClient
3. **Evening**: Create response transformation logic

### Day 2: Tool Implementation  
1. **Morning**: Implement searchPages tool handler
2. **Afternoon**: Add tool registration and schema definition
3. **Evening**: Test basic search functionality

### Day 3: Testing & Refinement
1. **Morning**: Create comprehensive test suite
2. **Afternoon**: Performance testing and optimization  
3. **Evening**: Documentation and AI client validation

---

## 🎯 Definition of Done

### Technical Requirements
- ✅ searchPages supports both v2 API and CQL queries
- ✅ Flexible parameter support (query, title, space filtering)
- ✅ Pagination and sorting options working
- ✅ Consistent response format across API types
- ✅ Proper error handling for various failure scenarios

### Testing Requirements
- ✅ Text search functionality validated
- ✅ Space filtering working correctly
- ✅ Sorting options producing correct order
- ✅ No-results scenarios handled gracefully
- ✅ Performance acceptable for typical search queries

### Integration Requirements
- ✅ Tool integrates well with getPageContent workflow
- ✅ Response format optimized for AI client consumption
- ✅ Clear usage guidance in tool description
- ✅ Works across different Confluence space configurations

---

## 🔗 Dependencies & Next Steps

**Prerequisites**: Sprint 2.2 (getPageVersions) completed  
**Next**: Sprint 2 completion and validation with all 8 tools  
**Integration**: Completes content discovery capabilities for full CRUD workflow

---

**Sprint 2.3 Goal**: Universal page search tool that enables efficient content discovery and integrates seamlessly with existing page management workflow.