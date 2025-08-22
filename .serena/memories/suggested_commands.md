# Suggested Commands - Confluence Cloud MCP Server

## Essential Development Commands

### Build & Development
```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build project (compile TypeScript)
npm run build

# Start production server
npm start
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables (required before running)
# Set CONFLUENCE_SITE_NAME and CONFLUENCE_API_TOKEN
```

### Quality Assurance
```bash
# Type checking (TypeScript compiler)
npm run build

# No specific lint/test commands defined yet
# Will be added during Sprint 1 implementation
```

## System Commands (macOS/Darwin)
```bash
# File operations
ls -la              # List files with details
find . -name "*.ts" # Find TypeScript files
grep -r "pattern"   # Search in files

# Git operations
git status          # Check git status
git add .           # Stage all changes
git commit -m "message"  # Commit changes
git push            # Push to remote

# Process management
ps aux | grep node  # Find Node.js processes
kill -9 <pid>       # Kill process by PID
```

## Confluence API Setup
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token
3. Configure in .env file:
   - CONFLUENCE_SITE_NAME=your-site.atlassian.net
   - CONFLUENCE_API_TOKEN=your-api-token

## Development Workflow
1. Start with `npm run dev` for development
2. Run `npm run build` to verify compilation
3. Test API connection with configured .env
4. Use project documentation in docs/ for context