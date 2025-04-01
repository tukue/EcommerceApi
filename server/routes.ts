import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import session from "express-session";

// Import services
import * as productService from "./services/product-service";
import * as userService from "./services/user-service";
import * as cartService from "./services/cart-service";
import * as orderService from "./services/order-service";
import * as paymentService from "./services/payment-service";
import * as gatewayService from "./services/gateway";

// Import types and schemas
import { 
  insertProductSchema, 
  insertUserSchema, 
  insertCartItemSchema,
  OrderStatus,
  PaymentStatus,
  ServiceStatus
} from "@shared/schema";

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
  app.get("/api/services/status", async (req, res) => {
    try {
      const statuses = await gatewayService.getServiceStatuses();
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

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
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const user = await userService.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Store user in session
      req.session.user = user;
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user: req.session.user });
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await userService.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

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
  app.get("/api/products", async (req, res) => {
    try {
      const products = await productService.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

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
  app.get("/api/cart", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const cart = await cartService.getCartByUserId(req.session.user.id);
      
      if (!cart) {
        // Create a new cart if one doesn't exist
        const newCart = await cartService.createCart({ userId: req.session.user.id });
        return res.json(await cartService.getCartWithItems(newCart.id));
      }
      
      const cartWithItems = await cartService.getCartWithItems(cart.id);
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
      
      const { productId, quantity } = insertCartItemSchema.parse(req.body);
      
      const cartItem = await cartService.addItemToCart(
        req.session.user.id,
        productId,
        quantity
      );
      
      const cart = await cartService.getCartByUserId(req.session.user.id);
      const cartWithItems = await cartService.getCartWithItems(cart!.id);
      
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
      
      const cart = await cartService.getCartByUserId(req.session.user.id);
      const cartWithItems = await cartService.getCartWithItems(cart!.id);
      
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
      
      const cart = await cartService.getCartByUserId(req.session.user.id);
      const cartWithItems = await cartService.getCartWithItems(cart!.id);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
