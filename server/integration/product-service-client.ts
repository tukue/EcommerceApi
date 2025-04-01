import { ServiceClient } from './service-client';
import { ServiceRegistry } from './service-registry';
import { Product, InsertProduct } from '@shared/schema';

/**
 * Client for communicating with the Product Service
 */
export class ProductServiceClient extends ServiceClient {
  constructor() {
    const registry = ServiceRegistry.getInstance();
    const serviceConfig = registry.getService('product-service');
    
    if (!serviceConfig) {
      throw new Error('Product service not registered');
    }
    
    super(serviceConfig.url, serviceConfig.name);
  }
  
  /**
   * Get all products
   */
  async getProducts(): Promise<Product[]> {
    return this.get<Product[]>('');
  }
  
  /**
   * Get product by ID
   */
  async getProduct(id: number): Promise<Product | undefined> {
    try {
      return await this.get<Product>(`/${id}`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Create new product
   */
  async createProduct(product: InsertProduct): Promise<Product> {
    return this.post<Product>('', product);
  }
  
  /**
   * Update product
   */
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      return await this.put<Product>(`/${id}`, product);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Delete product
   */
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await this.delete(`/${id}`);
      return true;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }
}