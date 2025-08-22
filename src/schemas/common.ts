export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  size: number;
  start: number;
  limit: number;
  _links: {
    base: string;
    context: string;
    next?: string;
    prev?: string;
  };
}

export interface SearchOptions {
  spaceKey?: string;
  title?: string;
  type?: string;
  status?: string;
  limit?: number;
  start?: number;
}