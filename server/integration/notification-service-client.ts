import { ServiceClient } from './service-client';
import { ServiceRegistry } from './service-registry';

/**
 * Types for notification service
 */
export interface NotificationRequest {
  recipientId: number;
  recipientEmail?: string;
  recipientPhone?: string;
  type: 'email' | 'sms' | 'push';
  subject: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: number;
  recipientId: number;
  type: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt: Date | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

/**
 * Client for communicating with the Notification Service
 */
export class NotificationServiceClient extends ServiceClient {
  constructor() {
    const registry = ServiceRegistry.getInstance();
    const serviceConfig = registry.getService('notification-service');
    
    if (!serviceConfig) {
      throw new Error('Notification service not registered');
    }
    
    super(serviceConfig.url, serviceConfig.name);
  }
  
  /**
   * Send notification
   */
  async sendNotification(notification: NotificationRequest): Promise<Notification> {
    return this.post<Notification>('/send', notification);
  }
  
  /**
   * Send order confirmation notification
   */
  async sendOrderConfirmation(userId: number, orderId: number, orderDetails: any): Promise<Notification> {
    return this.post<Notification>('/orders/confirmation', {
      userId,
      orderId,
      orderDetails
    });
  }
  
  /**
   * Send order status update notification
   */
  async sendOrderStatusUpdate(userId: number, orderId: number, status: string): Promise<Notification> {
    return this.post<Notification>('/orders/status-update', {
      userId,
      orderId,
      status
    });
  }
  
  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(userId: number, orderId: number, amount: number): Promise<Notification> {
    return this.post<Notification>('/payments/confirmation', {
      userId,
      orderId,
      amount
    });
  }
  
  /**
   * Get notifications for user
   */
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.get<Notification[]>(`/user/${userId}`);
  }
}