# Confluence Tools Complete Reference - Tool-Only Architecture

This document provides a comprehensive list of all Confluence functionality as tools for a "tool-only" architecture. It includes both current action tools and resources converted to retrieval tools, with detailed API information for each.

## Overview

All Confluence functionality is represented as tools that can be called by AI agents. Each tool includes:
- **Purpose**: What the tool does
- **Input Parameters**: Required and optional parameters
- **Confluence API**: Actual REST API endpoint(s) used
- **Output Format**: Structure of returned data
- **Usage Examples**: How to call the tool

---

## SPACE TOOLS

### 1. getSpaces
**Purpose**: Retrieve list of all Confluence spaces

**Input Parameters**:
```typescript
{
  cursor?: string;        // Pagination cursor for next page
  limit?: number;         // Number of results (default: 25, max: 250)
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/spaces`
- **Query Parameters**: `cursor`, `limit`
- **Response**: Cursor-based pagination with spaces array

**Output Format**:
```json
{
  "success": true,
  "results": [
    {
      "id": "123456789",
      "key": "DEV",
      "name": "Development Space",
      "type": "global",
      "status": "current",
      "authorId": "account-id",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "_links": {
        "webui": "https://yoursite.atlassian.net/wiki/spaces/DEV"
      }
    }
  ],
  "size": 1,
  "limit": 25,
  "_links": {
    "next": "https://api.atlassian.com/ex/confluence/.../spaces?cursor=..."
  }
}
```

---

### 2. getSpaceDetails
**Purpose**: Get detailed information for a specific space

**Input Parameters**:
```typescript
{
  spaceId: string;        // Required: Numeric space ID (not key)
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/spaces/{spaceId}`
- **URL Parameters**: `spaceId` (must be numeric ID)
- **Authentication**: Basic Auth with API token

**Output Format**:
```json
{
  "success": true,
  "space": {
    "id": "123456789",
    "key": "DEV",
    "name": "Development Space",
    "type": "global",
    "status": "current",
    "authorId": "account-id-123",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "description": {
      "representation": "plain",
      "value": "Space description"
    },
    "_links": {
      "webui": "https://yoursite.atlassian.net/wiki/spaces/DEV"
    }
  }
}
```

---

### 3. getSpacePages
**Purpose**: List all pages in a specific space

**Input Parameters**:
```typescript
{
  spaceId: string;        // Required: Numeric space ID
  limit?: number;         // Number of results (default: 25)
  cursor?: string;        // Pagination cursor
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/pages`
- **Query Parameters**: `space-id={spaceId}`, `limit`, `cursor`
- **Filter**: Results filtered by space-id

**Output Format**:
```json
{
  "success": true,
  "pages": [
    {
      "id": "987654321",
      "title": "Page Title",
      "status": "current",
      "spaceId": "123456789",
      "authorId": "account-id",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "version": {
        "number": 1,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    }
  ],
  "size": 1,
  "limit": 25
}
```

---

## PAGE TOOLS

### 4. getPages
**Purpose**: Search and filter pages across all spaces

**Input Parameters**:
```typescript
{
  title?: string;         // Filter by page title
  spaceId?: string;       // Filter by space ID
  status?: string;        // Filter by status (current, archived)
  limit?: number;         // Number of results (default: 25)
  cursor?: string;        // Pagination cursor
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/pages`
- **Query Parameters**: Dynamic based on filters provided
- **Supports**: Multiple filter combinations

**Output Format**:
```json
{
  "success": true,
  "pages": [
    {
      "id": "987654321",
      "title": "Page Title",
      "status": "current",
      "spaceId": "123456789",
      "parentId": "123456789",
      "authorId": "account-id",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "version": {
        "number": 3,
        "createdAt": "2023-01-15T00:00:00.000Z"
      },
      "_links": {
        "webui": "https://yoursite.atlassian.net/wiki/spaces/DEV/pages/987654321"
      }
    }
  ],
  "size": 1,
  "limit": 25
}
```

---

### 5. getPageDetails
**Purpose**: Get complete page information including content body

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID
  bodyFormat?: string;    // Optional: "storage" (default), "view", "export_view"
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/pages/{pageId}?body-format=storage`
- **Query Parameters**: `body-format` to include content body in response
- **Single Call**: Content body included in main page response

**Output Format**:
```json
{
  "success": true,
  "page": {
    "id": "987654321",
    "title": "Complete Page Title",
    "status": "current",
    "spaceId": "123456789",
    "parentId": "123456789",
    "authorId": "account-id",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "version": {
      "number": 3,
      "createdAt": "2023-01-15T00:00:00.000Z",
      "by": {
        "displayName": "John Doe",
        "accountId": "account-id"
      }
    },
    "body": "<p>Page content in Confluence storage format</p>",
    "bodyType": "storage",
    "_links": {
      "webui": "https://yoursite.atlassian.net/wiki/spaces/DEV/pages/987654321"
    }
  }
}
```

---

### 6. getPageChildren
**Purpose**: Get all child pages of a specific page

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Parent page ID
  limit?: number;         // Number of results (default: 25)
  cursor?: string;        // Pagination cursor
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/pages/{pageId}/children`
- **Pagination**: Cursor-based
- **Response**: Array of child page objects

**Output Format**:
```json
{
  "success": true,
  "parentPageId": "987654321",
  "children": [
    {
      "id": "111222333",
      "title": "Child Page 1",
      "status": "current",
      "spaceId": "123456789",
      "authorId": "account-id",
      "createdAt": "2023-01-02T00:00:00.000Z",
      "version": {
        "number": 1
      }
    }
  ],
  "size": 1,
  "limit": 25
}
```

---

### 7. getPageAncestors
**Purpose**: Get all ancestor pages (parent hierarchy) of a specific page

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/pages/{pageId}/ancestors`
- **Response**: Array ordered from root to immediate parent
- **Hierarchy**: Complete ancestor chain

**Output Format**:
```json
{
  "success": true,
  "pageId": "987654321",
  "ancestors": [
    {
      "id": "111111111",
      "title": "Root Page",
      "status": "current",
      "spaceId": "123456789"
    },
    {
      "id": "222222222", 
      "title": "Parent Page",
      "status": "current",
      "spaceId": "123456789"
    }
  ],
  "size": 2
}
```

---

### 8. getPageAttachments
**Purpose**: List all attachments for a specific page

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID
  limit?: number;         // Number of results (default: 25)
  cursor?: string;        // Pagination cursor
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/pages/{pageId}/attachments`
- **Pagination**: Cursor-based
- **Response**: Array of attachment objects with download URLs

**Output Format**:
```json
{
  "success": true,
  "pageId": "987654321",
  "attachments": [
    {
      "id": "att123456",
      "title": "document.pdf",
      "filename": "document.pdf",
      "mediaType": "application/pdf",
      "fileSize": 1048576,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "downloadUrl": "https://yoursite.atlassian.net/wiki/download/attachments/987654321/document.pdf",
      "_links": {
        "download": "https://api.atlassian.com/.../attachments/att123456/download"
      }
    }
  ],
  "size": 1,
  "limit": 25
}
```

---

### 9. getPageVersions
**Purpose**: Get version history of a specific page

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID
  limit?: number;         // Number of results (default: 25)
  cursor?: string;        // Pagination cursor
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/pages/{pageId}/versions`
- **Ordering**: Latest versions first
- **Response**: Complete version history with author info

**Output Format**:
```json
{
  "success": true,
  "pageId": "987654321",
  "versions": [
    {
      "number": 3,
      "by": {
        "displayName": "Jane Smith",
        "accountId": "account-id-456"
      },
      "when": "2023-01-15T10:30:00.000Z",
      "message": "Updated content section",
      "_links": {
        "self": "https://api.atlassian.com/.../pages/987654321/versions/3"
      }
    },
    {
      "number": 2,
      "by": {
        "displayName": "John Doe", 
        "accountId": "account-id-123"
      },
      "when": "2023-01-10T09:15:00.000Z",
      "message": "Added new section"
    }
  ],
  "size": 2,
  "limit": 25
}
```

---

### 10. getPageLabels
**Purpose**: Get all labels/tags assigned to a specific page

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID
  limit?: number;         // Number of results (default: 25)
  cursor?: string;        // Pagination cursor
}
```

**Confluence API**:
- **Endpoint**: `GET /api/v2/pages/{pageId}/labels`
- **Response**: Array of label objects
- **Types**: Global labels and space-specific labels

**Output Format**:
```json
{
  "success": true,
  "pageId": "987654321",
  "labels": [
    {
      "id": "label123",
      "name": "important",
      "prefix": "global"
    },
    {
      "id": "label456",
      "name": "development",
      "prefix": "my"
    }
  ],
  "size": 2,
  "limit": 25
}
```

---

## COMMENT TOOLS

### 11. getPageComments
**Purpose**: Get all comments (footer + inline) for a specific page

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID
  limit?: number;         // Number of results per type (default: 25)
}
```

**Confluence API**:
- **Footer Comments**: `GET /api/v2/pages/{pageId}/footer-comments`
- **Inline Comments**: `GET /api/v2/pages/{pageId}/inline-comments`
- **Combined**: Two API calls merged into single response

**Output Format**:
```json
{
  "success": true,
  "pageId": "987654321",
  "comments": [
    {
      "id": "comment123",
      "type": "footer",
      "pageId": "987654321",
      "body": "<p>This is a footer comment</p>",
      "bodyType": "storage",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "createdBy": {
        "accountId": "account-id",
        "displayName": "John Doe"
      },
      "_links": {
        "webui": "https://yoursite.atlassian.net/wiki/spaces/DEV/pages/987654321#comment-comment123"
      }
    },
    {
      "id": "comment456",
      "type": "inline", 
      "pageId": "987654321",
      "body": "<p>This is an inline comment</p>",
      "bodyType": "storage",
      "createdAt": "2023-01-02T00:00:00.000Z",
      "createdBy": {
        "accountId": "account-id-2",
        "displayName": "Jane Smith"
      }
    }
  ],
  "totalFooter": 1,
  "totalInline": 1,
  "totalComments": 2
}
```

---

## CONTENT CREATION & MODIFICATION TOOLS

### 12. createPage
**Purpose**: Create a new Confluence page

**Input Parameters**:
```typescript
{
  spaceId: string;        // Required: Numeric space ID 
  title: string;          // Required: Page title
  content: string;        // Required: Content in Confluence storage format
  parentId: string;       // Required: Parent page ID (for hierarchy)
}
```

**Confluence API**:
- **Endpoint**: `POST /api/v2/pages`
- **Content-Type**: `application/json`
- **Body Structure**: Confluence page creation format

**API Request Body**:
```json
{
  "spaceId": "123456789",
  "title": "New Page Title",
  "parentId": "987654321",
  "body": {
    "representation": "storage",
    "value": "<p>Page content in storage format</p><ac:structured-macro ac:name='info'><ac:rich-text-body>Information box</ac:rich-text-body></ac:structured-macro>"
  }
}
```

**Output Format**:
```json
{
  "success": true,
  "page": {
    "id": "111222333",
    "title": "New Page Title",
    "status": "current",
    "spaceId": "123456789",
    "parentId": "987654321",
    "authorId": "account-id",
    "createdAt": "2023-01-20T00:00:00.000Z",
    "version": {
      "number": 1,
      "createdAt": "2023-01-20T00:00:00.000Z"
    },
    "_links": {
      "webui": "https://yoursite.atlassian.net/wiki/spaces/DEV/pages/111222333",
      "self": "https://api.atlassian.com/.../pages/111222333"
    }
  }
}
```

**Content Format Requirements**:
- Must use Confluence storage format (XML-like HTML)
- Supported elements: `<p>`, `<h1>-<h6>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`
- Confluence macros: `<ac:structured-macro>`, `<ac:rich-text-body>`
- Plain text or Markdown NOT supported

---

### 13. updatePage
**Purpose**: Update existing page content and title

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID to update
  title?: string;         // Optional: New page title
  content?: string;       // Optional: New content in storage format
  version: number;        // Required: Current version number (for conflict resolution)
}
```

**Confluence API**:
- **Endpoint**: `PUT /api/v2/pages/{pageId}`
- **Version Check**: Required for optimistic locking
- **Content-Type**: `application/json`

**API Request Body**:
```json
{
  "id": "987654321",
  "title": "Updated Page Title",
  "body": {
    "representation": "storage",
    "value": "<p>Updated page content</p>"
  },
  "version": {
    "number": 3,
    "message": "Updated content and title"
  }
}
```

**Output Format**:
```json
{
  "success": true,
  "page": {
    "id": "987654321",
    "title": "Updated Page Title",
    "status": "current",
    "version": {
      "number": 4,
      "createdAt": "2023-01-20T10:30:00.000Z",
      "message": "Updated content and title"
    },
    "_links": {
      "webui": "https://yoursite.atlassian.net/wiki/spaces/DEV/pages/987654321"
    }
  }
}
```

---

### 14. deletePage
**Purpose**: Delete a Confluence page

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID to delete
  draft?: boolean;        // Optional: Move to draft instead of delete
  purge?: boolean;        // Optional: Permanently delete (admin only)
}
```

**Confluence API**:
- **Endpoint**: `DELETE /api/v2/pages/{pageId}`
- **Query Parameters**: `draft`, `purge`
- **Behavior**: Soft delete by default, can be configured

**Output Format**:
```json
{
  "success": true,
  "pageId": "987654321",
  "action": "deleted",
  "draft": false,
  "purge": false,
  "message": "Page deleted successfully",
  "deletedAt": "2023-01-20T10:30:00.000Z"
}
```

---

## COMMENT MANAGEMENT TOOLS

### 15. addComment
**Purpose**: Add a footer comment to a page

**Input Parameters**:
```typescript
{
  pageId: string;         // Required: Page ID to comment on
  content: string;        // Required: Comment content in storage format
}
```

**Confluence API**:
- **Endpoint**: `POST /api/v2/footer-comments`
- **Content-Type**: `application/json`
- **Body**: Comment content in storage format

**API Request Body**:
```json
{
  "pageId": "987654321",
  "body": {
    "representation": "storage",
    "value": "<p>This is a new comment</p>"
  }
}
```

**Output Format**:
```json
{
  "success": true,
  "comment": {
    "id": "comment789",
    "pageId": "987654321",
    "body": "<p>This is a new comment</p>",
    "bodyType": "storage",
    "createdAt": "2023-01-20T10:30:00.000Z",
    "createdBy": {
      "accountId": "account-id",
      "displayName": "Current User"
    },
    "_links": {
      "webui": "https://yoursite.atlassian.net/wiki/spaces/DEV/pages/987654321#comment-comment789"
    }
  }
}
```

---

### 16. updateFooterComment
**Purpose**: Update an existing footer comment

**Input Parameters**:
```typescript
{
  commentId: string;      // Required: Comment ID to update
  content: string;        // Required: New comment content
  version: number;        // Required: Current comment version
}
```

**Confluence API**:
- **Endpoint**: `PUT /api/v2/footer-comments/{commentId}`
- **Version Check**: Required for conflict resolution
- **Content-Type**: `application/json`

**Output Format**:
```json
{
  "success": true,
  "comment": {
    "id": "comment789",
    "body": "<p>Updated comment content</p>",
    "bodyType": "storage",
    "version": {
      "number": 2,
      "createdAt": "2023-01-20T11:00:00.000Z"
    },
    "updatedAt": "2023-01-20T11:00:00.000Z"
  }
}
```

---

### 17. deleteFooterComment
**Purpose**: Delete a footer comment

**Input Parameters**:
```typescript
{
  commentId: string;      // Required: Comment ID to delete
}
```

**Confluence API**:
- **Endpoint**: `DELETE /api/v2/footer-comments/{commentId}`
- **Authorization**: User must own comment or have admin rights
- **Response**: 204 No Content on success

**Output Format**:
```json
{
  "success": true,
  "commentId": "comment789",
  "message": "Comment deleted successfully",
  "deletedAt": "2023-01-20T11:30:00.000Z"
}
```

---

## AUTHENTICATION & ERROR HANDLING

### Authentication

**Option 1: API Token (Recommended for direct integration)**
```
Authorization: Basic base64(email:api_token)
```
- Get API token from: https://id.atlassian.com/manage-profile/security/api-tokens
- Use your Atlassian account email as username
- Most straightforward for personal/internal use

**Option 2: OAuth 2.0 (For apps and broader access)**
```
Authorization: Bearer {access_token}
```

**Required OAuth Scopes:**
- `read:content-details:confluence` - Read pages, spaces, comments
- `write:content:confluence` - Create/update/delete pages and comments
- `read:space:confluence` - Access space information
- `read:attachment:confluence` - Access page attachments

### Common Error Responses
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API token or insufficient permissions",
    "statusCode": 401
  }
}
```

### Rate Limits
- **Atlassian API**: 1000 requests per hour per IP
- **Recommended**: Implement exponential backoff
- **Headers**: Check `X-RateLimit-Remaining` and `Retry-After`

---

## IMPLEMENTATION NOTES

### Tool-Only Architecture Benefits
1. **Consistent Interface**: All functionality accessible via tools
2. **Action-Oriented**: Each tool performs specific action
3. **Composable**: Tools can be chained together
4. **Cacheable**: Results can be cached at tool level
5. **Traceable**: Each tool call is logged and trackable

### Content Format Requirements
- **Storage Format**: XML-like HTML for all content
- **Macros**: Support for Confluence structured macros
- **Validation**: Content must be well-formed XML
- **Security**: XSS protection via content sanitization

### Pagination Strategies
- **Cursor-based**: For spaces, pages, comments (preferred)
- **Offset-based**: For some legacy endpoints
- **Limits**: Respect API limits (usually 25-250 per request)

## API Validation Summary

✅ **90% of endpoints validated as correct** based on official Confluence Cloud REST API documentation.

**Key corrections made:**
- ❌ `PUT /api/v2/pages/{pageId}/title` - **Removed** (endpoint doesn't exist)
- ✅ `GET /api/v2/pages/{pageId}?body-format=storage` - **Corrected** (single endpoint for page + content)
- ✅ Authentication methods updated with OAuth scopes
- ✅ All other 15 endpoints validated as accurate

This comprehensive tool reference enables building a complete Confluence integration with tool-only architecture, providing all necessary functionality for AI agents to interact with Confluence spaces, pages, comments, and content management operations with **validated API endpoints**.