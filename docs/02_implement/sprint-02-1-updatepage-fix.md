# Sprint 2.1 - Fix updatePage Version Conflicts

## 📋 Sub-Sprint Overview

**Duration**: 2 working days  
**Status**: 🚀 **Ready to Start**  
**Priority**: **CRITICAL** - Fix updatePage HTTP 409 conflicts  
**Goal**: Reliable updatePage tool with proper version handling

---

## 🎯 Sprint Objectives

### Primary Goals
1. **🔥 CRITICAL**: Enhance updatePage tool with retry logic for 409 conflicts
2. **🛡️ ROBUST**: Improve error handling with user-friendly messages
3. **✅ VALIDATE**: Update test suite to handle version conflicts
4. **📋 SIMPLE**: Keep version parameter required - no auto-detection

### Success Criteria
- ✅ updatePage tool handles HTTP 409 conflicts gracefully
- ✅ Clear error messages guide users to resolution
- ✅ Test suite validates conflict scenarios
- ✅ Tool works reliably in concurrent edit scenarios
- ✅ Maintains explicit version requirement (no auto-version)

---

## 🐛 Current Issue Analysis

### Problem Description
**Issue**: HTTP 409 Conflict errors when updating pages
```
❌ Error updating page: MCP error -32603: API error 409: Request failed with status code 409
```

**Root Causes**:
1. **Stale Version**: User provides outdated version number
2. **Concurrent Edits**: Page modified between getPageVersions and updatePage calls
3. **Poor UX**: Cryptic error messages don't guide resolution

### Test Results from Sprint 1
- ✅ **Works**: In controlled test environment with sequential operations
- ❌ **Fails**: With real AI client when concurrent edits occur
- 🎯 **Need**: Better conflict resolution and user guidance

---

## 🔧 Technical Solution

### Enhanced updatePage Implementation

#### Core Enhancement Strategy
```typescript
async function updatePageHandler(params: any, wrapper: McpServerWrapper): Promise<any> {
  const { pageId, title, content, version: userVersion, versionMessage } = params;
  
  // Validate required parameters
  if (!pageId || !userVersion) {
    throw new Error('Both pageId and version are required');
  }

  if (!title && !content) {
    throw new Error('At least title or content must be provided for update');
  }

  try {
    // Implement retry logic for version conflicts
    const maxRetries = 3;
    let currentVersion = userVersion;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await wrapper.apiClient.updatePage(pageId, {
          id: pageId,
          title,
          content,
          version: currentVersion,
          versionMessage: versionMessage || 'Updated via MCP'
        });
        
        logger.info(`Page ${pageId} updated successfully on attempt ${attempt}`);
        return formatSuccessResponse(result, attempt > 1);
        
      } catch (error) {
        if (isVersionConflict(error) && attempt < maxRetries) {
          logger.warn(`Version conflict on attempt ${attempt}, will refresh and retry...`);
          
          // Get fresh version number for retry
          const freshVersions = await wrapper.apiClient.getPageVersions(pageId, 1);
          currentVersion = freshVersions.results[0].number + 1;
          
          // Brief exponential backoff
          await sleep(100 * attempt);
          continue;
        }
        
        // Final attempt failed or non-version error
        throw error;
      }
    }
  } catch (error) {
    return formatErrorResponse(error, pageId, userVersion);
  }
}
```

#### Enhanced Error Handling
```typescript
function formatErrorResponse(error: any, pageId: string, attemptedVersion: number) {
  if (isVersionConflict(error)) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Version conflict: Page ${pageId} was modified by someone else`
        },
        {
          type: 'text', 
          text: `🔄 Your version: ${attemptedVersion} is outdated. Page has been updated.`
        },
        {
          type: 'text',
          text: `💡 Solution: Use getPageVersions to get current version, then retry updatePage`
        },
        {
          type: 'text',
          text: `⚠️  Warning: Review current content before updating to avoid overwriting changes`
        }
      ],
      isError: true
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: `❌ Error updating page ${pageId}: ${error.message || 'Unknown error'}`
    }],
    isError: true
  };
}

function isVersionConflict(error: any): boolean {
  return error.response?.status === 409 || 
         error.message?.includes('version') ||
         error.message?.includes('conflict');
}
```

#### Updated Tool Schema (No Auto-Version)
```typescript
export const updatePageToolDefinition = {
  name: 'updatePage',
  description: 'Update title and/or content of an existing Confluence page. Requires explicit version number to prevent conflicts. Use getPageVersions to get current version first.',
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
        description: 'Current page version number (required). Get from getPageVersions tool.'
      },
      versionMessage: {
        type: 'string',
        description: 'Optional message describing the changes made'
      }
    },
    required: ['pageId', 'version'] // Keep version required
  }
};
```

---

## 🧪 Enhanced Test Strategy

### Test Cases for Version Conflicts

#### 1. **Sequential Update Test**
```javascript
// Test normal operation
const versions = await testClient.callTool('getPageVersions', { pageId });
const currentVersion = versions.results[0].number;

const result = await testClient.callTool('updatePage', {
  pageId,
  content: 'Updated content',
  version: currentVersion + 1
});
// Should succeed
```

#### 2. **Stale Version Test**
```javascript
// Test with outdated version
const result = await testClient.callTool('updatePage', {
  pageId,
  content: 'Updated content',
  version: 1 // Intentionally old version
});
// Should fail with helpful error message
```

#### 3. **Concurrent Edit Simulation**
```javascript
// Simulate concurrent edits
const promise1 = testClient.callTool('updatePage', { pageId, version: currentVersion + 1 });
const promise2 = testClient.callTool('updatePage', { pageId, version: currentVersion + 1 });

// One should succeed, one should fail with conflict message
```

### Test Suite Updates
- Update `test-client/tools-test.js` with conflict scenarios
- Add retry logic validation
- Test error message clarity and actionability

---

## 📋 Implementation Tasks

### Day 1: Core Enhancement
1. **Morning**: Implement enhanced updatePage with retry logic
2. **Afternoon**: Implement improved error handling and messages
3. **Evening**: Update tool schema and registration

### Day 2: Testing & Validation  
1. **Morning**: Update test suite with conflict scenarios
2. **Afternoon**: Run comprehensive testing (connection + tools)
3. **Evening**: Document changes and validate with real scenarios

---

## 🎯 Definition of Done

### Technical Requirements
- ✅ updatePage handles 409 conflicts with retry logic (max 3 attempts)
- ✅ Clear, actionable error messages for version conflicts
- ✅ Version parameter remains required (no auto-detection)
- ✅ Exponential backoff between retry attempts
- ✅ Logging for troubleshooting concurrent edit scenarios

### Testing Requirements
- ✅ All existing tests continue to pass
- ✅ New conflict scenario tests pass
- ✅ Error message validation tests pass
- ✅ Real-world concurrent edit testing successful

### Documentation Requirements
- ✅ Tool description updated with usage guidance
- ✅ Error handling documented with examples
- ✅ Testing approach documented for future reference

---

## 🔗 Next Steps

**Upon Completion**: Move to [Sprint 2.2 - getPageVersions Tool](sprint-02-2-get-page-versions.md)

**Dependencies**: None - can start immediately
**Blockers**: None identified

---

**Sprint 2.1 Goal**: Reliable updatePage tool that handles version conflicts gracefully while maintaining explicit version control requirements.