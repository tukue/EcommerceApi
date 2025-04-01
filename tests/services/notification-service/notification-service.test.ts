import { MockStorage } from '../../setup';
import * as notificationService from '../../../server/services/notification-service';
import { InsertUser, ServiceStatus, User } from '../../../shared/schema';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
  })
}));

// Mock the storage
jest.mock('../../../server/storage', () => {
  const mockStorage = new MockStorage();
  return { storage: mockStorage };
});

// Mock the logger
jest.mock('../../../server/vite', () => ({
  log: jest.fn()
}));

describe('Notification Service', () => {
  let testUser: User;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test data
    const { storage } = require('../../../server/storage');
    
    // Create user
    const mockUser: InsertUser = {
      username: 'notifyuser',
      email: 'notify@example.com',
      password: 'password123'
    };
    testUser = await storage.createUser(mockUser);
    
    // Update service status
    await storage.updateServiceStatus('notification-service', ServiceStatus.HEALTHY, 'Service is operating normally');
  });

  describe('sendNotification', () => {
    it('should send a notification and store it', async () => {
      const notificationRequest = {
        recipientId: testUser.id,
        recipientEmail: testUser.email,
        type: 'email' as const,
        subject: 'Test Notification',
        message: 'This is a test notification',
        metadata: { test: true, key: 'value' }
      };
      
      const result = await notificationService.sendNotification(notificationRequest);
      
      expect(result).toBeDefined();
      expect(result.recipientId).toBe(testUser.id);
      expect(result.type).toBe('email');
      expect(result.subject).toBe('Test Notification');
      expect(result.message).toBe('This is a test notification');
      expect(result.status).toBe('sent');
      expect(result.sentAt).toBeInstanceOf(Date);
      expect(result.metadata).toEqual(expect.objectContaining(notificationRequest.metadata));
      
      // Check if the logger was called
      const { log } = require('../../../server/vite');
      expect(log).toHaveBeenCalled();
    });
    
    it('should handle SMS notifications', async () => {
      const notificationRequest = {
        recipientId: testUser.id,
        recipientPhone: '+1234567890',
        type: 'sms' as const,
        subject: 'SMS Notification',
        message: 'This is a test SMS notification',
        metadata: { sms: true }
      };
      
      const result = await notificationService.sendNotification(notificationRequest);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('sms');
      expect(result.status).toBe('sent');
    });
  });

  describe('configureEmailSettings', () => {
    it('should update email configuration', async () => {
      const newConfig = {
        defaultRecipient: 'new@example.com',
        enabled: false
      };
      
      // Call the function to update the configuration
      notificationService.configureEmailSettings(newConfig);
      
      // Since the configuration is internal to the module, we can test it indirectly
      // by sending an email notification and checking if it's disabled
      
      const notificationRequest = {
        recipientId: testUser.id,
        recipientEmail: testUser.email,
        type: 'email' as const,
        subject: 'Test After Config',
        message: 'This notification should be marked as failed since email is disabled'
      };
      
      const result = await notificationService.sendNotification(notificationRequest);
      
      // Even though the email is disabled, the notification should still be created
      expect(result).toBeDefined();
      expect(result.status).toBe('failed');
      
      // Re-enable emails for other tests
      notificationService.configureEmailSettings({ enabled: true });
    });
  });

  describe('sendOrderConfirmation', () => {
    it('should send an order confirmation notification', async () => {
      const orderId = 12345;
      const orderDetails = {
        items: [{ name: 'Test Product', price: 29.99, quantity: 2 }],
        total: 59.98
      };
      
      const result = await notificationService.sendOrderConfirmation(testUser.id, orderId, orderDetails);
      
      expect(result).toBeDefined();
      expect(result.recipientId).toBe(testUser.id);
      expect(result.type).toBe('email');
      expect(result.subject).toContain(`Order #${orderId}`);
      expect(result.message).toContain('has been received');
      expect(result.metadata).toEqual(expect.objectContaining({
        orderId,
        orderDetails
      }));
    });
    
    it('should throw an error if user not found', async () => {
      const { storage } = require('../../../server/storage');
      jest.spyOn(storage, 'getUser').mockResolvedValueOnce(undefined);
      
      await expect(notificationService.sendOrderConfirmation(999, 1, {})).rejects.toThrow('User not found');
    });
  });

  describe('sendOrderStatusUpdate', () => {
    it('should send an order status update notification', async () => {
      const orderId = 12345;
      const status = 'shipped';
      
      const result = await notificationService.sendOrderStatusUpdate(testUser.id, orderId, status);
      
      expect(result).toBeDefined();
      expect(result.recipientId).toBe(testUser.id);
      expect(result.type).toBe('email');
      expect(result.subject).toContain(`Order #${orderId} Status Update`);
      expect(result.message).toContain('has been shipped');
      expect(result.metadata).toEqual(expect.objectContaining({
        orderId,
        status
      }));
    });
    
    it('should handle different status messages correctly', async () => {
      const tests = [
        { status: 'processing', expectedPhrase: 'being processed' },
        { status: 'shipped', expectedPhrase: 'has been shipped' },
        { status: 'delivered', expectedPhrase: 'has been delivered' },
        { status: 'cancelled', expectedPhrase: 'has been cancelled' },
        { status: 'custom', expectedPhrase: 'status has been updated' }
      ];
      
      for (const test of tests) {
        const result = await notificationService.sendOrderStatusUpdate(testUser.id, 12345, test.status);
        expect(result.message).toContain(test.expectedPhrase);
      }
    });
  });

  describe('sendPaymentConfirmation', () => {
    it('should send a payment confirmation notification', async () => {
      const orderId = 12345;
      const amount = 99.99;
      
      const result = await notificationService.sendPaymentConfirmation(testUser.id, orderId, amount);
      
      expect(result).toBeDefined();
      expect(result.recipientId).toBe(testUser.id);
      expect(result.type).toBe('email');
      expect(result.subject).toContain(`Payment Confirmation for Order #${orderId}`);
      expect(result.message).toContain(`$${amount.toFixed(2)}`);
      expect(result.metadata).toEqual(expect.objectContaining({
        orderId,
        amount
      }));
    });
  });

  describe('getUserNotifications', () => {
    it('should return notifications for a specific user', async () => {
      // Create some notifications for the user
      await notificationService.sendNotification({
        recipientId: testUser.id,
        type: 'email',
        subject: 'Test 1',
        message: 'Message 1'
      });
      
      await notificationService.sendNotification({
        recipientId: testUser.id,
        type: 'email',
        subject: 'Test 2',
        message: 'Message 2'
      });
      
      const notifications = await notificationService.getUserNotifications(testUser.id);
      
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.every(n => n.recipientId === testUser.id)).toBe(true);
    });

    it('should return an empty array for a user with no notifications', async () => {
      const newUserData: InsertUser = {
        username: 'nonotifyuser',
        email: 'nonotify@example.com',
        password: 'password123'
      };
      
      const { storage } = require('../../../server/storage');
      const newUser = await storage.createUser(newUserData);
      
      const notifications = await notificationService.getUserNotifications(newUser.id);
      
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBe(0);
    });
  });
});