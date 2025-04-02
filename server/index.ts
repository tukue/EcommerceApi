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
