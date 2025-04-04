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

// Import storage
import { storage } from "./storage";

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
      // Check if user is authenticated and has permission to view this user
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = Number(req.params.id);

      // Only allow users to view their own profile or admins to view any profile
      if (userId !== req.session.user.id && !req.session.user.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await userService.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't send the password in the response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/users/{id}/profile:
   *   put:
   *     summary: Update a user's profile
   *     tags:
   *       - User Service
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The ID of the user to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *     responses:
   *       200:
   *         description: User profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Access denied
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  app.put("/api/users/:id/profile", async (req, res) => {
    try {
      // Check if user is authenticated and has permission to update this user
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = Number(req.params.id);

      // Only allow users to update their own profile or admins to update any profile
      if (userId !== req.session.user.id && !req.session.user.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Extract allowed fields from request body
      const { email, firstName, lastName } = req.body;
      const updateData: Partial<{ email: string; firstName: string; lastName: string }> = {};

      if (email) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;

      // Update the user
      const updatedUser = await userService.updateUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't send the password in the response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/users/{id}/password:
   *   put:
   *     summary: Update a user's password
   *     tags:
   *       - User Service
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The ID of the user to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password updated successfully
   *       401:
   *         description: Not authenticated or incorrect current password
   *       403:
   *         description: Access denied
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  app.put("/api/users/:id/password", async (req, res) => {
    try {
      // Check if user is authenticated and has permission to update this user
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = Number(req.params.id);

      // Only allow users to update their own password
      if (userId !== req.session.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      // Get the user
      const user = await userService.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isAuthenticated = await userService.authenticateUser(user.username, currentPassword);

      if (!isAuthenticated) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update the password
      await userService.updateUser(userId, { password: newPassword });

      res.json({ success: true, message: "Password updated successfully" });
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

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Authenticate a user
   *     tags:
   *       - Authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Authentication failed
   */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await userService.authenticateUser(username, password);

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Store user in session (excluding password)
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false
      };

      res.json({ user: req.session.user });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Log out the current user
   *     tags:
   *       - Authentication
   *     responses:
   *       200:
   *         description: Logout successful
   */
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get the current authenticated user
   *     tags:
   *       - Authentication
   *     responses:
   *       200:
   *         description: Current user information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   */
  app.get("/api/auth/me", (req, res) => {
    if (req.session.user) {
      res.json({ user: req.session.user });
    } else {
      res.json({ user: null });
    }
  });

  // Product Service Routes

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: Retrieve a list of products with optional filtering
   *     tags:
   *       - Product Service
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term to filter products by name, description, or category
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter products by category
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *         description: Minimum price filter
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *         description: Maximum price filter
   *       - in: query
   *         name: inStock
   *         schema:
   *           type: boolean
   *         description: Filter for products in stock (true) or all products (false/omitted)
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [price, name, category]
   *         description: Field to sort results by
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sort order (ascending or descending)
   *     responses:
   *       200:
   *         description: A list of filtered products
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Product'
   */
  app.get("/api/products", async (req, res) => {
    try {
      // Extract filter parameters from query string
      const filters: productService.ProductFilter = {};

      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.category) filters.category = req.query.category as string;

      if (req.query.minPrice) {
        const minPrice = parseFloat(req.query.minPrice as string);
        if (!isNaN(minPrice)) filters.minPrice = minPrice;
      }

      if (req.query.maxPrice) {
        const maxPrice = parseFloat(req.query.maxPrice as string);
        if (!isNaN(maxPrice)) filters.maxPrice = maxPrice;
      }

      if (req.query.inStock) {
        filters.inStock = req.query.inStock === 'true';
      }

      if (req.query.sortBy && ['price', 'name', 'category'].includes(req.query.sortBy as string)) {
        filters.sortBy = req.query.sortBy as 'price' | 'name' | 'category';
      }

      if (req.query.sortOrder && ['asc', 'desc'].includes(req.query.sortOrder as string)) {
        filters.sortOrder = req.query.sortOrder as 'asc' | 'desc';
      }

      const products = await productService.getProducts(Object.keys(filters).length > 0 ? filters : undefined);
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
  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Retrieve a list of orders
   *     description: Returns all orders for admin users, or only the user's own orders for regular users
   *     tags:
   *       - Order Service
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: A list of orders
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Order'
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
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

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Retrieve a specific order by ID
   *     description: Returns detailed information about an order including its items
   *     tags:
   *       - Order Service
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The order ID
   *     responses:
   *       200:
   *         description: Order details with items
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OrderWithItems'
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Access denied - user doesn't own this order and is not an admin
   *       404:
   *         description: Order not found
   *       500:
   *         description: Server error
   */
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

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     summary: Create a new order
   *     description: Creates a new order from the user's current cart
   *     tags:
   *       - Order Service
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - shippingAddress
   *             properties:
   *               shippingAddress:
   *                 type: string
   *                 description: The shipping address for the order
   *     responses:
   *       201:
   *         description: Order created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       400:
   *         description: Bad request - shipping address is required or cart is empty
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
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

  /**
   * @swagger
   * /api/orders/{id}/status:
   *   put:
   *     summary: Update an order's status
   *     description: Updates the status of an existing order (admin only)
   *     tags:
   *       - Order Service
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The order ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, processing, shipped, delivered, completed, cancelled]
   *                 description: The new status for the order
   *     responses:
   *       200:
   *         description: Order status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       400:
   *         description: Bad request - invalid status value
   *       403:
   *         description: Access denied - only admins can update order status
   *       404:
   *         description: Order not found
   *       500:
   *         description: Server error
   */
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
  app.get("/api/users/health", async (req, res) => {
    try {
      // Update service status in the database
      await storage.updateServiceStatus(
        "user-service",
        ServiceStatus.HEALTHY,
        "Service is operating normally"
      );

      res.json({ status: "healthy", service: "user-service" });
    } catch (error) {
      res.status(500).json({
        status: "error",
        service: "user-service",
        message: (error as Error).message
      });
    }
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
  app.get("/api/products/health", async (req, res) => {
    try {
      // Update service status in the database
      await storage.updateServiceStatus(
        "product-service",
        ServiceStatus.HEALTHY,
        "Service is operating normally"
      );

      res.json({ status: "healthy", service: "product-service" });
    } catch (error) {
      res.status(500).json({
        status: "error",
        service: "product-service",
        message: (error as Error).message
      });
    }
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
  app.get("/api/cart/health", async (req, res) => {
    try {
      // Update service status in the database
      await storage.updateServiceStatus(
        "cart-service",
        ServiceStatus.HEALTHY,
        "Service is operating normally"
      );

      res.json({ status: "healthy", service: "cart-service" });
    } catch (error) {
      res.status(500).json({
        status: "error",
        service: "cart-service",
        message: (error as Error).message
      });
    }
  });

  /**
   * @swagger
   * /api/orders/health:
   *   get:
   *     summary: Check health of the order service
   *     description: Returns the health status of the order service
   *     tags:
   *       - Health Check
   *       - Order Service
   *     responses:
   *       200:
   *         description: Order service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 service:
   *                   type: string
   *                   example: order-service
   *       500:
   *         description: Order service is unhealthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 service:
   *                   type: string
   *                   example: order-service
   *                 message:
   *                   type: string
   *                   example: Database connection error
   */
  app.get("/api/orders/health", async (req, res) => {
    try {
      // Update service status in the database
      await storage.updateServiceStatus(
        "order-service",
        ServiceStatus.HEALTHY,
        "Service is operating normally"
      );

      res.json({ status: "healthy", service: "order-service" });
    } catch (error) {
      res.status(500).json({
        status: "error",
        service: "order-service",
        message: (error as Error).message
      });
    }
  });

  /**
   * @swagger
   * /api/payments/health:
   *   get:
   *     summary: Check health of the payment service
   *     description: Returns the health status of the payment service
   *     tags:
   *       - Health Check
   *       - Payment Service
   *     responses:
   *       200:
   *         description: Payment service is healthy or in degraded state
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [healthy, degraded]
   *                   example: healthy
   *                 service:
   *                   type: string
   *                   example: payment-service
   *                 message:
   *                   type: string
   *                   example: Service is operating normally
   */
  app.get("/api/payments/health", async (_req, res) => {
    try {
      // Check if Stripe is configured
      const isStripeConfigured = stripeService.isStripeConfigured();

      if (isStripeConfigured) {
        // Update service status in the database
        await storage.updateServiceStatus(
          "payment-service",
          ServiceStatus.HEALTHY,
          "Service is operating normally"
        );

        res.json({
          status: "healthy",
          service: "payment-service",
          message: "Service is operating normally"
        });
      } else {
        // Update service status in the database with WARNING status instead of ERROR
        await storage.updateServiceStatus(
          "payment-service",
          ServiceStatus.WARNING,
          "Payment gateway not configured - mock payments only"
        );

        // Return 200 status with degraded state
        res.json({
          status: "degraded",
          service: "payment-service",
          message: "Payment gateway not configured - mock payments only"
        });
      }
    } catch (error) {
      // Update service status in the database
      await storage.updateServiceStatus(
        "payment-service",
        ServiceStatus.ERROR,
        `Payment service error: ${(error as Error).message}`
      );

      // Still return 200 status with degraded state to avoid breaking the service catalog
      res.json({
        status: "degraded",
        service: "payment-service",
        message: `Payment service error: ${(error as Error).message}`
      });
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
  app.get("/api/notifications/health", async (req, res) => {
    try {
      // Update service status in the database
      await storage.updateServiceStatus(
        "notification-service",
        ServiceStatus.HEALTHY,
        "Service is operating normally"
      );

      res.json({ status: "healthy", service: "notification-service" });
    } catch (error) {
      res.status(500).json({
        status: "error",
        service: "notification-service",
        message: (error as Error).message
      });
    }
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
