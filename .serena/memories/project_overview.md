# Confluence Cloud MCP Server - Project Overview

## Project Purpose
- **Main Goal**: MCP (Model Context Protocol) server for Confluence Cloud API integration with AI assistants
- **Target**: Provide 11 essential tools for page management, search, and comments
- **Architecture**: Single optimized server for fast feature delivery
- **Use Case**: Enable AI assistants (Claude, Cline, Cursor) to interact with Confluence Cloud

## Tech Stack
- **Runtime**: Node.js with TypeScript
- **Main Framework**: @modelcontextprotocol/sdk (v1.0.0)
- **HTTP Client**: axios (v1.7.0)
- **Environment**: dotenv (v16.4.0)
- **Build Tool**: TypeScript compiler (tsc)
- **Dev Tools**: tsx for development mode

## Project Structure
```
src/
├── index.ts                    # Main MCP server entry point
├── tools/confluence/           # Tool implementations (11 tools planned)
├── utils/                      # API client and utilities
│   ├── confluence-api.ts       # Confluence API client wrapper
│   ├── error-handler.ts        # Error handling utilities
│   └── logger.ts               # Logging utilities
└── schemas/
    ├── confluence.ts           # Confluence-specific type definitions
    └── common.ts               # Shared type definitions

docs/
├── 00_context/                 # Technical specifications (DO NOT MODIFY)
├── 01_plan/                    # Project roadmap and timeline
└── 02_implement/               # Sprint-by-sprint implementation tasks
```

## Current Status
- **Phase**: Planning Complete - Not Started Implementation
- **Sprint**: Sprint 1 (Foundation & Page Management) - 8 working days
- **Tools Completed**: 0/11 tools
- **Next Actions**: Begin MCP server setup and core page tools