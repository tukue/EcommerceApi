import { ServiceStatus } from '@shared/schema';
import { storage } from '../storage';
import { log } from '../vite';
import nodemailer from 'nodemailer';

// Configuration options for email notifications
interface EmailConfig {
  defaultRecipient: string;
  enabled: boolean;
  from: string;
}

// Default email configuration
let emailConfig: EmailConfig = {
  defaultRecipient: 'tukue.geb@gmail.com', // Default recipient as requested
  enabled: true,
  from: 'noreply@microstore.com'
};

// Types for notification service
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

// Mock implementation of notification service
let notificationIdCounter = 1;
const notifications: Notification[] = [];

// Create a nodemailer transporter for sending emails
const createTransporter = () => {
  // For development, we'll use a test SMTP service
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'ethereal_user',
      pass: process.env.EMAIL_PASS || 'ethereal_password'
    }
  });
};

// Send email notification
const sendEmail = async (to: string, subject: string, text: string): Promise<boolean> => {
  try {
    if (!emailConfig.enabled) {
      log('Email notifications are disabled', 'notification-service');
      return false;
    }
    
    // If no specific recipient is provided, use the default one
    const recipient = to || emailConfig.defaultRecipient;
    
    // For demonstration, we'll log instead of actually sending
    log(`Would send email to ${recipient}: ${subject}`, 'notification-service');
    
    // In production, you would uncomment the following code:
    /*
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to: recipient,
      subject,
      text,
    });
    log(`Email sent: ${info.messageId}`, 'notification-service');
    */
    
    return true;
  } catch (error) {
    log(`Failed to send email: ${(error as Error).message}`, 'notification-service');
    return false;
  }
};

// Utility to add notification
const addNotification = async (notification: NotificationRequest): Promise<Notification> => {
  const now = new Date();
  let status: 'pending' | 'sent' | 'failed' = 'pending';
  
  // Try to send the email notification
  if (notification.type === 'email') {
    const emailSent = await sendEmail(
      notification.recipientEmail || emailConfig.defaultRecipient,
      notification.subject,
      notification.message
    );
    status = emailSent ? 'sent' : 'failed';
  } else {
    // For non-email notifications, just mark as sent
    status = 'sent';
  }
  
  const newNotification: Notification = {
    id: notificationIdCounter++,
    recipientId: notification.recipientId,
    type: notification.type,
    subject: notification.subject,
    message: notification.message,
    status,
    sentAt: status === 'sent' ? now : null,
    metadata: notification.metadata || {},
    createdAt: now
  };
  
  notifications.push(newNotification);
  return newNotification;
};

/**
 * Send a notification
 */
export const sendNotification = async (notification: NotificationRequest): Promise<Notification> => {
  log(`Sending ${notification.type} notification to user ${notification.recipientId}: ${notification.subject}`, 'notification-service');
  
  // Update service status
  await storage.updateServiceStatus('notification-service', ServiceStatus.HEALTHY, 'Service is operating normally');
  
  // Process the notification
  const result = await addNotification(notification);
  
  return result;
};

/**
 * Configure email settings
 */
export const configureEmailSettings = (config: Partial<EmailConfig>): void => {
  emailConfig = { ...emailConfig, ...config };
  log(`Email configuration updated: ${JSON.stringify(emailConfig)}`, 'notification-service');
};

/**
 * Send order confirmation notification
 */
export const sendOrderConfirmation = async (
  userId: number, 
  orderId: number, 
  orderDetails: any
): Promise<Notification> => {
  // Get user email (in a real app, we'd look this up)
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return sendNotification({
    recipientId: userId,
    recipientEmail: user.email,
    type: 'email',
    subject: `Order #${orderId} Confirmation`,
    message: `Your order #${orderId} has been received and is being processed. Thank you for your purchase!`,
    metadata: {
      orderId,
      orderDetails
    }
  });
};

/**
 * Send order status update notification
 */
export const sendOrderStatusUpdate = async (
  userId: number, 
  orderId: number, 
  status: string
): Promise<Notification> => {
  // Get user email (in a real app, we'd look this up)
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  let message = '';
  
  switch (status) {
    case 'processing':
      message = `Your order #${orderId} is now being processed. We'll notify you when it ships.`;
      break;
    case 'shipped':
      message = `Your order #${orderId} has been shipped! You should receive it soon.`;
      break;
    case 'delivered':
      message = `Your order #${orderId} has been delivered. We hope you enjoy your purchase!`;
      break;
    case 'cancelled':
      message = `Your order #${orderId} has been cancelled. Please contact customer service if you have any questions.`;
      break;
    default:
      message = `Your order #${orderId} status has been updated to: ${status}`;
  }
  
  return sendNotification({
    recipientId: userId,
    recipientEmail: user.email,
    type: 'email',
    subject: `Order #${orderId} Status Update: ${status}`,
    message,
    metadata: {
      orderId,
      status
    }
  });
};

/**
 * Send payment confirmation notification
 */
export const sendPaymentConfirmation = async (
  userId: number, 
  orderId: number, 
  amount: number
): Promise<Notification> => {
  // Get user email (in a real app, we'd look this up)
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return sendNotification({
    recipientId: userId,
    recipientEmail: user.email,
    type: 'email',
    subject: `Payment Confirmation for Order #${orderId}`,
    message: `Your payment of $${amount.toFixed(2)} for order #${orderId} has been received and processed successfully.`,
    metadata: {
      orderId,
      amount
    }
  });
};

/**
 * Get notifications for user
 */
export const getUserNotifications = async (userId: number): Promise<Notification[]> => {
  return notifications.filter(n => n.recipientId === userId);
};