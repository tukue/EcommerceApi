import { MockStorage } from '../../setup';
import * as orderService from '../../../server/services/order-service';
import * as cartService from '../../../server/services/cart-service';
import { InsertCart, InsertCartItem, InsertOrder, InsertOrderItem, InsertProduct, InsertUser, Order, OrderItem, OrderStatus, Product, User } from '../../../shared/schema';

// Mock the storage
jest.mock('../../../server/storage', () => {
  const mockStorage = new MockStorage();
  return { storage: mockStorage };
});

// Mock notification service
jest.mock('../../../server/services/notification-service', () => ({
  sendOrderConfirmation: jest.fn().mockResolvedValue({}),
  sendOrderStatusUpdate: jest.fn().mockResolvedValue({})
}));

describe('Order Service', () => {
  let testUser: User;
  let testProduct: Product;
  let testOrder: Order;
  let testOrderItem: OrderItem;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test data
    const { storage } = require('../../../server/storage');
    
    // Create user
    const mockUser: InsertUser = {
      username: 'orderuser',
      email: 'order@example.com',
      password: 'password123'
    };
    testUser = await storage.createUser(mockUser);
    
    // Create product
    const mockProduct: InsertProduct = {
      name: 'Order Test Product',
      description: 'Product for order testing',
      price: 29.99,
      category: 'Test',
      inventory: 10,
      imageUrl: 'https://example.com/order-image.jpg'
    };
    testProduct = await storage.createProduct(mockProduct);
    
    // Create order
    const mockOrder: InsertOrder = {
      userId: testUser.id,
      status: OrderStatus.PENDING,
      total: testProduct.price * 2,
      shippingAddress: '123 Test St, Test City, Test Country'
    };
    testOrder = await orderService.createOrder(mockOrder);
    
    // Create order item
    const mockOrderItem: InsertOrderItem = {
      orderId: testOrder.id,
      productId: testProduct.id,
      quantity: 2,
      price: testProduct.price
    };
    testOrderItem = await storage.addOrderItem(mockOrderItem);
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const newOrder: InsertOrder = {
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 49.99,
        shippingAddress: '456 New St, New City, New Country'
      };
      
      const result = await orderService.createOrder(newOrder);
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(testUser.id);
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.total).toBe(49.99);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('createOrderFromCart', () => {
    it('should create an order from a cart', async () => {
      // First create a cart with items
      const { storage } = require('../../../server/storage');
      
      const cart = await cartService.createCart({ userId: testUser.id });
      await cartService.addItemToCart(cart.id, testProduct.id, 3);
      
      // Create order from cart
      const shippingAddress = '789 Cart St, Cart City, Cart Country';
      const order = await orderService.createOrderFromCart(testUser.id, shippingAddress);
      
      expect(order).toBeDefined();
      expect(order.userId).toBe(testUser.id);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.shippingAddress).toBe(shippingAddress);
      
      // Check if order items were created from cart items
      const orderItems = await storage.getOrderItems(order.id);
      expect(orderItems.length).toBe(1);
      expect(orderItems[0].productId).toBe(testProduct.id);
      expect(orderItems[0].quantity).toBe(3);
      
      // Check if cart was cleared
      const cartWithItems = await cartService.getCartWithItems(cart.id);
      expect(cartWithItems.items.length).toBe(0);
      
      // Check if notification was sent
      const { sendOrderConfirmation } = require('../../../server/services/notification-service');
      expect(sendOrderConfirmation).toHaveBeenCalledWith(testUser.id, order.id, expect.any(Object));
    });
    
    it('should throw an error if user has no cart', async () => {
      const newUserData: InsertUser = {
        username: 'nocartuser',
        email: 'nocart@example.com',
        password: 'password123'
      };
      
      const { storage } = require('../../../server/storage');
      const newUser = await storage.createUser(newUserData);
      
      await expect(orderService.createOrderFromCart(newUser.id, 'Test Address')).rejects.toThrow();
    });
    
    it('should throw an error if cart is empty', async () => {
      const newUserData: InsertUser = {
        username: 'emptycartuser',
        email: 'emptycart@example.com',
        password: 'password123'
      };
      
      const { storage } = require('../../../server/storage');
      const newUser = await storage.createUser(newUserData);
      
      // Create an empty cart
      await cartService.createCart({ userId: newUser.id });
      
      await expect(orderService.createOrderFromCart(newUser.id, 'Test Address')).rejects.toThrow();
    });
  });

  describe('getOrder', () => {
    it('should return an order by ID', async () => {
      const order = await orderService.getOrder(testOrder.id);
      
      expect(order).toBeDefined();
      expect(order?.id).toBe(testOrder.id);
      expect(order?.userId).toBe(testUser.id);
      expect(order?.status).toBe(OrderStatus.PENDING);
    });

    it('should return undefined for non-existent order', async () => {
      const order = await orderService.getOrder(999);
      
      expect(order).toBeUndefined();
    });
  });

  describe('getOrderWithItems', () => {
    it('should return an order with items', async () => {
      const orderWithItems = await orderService.getOrderWithItems(testOrder.id);
      
      expect(orderWithItems).toBeDefined();
      expect(orderWithItems?.id).toBe(testOrder.id);
      expect(orderWithItems?.items).toBeDefined();
      expect(orderWithItems?.items.length).toBe(1);
      expect(orderWithItems?.items[0].productId).toBe(testProduct.id);
      expect(orderWithItems?.items[0].quantity).toBe(2);
      expect(orderWithItems?.user).toBeDefined();
      expect(orderWithItems?.user.id).toBe(testUser.id);
    });
  });

  describe('getOrders', () => {
    it('should return a list of orders', async () => {
      const orders = await orderService.getOrders();
      
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders).toContainEqual(expect.objectContaining({
        id: testOrder.id,
        userId: testUser.id
      }));
    });
  });

  describe('getOrdersByUserId', () => {
    it('should return orders for a specific user', async () => {
      const orders = await orderService.getOrdersByUserId(testUser.id);
      
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders.every(order => order.userId === testUser.id)).toBe(true);
    });

    it('should return an empty array for a user with no orders', async () => {
      const newUserData: InsertUser = {
        username: 'noorderuser',
        email: 'noorder@example.com',
        password: 'password123'
      };
      
      const { storage } = require('../../../server/storage');
      const newUser = await storage.createUser(newUserData);
      
      const orders = await orderService.getOrdersByUserId(newUser.id);
      
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(0);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update the status of an order', async () => {
      const updatedOrder = await orderService.updateOrderStatus(testOrder.id, OrderStatus.PROCESSING);
      
      expect(updatedOrder).toBeDefined();
      expect(updatedOrder?.id).toBe(testOrder.id);
      expect(updatedOrder?.status).toBe(OrderStatus.PROCESSING);
      
      // Check if notification was sent
      const { sendOrderStatusUpdate } = require('../../../server/services/notification-service');
      expect(sendOrderStatusUpdate).toHaveBeenCalledWith(testUser.id, testOrder.id, OrderStatus.PROCESSING);
    });

    it('should return undefined for non-existent order', async () => {
      const result = await orderService.updateOrderStatus(999, OrderStatus.PROCESSING);
      
      expect(result).toBeUndefined();
    });
  });
});