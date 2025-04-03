import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import session from "express-session";

// Extend Express session types to include user
declare module 'express-session' {
  interface SessionData {
    user: {
      id: number;
      username: string;
      email: string;
      isAdmin: boolean;
    };
  }
}

// Import services
import * as productService from "./services/product-service";
import * as userService from "./services/user-service";
import * as cartService from "./services/cart-service";
import * as orderService from "./services/order-service";
import * as paymentService from "./services/payment-service";
import * as notificationService from "./services/notification-service";
import * as gatewayService from "./services/gateway";
import * as stripeService from "./services/stripe-service";

// Import service integration
import { isStripeConfigured, ServiceRegistry, services } from './integration';

// Import types and schemas
import { 
  insertProductSchema, 
  insertUserSchema, 
  insertCartItemSchema,
  OrderStatus,
  PaymentStatus,
  ServiceStatus,
  User
} from "@shared/schema";

const addItemSchema = z.object({
  productId: z.number().positive(),
  quantity: z.number().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session
  app.use(
    session({
      secret: "microstore-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

  // API Gateway Routes

  /**
   * @swagger
   * /api/services/status:
   *   get:
   *     summary: Retrieve the status of all services
   *     tags:
   *       - API Gateway
   *     responses:
   *       200:
   *         description: A list of service statuses
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ServiceStatus'
   */
  app.get("/api/services/status", async (req, res) => {
    try {
      const statuses = await gatewayService.getServiceStatuses();
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/gateway/metrics:
   *   get:
   *     summary: Retrieve system metrics
   *     tags:
   *       - API Gateway
   *     responses:
   *       200:
   *         description: System metrics
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SystemMetrics'
   */
  app.get("/api/gateway/metrics", async (req, res) => {
    try {
      const metrics = await gatewayService.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/gateway/traffic", async (req, res) => {
    try {
      const traffic = await gatewayService.getApiTrafficStats();
      res.json(traffic);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/gateway/containers", async (req, res) => {
    try {
      const containers = await gatewayService.getContainerStatuses();
      res.json(containers);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // User Service Routes

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Retrieve a list of users
   *     tags:
   *       - User Service
   *     responses:
   *       200:
   *         description: A list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   */
  app.get("/api/users", async (req, res) => {
    try {
      const users = await userService.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Retrieve a user by ID
   *     tags:
   *       - User Service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The ID of the user
   *     responses:
   *       200:
   *         description: A user object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   */
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await userService.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await userService.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Product Service Routes

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: Retrieve a list of products
   *     tags:
   *       - Product Service
   *     responses:
   *       200:
   *         description: A list of products
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Product'
   */
  app.get("/api/products", async (req, res) => {
    try {
      const products = await productService.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Retrieve a product by ID
   *     tags:
   *       - Product Service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The ID of the product
   *     responses:
   *       200:
   *         description: A product object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
   *       404:
   *         description: Product not found
   */
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await productService.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await productService.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await productService.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await productService.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Cart Service Routes
  /**
   * @swagger
   * /api/cart:
   *   get:
   *     summary: Retrieve the current user's cart
   *     tags:
   *       - Cart Service
   *     responses:
   *       200:
   *         description: The user's cart
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Cart'
   *       401:
   *         description: Not authenticated
   */
  app.get("/api/cart", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Ensure cart exists
      const userCart = await cartService.getCartByUserId(req.session.user.id);
      
      if (!userCart) {
        // Create a new cart if one doesn't exist
        const newCart = await cartService.createCart({ userId: req.session.user.id });
        return res.json(await cartService.getCartWithItems(newCart.id));
      }
      
      const cartWithItems = await cartService.getCartWithItems(userCart.id);
      res.json(cartWithItems);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/cart/items", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { productId, quantity } = addItemSchema.parse(req.body);
      
      // Ensure cart exists
      const userCart = await cartService.getCartByUserId(req.session.user.id);
      const cartId = userCart ? userCart.id : 
                    (await cartService.createCart({ userId: req.session.user.id })).id;
      
      const cartItem = await cartService.addItemToCart(
        cartId,
        productId,
        quantity
      );
      
      // Get the latest cart state
      const cartWithItems = await cartService.getCartWithItems(cartId);
      
      res.status(201).json(cartWithItems);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/cart/items/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = Number(req.params.id);
      const { quantity } = req.body;
      
      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }
      
      const updatedItem = await cartService.updateCartItemQuantity(id, quantity);
      
      if (!updatedItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      const userCart = await cartService.getCartByUserId(req.session.user.id);
      if (!userCart) {
        return res.status(404).json({ error: "Cart not found" });
      }
      const cartWithItems = await cartService.getCartWithItems(userCart.id);
      
      res.json(cartWithItems);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/cart/items/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = Number(req.params.id);
      const deleted = await cartService.removeCartItem(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      const userCart = await cartService.getCartByUserId(req.session.user.id);
      if (!userCart) {
        return res.status(404).json({ error: "Cart not found" });
      }
      const cartWithItems = await cartService.getCartWithItems(userCart.id);
      
      res.json(cartWithItems);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Order Service Routes
  app.get("/api/orders", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      let orders;
      if (req.session.user.isAdmin) {
        orders = await orderService.getOrders();
      } else {
        orders = await orderService.getOrdersByUserId(req.session.user.id);
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = Number(req.params.id);
      const order = await orderService.getOrderWithItems(id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Only allow admin or the order owner to access
      if (!req.session.user.isAdmin && order.userId !== req.session.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { shippingAddress } = req.body;
      
      if (!shippingAddress) {
        return res.status(400).json({ error: "Shipping address is required" });
      }
      
      const order = await orderService.createOrderFromCart(
        req.session.user.id,
        shippingAddress
      );
      
      if (!order) {
        return res.status(400).json({ error: "Failed to create order" });
      }
      
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const id = Number(req.params.id);
      const { status } = req.body;
      
      if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const order = await orderService.updateOrderStatus(id, status as OrderStatus);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Payment Service Routes
  app.get("/api/payments/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = Number(req.params.id);
      const payment = await paymentService.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // Get the order to check ownership
      const order = await orderService.getOrder(payment.orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Associated order not found" });
      }
      
      // Only allow admin or the order owner to access
      if (!req.session.user.isAdmin && order.userId !== req.session.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/orders/:id/payment", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const orderId = Number(req.params.id);
      const { paymentMethod, mockSuccess } = req.body;
      
      if (!paymentMethod) {
        return res.status(400).json({ error: "Payment method is required" });
      }
      
      const order = await orderService.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Only allow the order owner to make payment
      if (order.userId !== req.session.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const payment = await paymentService.processPayment(
        orderId,
        order.total,
        paymentMethod,
        mockSuccess !== false
      );
      
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/payments/create-intent", async (req, res) => {
    try {
      const { amount, currency, metadata } = req.body;

      if (!amount || typeof amount !== "number") {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        currency || "usd",
        metadata || {}
      );

      res.status(201).json(paymentIntent);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/payments/confirm-intent", async (req, res) => {
    try {
      const { paymentIntentId, paymentMethodId } = req.body;

      if (!paymentIntentId || !paymentMethodId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const confirmedIntent = await stripeService.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId
      );

      res.status(200).json(confirmedIntent);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/payments/refund", async (req, res) => {
    try {
      const { paymentIntentId, amount } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }

      const refund = await stripeService.createRefund(paymentIntentId, amount);

      res.status(201).json(refund);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Notification Service Routes
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const notifications = await notificationService.getUserNotifications(req.session.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/notifications/send", async (req, res) => {
    try {
      if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { recipientId, type, subject, message, metadata } = req.body;
      
      if (!recipientId || !type || !subject || !message) {
        return res.status(400).json({ error: "Required fields missing" });
      }
      
      /**
       * @swagger
       * /api/notifications/send:
       *   post:
       *     summary: Send a notification to a user
       *     tags:
       *       - Notification Service
       *     requestBody:
       *       required: true
       *       content:
       *         application/json:
       *           schema:
       *             type: object
       *             properties:
       *               recipientId:
       *                 type: integer
       *                 description: The ID of the recipient
       *               type:
       *                 type: string
       *                 description: The type of notification
       *               subject:
       *                 type: string
       *                 description: The subject of the notification
       *               message:
       *                 type: string
       *                 description: The message content
       *               metadata:
       *                 type: object
       *                 description: Additional metadata for the notification
       *     responses:
       *       201:
       *         description: Notification sent successfully
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       *               properties:
       *                 id:
       *                   type: integer
       *                   description: The ID of the notification
       *                 recipientId:
       *                   type: integer
       *                   description: The ID of the recipient
       *                 type:
       *                   type: string
       *                   description: The type of notification
       *                 subject:
       *                   type: string
       *                   description: The subject of the notification
       *                 message:
       *                   type: string
       *                   description: The message content
       *                 metadata:
       *                   type: object
       *                   description: Additional metadata for the notification
       *       400:
       *         description: Bad request, missing or invalid fields
       *       403:
       *         description: Admin access required
       *       500:
       *         description: Internal server error
       */
      const notification = await notificationService.sendNotification({
        recipientId,
        type,
        subject,
        message,
        metadata
      });
      
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  /**
   * @swagger
   * /api/notifications/config/email:
   *   put:
   *     summary: Update email notification settings
   *     tags:
   *       - Notification Service
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               defaultRecipient:
   *                 type: string
   *                 description: Default recipient email address
   *               enabled:
   *                 type: boolean
   *                 description: Whether email notifications are enabled
   *               from:
   *                 type: string
   *                 description: Sender email address
   *     responses:
   *       200:
   *         description: Email configuration updated successfully
   *       403:
   *         description: Admin access required
   *       500:
   *         description: Internal server error
   */
  app.put("/api/notifications/config/email", async (req, res) => {
    try {
      if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { defaultRecipient, enabled, from } = req.body;
      
      const configUpdate: Record<string, any> = {};
      if (defaultRecipient !== undefined) configUpdate.defaultRecipient = defaultRecipient;
      if (enabled !== undefined) configUpdate.enabled = Boolean(enabled);
      if (from !== undefined) configUpdate.from = from;
      
      notificationService.configureEmailSettings(configUpdate);
      
      res.json({ success: true, message: "Email configuration updated" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/users/health:
   *   get:
   *     summary: Check health of the user service
   *     tags:
   *       - Health Check
   *     responses:
   *       200:
   *         description: User service is healthy
   */
  app.get("/api/users/health", (req, res) => {
    res.json({ status: "healthy", service: "user-service" });
  });

  /**
   * @swagger
   * /api/products/health:
   *   get:
   *     summary: Check health of the product service
   *     tags:
   *       - Health Check
   *     responses:
   *       200:
   *         description: Product service is healthy
   */
  app.get("/api/products/health", (req, res) => {
    res.json({ status: "healthy", service: "product-service" });
  });

  /**
   * @swagger
   * /api/cart/health:
   *   get:
   *     summary: Check health of the cart service
   *     tags:
   *       - Health Check
   *     responses:
   *       200:
   *         description: Cart service is healthy
   */
  app.get("/api/cart/health", (req, res) => {
    res.json({ status: "healthy", service: "cart-service" });
  });

  /**
   * @swagger
   * /api/orders/health:
   *   get:
   *     summary: Check health of the order service
   *     tags:
   *       - Health Check
   *     responses:
   *       200:
   *         description: Order service is healthy
   */
  app.get("/api/orders/health", (req, res) => {
    res.json({ status: "healthy", service: "order-service" });
  });

  /**
   * @swagger
   * /api/payments/health:
   *   get:
   *     summary: Check health of the payment service
   *     tags:
   *       - Health Check
   *     responses:
   *       200:
   *         description: Payment service is healthy
   *       500:
   *         description: Payment service is not configured
   */
  app.get("/api/payments/health", (req, res) => {
    try {
      const isHealthy = isStripeConfigured();
      if (isHealthy) {
        res.json({ status: "healthy", service: "payment-service" });
      } else {
        res.status(500).json({ status: "error", service: "payment-service", message: "Stripe is not configured" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/notifications/health:
   *   get:
   *     summary: Check health of the notification service
   *     tags:
   *       - Health Check
   *     responses:
   *       200:
   *         description: Notification service is healthy
   */
  app.get("/api/notifications/health", (req, res) => {
    res.json({ status: "healthy", service: "notification-service" });
  });

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Check health of all services
   *     tags:
   *       - Health Check
   *     responses:
   *       200:
   *         description: All services are healthy
   *       500:
   *         description: One or more services are unhealthy
   */
  app.get("/api/health", async (req, res) => {
    try {
      const serviceHealth = await services.checkServicesHealth();
      res.json({
        status: "healthy",
        services: serviceHealth,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
