import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    user: {
      id: number;
      username: string;
      email: string;
      isAdmin: boolean;
    };
  }
}

import * as gatewayCtrl from "./controllers/gateway-controller";
import * as userCtrl from "./controllers/user-controller";
import * as authCtrl from "./controllers/auth-controller";
import * as productCtrl from "./controllers/product-controller";
import * as cartCtrl from "./controllers/cart-controller";
import * as orderCtrl from "./controllers/order-controller";
import * as paymentCtrl from "./controllers/payment-controller";
import * as notificationCtrl from "./controllers/notification-controller";
import * as healthCtrl from "./controllers/health-controller";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "microstore-secret-dev",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" },
    }),
  );

  // ── Gateway ──
  app.get("/api/services/status", gatewayCtrl.getServiceStatuses);
  app.get("/api/gateway/metrics", gatewayCtrl.getSystemMetrics);
  app.get("/api/gateway/traffic", gatewayCtrl.getApiTrafficStats);
  app.get("/api/gateway/containers", gatewayCtrl.getContainerStatuses);

  // ── Users ──
  app.get("/api/users", userCtrl.getUsers);
  app.get("/api/users/:id", userCtrl.getUser);
  app.put("/api/users/:id/profile", userCtrl.updateProfile);
  app.put("/api/users/:id/password", userCtrl.updatePassword);
  app.post("/api/users", userCtrl.createUser);

  // ── Auth ──
  app.post("/api/auth/login", authCtrl.login);
  app.post("/api/auth/logout", authCtrl.logout);
  app.get("/api/auth/me", authCtrl.getCurrentUser);

  // ── Products ──
  app.get("/api/products", productCtrl.getProducts);
  app.get("/api/products/:id", productCtrl.getProduct);
  app.post("/api/products", productCtrl.createProduct);
  app.put("/api/products/:id", productCtrl.updateProduct);
  app.delete("/api/products/:id", productCtrl.deleteProduct);

  // ── Cart ──
  app.get("/api/cart", cartCtrl.getCart);
  app.post("/api/cart/items", cartCtrl.addCartItem);
  app.put("/api/cart/items/:id", cartCtrl.updateCartItem);
  app.delete("/api/cart/items/:id", cartCtrl.removeCartItem);

  // ── Orders ──
  app.get("/api/orders", orderCtrl.getOrders);
  app.get("/api/orders/:id", orderCtrl.getOrder);
  app.post("/api/orders", orderCtrl.createOrder);
  app.put("/api/orders/:id/status", orderCtrl.updateOrderStatus);

  // ── Payments ──
  app.get("/api/payments/:id", paymentCtrl.getPayment);
  app.post("/api/orders/:id/payment", paymentCtrl.processOrderPayment);
  app.post("/api/payments/create-intent", paymentCtrl.createPaymentIntent);
  app.post("/api/payments/confirm-intent", paymentCtrl.confirmPaymentIntent);
  app.post("/api/payments/refund", paymentCtrl.refundPayment);

  // ── Notifications ──
  app.get("/api/notifications", notificationCtrl.getNotifications);
  app.post("/api/notifications/send", notificationCtrl.sendNotification);
  app.put("/api/notifications/config/email", notificationCtrl.updateEmailConfig);

  // ── Health ──
  app.get("/api/users/health", healthCtrl.userHealth);
  app.get("/api/products/health", healthCtrl.productHealth);
  app.get("/api/cart/health", healthCtrl.cartHealth);
  app.get("/api/orders/health", healthCtrl.orderHealth);
  app.get("/api/payments/health", healthCtrl.paymentHealth);
  app.get("/api/notifications/health", healthCtrl.notificationHealth);
  app.get("/api/health", healthCtrl.globalHealth);

  const httpServer = createServer(app);
  return httpServer;
}
