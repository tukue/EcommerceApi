import { MockStorage } from '../../setup';
import * as paymentService from '../../../server/services/payment-service';
import * as orderService from '../../../server/services/order-service';
import { InsertOrder, InsertPayment, InsertUser, Order, OrderStatus, Payment, PaymentStatus, User } from '../../../shared/schema';

// Mock the storage
jest.mock('../../../server/storage', () => {
  const mockStorage = new MockStorage();
  return { storage: mockStorage };
});

// Mock notification service
jest.mock('../../../server/services/notification-service', () => ({
  sendPaymentConfirmation: jest.fn().mockResolvedValue({}),
  sendOrderStatusUpdate: jest.fn().mockResolvedValue({})
}));

// Mock order service
jest.mock('../../../server/services/order-service', () => {
  const actualOrderService = jest.requireActual('../../../server/services/order-service');
  return {
    ...actualOrderService,
    updateOrderStatus: jest.fn().mockImplementation(async (orderId, status) => {
      const { storage } = require('../../../server/storage');
      return storage.updateOrderStatus(orderId, status);
    })
  };
});

describe('Payment Service', () => {
  let testUser: User;
  let testOrder: Order;
  let testPayment: Payment;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test data
    const { storage } = require('../../../server/storage');
    
    // Create user
    const mockUser: InsertUser = {
      username: 'paymentuser',
      email: 'payment@example.com',
      password: 'password123'
    };
    testUser = await storage.createUser(mockUser);
    
    // Create order
    const mockOrder: InsertOrder = {
      userId: testUser.id,
      status: OrderStatus.PENDING,
      total: 49.99,
      shippingAddress: '123 Payment St, Payment City, Payment Country'
    };
    testOrder = await storage.createOrder(mockOrder);
    
    // Create payment
    const mockPayment: InsertPayment = {
      orderId: testOrder.id,
      amount: testOrder.total,
      method: 'credit_card',
      status: PaymentStatus.PENDING
    };
    testPayment = await paymentService.createPayment(mockPayment);
  });

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      // Create another order for a new payment
      const { storage } = require('../../../server/storage');
      
      const anotherOrder = await storage.createOrder({
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 99.99,
        shippingAddress: '456 New Payment St, New City, New Country'
      });
      
      const newPayment: InsertPayment = {
        orderId: anotherOrder.id,
        amount: anotherOrder.total,
        method: 'paypal',
        status: PaymentStatus.PENDING
      };
      
      const result = await paymentService.createPayment(newPayment);
      
      expect(result).toBeDefined();
      expect(result.orderId).toBe(anotherOrder.id);
      expect(result.amount).toBe(99.99);
      expect(result.method).toBe('paypal');
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw an error if payment for order already exists', async () => {
      const duplicatePayment: InsertPayment = {
        orderId: testOrder.id,
        amount: testOrder.total,
        method: 'paypal',
        status: PaymentStatus.PENDING
      };
      
      await expect(paymentService.createPayment(duplicatePayment)).rejects.toThrow();
    });
  });

  describe('getPayment', () => {
    it('should return a payment by ID', async () => {
      const payment = await paymentService.getPayment(testPayment.id);
      
      expect(payment).toBeDefined();
      expect(payment?.id).toBe(testPayment.id);
      expect(payment?.orderId).toBe(testOrder.id);
      expect(payment?.amount).toBe(testOrder.total);
    });

    it('should return undefined for non-existent payment', async () => {
      const payment = await paymentService.getPayment(999);
      
      expect(payment).toBeUndefined();
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should return a payment by order ID', async () => {
      const payment = await paymentService.getPaymentByOrderId(testOrder.id);
      
      expect(payment).toBeDefined();
      expect(payment?.id).toBe(testPayment.id);
      expect(payment?.orderId).toBe(testOrder.id);
    });

    it('should return undefined for non-existent order payment', async () => {
      const payment = await paymentService.getPaymentByOrderId(999);
      
      expect(payment).toBeUndefined();
    });
  });

  describe('processPayment', () => {
    it('should process a successful payment and update order status', async () => {
      // Create a new order for testing process payment
      const { storage } = require('../../../server/storage');
      
      const anotherOrder = await storage.createOrder({
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 129.99,
        shippingAddress: '789 Process St, Process City, Process Country'
      });
      
      // Process payment (mockSuccess = true)
      const payment = await paymentService.processPayment(
        anotherOrder.id,
        anotherOrder.total,
        'credit_card',
        true
      );
      
      expect(payment).toBeDefined();
      expect(payment.orderId).toBe(anotherOrder.id);
      expect(payment.amount).toBe(anotherOrder.total);
      expect(payment.method).toBe('credit_card');
      expect(payment.status).toBe(PaymentStatus.COMPLETED);
      
      // Check if order status was updated
      const { updateOrderStatus } = require('../../../server/services/order-service');
      expect(updateOrderStatus).toHaveBeenCalledWith(anotherOrder.id, OrderStatus.PROCESSING);
      
      // Check if notification was sent
      const { sendPaymentConfirmation } = require('../../../server/services/notification-service');
      expect(sendPaymentConfirmation).toHaveBeenCalledWith(testUser.id, anotherOrder.id, anotherOrder.total);
    });

    it('should handle a failed payment', async () => {
      // Create a new order for testing failed payment
      const { storage } = require('../../../server/storage');
      
      const anotherOrder = await storage.createOrder({
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 159.99,
        shippingAddress: '101 Failed St, Failed City, Failed Country'
      });
      
      // Process payment (mockSuccess = false)
      const payment = await paymentService.processPayment(
        anotherOrder.id,
        anotherOrder.total,
        'credit_card',
        false
      );
      
      expect(payment).toBeDefined();
      expect(payment.orderId).toBe(anotherOrder.id);
      expect(payment.status).toBe(PaymentStatus.FAILED);
      
      // Check if order status was not updated to processing
      const { updateOrderStatus } = require('../../../server/services/order-service');
      expect(updateOrderStatus).not.toHaveBeenCalledWith(anotherOrder.id, OrderStatus.PROCESSING);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update the status of a payment', async () => {
      const updatedPayment = await paymentService.updatePaymentStatus(testPayment.id, PaymentStatus.COMPLETED);
      
      expect(updatedPayment).toBeDefined();
      expect(updatedPayment?.id).toBe(testPayment.id);
      expect(updatedPayment?.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should return undefined for non-existent payment', async () => {
      const result = await paymentService.updatePaymentStatus(999, PaymentStatus.COMPLETED);
      
      expect(result).toBeUndefined();
    });
  });
});