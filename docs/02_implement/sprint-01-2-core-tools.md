# Sprint 1.2: Core Page Tools

**Duration**: 3 working days (3MD)  
**Parent Sprint**: Sprint 1 - Foundation & Page Management (see [Project Roadmap](../01_plan/project-roadmap.md))  
**Status**: ✅ **Completed** - 2025-08-22  
**Prerequisites**: [Sprint 1.1 - Setup & Infrastructure](sprint-01-1-setup.md) ✅ **completed**

## Sub-Sprint Overview

### Objective
Implement the first 3 core page management tools: createPage, getPageContent, and updatePage.

### Focus Areas
- Page creation with Confluence storage format
- Page content retrieval with labels integration
- Page content and title modification

### Deliverables
- ✅ createPage tool: Create new pages in specified spaces
- ✅ getPageContent tool: Retrieve complete page information with labels  
- ✅ updatePage tool: Modify existing page title and content
- ⏳ All tools implemented (API testing pending)

## Task Breakdown

### Day 1: createPage Tool (1MD)

#### T1.2.1: Page Creation Tool
**Status**: 📋 **Not Started**  
**Estimate**: 1 day  
**Priority**: Critical  
**API**: `POST /api/v2/pages`

**Tasks**:
- 📋 Define tool schema with required parameters
- 📋 Implement API call to create pages
- 📋 Handle Confluence storage format content
- 📋 Add proper error handling for creation failures
- 📋 Test page creation in real Confluence space

**Implementation Reference**: 
- Tool pattern: [Implementation Guide - Standard Tool Structure](../../00_context/implementation-guide.md#standard-tool-structure)
- API mapping: [Implementation Guide - Tool-to-API Mapping](../../00_context/implementation-guide.md#tool-to-api-mapping) (createPage section)

**Acceptance Criteria**:
- 📋 Tool creates pages successfully in test space
- 📋 Content renders properly in Confluence UI
- 📋 Error handling for invalid space/parent IDs
- 📋 Proper response format for MCP client consumption

---

### Day 2: getPageContent Tool (1MD)

#### T1.2.2: Page Content Retrieval Tool
**Status**: 📋 **Not Started**  
**Estimate**: 1 day  
**Priority**: Critical  
**API**: `GET /api/v2/pages/{pageId}?body-format=storage`

**Tasks**:
- 📋 Implement API call to retrieve complete page data
- 📋 Include page labels in response
- 📋 Handle different body format options
- 📋 Format response for AI client consumption
- 📋 Test with pages containing various content types

**Implementation Reference**: 
- Tool pattern: [Implementation Guide - Standard Tool Structure](../../00_context/implementation-guide.md#standard-tool-structure)
- API mapping: [Implementation Guide - Tool-to-API Mapping](../../00_context/implementation-guide.md#tool-to-api-mapping) (getPageContent section)

**Acceptance Criteria**:
- 📋 Tool retrieves complete page data including content body
- 📋 Page labels included in response
- 📋 Different body formats work correctly
- 📋 Error handling for invalid page IDs
- 📋 Response format suitable for AI processing

---

### Day 3: updatePage Tool (1MD)

#### T1.2.3: Page Update Tool
**Status**: 📋 **Not Started**  
**Estimate**: 1 day  
**Priority**: Critical  
**API**: `PUT /api/v2/pages/{pageId}`

**Tasks**:
- 📋 Implement API call to update page content and title
- 📋 Handle version-based optimistic locking
- 📋 Support partial updates (title only, content only, or both)
- 📋 Add version conflict error handling
- 📋 Test page updates with various content modifications

**Implementation Reference**: 
- Tool pattern: [Implementation Guide - Standard Tool Structure](../../00_context/implementation-guide.md#standard-tool-structure)
- API mapping: [Implementation Guide - Tool-to-API Mapping](../../00_context/implementation-guide.md#tool-to-api-mapping) (updatePage section)

**Acceptance Criteria**:
- 📋 Tool updates pages successfully
- 📋 Version conflict detection and proper error messages
- 📋 Partial updates (title-only, content-only) work correctly
- 📋 Version increment handled properly
- 📋 Update messages tracked in page history

---

## Integration & Testing

### Tool Registration
All tools must be registered with the MCP server in `src/tools/confluence/index.ts`:

```typescript
// src/tools/confluence/index.ts
import { registerCreatePageTool } from './create-page.js';
import { registerGetPageContentTool } from './get-page-content.js';
import { registerUpdatePageTool } from './update-page.js';

export function registerCorePageTools(server: McpServerWrapper) {
  registerCreatePageTool(server);
  registerGetPageContentTool(server);  
  registerUpdatePageTool(server);
}
```

### Daily Validation
- **Day 1**: Create test pages in development Confluence space
- **Day 2**: Retrieve created pages with labels verification
- **Day 3**: Update test pages and verify version management

### Content Format Validation
See [Implementation Guide - Content Format Handling](../../00_context/implementation-guide.md#content-format-handling) for supported Confluence storage format examples and validation patterns.

## Error Handling Strategy

### Common Error Scenarios
- **401 Unauthorized**: Invalid API token
- **403 Forbidden**: Insufficient space permissions
- **404 Not Found**: Invalid space/page IDs
- **409 Conflict**: Version conflicts on updates
- **400 Bad Request**: Malformed content or missing required fields

### Error Response Format
See [Implementation Guide - Error Handling Strategy](../../00_context/implementation-guide.md#error-handling-strategy) for standardized error response patterns.

## Sub-Sprint Completion Criteria

- 📋 All 3 tools implemented and registered
- 📋 Tools tested with real Confluence API calls
- 📋 Error handling prevents server crashes
- 📋 Content format validation working
- 📋 Version management for updates operational

## Handoff to Sprint 1.3

### Deliverables Ready
- ✅ 3 core page tools: createPage, getPageContent, updatePage
- ✅ Storage format content handling
- ✅ Error handling patterns established
- ✅ API client extended with page operations

### Next Sub-Sprint
[Sprint 1.3 - Completion & Integration](sprint-01-3-completion.md) will add the remaining tools (deletePage, getSpaces) and complete Sprint 1 integration testing.

---

**Sub-Sprint Status**: ✅ **Completed**  
**Achievement**: All 3 core tools implemented and registered  
**Next Action**: Move to Sprint 1.3 - Complete remaining tools (deletePage, getSpaces)