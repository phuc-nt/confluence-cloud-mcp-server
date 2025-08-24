# Test Suite

**Comprehensive integration testing** cho Confluence Cloud MCP Server với real API validation.

## Vai trò

**Integration testing** với real Confluence API để validate:
- ✅ **Tool functionality** - Tất cả 11 tools hoạt động đúng
- ✅ **API connectivity** - Confluence API v1/v2 endpoints
- ✅ **Workflow integration** - Multi-tool workflows (CRUD, search, comments)
- ✅ **AI client compatibility** - MCP protocol compliance

## Setup

```bash
# Copy environment template
cp .env.example .env

# Configure với real Confluence credentials
vim .env

# Install dependencies
npm install

# Run tests
npm run test:all
```

## Test Files

- **`tools-test.js`** - Main integration test với full CRUD workflow
- **`connection-test.js`** - API connectivity validation
- **`config/test-config.js`** - Environment configuration management
- **`helpers/`** - MCP client wrapper và test utilities

## Maintenance

**Adding new tools:**
1. Add test function in `tools-test.js`
2. Update test workflow if needed
3. Run `npm test` để validate

**Updating for new features:**
- **New API endpoints** → Test connectivity
- **New tool parameters** → Validate input/output
- **Breaking changes** → Update test expectations

**Security:** Tất cả credentials từ `.env` file, không hardcode trong source code.