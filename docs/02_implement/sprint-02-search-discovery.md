# Sprint 2 - Search & Discovery + updatePage Enhancement

## 📋 Sprint Overview

**Duration**: 7 working days  
**Status**: 🚀 **Ready to Start**  
**Priority**: Fix updatePage conflicts + Add search capabilities  
**Goal**: 8 fully functional tools with enhanced error handling

---

## 🎯 Sprint Objectives

### Primary Goals
1. **🔥 CRITICAL**: Fix updatePage version conflict handling (HTTP 409 errors)
2. **🔍 NEW**: Implement searchPages tool for content discovery  
3. **📚 NEW**: Implement getPageVersions tool for version history
4. **🛡️ ENHANCE**: Standardize error handling across all tools

### Success Criteria
- ✅ updatePage tool works reliably with concurrent edits
- ✅ searchPages enables content discovery across spaces
- ✅ getPageVersions provides version history access  
- ✅ All 8 tools tested and validated with AI clients
- ✅ Error messages are consistent and actionable

---

## 🐛 Priority 1: Fix updatePage Tool

### Current Issue Analysis
**Problem**: HTTP 409 Conflict errors when updating pages
```
❌ Error updating page: MCP error -32603: Network error: MCP error -32603: API error 409: Request failed with status code 409
```

**Root Causes**:
1. **Version Mismatch**: Tool doesn't automatically get current version
2. **Concurrent Edits**: No handling for simultaneous updates
3. **User Experience**: Requires manual version management

### Proposed Solution

#### Enhanced updatePage Implementation
```typescript
async function updatePageHandler(params: any, wrapper: McpServerWrapper): Promise<any> {
  const { pageId, title, content, version: userVersion, versionMessage } = params;
  
  try {
    // 1. Auto-fetch current version if not provided
    let targetVersion = userVersion;
    if (!targetVersion) {
      logger.info(`Auto-fetching current version for page ${pageId}`);
      const currentPage = await wrapper.apiClient.getPageContent(pageId);
      targetVersion = currentPage.version.number + 1;
      logger.debug(`Using auto-detected version: ${targetVersion}`);
    }
    
    // 2. Implement retry logic for conflicts
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await wrapper.apiClient.updatePage(pageId, {
          title,
          content,
          version: targetVersion,
          versionMessage: versionMessage || 'Updated via MCP'
        });
        
        logger.info(`Page ${pageId} updated successfully on attempt ${attempt}`);
        return formatSuccessResponse(result);
        
      } catch (error) {
        if (error.response?.status === 409 && attempt < maxRetries) {
          logger.warn(`Version conflict on attempt ${attempt}, refreshing version...`);
          
          // Refresh version and retry
          const refreshedPage = await wrapper.apiClient.getPageContent(pageId);
          targetVersion = refreshedPage.version.number + 1;
          
          // Brief delay before retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }
        throw error;
      }
    }
    
  } catch (error) {
    return formatErrorResponse(error, pageId);
  }
}
```

#### Enhanced Error Handling
```typescript
function formatErrorResponse(error: any, pageId: string) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  if (error.response?.status === 409) {
    return {
      content: [{
        type: 'text',
        text: `❌ Version conflict updating page ${pageId}: The page was modified by someone else. The update has been automatically retried but still failed. Please try again.`
      }, {
        type: 'text', 
        text: `💡 Tip: The page may be actively being edited. Wait a moment and try again.`
      }],
      isError: true
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: `❌ Error updating page ${pageId}: ${errorMessage}`
    }],
    isError: true
  };
}
```

#### Updated Tool Schema
```typescript
const updatePageToolDefinition = {
  name: 'updatePage',
  description: 'Update title and/or content of an existing Confluence page with automatic version handling',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'ID of the page to update'
      },
      title: {
        type: 'string',
        description: 'New title for the page (optional if only updating content)'
      },
      content: {
        type: 'string', 
        description: 'New content in Confluence storage format (HTML-like)'
      },
      version: {
        type: 'number',
        description: 'Page version number (optional - will auto-detect if not provided)'
      },
      versionMessage: {
        type: 'string',
        description: 'Version comment/message (optional)'
      }
    },
    required: ['pageId']
  }
};
```

---

## 🔍 Priority 2: Implement searchPages Tool

### Functional Requirements
- Search pages across all accessible spaces
- Support title, content, and space-based filtering
- Pagination support for large result sets
- Clear, structured response format

### Implementation Plan

#### Tool Schema
```typescript
const searchPagesToolDefinition = {
  name: 'searchPages',
  description: 'Search for Confluence pages across spaces with advanced filtering',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (searches in title and content)'
      },
      spaceKey: {
        type: 'string',
        description: 'Limit search to specific space (optional)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 25, max: 100)',
        default: 25,
        minimum: 1,
        maximum: 100
      },
      sortBy: {
        type: 'string',
        enum: ['relevance', 'title', 'created', 'modified'],
        description: 'Sort order for results (default: relevance)'
      }
    },
    required: ['query']
  }
};
```

#### API Integration
```typescript
async searchPages(query: string, options: SearchOptions = {}): Promise<SearchResult> {
  const params = new URLSearchParams({
    cql: this.buildCQL(query, options),
    limit: options.limit?.toString() || '25',
    start: options.start?.toString() || '0'
  });
  
  const response = await this.client.get(`/search?${params}`);
  return this.formatSearchResults(response.data);
}

private buildCQL(query: string, options: SearchOptions): string {
  let cql = `type=page AND text~"${query}"`;
  
  if (options.spaceKey) {
    cql += ` AND space="${options.spaceKey}"`;
  }
  
  if (options.sortBy) {
    const sortMap = {
      relevance: 'score desc',
      title: 'title asc', 
      created: 'created desc',
      modified: 'lastmodified desc'
    };
    cql += ` ORDER BY ${sortMap[options.sortBy]}`;
  }
  
  return cql;
}
```

---

## 📚 Priority 3: Implement getPageVersions Tool  

### Functional Requirements
- List all versions of a specific page
- Include version metadata (author, date, message)
- Support pagination for pages with many versions
- Easy access to specific version content

### Implementation Plan

#### Tool Schema  
```typescript
const getPageVersionsToolDefinition = {
  name: 'getPageVersions',
  description: 'Get version history of a Confluence page with details',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'ID of the page to get version history for'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of versions to return (default: 10)',
        default: 10,
        minimum: 1,
        maximum: 50
      },
      includeContent: {
        type: 'boolean',
        description: 'Whether to include content of each version (default: false)',
        default: false
      }
    },
    required: ['pageId']
  }
};
```

#### API Integration
```typescript
async getPageVersions(pageId: string, limit: number = 10): Promise<PageVersions> {
  const response = await this.client.get(
    `/pages/${pageId}/versions?limit=${limit}&expand=version,author`
  );
  
  return {
    pageId,
    versions: response.data.results.map(version => ({
      number: version.version.number,
      author: version.version.by.displayName,
      authorId: version.version.by.accountId,
      createdAt: version.version.when,
      message: version.version.message || 'No message',
      minorEdit: version.version.minorEdit
    }))
  };
}
```

---

## 🧪 Testing Strategy

### Enhanced Test Suite
1. **updatePage Conflict Testing**
   - Simulate concurrent edit scenarios
   - Test auto-version detection
   - Verify retry logic works correctly

2. **Search Functionality Testing**  
   - Test various query types
   - Verify space filtering works
   - Test pagination and sorting

3. **Version History Testing**
   - Test with pages having multiple versions
   - Verify metadata accuracy
   - Test limit and pagination

### AI Client Validation
- Test all 8 tools with Cline
- Test with Claude Desktop
- Test with Cursor (if available)
- Document usage examples

---

## 📋 Task Breakdown

### Week 1 (Days 1-4)
- **Day 1**: Fix updatePage - implement auto version detection
- **Day 2**: Fix updatePage - add retry logic and testing  
- **Day 3**: Implement searchPages - API integration and tool handler
- **Day 4**: Implement searchPages - testing and refinement

### Week 2 (Days 5-7)  
- **Day 5**: Implement getPageVersions - API integration and tool handler
- **Day 6**: Enhanced error handling across all tools
- **Day 7**: Integration testing with AI clients and documentation

---

## 🎯 Definition of Done

### For Each Tool
- ✅ Implementation complete with proper error handling
- ✅ Tool schema documented and validated
- ✅ Unit tests pass (internal test suite)
- ✅ Integration tests pass (with real Confluence API)
- ✅ AI client validation successful
- ✅ User-friendly error messages
- ✅ Performance acceptable (< 5 second response time)

### For Sprint 2 Overall
- ✅ All 8 tools operational: createPage, getPageContent, updatePage, deletePage, getSpaces, searchPages, getPageVersions
- ✅ updatePage 409 conflicts resolved
- ✅ Comprehensive test coverage  
- ✅ AI client compatibility validated
- ✅ Documentation updated
- ✅ Ready for Sprint 3 (Comments system)

---

**Sprint Start**: TBD  
**Sprint End**: TBD  
**Sprint Goal**: Reliable CRUD + Search capabilities with 0 known critical issues