# Sprint 2.2 - Implement getPageVersions Tool

## 📋 Sub-Sprint Overview

**Duration**: 2 working days  
**Status**: ✅ **COMPLETED** - Implementation và testing thành công  
**Priority**: **HIGH** - Enable version discovery for updatePage workflows  
**Goal**: Version history metadata tool for page management

### 🎉 Completion Summary
- ✅ getPageVersions API method implemented trong ConfluenceApiClient
- ✅ MCP tool handler với comprehensive error handling  
- ✅ Tool registration trong routing system
- ✅ Integration test thành công (version progression v2→v3)
- ✅ AI client validation với Cline (page 19464527 → v4)
- ✅ Production ready với 6 tools total

---

## 🎯 Sprint Objectives

### Primary Goals
1. **📚 NEW**: Implement getPageVersions tool for version history metadata
2. **🔗 INTEGRATION**: Support updatePage workflow with version discovery
3. **⚡ PERFORMANCE**: Lightweight metadata-only responses
4. **✅ VALIDATE**: Comprehensive testing with real page versions

### Success Criteria
- ✅ getPageVersions returns version history metadata (no content)
- ✅ Supports pagination for pages with many versions
- ✅ Clear, structured response format for AI clients
- ✅ Integration with updatePage workflow validated
- ✅ Test suite covers various version scenarios

---

## 🛠️ Technical Specification

### API Integration Discovery

Based on curl testing with page `19464527`:
```http
GET /api/v2/pages/{pageId}/versions?limit={limit}
```

**Response Structure**:
```json
{
  "results": [
    {
      "number": 3,
      "message": "",
      "minorEdit": false,
      "authorId": "557058:24acce7b-a0c1-4f45-97f1-7eb4afd2ff5f",
      "createdAt": "2025-05-15T11:20:11.735Z",
      "page": {
        "title": "Test Page 5/15/2025, 6:20:07 PM (Title Updated)",
        "id": "19464527"
      }
    }
  ],
  "_links": {
    "base": "https://phuc-nt.atlassian.net/wiki"
  }
}
```

### Tool Implementation

#### Confluence API Client Enhancement
```typescript
// Add to src/utils/confluence-api.ts
async getPageVersions(pageId: string, limit: number = 10): Promise<PageVersionsResult> {
  try {
    this.logger.info(`Retrieving version history for page: ${pageId}`);
    const response = await this.client.get(`/pages/${pageId}/versions?limit=${limit}`);
    
    // Transform to user-friendly format
    return {
      pageId,
      versions: response.data.results.map(version => ({
        number: version.number,
        author: {
          id: version.authorId,
          displayName: version.page?.title || 'Unknown User' // Will get from user API if needed
        },
        createdAt: version.createdAt,
        message: version.message || 'No message provided',
        minorEdit: version.minorEdit || false,
        pageTitle: version.page?.title
      })),
      totalCount: response.data.results.length,
      hasMore: !!response.data._links?.next
    };
  } catch (error) {
    throw ErrorHandler.handleApiError(error);
  }
}
```

#### MCP Tool Handler
```typescript
// Create src/tools/confluence/get-page-versions.ts
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
    const versionsData = await wrapper.apiClient.getPageVersions(pageId, limit);

    logger.info(`Retrieved ${versionsData.versions.length} versions for page ${pageId}`);

    return {
      content: [
        {
          type: 'text',
          text: `📚 Version History for Page ${pageId}`,
        },
        {
          type: 'text',
          text: `📊 Found ${versionsData.versions.length} versions (showing latest ${limit})`,
        },
        {
          type: 'text',
          text: `📋 Version Details:`,
        },
        ...versionsData.versions.map(version => ({
          type: 'text',
          text: `  • Version ${version.number} - ${version.createdAt} by ${version.author.displayName}${version.message ? ` - "${version.message}"` : ''}`
        })),
        {
          type: 'text',
          text: `💡 Usage: Use version number with updatePage tool (e.g., version: ${versionsData.versions[0]?.number + 1})`
        },
        {
          type: 'text',
          text: `🔍 Note: For historical content, use getPageContent with version parameter`
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
```

#### Tool Registration Schema
```typescript
export const getPageVersionsToolDefinition = {
  name: 'getPageVersions',
  description: 'Get version history metadata for a Confluence page. Returns version numbers, authors, dates, and messages. Use this before updatePage to get current version number, or to explore page edit history.',
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
```

---

## 🔗 Integration Patterns

### Pattern 1: **Version-Controlled Update**
```typescript
// AI Client Workflow:
// 1. Get current version
const versions = await callTool('getPageVersions', { pageId });
const currentVersion = versions[0].number;

// 2. Update with explicit version  
await callTool('updatePage', {
  pageId,
  content: 'New content',
  version: currentVersion + 1
});
```

### Pattern 2: **Version History Exploration**
```typescript
// AI Client Workflow:
// Human: "Who edited this page recently?"
const versions = await callTool('getPageVersions', { pageId, limit: 5 });
// Shows recent editors and timestamps
```

### Pattern 3: **Version Comparison Setup**
```typescript
// AI Client Workflow:
// 1. Get available versions
const versions = await callTool('getPageVersions', { pageId });

// 2. Get specific version content for comparison
const v2Content = await callTool('getPageContent', { pageId, version: 2 });
const v5Content = await callTool('getPageContent', { pageId, version: 5 });
```

---

## 🧪 Testing Strategy

### Test Cases

#### 1. **Basic Version Retrieval**
```javascript
const result = await testClient.callTool('getPageVersions', {
  pageId: '19464527' // Test page with known versions
});

// Validate response structure
expect(result.versions).toBeDefined();
expect(result.versions[0]).toHaveProperty('number');
expect(result.versions[0]).toHaveProperty('author');
expect(result.versions[0]).toHaveProperty('createdAt');
```

#### 2. **Pagination Testing**
```javascript
// Test limit parameter
const limited = await testClient.callTool('getPageVersions', {
  pageId: '19464527',
  limit: 2
});

expect(limited.versions.length).toBeLessThanOrEqual(2);
```

#### 3. **Integration with updatePage**
```javascript
// Test workflow integration
const versions = await testClient.callTool('getPageVersions', { pageId: testPageId });
const nextVersion = versions.versions[0].number + 1;

const updateResult = await testClient.callTool('updatePage', {
  pageId: testPageId,
  content: 'Updated via version workflow',
  version: nextVersion
});

expect(updateResult.success).toBe(true);
```

#### 4. **Error Handling**
```javascript
// Test invalid page ID
const result = await testClient.callTool('getPageVersions', {
  pageId: 'invalid-page-id'
});

expect(result.isError).toBe(true);
expect(result.content[0].text).toContain('Error');
```

### Test Suite Integration
- Add `getPageVersions` tests to `test-client/tools-test.js`
- Test with real page having multiple versions
- Validate response format consistency
- Test pagination edge cases

---

## 📋 Implementation Tasks

### Day 1: Core Implementation
1. **Morning**: Add getPageVersions method to ConfluenceApiClient
2. **Afternoon**: Implement tool handler and response formatting
3. **Evening**: Register tool and update main index

### Day 2: Testing & Integration
1. **Morning**: Create comprehensive test cases
2. **Afternoon**: Test integration with updatePage workflow
3. **Evening**: Document usage patterns and validate with real scenarios

---

## 🎯 Definition of Done

### Technical Requirements
- ✅ getPageVersions API client method implemented
- ✅ MCP tool handler with proper error handling
- ✅ Tool registered in main server index
- ✅ Pagination support (limit parameter)
- ✅ User-friendly response formatting

### Testing Requirements
- ✅ Basic version retrieval tests pass
- ✅ Pagination functionality validated
- ✅ Integration with updatePage workflow tested
- ✅ Error handling scenarios covered
- ✅ Test with real Confluence page having multiple versions

### Integration Requirements
- ✅ Tool works seamlessly with updatePage for version-controlled updates
- ✅ Response format optimized for AI client consumption
- ✅ Clear guidance in tool description for proper usage
- ✅ Performance acceptable for typical version history sizes

---

## 🔗 Dependencies & Next Steps

**Prerequisites**: Sprint 2.1 (updatePage fix) completed
**Next**: [Sprint 2.3 - searchPages Tool](sprint-02-3-search-pages.md)
**Integration**: Enables reliable updatePage workflows with version discovery

---

**Sprint 2.2 Goal**: Version history discovery tool that enables safe, version-controlled page updates and supports page history exploration.