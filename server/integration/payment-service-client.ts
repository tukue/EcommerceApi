import { ServiceClient } from './service-client';
import { ServiceRegistry } from './service-registry';
import { Payment, InsertPayment, PaymentStatus } from '@shared/schema';

/**
 * Client for communicating with the Payment Service
 */
export class PaymentServiceClient extends ServiceClient {
  constructor() {
    const registry = ServiceRegistry.getInstance();
    const serviceConfig = registry.getService('payment-service');
    
    if (!serviceConfig) {
      throw new Error('Payment service not registered');
    }
    
    super(serviceConfig.url, serviceConfig.name);
  }
  
  /**
   * Get payment by ID
   */
  async getPayment(id: number): Promise<Payment | undefined> {
    try {
      return await this.get<Payment>(`/${id}`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: number): Promise<Payment | undefined> {
    try {
      return await this.get<Payment>(`/order/${orderId}`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Create payment
   */
  async createPayment(payment: InsertPayment): Promise<Payment> {
    return this.post<Payment>('', payment);
  }
  
  /**
   * Update payment status
   */
  async updatePaymentStatus(id: number, status: PaymentStatus): Promise<Payment | undefined> {
    try {
      return await this.put<Payment>(`/${id}/status`, { status });
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Process payment
   */
  async processPayment(
    orderId: number, 
    amount: number, 
    paymentMethod: string, 
    mockSuccess: boolean = true
  ): Promise<Payment> {
    return this.post<Payment>('/process', {
      orderId,
      amount,
      paymentMethod,
      mockSuccess
    });
  }
}