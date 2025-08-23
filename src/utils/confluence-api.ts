import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { Logger } from './logger.js';
import { ErrorHandler } from './error-handler.js';
import { ConfluencePage, ConfluenceSpace, PageCreateRequest, PageUpdateRequest } from '../schemas/confluence.js';

export interface ConfluenceConfig {
  siteName: string;
  email: string;     // Added for Basic Auth
  apiToken: string;
}

export class ConfluenceApiClient {
  private client: AxiosInstance;
  private config: ConfluenceConfig;
  private logger: Logger;

  constructor(config: ConfluenceConfig) {
    this.config = config;
    this.logger = new Logger('ConfluenceAPI');
    
    // Create Basic Auth string for Confluence Cloud
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    
    this.client = axios.create({
      baseURL: `https://${config.siteName}/wiki/api/v2`,
      headers: {
        'Authorization': `Basic ${auth}`,  // Changed from Bearer to Basic
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.logger.error(`API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        return Promise.reject(ErrorHandler.handleApiError(error));
      }
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      this.logger.info('Testing connection to Confluence API...');
      // Use spaces endpoint for v2 API
      const response = await this.client.get('/spaces?limit=1');
      this.logger.info('Connection test successful');
      return response.status === 200;
    } catch (error: any) {
      this.logger.error('Connection test failed:', error);
      
      // If endpoint fails, provide helpful error info
      if (error.response?.status === 404) {
        this.logger.error('API v2 endpoint not found - check if your Confluence instance supports API v2');
      }
      
      return false;
    }
  }

  // Helper method to get authenticated user info for validation
  async getCurrentUser(): Promise<any> {
    try {
      // Note: Confluence v2 API doesn't have a direct user endpoint
      // We'll use a spaces call to verify authentication
      const response = await this.client.get('/spaces?limit=1');
      return { authenticated: true, spaces: response.data };
    } catch (error) {
      throw ErrorHandler.handleApiError(error);
    }
  }

  // Page Management Methods

  async createPage(data: PageCreateRequest): Promise<ConfluencePage> {
    try {
      this.logger.info(`Creating page: ${data.title} in space ${data.spaceId}`);
      const response = await this.client.post('/pages', data);
      this.logger.info(`Page created successfully: ${response.data.id}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getPageContent(pageId: string, bodyFormat: 'storage' | 'atlas_doc_format' = 'storage'): Promise<ConfluencePage> {
    try {
      this.logger.info(`Retrieving page content: ${pageId}`);
      const response = await this.client.get(`/pages/${pageId}?body-format=${bodyFormat}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error);
    }
  }

  async updatePage(pageId: string, data: PageUpdateRequest): Promise<ConfluencePage> {
    try {
      this.logger.info(`Updating page: ${pageId}`);
      const response = await this.client.put(`/pages/${pageId}`, data);
      this.logger.info(`Page updated successfully: ${pageId}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error);
    }
  }

  async deletePage(pageId: string): Promise<void> {
    try {
      this.logger.info(`Deleting page: ${pageId}`);
      await this.client.delete(`/pages/${pageId}`);
      this.logger.info(`Page deleted successfully: ${pageId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getSpaces(limit: number = 25): Promise<{ results: ConfluenceSpace[] }> {
    try {
      this.logger.info('Retrieving spaces list');
      this.logger.debug(`Making request to /spaces?limit=${limit}`);
      
      // Use v2 API endpoint
      const response = await this.client.get(`/spaces?limit=${limit}`);
      
      this.logger.debug(`Response status: ${response.status}`);
      this.logger.debug(`Response data:`, JSON.stringify(response.data, null, 2));
      
      return response.data; // v2 API already has { results: [...] } format
    } catch (error) {
      this.logger.error('getSpaces failed:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getPageVersions(pageId: string, limit: number = 10): Promise<{ results: any[] }> {
    try {
      this.logger.info(`Retrieving version history for page: ${pageId}`);
      this.logger.debug(`Making request to /pages/${pageId}/versions?limit=${limit}`);
      
      const response = await this.client.get(`/pages/${pageId}/versions?limit=${limit}`);
      
      this.logger.debug(`Response status: ${response.status}`);
      this.logger.debug(`Found ${response.data.results?.length || 0} versions`);
      
      return response.data;
    } catch (error) {
      this.logger.error('getPageVersions failed:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }
}