import { ServiceClient } from './service-client';
import { ServiceRegistry } from './service-registry';
import { Order, OrderItem, InsertOrder, InsertOrderItem, OrderWithItems, OrderStatus } from '@shared/schema';

/**
 * Client for communicating with the Order Service
 */
export class OrderServiceClient extends ServiceClient {
  constructor() {
    const registry = ServiceRegistry.getInstance();
    const serviceConfig = registry.getService('order-service');
    
    if (!serviceConfig) {
      throw new Error('Order service not registered');
    }
    
    super(serviceConfig.url, serviceConfig.name);
  }
  
  /**
   * Get all orders
   */
  async getOrders(): Promise<Order[]> {
    return this.get<Order[]>('');
  }
  
  /**
   * Get order by ID
   */
  async getOrder(id: number): Promise<Order | undefined> {
    try {
      return await this.get<Order>(`/${id}`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return this.get<Order[]>(`/user/${userId}`);
  }
  
  /**
   * Create order
   */
  async createOrder(order: InsertOrder): Promise<Order> {
    return this.post<Order>('', order);
  }
  
  /**
   * Update order status
   */
  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    try {
      return await this.put<Order>(`/${id}/status`, { status });
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Get order with items
   */
  async getOrderWithItems(orderId: number): Promise<OrderWithItems | undefined> {
    try {
      return await this.get<OrderWithItems>(`/${orderId}/items`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Add item to order
   */
  async addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    return this.post<OrderItem>(`/${orderItem.orderId}/items`, orderItem);
  }
  
  /**
   * Get order items
   */
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.get<OrderItem[]>(`/${orderId}/items/raw`);
  }
  
  /**
   * Create order from cart
   */
  async createOrderFromCart(userId: number, shippingAddress: string): Promise<OrderWithItems> {
    return this.post<OrderWithItems>('/from-cart', { userId, shippingAddress });
  }
}