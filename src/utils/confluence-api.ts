import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { Logger } from './logger.js';
import { ErrorHandler } from './error-handler.js';
import { ConfluencePage, ConfluenceSpace, PageCreateRequest, PageUpdateRequest } from '../schemas/confluence.js';

export interface ConfluenceConfig {
  siteName: string;
  apiToken: string;
}

export class ConfluenceApiClient {
  private client: AxiosInstance;
  private config: ConfluenceConfig;
  private logger: Logger;

  constructor(config: ConfluenceConfig) {
    this.config = config;
    this.logger = new Logger('ConfluenceAPI');
    
    this.client = axios.create({
      baseURL: `https://${config.siteName}/wiki/api/v2`,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
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
      const response = await this.client.get('/spaces?limit=1');
      this.logger.info('Connection test successful');
      return response.status === 200;
    } catch (error) {
      this.logger.error('Connection test failed:', error);
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
      const response = await this.client.get(`/spaces?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error);
    }
  }
}