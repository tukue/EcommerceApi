import { log } from '../vite';

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  name: string;
  url: string;
  version?: string;
  isLocal: boolean;
}

/**
 * Service Registry - handles discovery of microservices
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceConfig>;
  
  private constructor() {
    this.services = new Map<string, ServiceConfig>();
    this.initializeServices();
    log('ServiceRegistry initialized', 'service-registry');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
  
  /**
   * Initialize services - in a real microservices environment, this would
   * communicate with a service discovery mechanism like Consul or Eureka
   */
  private initializeServices(): void {
    // In a real deployment, these URLs would come from service discovery
    // For local development, we're using the same server with different endpoints
    
    this.registerService({
      name: 'user-service',
      url: 'http://localhost:5000/api/users',
      isLocal: true
    });
    
    this.registerService({
      name: 'product-service',
      url: 'http://localhost:5000/api/products',
      isLocal: true
    });
    
    this.registerService({
      name: 'cart-service',
      url: 'http://localhost:5000/api/cart',
      isLocal: true
    });
    
    this.registerService({
      name: 'order-service',
      url: 'http://localhost:5000/api/orders',
      isLocal: true
    });
    
    this.registerService({
      name: 'payment-service',
      url: 'http://localhost:5000/api/payments',
      isLocal: true
    });
    
    this.registerService({
      name: 'notification-service',
      url: 'http://localhost:5000/api/notifications',
      isLocal: true
    });
    
    this.registerService({
      name: 'api-gateway',
      url: 'http://localhost:5000/api',
      isLocal: true
    });
    
    log('Services registered', 'service-registry');
  }
  
  /**
   * Register a new service
   */
  public registerService(config: ServiceConfig): void {
    this.services.set(config.name, config);
    log(`Service registered: ${config.name} at ${config.url}`, 'service-registry');
  }
  
  /**
   * Get a service by name
   */
  public getService(name: string): ServiceConfig | undefined {
    return this.services.get(name);
  }
  
  /**
   * Get all registered services
   */
  public getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }
  
  /**
   * Unregister a service
   */
  public unregisterService(name: string): boolean {
    const existed = this.services.has(name);
    this.services.delete(name);
    
    if (existed) {
      log(`Service unregistered: ${name}`, 'service-registry');
    }
    
    return existed;
  }
  
  /**
   * Update a service configuration
   */
  public updateService(name: string, config: Partial<ServiceConfig>): boolean {
    const service = this.services.get(name);
    
    if (!service) {
      return false;
    }
    
    this.services.set(name, { ...service, ...config });
    log(`Service updated: ${name}`, 'service-registry');
    
    return true;
  }
}