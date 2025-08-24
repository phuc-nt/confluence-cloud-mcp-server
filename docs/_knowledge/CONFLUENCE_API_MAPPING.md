# Confluence Cloud MCP Server - API Mapping Reference

> **Tài liệu tham khảo cho Confluence Data Center MCP Server** - Chi tiết về API endpoints, versions, và implementation patterns

## 📋 Tổng quan

Document này liệt kê tất cả MCP tools trong Confluence Cloud MCP Server và mapping tới Confluence REST API endpoints. Mục đích để dự án **Confluence Data Center MCP Server** có thể tham khảo và adapt cho Data Center/Server environment.

## 🏗️ Kiến trúc API Client

### Dual API Client Architecture

```typescript
// V2 API Client - Primary
baseURL: `https://${siteName}/wiki/api/v2`

// V1 API Client - Legacy/Search  
baseURL: `https://${siteName}/wiki/rest/api`
```

### Authentication
```typescript
// Basic Auth for Confluence Cloud
Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
```

---

## 🛠️ MCP Tools → API Endpoints Mapping

### 1. Page Management Tools (5 tools)

> **Category Purpose**: Complete page lifecycle management from creation to deletion with version control and metadata access

#### 1.1 createPage
**MCP Tool**: `createPage`  
**Description**: Create a new Confluence page in a specified space with rich content support. Supports parent-child page hierarchies for structured documentation.  
**API Version**: v2  
**Endpoint**: `POST /wiki/api/v2/pages`  
**Authentication**: Basic Auth (email + API token)  
**Workflow Pattern**: `getSpaces` → `createPage` → `getPageContent` (verify creation)

**Request Format**:
```json
{
  "spaceId": "string",
  "status": "current",  
  "title": "string",
  "parentId": "string",
  "body": {
    "representation": "storage",
    "value": "string"
  }
}
```

**Response**: Full page object with ID, title, version, etc.

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+
- ⚠️ May need v1 fallback for older versions: `POST /rest/api/content`

---

#### 1.2 getPageContent
**MCP Tool**: `getPageContent`  
**Description**: Retrieve complete content and metadata of a Confluence page. Provides page version for updatePage operations.  
**API Version**: v2  
**Endpoint**: `GET /wiki/api/v2/pages/{pageId}?body-format=storage`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `searchPages` → `getPageContent` → `updatePage/addComment`

**Parameters**:
- `pageId`: string (required)
- `body-format`: "storage" | "atlas_doc_format" (optional, default: storage)

**Response**: Complete page data including content, metadata, version

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+
- ⚠️ V1 fallback: `GET /rest/api/content/{pageId}?expand=body.storage,version`

---

#### 1.3 updatePage  
**MCP Tool**: `updatePage`  
**Description**: Update title and/or content of an existing Confluence page. Requires current version for conflict resolution.  
**API Version**: v2  
**Endpoint**: `PUT /wiki/api/v2/pages/{pageId}`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `getPageContent/getPageVersions` → `updatePage` → `addComment` (notify changes)

**Request Format**:
```json
{
  "id": "string",
  "status": "current",
  "title": "string", 
  "body": {
    "representation": "storage",
    "value": "string"
  },
  "version": {
    "number": 123,
    "message": "Update message"
  }
}
```

**Key Features**:
- Optimistic locking với version number
- Version conflict detection
- Update message tracking

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+
- ⚠️ V1 fallback: `PUT /rest/api/content/{pageId}`

---

#### 1.4 deletePage
**MCP Tool**: `deletePage`  
**Description**: Delete a Confluence page permanently. This action cannot be undone.  
**API Version**: v2  
**Endpoint**: `DELETE /wiki/api/v2/pages/{pageId}`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `searchPages/getPageContent` → `deletePage` (confirm page ID)

**Parameters**:
- `pageId`: string (required)
- Optional: Move to draft vs permanent delete

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+  
- ⚠️ V1 fallback: `DELETE /rest/api/content/{pageId}`

---

#### 1.5 getSpaces
**MCP Tool**: `getSpaces`  
**Description**: List available Confluence spaces with details and permissions.  
**API Version**: v2  
**Endpoint**: `GET /wiki/api/v2/spaces?limit={limit}`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `getSpaces` → `createPage` (space discovery for page creation)

**Parameters**:
- `limit`: number (optional, default: 25, max: 250)

**Response**: List of spaces với metadata, permissions

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+
- ⚠️ V1 fallback: `GET /rest/api/space?expand=description,homepage`

---

### 2. Search & Discovery Tools (2 tools)

> **Category Purpose**: Universal content discovery, search capabilities, and version history access for knowledge management

#### 2.1 searchPages
**MCP Tool**: `searchPages`  
**Description**: Search for Confluence pages across spaces using text queries or filters. Supports CQL search and content API fallback.  
**API Strategy**: Dual endpoint với fallback  
**Primary**: CQL Search (v1)  
**Fallback**: Content API (v1)  
**Workflow Pattern**: `searchPages` → `getPageContent` → `updatePage/addComment/deletePage`

**Primary Endpoint** (CQL):
```
POST /wiki/rest/api/search/cql
```

**Request Format**:
```json
{
  "cql": "type=page AND title~\"search term\"",
  "start": 0,
  "limit": 25
}
```

**Fallback Endpoint** (Content API):
```
GET /wiki/rest/api/content/search?cql=...
```

**CQL Query Examples**:
```sql
-- Text search in title and content
type=page AND (title~"search term" OR text~"search term")

-- Space-specific search  
type=page AND space.key="DEMO" AND title~"documentation"

-- Date-based filtering
type=page AND lastModified >= "2024-01-01"
```

**Data Center Considerations**:
- ✅ CQL search fully compatible
- ✅ Content API compatible
- 💡 DC may have additional CQL functions

---

#### 2.2 getPageVersions
**MCP Tool**: `getPageVersions`  
**Description**: Get version history metadata for a Confluence page. Returns version numbers, dates, and messages.  
**API Version**: v2  
**Endpoint**: `GET /wiki/api/v2/pages/{pageId}/versions?limit={limit}`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `searchPages/getPageContent` → `getPageVersions` → `updatePage` (version conflict resolution)

**Parameters**:
- `pageId`: string (required)
- `limit`: number (optional, default: 10, max: 50)

**Response**: Array of version objects với author, date, message

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+
- ⚠️ V1 fallback: `GET /rest/api/content/{pageId}/version`

---

### 3. Comment Management Tools (4 tools)

> **Category Purpose**: Complete collaborative discussion management with threaded comments, replies, and moderation capabilities

#### 3.1 getPageComments
**MCP Tool**: `getPageComments`  
**Description**: Retrieve all footer comments for a specific Confluence page. Returns comment IDs, content previews, authors, and creation dates.  
**API Version**: v2  
**Endpoint**: `GET /wiki/api/v2/pages/{pageId}/footer-comments?limit={limit}`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `getPageComments` → `addComment/updateComment/deleteComment` (comment management workflow)

**Parameters**:
- `pageId`: string (required)
- `limit`: number (optional, default: 25, max: 100)
- `cursor`: string (optional, for pagination)

**Response**: Comments array với threading information

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+
- ⚠️ V1 fallback: `GET /rest/api/content/{pageId}/child/comment`

---

#### 3.2 addComment
**MCP Tool**: `addComment`  
**Description**: Add a new footer comment to a Confluence page. Supports both top-level comments and replies to existing comments.  
**API Version**: v2  
**Endpoint**: `POST /wiki/api/v2/pages/{pageId}/footer-comments`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `getPageComments` → `addComment` → `getPageComments` (verify comment added)

**Request Format**:
```json
{
  "body": {
    "representation": "storage", 
    "value": "<p>Comment content</p>"
  },
  "parentCommentId": "string" // Optional for replies
}
```

**Features**:
- Top-level comments
- Threaded replies
- Storage format content

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+
- ⚠️ V1 fallback: `POST /rest/api/content/{pageId}/child/comment`

---

#### 3.3 updateComment  
**MCP Tool**: `updateComment`  
**Description**: Update the content of an existing Confluence comment. Requires the comment ID and current version number for conflict resolution.  
**API Version**: v2  
**Endpoint**: `PUT /wiki/api/v2/footer-comments/{commentId}`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `getPageComments` → `updateComment` (get current version) → `getPageComments` (verify update)

**Request Format**:
```json
{
  "body": {
    "representation": "storage",
    "value": "<p>Updated comment</p>"
  },
  "version": {
    "number": 123
  }
}
```

**Key Features**:
- Version-based optimistic locking
- Storage format support

**Data Center Considerations**:
- ✅ API v2 available in DC 7.4+
- ⚠️ V1 fallback: `PUT /rest/api/content/{commentId}`

---

#### 3.4 deleteComment
**MCP Tool**: `deleteComment`  
**Description**: Permanently delete a Confluence comment. This action cannot be undone and will remove the comment and all its replies.  
**API Version**: v2  
**Endpoint**: `DELETE /wiki/api/v2/footer-comments/{commentId}`  
**Authentication**: Basic Auth  
**Workflow Pattern**: `getPageComments` → `deleteComment` (get comment ID) → `getPageComments` (verify deletion)

**Parameters**:
- `commentId`: string (required)

**Data Center Considerations**:  
- ✅ API v2 available in DC 7.4+
- ⚠️ V1 fallback: `DELETE /rest/api/content/{commentId}`

---

## 🔄 API Version Compatibility Matrix

| Feature Category | Cloud (v2) | Cloud (v1 fallback) | DC 7.4+ | DC 7.0-7.3 | Server 6.x |
|------------------|------------|---------------------|---------|-------------|------------|
| **Page CRUD** | ✅ Primary | ✅ Available | ✅ Available | ⚠️ v1 only | ⚠️ v1 only |
| **Search (CQL)** | ✅ v1 API | ✅ Primary | ✅ Full support | ✅ Full support | ✅ Full support |
| **Comments** | ✅ Primary | ✅ Available | ✅ Available | ⚠️ v1 only | ⚠️ v1 only |
| **Spaces** | ✅ Primary | ✅ Available | ✅ Available | ⚠️ v1 only | ⚠️ v1 only |

**Legend**:
- ✅ Full support
- ⚠️ Requires adaptation/fallback
- ❌ Not available

---

## 🏛️ Data Center Migration Strategy

### 1. Authentication Differences

**Cloud (Current)**:
```typescript
// Basic Auth với email + API token
Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
```

**Data Center Options**:
```typescript
// Option 1: Basic Auth với username + password  
Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

// Option 2: Personal Access Token (DC 6.3+)
Authorization: `Bearer ${personalAccessToken}`

// Option 3: Session-based auth
// Requires login flow
```

### 2. Base URL Patterns

**Cloud**:
```
https://{siteName}.atlassian.net/wiki/api/v2/...
https://{siteName}.atlassian.net/wiki/rest/api/...
```

**Data Center**:
```
https://{hostname}/wiki/api/v2/...  (DC 7.4+)
https://{hostname}/wiki/rest/api/... (All versions)
http://{hostname}/wiki/rest/api/...  (Internal/dev)
```

### 3. API Endpoint Adaptation

**Strategy cho Data Center**:

1. **Version Detection**: Detect DC version để choose API endpoints
2. **Graceful Degradation**: v2 → v1 fallback pattern  
3. **Feature Parity**: Maintain same tool interfaces
4. **Error Handling**: Adapt error codes và messages

**Implementation Pattern**:
```typescript
class DataCenterApiClient {
  constructor(config: DataCenterConfig) {
    this.detectVersion(); // Detect DC version
    this.setupClients(); // Setup v1/v2 clients based on version
  }
  
  async createPage(data: PageCreateRequest) {
    if (this.supportsV2) {
      return this.v2Client.post('/pages', data);
    } else {
      return this.v1Client.post('/content', this.adaptToV1(data));
    }
  }
}
```

---

## 📊 Feature Implementation Priority

### Phase 1: Core Compatibility
1. **Authentication Adapter** - Support multiple auth methods
2. **Base URL Configuration** - Handle DC hostname patterns  
3. **Version Detection** - Automatic API version detection
4. **Page CRUD (5 tools)** - Essential functionality

### Phase 2: Search & Discovery  
5. **CQL Search** - Already compatible
6. **Version History** - API adaptation required

### Phase 3: Comments & Collaboration
7. **Comment Management (4 tools)** - API v2/v1 adaptation

---

## 🔗 API Documentation References

### Confluence Cloud
- [API v2 Documentation](https://developer.atlassian.com/cloud/confluence/rest/v2/)
- [API v1 Documentation](https://developer.atlassian.com/cloud/confluence/rest/v1/)  
- [CQL Reference](https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/)

### Confluence Data Center/Server
- [Data Center API Documentation](https://docs.atlassian.com/ConfluenceServer/rest/)
- [Server API Documentation](https://docs.atlassian.com/atlassian-confluence/)
- [Version Compatibility](https://confluence.atlassian.com/doc/confluence-server-and-data-center-release-notes-327.html)

---

## 🎯 Summary cho Data Center Project

### ✅ High Compatibility Features
- **CQL Search**: Identical API across Cloud/DC/Server
- **Authentication**: Multiple options in DC (Basic, PAT, Session)
- **Core Functionality**: All tools mappable to DC APIs

### ⚠️ Adaptation Required  
- **API Version Strategy**: v2/v1 detection and fallback
- **Base URL Handling**: DC hostname patterns
- **Error Handling**: Different error codes và formats
- **Feature Detection**: Version-specific functionality

### 🚀 Implementation Approach
1. Fork current Cloud MCP Server codebase
2. Create `DataCenterApiClient` extending current architecture  
3. Implement version detection và graceful degradation
4. Maintain tool interface compatibility
5. Add DC-specific configuration options

**Estimated Development**: 15-20 working days với current codebase as foundation

---

---

## 📝 Detailed Tool Descriptions

### Page Management Tools

#### createPage
**Purpose**: Create new pages with structured content  
**Input Schema**: spaceId, title, content (storage format), optional parentId  
**Success Response**: Full page object with ID, version, metadata  
**Common Use Cases**: 
- Documentation creation
- Meeting notes templates  
- Project pages with structured content
- Child page creation for hierarchical docs

#### getPageContent  
**Purpose**: Retrieve complete page data including content and metadata  
**Input Schema**: pageId, optional bodyFormat (storage/atlas_doc_format)  
**Success Response**: Page object with content, version, space, author info  
**Common Use Cases**:
- Content review and analysis
- Version checking before updates
- Content migration and backup
- Template extraction

#### updatePage
**Purpose**: Update page title and/or content with version control  
**Input Schema**: pageId, optional title, optional content, version number  
**Success Response**: Updated page object with new version  
**Version Control**: Optimistic locking prevents concurrent edit conflicts  
**Common Use Cases**:
- Content updates and revisions
- Title corrections
- Adding new sections to existing pages
- Collaborative editing workflows

#### deletePage  
**Purpose**: Remove pages permanently or move to draft  
**Input Schema**: pageId, optional draft flag (default: false)  
**Success Response**: Deletion confirmation  
**Common Use Cases**:
- Cleanup outdated documentation
- Remove test/duplicate pages
- Archive old project documentation
- Space reorganization

#### getSpaces
**Purpose**: List available spaces with permissions and metadata  
**Input Schema**: optional limit (max: 250)  
**Success Response**: Array of space objects with keys, names, descriptions  
**Common Use Cases**:
- Space discovery for page creation
- Permission validation  
- Workspace overview
- Navigation context building

### Search & Discovery Tools

#### searchPages
**Purpose**: Universal content discovery with advanced filtering  
**Dual Strategy**: CQL search (primary) + Content API (fallback)  
**Input Schema**: query/title text, optional spaceKey/spaceId, limit, sortBy  
**Success Response**: Array of page results with relevance ranking  
**CQL Features**: 
- Full-text search across title and content
- Date-based filtering (created, modified)
- Space-specific searches
- Author and content type filtering
**Common Use Cases**:
- Finding existing documentation
- Content audit and discovery
- Related page identification
- Knowledge base search

#### getPageVersions
**Purpose**: Access complete page version history and change tracking  
**Input Schema**: pageId, optional limit (max: 50)  
**Success Response**: Array of version objects with author, date, messages  
**Common Use Cases**:
- Change history analysis
- Version rollback information
- Collaboration tracking
- Content audit trails

### Comment Management Tools

#### getPageComments
**Purpose**: Retrieve all page comments including threaded discussions  
**Input Schema**: pageId, optional limit, cursor for pagination  
**Success Response**: Array of comments with threading info, authors, dates  
**Threading Support**: Parent-child comment relationships  
**Common Use Cases**:
- Review and feedback collection
- Discussion analysis
- Comment moderation
- Collaboration insights

#### addComment
**Purpose**: Add new comments or replies to existing discussions  
**Input Schema**: pageId, content (storage format), optional parentId  
**Success Response**: Created comment object with ID  
**Threading Features**: Top-level comments and nested replies  
**Common Use Cases**:
- Feedback and review comments
- Discussion participation  
- Review requests and approvals
- Collaborative feedback loops

#### updateComment
**Purpose**: Edit existing comments with version control  
**Input Schema**: commentId, content (storage format), version number  
**Success Response**: Updated comment object  
**Version Control**: Prevents concurrent edit conflicts  
**Common Use Cases**:
- Typo corrections
- Adding additional context
- Updating review feedback
- Content clarifications

#### deleteComment
**Purpose**: Remove comments and their replies permanently  
**Input Schema**: commentId  
**Success Response**: Deletion confirmation  
**Cascade Effect**: Deletes comment and all nested replies  
**Common Use Cases**:
- Remove inappropriate content
- Clean up outdated discussions
- Resolve completed feedback
- Content moderation

---

## 🔄 Multi-Tool Workflow Scenarios

### Scenario 1: Complete Documentation Creation Workflow
```
User: "Create a new API documentation page in the DEV space with proper structure"

Workflow:
1. getSpaces() → Find DEV space ID
2. createPage(spaceId="DEV", title="API Documentation", content="<h1>API Guide</h1>...")
3. getPageContent(pageId=result.id) → Verify creation and get current version
4. addComment(pageId=result.id, content="<p>Please review the initial structure</p>")
5. getPageComments(pageId=result.id) → Confirm comment added

Tools Used: 5 tools
API Calls: 5 calls  
Result: Complete page creation with review comment
```

### Scenario 2: Content Review and Update Workflow  
```
User: "Find pages about 'authentication' in DOCS space, review the latest one, and add implementation notes"

Workflow:
1. searchPages(query="authentication", spaceKey="DOCS", limit=10, sortBy="modified")
2. getPageContent(pageId=topResult.id) → Get current content and version
3. getPageVersions(pageId=topResult.id) → Check recent changes  
4. updatePage(pageId=topResult.id, content=enhancedContent, version=currentVersion)
5. addComment(pageId=topResult.id, content="<p>Added implementation examples in v{newVersion}</p>")

Tools Used: 5 tools  
API Calls: 5 calls
Result: Updated page with change notification
```

### Scenario 3: Content Audit and Cleanup Workflow
```  
User: "Find all test pages in PROJECT space, review their content, and remove outdated ones"

Workflow:
1. searchPages(query="test", spaceKey="PROJECT", limit=50) 
2. For each page:
   a. getPageContent(pageId) → Review content and metadata
   b. getPageVersions(pageId, limit=5) → Check recent activity
   c. getPageComments(pageId) → Check for active discussions
   d. deletePage(pageId) OR updatePage() → Remove or update based on criteria

Tools Used: 4-5 tools per page
API Calls: 4-5 calls per page × N pages
Result: Cleaned workspace with relevant content only
```

### Scenario 4: Collaborative Review Workflow
```
User: "Setup a review process for the 'Project Charter' page with team feedback"

Workflow:  
1. searchPages(title="Project Charter", limit=5)
2. getPageContent(pageId=found.id) → Get current content
3. addComment(pageId, content="<p>@team Please review section 3 by Friday</p>")
4. [Wait for team responses]
5. getPageComments(pageId) → Collect all feedback
6. updatePage(pageId, content=revisedContent, version=currentVersion+1, message="Incorporated team feedback")
7. addComment(pageId, content="<p>Updated based on your feedback. Ready for approval.</p>")

Tools Used: 5 tools
API Calls: 6+ calls (depending on review iterations)  
Result: Collaborative document improvement with tracked feedback
```

### Scenario 5: Knowledge Base Migration Workflow
```
User: "Migrate content from old ARCHIVE space to new DOCS space with proper categorization"

Workflow:
1. getSpaces() → Get all available spaces and their IDs
2. searchPages(spaceKey="ARCHIVE", limit=100) → Get all pages in old space
3. For each page:
   a. getPageContent(pageId) → Get full content and metadata
   b. createPage(spaceId="DOCS", title=newTitle, content=migratedContent, parentId=categoryPage)
   c. addComment(newPageId, content="<p>Migrated from ARCHIVE space on {date}</p>")
   d. [Optional] deletePage(oldPageId) → Remove from old space

Tools Used: 5 tools  
API Calls: 4+ calls per page × N pages
Result: Organized knowledge base with migration tracking
```

### Scenario 6: Version Control and Rollback Scenario
```
User: "Check what changed in the 'User Guide' page over the last week and potentially rollback problematic changes"

Workflow:
1. searchPages(title="User Guide") → Find the target page
2. getPageVersions(pageId, limit=20) → Get recent version history
3. getPageContent(pageId) → Get current content
4. [Analysis of versions and changes]
5. updatePage(pageId, content=previousGoodContent, version=currentVersion, message="Rollback to stable version")
6. addComment(pageId, content="<p>Rolled back to version X due to formatting issues</p>")

Tools Used: 4 tools
API Calls: 4 calls
Result: Content restored to stable state with change documentation
```

---

## 🎯 Tool Combination Patterns

### Pattern 1: Search → Read → Act
**Common Flow**: `searchPages` → `getPageContent` → `updatePage/deletePage/addComment`  
**Use Cases**: Content discovery and modification workflows  
**API Efficiency**: 3+ calls per operation

### Pattern 2: Create → Verify → Enhance  
**Common Flow**: `createPage` → `getPageContent` → `addComment`  
**Use Cases**: New content creation with review setup  
**API Efficiency**: 3 calls per workflow

### Pattern 3: Audit → Analyze → Clean
**Common Flow**: `getSpaces` → `searchPages` → `getPageVersions` → `deletePage`  
**Use Cases**: Content maintenance and cleanup  
**API Efficiency**: 4+ calls per page

### Pattern 4: Collaborative Review
**Common Flow**: `getPageContent` → `addComment` → `getPageComments` → `updatePage`  
**Use Cases**: Team review and approval processes  
**API Efficiency**: 4+ calls per review cycle

---

**Repository**: https://github.com/phuc-nt/confluence-cloud-mcp-server  
**Data Center Adaptation**: Use this document as blueprint for DC implementation