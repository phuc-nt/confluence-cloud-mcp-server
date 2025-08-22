# Confluence Cloud MCP Server

MCP server for Confluence Cloud API integration with AI assistants.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Configure your Confluence credentials in `.env`:
```bash
CONFLUENCE_SITE_NAME=your-site.atlassian.net
CONFLUENCE_API_TOKEN=your-api-token
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

## Development

Run in development mode:
```bash
npm run dev
```

## API Token Setup

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label and copy the token
4. Use the token in your `.env` file

## Project Structure

```
src/
├── index.ts                    # Main server entry
├── tools/confluence/           # Tool implementations
├── utils/                      # API client and utilities
│   ├── confluence-api.ts       # API client
│   ├── error-handler.ts        # Error utilities
│   └── logger.ts               # Logging utilities
└── schemas/
    ├── confluence.ts           # Type definitions
    └── common.ts               # Shared types
```