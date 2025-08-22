import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export class ErrorHandler {
  static createMcpError(message: string, code: ErrorCode = ErrorCode.InternalError): McpError {
    return new McpError(code, message);
  }

  static handleApiError(error: any): McpError {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      switch (status) {
        case 401:
          return new McpError(ErrorCode.InvalidRequest, `Authentication failed: ${message}`);
        case 403:
          return new McpError(ErrorCode.InvalidRequest, `Access denied: ${message}`);
        case 404:
          return new McpError(ErrorCode.InvalidRequest, `Resource not found: ${message}`);
        case 429:
          return new McpError(ErrorCode.InternalError, `Rate limit exceeded: ${message}`);
        default:
          return new McpError(ErrorCode.InternalError, `API error ${status}: ${message}`);
      }
    }
    
    return new McpError(ErrorCode.InternalError, `Network error: ${error.message}`);
  }
}