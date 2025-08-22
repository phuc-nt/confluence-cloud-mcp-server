# Code Style & Conventions - Confluence Cloud MCP Server

## TypeScript Configuration
- **Target**: ES2022
- **Module System**: NodeNext (ES modules)
- **Strict Mode**: Enabled
- **Source Maps**: Enabled for debugging
- **Declaration Files**: Generated for type definitions

## File Organization
- **Entry Point**: src/index.ts (main MCP server)
- **Tools**: src/tools/confluence/ (individual tool implementations)
- **Utilities**: src/utils/ (API client, error handling, logging)
- **Types**: src/schemas/ (TypeScript interfaces and types)
- **Output**: dist/ (compiled JavaScript)

## Naming Conventions
- **Files**: kebab-case (confluence-api.ts, error-handler.ts)
- **Classes**: PascalCase (ConfluenceApiClient)
- **Interfaces**: PascalCase (ConfluencePage, PageCreateRequest)
- **Functions**: camelCase (initializeApiClient, validateEnvironment)
- **Constants**: camelCase or UPPER_CASE for environment variables

## Code Patterns
- **ES Modules**: Use import/export syntax
- **Async/Await**: Preferred over Promises
- **Error Handling**: Centralized error handling utilities
- **Type Safety**: Full TypeScript types for all API interactions
- **Environment**: dotenv for configuration management

## API Client Structure
- **Base Client**: ConfluenceApiClient class
- **Configuration**: ConfluenceConfig interface
- **Error Handling**: Standardized across all tools
- **Authentication**: API token-based (no email required)

## Documentation Style
- **Comments**: Minimal - code should be self-documenting
- **JSDoc**: For public APIs and complex functions
- **README**: Setup and usage instructions
- **Technical Docs**: Separate documentation in docs/