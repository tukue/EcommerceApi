import { ServiceClient } from './service-client';
import { ServiceRegistry } from './service-registry';
import { ServiceStatus as ServiceStatusEnum, type ServiceStatusWithMetrics } from '@shared/schema';

/**
 * Types for API Gateway metrics
 */
export interface ApiTrafficStats {
  totalRequests: number;
  averageResponse: string;
  errorRate: string;
  cacheHitRatio: string;
  timePoints: string[];
  dataPoints: { time: string; requests: number }[];
}

export interface SystemMetrics {
  orders: {
    count: number;
    change: number;
    period: string;
  };
  users: {
    count: number;
    change: number;
    period: string;
  };
  revenue: {
    amount: number;
    change: number;
    period: string;
  };
}

export interface ContainerStatus {
  name: string;
  image: string;
  status: string;
  cpu: string;
  memory: string;
  port: string;
}

/**
 * Client for communicating with the API Gateway Service
 */
export class ApiGatewayClient extends ServiceClient {
  constructor() {
    // Use localhost API endpoint when running in the same process
    super('http://localhost:5000/api', 'api-gateway');
  }
  
  /**
   * Get service statuses
   */
  async getServiceStatuses(): Promise<ServiceStatusWithMetrics[]> {
    return this.get<ServiceStatusWithMetrics[]>('/services/status');
  }
  
  /**
   * Update service status
   */
  async updateServiceStatus(
    name: string, 
    status: ServiceStatusEnum, 
    details?: string
  ): Promise<ServiceStatusWithMetrics> {
    return this.post<ServiceStatusWithMetrics>('/services/status', {
      name,
      status,
      details
    });
  }
  
  /**
   * Get API traffic stats
   */
  async getApiTrafficStats(): Promise<ApiTrafficStats> {
    return this.get<ApiTrafficStats>('/gateway/traffic');
  }
  
  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.get<SystemMetrics>('/gateway/metrics');
  }
  
  /**
   * Get container statuses
   */
  async getContainerStatuses(): Promise<ContainerStatus[]> {
    return this.get<ContainerStatus[]>('/gateway/containers');
  }
}