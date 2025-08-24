# Confluence Cloud MCP Server Installation Guide

> **Production-Ready Confluence Integration** - Connect AI assistants to Confluence Cloud with comprehensive page management tools

## System Requirements

- macOS 10.15+ or Windows 10+
- Node.js 16+ (for running the MCP server)
- Confluence Cloud workspace access with API token
- MCP-compatible client (Claude Desktop, Cline, Cursor, or other MCP clients)

## Installation Methods

### 🚀 Method 1: NPM Installation (Recommended)

**Quick install from npm registry:**

```bash
npm install -g confluence-cloud-mcp-server
```

**That's it!** Skip to [Step 2: Get Confluence API Credentials](#step-2-get-confluence-api-credentials) below.

### 🔧 Method 2: Manual Installation from Source

**For development or customization:**

#### Prerequisites Check

Verify Git and Node.js are installed:

```bash
git --version
node --version
npm --version
```

#### Step 1: Clone Repository

```bash
git clone https://github.com/phuc-nt/confluence-cloud-mcp-server.git
cd confluence-cloud-mcp-server
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Build the Project

```bash
npm run build
```

## Step 2: Get Confluence API Credentials

### Create Confluence API Token

1. **Go to Atlassian Account Settings**: [API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. **Create API Token**:
   - Click "Create API token"
   - Give it a descriptive name (e.g., "MCP Server")
   - Copy and securely store the token
3. **Get Your Site Information**:
   - Your site name: from URL `https://your-site.atlassian.net`
   - Your email: the email associated with your Atlassian account

### Required Permissions

Make sure your account has these Confluence permissions:
- **View Pages**: Read page content and metadata
- **Create Pages**: Add new pages to spaces
- **Edit Pages**: Update existing page content and titles
- **Manage Comments**: Add, edit, and delete comments
- **Search Content**: Access search and discovery features

## Step 3: Find Your Global NPM Installation Path

First, find where npm installed the package globally:

```bash
which confluence-cloud-mcp-server
```

**Copy this path** - you'll need it for the configuration below.

**Common paths:**

- **macOS (Homebrew):** `/opt/homebrew/bin/confluence-cloud-mcp-server`
- **macOS (Node.js):** `/usr/local/bin/confluence-cloud-mcp-server`
- **Linux:** `/usr/local/bin/confluence-cloud-mcp-server`
- **Windows:** `C:\\Users\\{username}\\AppData\\Roaming\\npm\\confluence-cloud-mcp-server.cmd`

## Step 4: Configure Your AI Client

### Configuration Format

**Important:** Use the following format for reliable MCP connections:

```json
{
  "mcpServers": {
    "server-name": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio", 
      "command": "node",
      "args": ["/path/to/binary"],
      "env": { /* environment variables */ }
    }
  }
}
```

**Key points:**
- Use `"command": "node"` with `"args": ["/path/to/binary"]` format
- Include `"type": "stdio"` and `"timeout": 60` for stability
- Set `"disabled": false` to ensure server is active

### Deployment Configuration

Choose the configuration that best fits your needs:

### 🔧 Recommended: Single Server Configuration

**Complete Confluence integration with all 11 tools:**

```json
{
  "mcpServers": {
    "confluence": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/confluence-cloud-mcp-server"],
      "env": {
        "CONFLUENCE_SITE_NAME": "your-site-name",
        "CONFLUENCE_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Alternative: Manual Installation from Source

If you built from source instead of using npm:

```json
{
  "mcpServers": {
    "confluence": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/full/path/to/confluence-cloud-mcp-server/dist/index.js"],
      "env": {
        "CONFLUENCE_SITE_NAME": "your-site-name",
        "CONFLUENCE_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Configuration Parameters Explained

**Required Environment Variables:**

- `CONFLUENCE_SITE_NAME`: Your Confluence site name (e.g., if your URL is `https://mycompany.atlassian.net`, use `mycompany.atlassian.net`)
- `CONFLUENCE_EMAIL`: Your Atlassian account email address
- `CONFLUENCE_API_TOKEN`: Your API token from step 2

**⚠️ Important:** Replace `/opt/homebrew/bin/confluence-cloud-mcp-server` with **your actual path** from the `which` command above.

### Supported MCP Clients

This server works with all major MCP clients:

- **✅ Claude Desktop** - Use the configuration above
- **✅ Cline** - Use the same configuration format
- **✅ Cursor** - Use the same configuration format  
- **✅ Other MCP clients** - Use the same configuration format

### Find Your Full Path (for Manual Installation)

**macOS/Linux:**

```bash
pwd
# Use the output + /dist/index.js
```

**Windows (PowerShell):**

```bash
(Get-Location).Path
# Use the output + \\dist\\index.js
```

**Example paths:**

- macOS: `/Users/yourname/confluence-cloud-mcp-server/dist/index.js`
- Windows: `C:\\\\Users\\\\YourName\\\\confluence-cloud-mcp-server\\\\dist\\\\index.js`

## Step 5: Verify Installation

### Test MCP Server Directly

```bash
# Test main server
node ./dist/index.js

# Test with environment variables
CONFLUENCE_SITE_NAME=your-site.atlassian.net CONFLUENCE_EMAIL=your@email.com CONFLUENCE_API_TOKEN=your-token node ./dist/index.js
```

You should see output showing tools registered successfully:

```
[INFO] Confluence MCP Server starting...
[INFO] Registered 11 tools: createPage, getPageContent, updatePage, deletePage, getSpaces, searchPages, getPageVersions, getPageComments, addComment, updateComment, deleteComment
[INFO] Server initialized successfully
```

### Test with Your AI Client

After restarting your AI client, test with questions like:

- "List all spaces in my Confluence workspace"
- "Search for pages containing 'documentation' in the DEV space"
- "Create a new page called 'Test Page' in the DEMO space"
- "Get the content of page ID 123456"
- "Show me the version history of page 123456"
- "Add a comment to page 123456 saying 'Great work!'"

## 🎉 Installation Complete!

Your Confluence Cloud MCP Server is now ready with **11 production-ready tools** and **100% test success rate**.

**What you can do now:**

### 📄 Page Management
- Create and manage pages with natural language
- Update page content and titles safely with version control
- Delete pages when no longer needed
- Explore available spaces and their structure

### 🔍 Search & Discovery  
- Search your Confluence content with advanced CQL queries
- Find pages by title, content, or space
- Access page version history for tracking changes
- Discover content across your entire workspace

### 💬 Comment Collaboration
- Retrieve page comments and discussion threads
- Add comments with support for reply threading
- Edit existing comments to update feedback
- Remove comments when necessary

### 🤖 AI Integration Workflows
- **Content Creation**: "Create a meeting notes template in the TEAM space"
- **Content Search**: "Find all pages about API documentation from last month" 
- **Version Control**: "Check what changed in the user guide since version 3"
- **Team Collaboration**: "Add a review request comment to the project proposal"

**Need help?** Check our [GitHub repository](https://github.com/phuc-nt/confluence-cloud-mcp-server) for troubleshooting and support.

**Ready to explore?** Start with simple commands like _"List all my Confluence spaces"_ or _"Search for pages about project planning"_.

---

**✅ Production-ready Confluence integration achieved with comprehensive collaboration tools!**