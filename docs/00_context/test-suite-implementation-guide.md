# MCP Atlassian Server Test Suite Implementation Guide

This guide outlines how to implement a comprehensive test suite for your MCP Atlassian Server using an AI client approach.

## Architecture Overview

### Purpose
- **Validate MCP server functionality** through automated testing
- **Ensure compatibility** with both Confluence Cloud and Data Center
- **Test real-world scenarios** using actual Atlassian credentials
- **Provide comprehensive coverage** of all tools and resources

### Design Philosophy
The test suite is designed as a **standalone AI client** that acts as a consumer of your MCP server, similar to how Cline or Claude Desktop would interact with it. This approach ensures testing from the actual user perspective.

```
┌─────────────────┐    MCP Protocol    ┌─────────────────┐    REST API    ┌─────────────────┐
│   Test Client   │ ←──────────────→   │   MCP Server    │ ──────────→    │   Confluence    │
│   (AI Client)   │     stdio/json     │  (Your Code)    │   HTTP/JSON    │   (Cloud/DC)    │
└─────────────────┘                    └─────────────────┘                └─────────────────┘
```

## Directory Structure

```
project-root/
├── src/                          # Main MCP server source
├── test-client/                  # Test suite (peer to src/)
│   ├── .env                     # Environment configuration
│   ├── package.json             # Test dependencies
│   ├── connection-test.js       # Basic MCP connectivity
│   ├── tools-test.js           # Comprehensive tool testing
│   ├── config/
│   │   └── test-config.js      # Configuration management
│   ├── helpers/
│   │   ├── mcp-client.js       # MCP client wrapper
│   │   └── test-utils.js       # Testing utilities
│   └── results/                 # Test execution results
```

## Implementation Phases

### Phase 1: Environment Setup

**Purpose**: Configure test environment with proper credentials and settings.

**Key Components**:
- Environment variable management for both Cloud and Data Center
- Credential validation and configuration switching
- Test data specification (existing spaces, pages for testing)

### Phase 2: MCP Client Wrapper

**Purpose**: Create a reusable MCP client that handles server lifecycle and communication.

**Core MCP Integration**:
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPTestClient {
  async connect() {
    // Start MCP server process with environment variables
    // Create StdioClientTransport for communication  
    // Initialize MCP client with capabilities
    // Establish connection via transport
  }

  async listTools() {
    // Use MCP client.listTools() to discover available tools
  }

  async callTool(name, args) {
    // Use MCP client.callTool() for tool execution
  }

  async listResources() {
    // Use MCP client.listResources() to discover resources
  }

  async getResource(uri) {
    // Use MCP client.readResource() for resource access
  }
}
```

### Phase 3: Connection Testing

**Purpose**: Validate basic MCP server functionality without requiring service credentials.

**Test Categories**:
1. **Server Startup**: Verify MCP server launches and accepts connections
2. **Protocol Compliance**: Validate MCP handshake and capability negotiation
3. **Tool Discovery**: Ensure expected tools are exposed with proper schemas
4. **Resource Discovery**: Verify resource endpoints are properly registered
5. **Schema Validation**: Check tool input schemas and resource URI patterns

**Implementation Strategy**:
- Mock or skip service-specific operations
- Focus on MCP protocol layer validation
- Test server configuration and initialization
- Validate tool/resource metadata consistency

### Phase 4: Comprehensive Tool Testing

**Purpose**: Execute full integration tests using real service credentials and data.

**Test Flow**:
1. **Connection Establishment**: Connect to MCP server with service credentials
2. **Data Retrieval Tests**: Test all read-only operations (getSpaces, getPages, etc.)
3. **Data Modification Tests**: Test CRUD operations with test data creation
4. **Error Handling Tests**: Validate error responses and edge cases
5. **Cleanup Operations**: Remove all test-created data

**Universal Service Support**:
- Detect service type (Cloud vs Data Center) from configuration
- Adapt test parameters based on service capabilities
- Use appropriate identifiers (spaceId vs spaceKey, etc.)
- Handle different pagination patterns (cursor vs offset)

## Key Implementation Considerations

### MCP-Specific Requirements

**Server Process Management**:
- Launch MCP server as child process with proper environment
- Handle stdio communication for MCP protocol
- Manage server lifecycle (startup, shutdown, error recovery)

**Protocol Compliance**:
- Implement proper MCP client initialization sequence
- Handle capability negotiation correctly  
- Respect MCP message format for tool calls and responses
- Parse MCP server responses according to protocol specification

**Error Handling**:
- Distinguish between MCP protocol errors and service API errors
- Handle connection failures and transport issues
- Implement retry logic for transient failures
- Provide meaningful error reporting for debugging

### Universal Service Compatibility

**Configuration Abstraction**:
```javascript
// Universal configuration that adapts to service type
const config = {
  confluence: {
    type: 'cloud' | 'datacenter',
    credentials: { /* service-specific */ },
    endpoints: { /* service-specific */ },
    features: { /* capability detection */ }
  }
};
```

**Adaptive Test Logic**:
- Detect service capabilities at runtime
- Skip tests for unavailable features
- Use appropriate API patterns for each service type
- Validate responses according to service version

### Test Data Management

**Safe Testing Practices**:
- Use dedicated test spaces/environments
- Create temporary test content with clear naming
- Implement comprehensive cleanup procedures
- Track all created resources for proper removal

**Data Lifecycle**:
1. **Setup**: Validate existing test environment
2. **Execution**: Create test data as needed
3. **Validation**: Verify operations succeeded
4. **Cleanup**: Remove all temporary data
5. **Verification**: Confirm cleanup completion

## Execution Strategy

### Two-Tier Testing Approach

**Tier 1: Connection Tests**
- **Runtime**: ~30 seconds
- **Requirements**: None (no service credentials)
- **Purpose**: Validate MCP implementation
- **Usage**: Development and CI/CD validation

**Tier 2: Integration Tests**  
- **Runtime**: ~5-10 minutes
- **Requirements**: Service credentials and test environment
- **Purpose**: Validate service integration
- **Usage**: Pre-deployment validation

### Test Execution Flow

```bash
# Quick validation (no credentials needed)
npm run test:connection

# Full integration testing (requires credentials)
npm run test:tools  

# Complete test suite
npm run test:all
```

## Success Criteria

### MCP Layer Validation
- ✅ Server starts and accepts connections
- ✅ All expected tools/resources are discovered
- ✅ Tool schemas are valid and complete
- ✅ MCP protocol communication works correctly

### Service Integration Validation
- ✅ All tools execute successfully with real data
- ✅ Response formats match expected schemas
- ✅ Error handling works for invalid inputs
- ✅ Both service types (Cloud/DC) are supported
- ✅ Test data is properly created and cleaned up

### Quality Assurance
- ✅ Comprehensive test coverage (>90% of tools)
- ✅ Reliable execution (tests pass consistently)
- ✅ Clear reporting (success/failure with details)
- ✅ Safe execution (no data corruption or leaks)

## Benefits of This Approach

**Development Benefits**:
- **Early Validation**: Catch MCP protocol issues during development
- **Confidence**: Ensure service integration works correctly
- **Debugging**: Clear test failures help identify problems quickly

**Deployment Benefits**:
- **Pre-deployment Validation**: Test in staging environment before production
- **Compatibility Verification**: Ensure both service types work correctly
- **Regression Detection**: Identify when changes break existing functionality

**Maintenance Benefits**:
- **Automated Verification**: Run tests after any changes
- **Documentation**: Tests serve as executable documentation
- **Quality Gates**: Prevent deployment of broken implementations

This approach provides comprehensive validation while maintaining focus on the MCP protocol implementation and universal service compatibility.