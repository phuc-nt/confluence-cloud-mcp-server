# Sprint 3 - Comment Management Tools

## 📋 Sprint Overview

**Duration**: 4 working days  
**Status**: ✅ **COMPLETED** - All comment tools operational  
**Priority**: **HIGH** - Complete content collaboration capabilities  
**Goal**: ✅ Implemented comprehensive comment management for Confluence pages

### 🎯 Sprint Mission ✅ ACHIEVED
Added complete comment workflow capabilities to enable AI agents to:
- ✅ Read and analyze existing page discussions
- ✅ Participate in collaborative conversations  
- ✅ Manage comment threads effectively
- ✅ Support full content collaboration lifecycle

---

## 🎯 Sprint Objectives

### Primary Goals
1. **🗨️ NEW**: Implement getPageComments tool for reading page discussions
2. **➕ NEW**: Implement addComment tool for creating new comments
3. **✏️ NEW**: Implement updateComment tool for editing existing comments
4. **🗑️ NEW**: Implement deleteComment tool for removing comments
5. **🔗 INTEGRATION**: Ensure seamless workflow with existing page tools
6. **✅ VALIDATE**: Comprehensive testing with real comment scenarios

### Success Criteria ✅ ALL ACHIEVED
- ✅ All 4 comment tools operational and MCP-compliant
- ✅ Comments integrate with existing searchPages → getPageContent workflow
- ✅ Full CRUD operations on comments validated
- ✅ Thread management and replies working correctly
- ✅ Test suite includes comment workflow scenarios
- ✅ AI client validation with Cline demonstrates real-world usage

---

## 🛠️ Technical Architecture

### API Integration Strategy

**Comment API Endpoints (v2)** - ✅ **VALIDATED**:
```http
GET    /api/v2/pages/{pageId}/footer-comments        # getPageComments (✅ Working)
POST   /api/v2/footer-comments                       # addComment (✅ Working)  
PUT    /api/v2/footer-comments/{commentId}           # updateComment (✅ Working)
DELETE /api/v2/footer-comments/{commentId}           # deleteComment (✅ Working)
```

**Note**: Inline comments sử dụng endpoint tương tự nhưng với `/inline-comments`:
```http
GET    /api/v2/pages/{pageId}/inline-comments         # For inline/content comments
POST   /api/v2/inline-comments                        # For inline comment creation
```

**API Testing Results**:
- ✅ getPageComments: Returns paginated comment list with proper structure
- ✅ addComment: Creates comment and returns ID + version info  
- ✅ updateComment: Updates content and increments version number
- ✅ deleteComment: Removes comment completely (204 No Content)

**Request/Response Structures**:
```javascript
// addComment request body
{
  "pageId": "19464527",
  "body": {
    "representation": "storage", 
    "value": "<p>Test comment content</p>"
  }
}

// Comment response structure
{
  "id": "42663988",
  "body": {
    "storage": {
      "value": "<p>Test comment content</p>",
      "representation": "storage"
    }
  },
  "version": {
    "number": 1,
    "createdAt": "2024-08-24T..."
  },
  "pageId": "19464527",
  // ... other fields
}
```

### Data Flow Architecture
```
Search Page → Get Content → Get Comments → Add/Update/Delete Comments
     ↓              ↓             ↓                    ↓
searchPages  → getPageContent → getPageComments → comment CRUD
```

### Comment Data Structure
```typescript
interface Comment {
  id: string;
  body: string;
  authorId: string; 
  createdAt: string;
  parentId?: string;  // For replies
  version: {
    number: number;
    createdAt: string;
  };
  _links: {
    webui: string;
    self: string;
  };
}
```

---

## 📋 Implementation Plan

### Sprint 3.1 - Comment Reading (Day 1)
**Focus**: getPageComments tool implementation

#### Morning
- Research Confluence Comments API v2 endpoints
- Test API responses với real comment data
- Design comment data transformation logic

#### Afternoon  
- Implement getPageComments method trong ConfluenceApiClient
- Create comment tool handler với pagination support
- Add tool registration và routing

#### Evening
- Test getPageComments với pages có existing comments
- Validate response format và error handling
- Integration test với getPageContent workflow

### Sprint 3.2 - Comment Creation (Day 2) 
**Focus**: addComment tool implementation

#### Morning
- Research comment creation API requirements
- Test comment creation với various content formats
- Implement addComment API client method

#### Afternoon
- Create addComment tool handler
- Add support for reply comments (parentId)
- Handle comment content formatting

#### Evening
- Test comment creation scenarios
- Validate created comments via getPageComments
- Test reply thread functionality

### Sprint 3.3 - Comment Modification (Day 3)
**Focus**: updateComment và deleteComment tools

#### Morning
- Implement updateComment tool
- Research comment version management
- Test comment update scenarios

#### Afternoon  
- Implement deleteComment tool
- Handle comment deletion permissions
- Test comment removal và thread integrity

#### Evening
- Complete comment CRUD testing
- Validate full workflow: create → read → update → delete
- Integration testing với existing tools

### Sprint 3.4 - Testing & Validation (Day 4)
**Focus**: Comprehensive testing và AI client validation

#### Morning
- Update test suite với comment scenarios
- Create comprehensive comment workflow tests
- Test error handling và edge cases

#### Afternoon
- AI client testing với Cline
- Real-world usage scenarios validation
- Performance testing với large comment threads

#### Evening
- Documentation updates
- Sprint completion và quality gates validation
- Prepare for Sprint 4 planning

---

## 🧪 Testing Strategy

### Test Scenarios

#### 1. **Basic Comment Operations**
```javascript
// Test getPageComments
const comments = await testClient.callTool('getPageComments', { pageId });

// Test addComment  
const newComment = await testClient.callTool('addComment', {
  pageId,
  content: '<p>Test comment from MCP client</p>'
});

// Test updateComment
await testClient.callTool('updateComment', {
  commentId: newComment.id,
  content: '<p>Updated comment content</p>',
  version: newComment.version.number + 1
});

// Test deleteComment
await testClient.callTool('deleteComment', { commentId: newComment.id });
```

#### 2. **Thread Management**
```javascript
// Parent comment
const parentComment = await testClient.callTool('addComment', {
  pageId,
  content: '<p>Parent comment</p>'
});

// Reply comment
const replyComment = await testClient.callTool('addComment', {
  pageId, 
  content: '<p>Reply to parent</p>',
  parentId: parentComment.id
});

// Verify thread structure
const allComments = await testClient.callTool('getPageComments', { pageId });
```

#### 3. **Integration Workflow**
```javascript
// Complete workflow test
const searchResults = await testClient.callTool('searchPages', { query: 'Test' });
const pageId = searchResults.results[0].id;

const pageContent = await testClient.callTool('getPageContent', { pageId });
const comments = await testClient.callTool('getPageComments', { pageId });

const newComment = await testClient.callTool('addComment', {
  pageId,
  content: '<p>AI-generated analysis of page content</p>'
});
```

### Error Handling Tests
- Invalid pageId scenarios
- Permission denied cases  
- Comment not found errors
- Version conflict resolution
- Malformed content handling

---

## 🔗 Integration Patterns

### Pattern 1: **Content Analysis với Comments**
```typescript
// AI Agent workflow
const page = await callTool('getPageContent', { pageId });
const comments = await callTool('getPageComments', { pageId });

// Analyze content + comments
const analysis = analyzePageDiscussion(page.content, comments);

// Add AI insights
await callTool('addComment', {
  pageId,
  content: `<p>AI Analysis: ${analysis}</p>`
});
```

### Pattern 2: **Collaborative Review Workflow**  
```typescript
// Search for review pages
const reviewPages = await callTool('searchPages', { 
  query: 'code review',
  spaceKey: 'DEV' 
});

// Process each review
for (const page of reviewPages.results) {
  const comments = await callTool('getPageComments', { pageId: page.id });
  
  // Add review comments
  await callTool('addComment', {
    pageId: page.id,
    content: '<p>Automated review feedback...</p>'
  });
}
```

### Pattern 3: **Comment Moderation**
```typescript
// Get all comments
const comments = await callTool('getPageComments', { pageId });

// Review and moderate
for (const comment of comments.results) {
  if (needsModeration(comment.content)) {
    await callTool('updateComment', {
      commentId: comment.id,
      content: '<p>[Comment moderated by AI]</p>',
      version: comment.version.number + 1
    });
  }
}
```

---

## 🎯 Definition of Done

### Technical Requirements
- ✅ All 4 comment tools implemented với proper error handling
- ✅ Tools registered trong MCP server với correct schemas
- ✅ Comment CRUD operations working với real Confluence data
- ✅ Thread management (replies) functioning correctly
- ✅ Integration với existing page management tools validated

### Testing Requirements  
- ✅ Unit tests cho all comment operations pass
- ✅ Integration tests với full workflow scenarios pass
- ✅ Error handling tests cover edge cases
- ✅ Performance tests với large comment threads acceptable
- ✅ AI client validation với Cline demonstrates real usage

### Quality Gates
- ✅ Code compile và build successful
- ✅ Test suite 100% pass rate
- ✅ No regressions trong existing functionality
- ✅ Documentation updated với comment tool specifications
- ✅ Clean git commit với conventional format

### Integration Requirements
- ✅ Comments searchable via searchPages tool (if supported by API)
- ✅ Comment workflow integrates với page discovery patterns
- ✅ Response formats optimized cho AI client consumption
- ✅ Clear usage guidance trong tool descriptions
- ✅ Handles comment permissions và access control properly

---

## 🔗 Dependencies & Next Steps

**Prerequisites**: Sprint 2 completed (searchPages + getPageVersions operational)  
**Follows**: Sprint 4 - Labels & Attachments Management  
**Integration**: Enables complete content collaboration workflow

---

**Sprint 3 Goal**: Transform MCP server from content management to full collaboration platform với comprehensive comment capabilities, reaching 11/17 tools operational (65% complete).