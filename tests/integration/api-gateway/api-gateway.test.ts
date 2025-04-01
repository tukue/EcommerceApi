import request from 'supertest';
import express, { Express } from 'express';
import { MockStorage } from '../../setup';
import { registerRoutes } from '../../../server/routes';
import { InsertProduct, InsertUser, OrderStatus, PaymentStatus, User } from '../../../shared/schema';

// Mock Express Session
jest.mock('express-session', () => {
  return () => (req: any, res: any, next: any) => {
    req.session = {
      user: null,
      save: jest.fn((cb) => cb && cb()),
      destroy: jest.fn((cb) => cb && cb())
    };
    next();
  };
});

// Mock the storage
jest.mock('../../../server/storage', () => {
  const mockStorage = new MockStorage();
  return { storage: mockStorage };
});

// Mock service clients
jest.mock('../../../server/integration/service-client', () => {
  return {
    ServiceClient: jest.fn().mockImplementation(() => {
      return {
        request: jest.fn().mockImplementation(async (method, endpoint, data) => {
          // The mock implementation will use the storage directly
          const { storage } = require('../../../server/storage');
          
          if (endpoint.includes('/products')) {
            if (method === 'GET' && endpoint.includes('/products/')) {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.getProduct(id);
            } else if (method === 'GET') {
              return storage.getProducts();
            } else if (method === 'POST') {
              return storage.createProduct(data);
            } else if (method === 'PUT') {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.updateProduct(id, data);
            } else if (method === 'DELETE') {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.deleteProduct(id);
            }
          } else if (endpoint.includes('/users')) {
            if (method === 'GET' && endpoint.includes('/users/')) {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.getUser(id);
            } else if (method === 'GET') {
              return storage.getUsers();
            } else if (method === 'POST') {
              return storage.createUser(data);
            }
          } else if (endpoint.includes('/carts')) {
            if (method === 'GET' && endpoint.includes('/items')) {
              const cartId = parseInt(endpoint.split('/').pop() as string);
              return storage.getCartItems(cartId);
            } else if (method === 'POST' && endpoint.includes('/items')) {
              return storage.addCartItem(data);
            } else if (method === 'GET' && endpoint.includes('/carts/user/')) {
              const userId = parseInt(endpoint.split('/').pop() as string);
              return storage.getCartByUserId(userId);
            } else if (method === 'GET') {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.getCart(id);
            } else if (method === 'POST') {
              return storage.createCart(data);
            }
          } else if (endpoint.includes('/orders')) {
            if (method === 'GET' && endpoint.includes('/items')) {
              const orderId = parseInt(endpoint.split('/').pop() as string);
              return storage.getOrderItems(orderId);
            } else if (method === 'POST' && endpoint.includes('/items')) {
              return storage.addOrderItem(data);
            } else if (method === 'GET' && endpoint.includes('/user/')) {
              const userId = parseInt(endpoint.split('/').pop() as string);
              return storage.getOrdersByUserId(userId);
            } else if (method === 'GET' && endpoint.includes('/orders/')) {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.getOrder(id);
            } else if (method === 'GET') {
              return storage.getOrders();
            } else if (method === 'POST') {
              return storage.createOrder(data);
            } else if (method === 'PUT' && endpoint.includes('/status')) {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.updateOrderStatus(id, data.status);
            }
          } else if (endpoint.includes('/payments')) {
            if (method === 'GET' && endpoint.includes('/order/')) {
              const orderId = parseInt(endpoint.split('/').pop() as string);
              return storage.getPaymentByOrderId(orderId);
            } else if (method === 'GET') {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.getPayment(id);
            } else if (method === 'POST') {
              return storage.createPayment(data);
            } else if (method === 'PUT' && endpoint.includes('/status')) {
              const id = parseInt(endpoint.split('/').pop() as string);
              return storage.updatePaymentStatus(id, data.status);
            }
          }
          
          return null;
        })
      };
    })
  };
});

describe('API Gateway Integration', () => {
  let app: Express;
  let testUser: User;
  let adminUser: User;
  let authToken: string;
  let adminAuthToken: string;

  beforeAll(async () => {
    // Set up the express app
    app = express();
    
    // Register all routes
    await registerRoutes(app);
    
    // Create test users in the database
    const { storage } = require('../../../server/storage');
    
    // Regular user
    const mockUser: InsertUser = {
      username: 'testintegration',
      email: 'integration@example.com',
      password: 'password123'
    };
    testUser = await storage.createUser(mockUser);
    testUser.isAdmin = false;
    
    // Admin user
    const mockAdminUser: InsertUser = {
      username: 'adminintegration',
      email: 'admin@example.com',
      password: 'admin123'
    };
    adminUser = await storage.createUser(mockAdminUser);
    adminUser.isAdmin = true;
    
    // Create the auth tokens (just for simulation)
    authToken = Buffer.from(JSON.stringify(testUser)).toString('base64');
    adminAuthToken = Buffer.from(JSON.stringify(adminUser)).toString('base64');
  });

  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should allow login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'password123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(testUser.username);
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        });
      
      expect(res.status).toBe(401);
    });

    it('should allow registration with valid data', async () => {
      const newUser = {
        username: 'newintegrationuser',
        email: 'newintegration@example.com',
        password: 'newpassword123'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(newUser.username);
    });

    it('should reject registration with existing username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: 'another@example.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('Product API', () => {
    it('should get all products', async () => {
      // First create a product
      const { storage } = require('../../../server/storage');
      
      await storage.createProduct({
        name: 'Integration Test Product',
        description: 'Product for integration testing',
        price: 29.99,
        category: 'Test',
        inventory: 10,
        imageUrl: 'https://example.com/integration-image.jpg'
      });
      
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get a product by ID', async () => {
      // Create a product
      const { storage } = require('../../../server/storage');
      
      const product = await storage.createProduct({
        name: 'Get By ID Product',
        description: 'Product for getting by ID',
        price: 39.99,
        category: 'Test',
        inventory: 5,
        imageUrl: 'https://example.com/get-by-id.jpg'
      });
      
      const res = await request(app)
        .get(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', product.id);
      expect(res.body).toHaveProperty('name', product.name);
    });

    it('should create a new product if admin', async () => {
      const mockProduct: InsertProduct = {
        name: 'Admin Created Product',
        description: 'Product created by admin',
        price: 49.99,
        category: 'Admin',
        inventory: 20,
        imageUrl: 'https://example.com/admin-created.jpg'
      };
      
      // Mock session to be authenticated as admin
      jest.spyOn(app.request, 'session', 'get').mockReturnValue({
        user: adminUser,
        save: jest.fn((cb) => cb && cb())
      });
      
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(mockProduct);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', mockProduct.name);
      expect(res.body).toHaveProperty('id');
    });

    it('should not allow product creation for non-admin users', async () => {
      const mockProduct: InsertProduct = {
        name: 'User Created Product',
        description: 'Product created by regular user',
        price: 19.99,
        category: 'User',
        inventory: 3,
        imageUrl: 'https://example.com/user-created.jpg'
      };
      
      // Mock session to be authenticated as regular user
      jest.spyOn(app.request, 'session', 'get').mockReturnValue({
        user: testUser,
        save: jest.fn((cb) => cb && cb())
      });
      
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockProduct);
      
      expect(res.status).toBe(403);
    });
  });

  describe('Cart API', () => {
    it('should create a cart for a user', async () => {
      const res = await request(app)
        .post('/api/carts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: testUser.id });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('userId', testUser.id);
    });

    it('should add an item to the cart', async () => {
      // Create a product and cart first
      const { storage } = require('../../../server/storage');
      
      const product = await storage.createProduct({
        name: 'Cart Item Product',
        description: 'Product for cart item testing',
        price: 24.99,
        category: 'Test',
        inventory: 15,
        imageUrl: 'https://example.com/cart-item.jpg'
      });
      
      const cart = await storage.createCart({ userId: testUser.id });
      
      const res = await request(app)
        .post('/api/carts/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cartId: cart.id,
          productId: product.id,
          quantity: 2
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('cartId', cart.id);
      expect(res.body).toHaveProperty('productId', product.id);
      expect(res.body).toHaveProperty('quantity', 2);
    });

    it('should get cart items for a cart', async () => {
      // Create a cart with items
      const { storage } = require('../../../server/storage');
      
      const product = await storage.createProduct({
        name: 'Get Cart Items Product',
        description: 'Product for getting cart items',
        price: 14.99,
        category: 'Test',
        inventory: 8,
        imageUrl: 'https://example.com/get-cart-items.jpg'
      });
      
      const cart = await storage.createCart({ userId: testUser.id });
      
      await storage.addCartItem({
        cartId: cart.id,
        productId: product.id,
        quantity: 3
      });
      
      const res = await request(app)
        .get(`/api/carts/${cart.id}/items`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('productId', product.id);
    });
  });

  describe('Order API', () => {
    it('should create an order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUser.id,
          status: OrderStatus.PENDING,
          total: 99.99,
          shippingAddress: '123 Integration St, Integration City'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('userId', testUser.id);
      expect(res.body).toHaveProperty('status', OrderStatus.PENDING);
    });

    it('should get orders for a user', async () => {
      // Create an order first
      const { storage } = require('../../../server/storage');
      
      await storage.createOrder({
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 149.99,
        shippingAddress: '456 User Orders St, User City'
      });
      
      const res = await request(app)
        .get(`/api/orders/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('userId', testUser.id);
    });

    it('should update an order status if admin', async () => {
      // Create an order first
      const { storage } = require('../../../server/storage');
      
      const order = await storage.createOrder({
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 199.99,
        shippingAddress: '789 Status Update St, Status City'
      });
      
      // Mock session to be authenticated as admin
      jest.spyOn(app.request, 'session', 'get').mockReturnValue({
        user: adminUser,
        save: jest.fn((cb) => cb && cb())
      });
      
      const res = await request(app)
        .put(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({ status: OrderStatus.PROCESSING });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', order.id);
      expect(res.body).toHaveProperty('status', OrderStatus.PROCESSING);
    });
  });

  describe('Payment API', () => {
    it('should create a payment for an order', async () => {
      // Create an order first
      const { storage } = require('../../../server/storage');
      
      const order = await storage.createOrder({
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 129.99,
        shippingAddress: '101 Payment St, Payment City'
      });
      
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: order.id,
          amount: order.total,
          method: 'credit_card',
          status: PaymentStatus.PENDING
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('orderId', order.id);
      expect(res.body).toHaveProperty('amount', order.total);
    });

    it('should get a payment by order ID', async () => {
      // Create an order and payment first
      const { storage } = require('../../../server/storage');
      
      const order = await storage.createOrder({
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 89.99,
        shippingAddress: '202 Get Payment St, Get Payment City'
      });
      
      await storage.createPayment({
        orderId: order.id,
        amount: order.total,
        method: 'paypal',
        status: PaymentStatus.PENDING
      });
      
      const res = await request(app)
        .get(`/api/payments/order/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orderId', order.id);
      expect(res.body).toHaveProperty('method', 'paypal');
    });

    it('should update a payment status', async () => {
      // Create an order and payment first
      const { storage } = require('../../../server/storage');
      
      const order = await storage.createOrder({
        userId: testUser.id,
        status: OrderStatus.PENDING,
        total: 79.99,
        shippingAddress: '303 Update Payment St, Update Payment City'
      });
      
      const payment = await storage.createPayment({
        orderId: order.id,
        amount: order.total,
        method: 'credit_card',
        status: PaymentStatus.PENDING
      });
      
      const res = await request(app)
        .put(`/api/payments/${payment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: PaymentStatus.COMPLETED });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', payment.id);
      expect(res.body).toHaveProperty('status', PaymentStatus.COMPLETED);
    });
  });

  describe('Service Status API', () => {
    it('should get all service statuses', async () => {
      // Create some service statuses first
      const { storage } = require('../../../server/storage');
      
      await storage.updateServiceStatus('product-service', 'healthy', 'Operating normally');
      await storage.updateServiceStatus('user-service', 'healthy', 'Operating normally');
      await storage.updateServiceStatus('cart-service', 'healthy', 'Operating normally');
      
      const res = await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${adminAuthToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get status for a specific service', async () => {
      // Create a service status first
      const { storage } = require('../../../server/storage');
      
      await storage.updateServiceStatus('order-service', 'healthy', 'Operating normally');
      
      const res = await request(app)
        .get('/api/status/order-service')
        .set('Authorization', `Bearer ${adminAuthToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'order-service');
      expect(res.body).toHaveProperty('status', 'healthy');
    });

    it('should update a service status if admin', async () => {
      // Mock session to be authenticated as admin
      jest.spyOn(app.request, 'session', 'get').mockReturnValue({
        user: adminUser,
        save: jest.fn((cb) => cb && cb())
      });
      
      const res = await request(app)
        .put('/api/status/payment-service')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({ status: 'warning', details: 'High load detected' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'payment-service');
      expect(res.body).toHaveProperty('status', 'warning');
      expect(res.body).toHaveProperty('details', 'High load detected');
    });

    it('should not allow service status update for non-admin users', async () => {
      // Mock session to be authenticated as regular user
      jest.spyOn(app.request, 'session', 'get').mockReturnValue({
        user: testUser,
        save: jest.fn((cb) => cb && cb())
      });
      
      const res = await request(app)
        .put('/api/status/notification-service')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'error', details: 'Service is down' });
      
      expect(res.status).toBe(403);
    });
  });
});