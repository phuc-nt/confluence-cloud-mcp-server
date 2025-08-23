import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { CONFIG } from '../config/test-config.js';

export class MCPTestClient {
  constructor(testType = 'tools') {
    this.client = null;
    this.transport = null;
    this.serverProcess = null;
    this.connected = false;
    this.testType = testType; // 'connection' hoặc 'tools'
  }

  async connect() {
    try {
      console.log('🚀 Starting MCP server...');
      
      // Chọn env config dựa trên test type
      const serverEnv = this.testType === 'connection' 
        ? CONFIG.mcpServer.serverEnvConnectionTest
        : CONFIG.mcpServer.serverEnvToolsTest;

      // Tạo transport - nó sẽ tự spawn process
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [CONFIG.mcpServer.serverPath],
        env: {
          ...process.env,
          ...serverEnv
        },
        stderr: CONFIG.test.verboseLogging ? 'pipe' : 'inherit'
      });

      // Set up debug logging if verbose
      if (CONFIG.test.verboseLogging) {
        this.transport.onerror = (error) => {
          console.error('Transport error:', error);
        };
      }

      // Tạo MCP client
      this.client = new Client({
        name: 'test-client',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {},
          resources: {}
        }
      });

      // Kết nối client với transport
      await this.client.connect(this.transport);
      
      this.connected = true;
      console.log('✅ MCP server connected successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error.message);
      await this.disconnect();
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.connected) {
        await this.client.close();
      }
      
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }
      
      this.connected = false;
      console.log('🔌 MCP server disconnected');
    } catch (error) {
      console.warn('Warning during disconnect:', error.message);
    }
  }

  async listTools() {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.listTools();
      return response.tools || [];
    } catch (error) {
      throw new Error(`Failed to list tools: ${error.message}`);
    }
  }

  async callTool(name, args = {}) {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: args
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to call tool '${name}': ${error.message}`);
    }
  }

  async listResources() {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.listResources();
      return response.resources || [];
    } catch (error) {
      throw new Error(`Failed to list resources: ${error.message}`);
    }
  }

  async readResource(uri) {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.readResource({ uri });
      return response;
    } catch (error) {
      throw new Error(`Failed to read resource '${uri}': ${error.message}`);
    }
  }

  // Test utilities
  async ping() {
    try {
      // Test basic connectivity bằng cách list tools
      const tools = await this.listTools();
      return {
        connected: true,
        toolCount: tools.length,
        tools: tools.map(t => t.name)
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async validateSchema(toolName) {
    const tools = await this.listTools();
    const tool = tools.find(t => t.name === toolName);
    
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    // Validate tool schema has required properties
    const required = ['name', 'description', 'inputSchema'];
    const missing = required.filter(prop => !tool[prop]);
    
    if (missing.length > 0) {
      throw new Error(`Tool '${toolName}' missing required properties: ${missing.join(', ')}`);
    }

    return {
      valid: true,
      tool: tool
    };
  }
}