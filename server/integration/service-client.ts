import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { log } from '../vite';

/**
 * Base class for service clients
 * Provides common functionality for communicating with microservices
 */
export class ServiceClient {
  protected http: AxiosInstance;
  protected serviceName: string;
  protected baseUrl: string;
  
  constructor(baseUrl: string, serviceName: string) {
    this.serviceName = serviceName;
    this.baseUrl = baseUrl;
    
    this.http = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds
    });
    
    // Add request interceptor for logging
    this.http.interceptors.request.use((config) => {
      log(`[${this.serviceName}] Request: ${config.method?.toUpperCase()} ${config.url}`, 'service-client');
      return config;
    });
    
    // Add response interceptor for logging
    this.http.interceptors.response.use(
      (response) => {
        log(`[${this.serviceName}] Response: ${response.status} ${response.statusText}`, 'service-client');
        return response;
      },
      (error) => {
        if (error.response) {
          log(`[${this.serviceName}] Error: ${error.response.status} ${error.response.statusText}`, 'service-client');
        } else {
          log(`[${this.serviceName}] Error: ${error.message}`, 'service-client');
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * GET request
   */
  protected async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.get<T>(path, config);
    return response.data;
  }
  
  /**
   * POST request
   */
  protected async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.post<T>(path, data, config);
    return response.data;
  }
  
  /**
   * PUT request
   */
  protected async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.put<T>(path, data, config);
    return response.data;
  }
  
  /**
   * DELETE request
   */
  protected async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.delete<T>(path, config);
    return response.data;
  }
  
  /**
   * Health check
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.http.get(`/health`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get service name
   */
  getServiceName(): string {
    return this.serviceName;
  }
  
  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}