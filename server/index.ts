import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeStorage, storage } from "./storage";
import { setupDatabase } from "./database.js";
import { ServiceRegistry } from "./integration/service-registry";
import { ServiceStatus } from "@shared/schema";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});

app.use("/api/", limiter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "API documentation for the E-Commerce platform",
    },
    components: {
      schemas: {
        ServiceStatus: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the service" },
            status: {
              type: "string",
              enum: ["healthy", "warning", "error"],
              description: "Health status of the service",
            },
            details: { type: "string", description: "Additional details about the service" },
            lastUpdated: { type: "string", format: "date-time", description: "Last updated timestamp" },
          },
        },
        SystemMetrics: {
          type: "object",
          properties: {
            orders: {
              type: "object",
              properties: {
                count: { type: "integer", description: "Total number of orders" },
                change: { type: "number", description: "Percentage change in orders" },
                period: { type: "string", description: "Time period for the metrics" },
              },
            },
            users: {
              type: "object",
              properties: {
                count: { type: "integer", description: "Total number of users" },
                change: { type: "number", description: "Percentage change in users" },
                period: { type: "string", description: "Time period for the metrics" },
              },
            },
            revenue: {
              type: "object",
              properties: {
                amount: { type: "number", description: "Total revenue" },
                change: { type: "number", description: "Percentage change in revenue" },
                period: { type: "string", description: "Time period for the metrics" },
              },
            },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "integer", description: "The unique identifier for a product" },
            name: { type: "string", description: "The name of the product" },
            description: { type: "string", description: "The description of the product" },
            price: { type: "number", description: "The price of the product" },
            category: { type: "string", description: "The category of the product" },
            inventory: { type: "integer", description: "The inventory count of the product" },
            imageUrl: { type: "string", description: "The URL of the product image" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "integer", description: "The unique identifier for the order" },
            userId: { type: "integer", description: "The ID of the user who placed the order" },
            status: {
              type: "string",
              enum: ["pending", "processing", "shipped", "delivered", "completed", "cancelled"],
              description: "The status of the order",
            },
            total: { type: "number", description: "The total amount for the order" },
            shippingAddress: { type: "string", description: "The shipping address for the order" },
            createdAt: { type: "string", format: "date-time", description: "The date and time the order was created" },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            id: { type: "integer", description: "The unique identifier for the order item" },
            orderId: { type: "integer", description: "The ID of the order this item belongs to" },
            productId: { type: "integer", description: "The ID of the product" },
            quantity: { type: "integer", description: "The quantity of the product" },
            price: { type: "number", description: "The price of the product" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", description: "The unique identifier for the user" },
            username: { type: "string", description: "The username of the user" },
            email: { type: "string", description: "The email of the user" },
            firstName: { type: "string", description: "The first name of the user" },
            lastName: { type: "string", description: "The last name of the user" },
            isAdmin: { type: "boolean", description: "Whether the user is an admin" },
          },
        },
        OrderWithItems: {
          type: "object",
          properties: {
            id: { type: "integer", description: "The unique identifier for the order" },
            userId: { type: "integer", description: "The ID of the user who placed the order" },
            status: {
              type: "string",
              enum: ["pending", "processing", "shipped", "delivered", "completed", "cancelled"],
              description: "The status of the order",
            },
            total: { type: "number", description: "The total amount for the order" },
            shippingAddress: { type: "string", description: "The shipping address for the order" },
            createdAt: { type: "string", format: "date-time", description: "The date and time the order was created" },
            items: {
              type: "array",
              description: "The items in the order",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer", description: "The unique identifier for the order item" },
                  orderId: { type: "integer", description: "The ID of the order this item belongs to" },
                  productId: { type: "integer", description: "The ID of the product" },
                  quantity: { type: "integer", description: "The quantity of the product" },
                  price: { type: "number", description: "The price of the product" },
                  product: { $ref: "#/components/schemas/Product" }
                }
              }
            },
            user: { $ref: "#/components/schemas/User" }
          },
        },
      },
    },
  },
  apis: ["./server/routes.ts"], // Path to your API route definitions
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

(async () => {
  log("Initializing database...");
  try {
    await setupDatabase();
    log("Database setup successful");
  } catch (error) {
    log("Database setup failed: " + (error as Error).message);
    // Continue even if database setup fails, as we'll fallback to MemStorage
  }

  log("Initializing storage...");
  await initializeStorage();

  // Initialize service registry
  log("Initializing service registry...");
  const registry = ServiceRegistry.getInstance();

  // Initialize service statuses
  log("Initializing service statuses...");
  try {
    await storage.updateServiceStatus("user-service", ServiceStatus.HEALTHY, "Service is operating normally");
    await storage.updateServiceStatus("product-service", ServiceStatus.HEALTHY, "Service is operating normally");
    await storage.updateServiceStatus("cart-service", ServiceStatus.HEALTHY, "Service is operating normally");
    await storage.updateServiceStatus("order-service", ServiceStatus.HEALTHY, "Service is operating normally");
    await storage.updateServiceStatus("payment-service", ServiceStatus.HEALTHY, "Service is operating normally");
    await storage.updateServiceStatus("notification-service", ServiceStatus.HEALTHY, "Service is operating normally");
    await storage.updateServiceStatus("api-gateway", ServiceStatus.HEALTHY, "Service is operating normally");
    log("Services initialized successfully");
  } catch (error) {
    log("Error initializing services: " + (error as Error).message);
    // Continue even if service initialization fails
  }

  log("Setting up routes...");
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
