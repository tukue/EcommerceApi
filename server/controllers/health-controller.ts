import type { Request, Response } from "express";
import { storage } from "../storage";
import { ServiceStatus } from "@shared/schema";
import { services } from "../integration";

type ServiceName =
  | "user-service"
  | "product-service"
  | "cart-service"
  | "order-service"
  | "payment-service"
  | "notification-service";

async function checkServiceHealth(_req: Request, res: Response, serviceName: ServiceName) {
  try {
    await storage.updateServiceStatus(serviceName, ServiceStatus.HEALTHY, "Service is operating normally");
    res.json({ status: "healthy", service: serviceName });
  } catch (error) {
    res.status(500).json({
      status: "error",
      service: serviceName,
      message: (error as Error).message,
    });
  }
}

export function userHealth(req: Request, res: Response) {
  return checkServiceHealth(req, res, "user-service");
}

export function productHealth(req: Request, res: Response) {
  return checkServiceHealth(req, res, "product-service");
}

export function cartHealth(req: Request, res: Response) {
  return checkServiceHealth(req, res, "cart-service");
}

export function orderHealth(req: Request, res: Response) {
  return checkServiceHealth(req, res, "order-service");
}

export function paymentHealth(req: Request, res: Response) {
  return checkServiceHealth(req, res, "payment-service");
}

export async function notificationHealth(_req: Request, res: Response) {
  try {
    await storage.updateServiceStatus(
      "notification-service",
      ServiceStatus.HEALTHY,
      "Service is operating normally",
    );
    res.json({ status: "healthy", service: "notification-service" });
  } catch (error) {
    res.status(500).json({
      status: "error",
      service: "notification-service",
      message: (error as Error).message,
    });
  }
}

export async function globalHealth(_req: Request, res: Response) {
  try {
    const healthResults = await services.checkServicesHealth();
    const allHealthy = healthResults.every((s: { status: string }) => s.status === "healthy");
    res.json({
      status: allHealthy ? "healthy" : "degraded",
      services: healthResults,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
