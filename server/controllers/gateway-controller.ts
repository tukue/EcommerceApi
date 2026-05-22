import type { Request, Response } from "express";
import * as gatewayService from "../services/gateway";

export async function getServiceStatuses(_req: Request, res: Response) {
  try {
    const statuses = await gatewayService.getServiceStatuses();
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getSystemMetrics(_req: Request, res: Response) {
  try {
    const metrics = await gatewayService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getApiTrafficStats(_req: Request, res: Response) {
  try {
    const traffic = await gatewayService.getApiTrafficStats();
    res.json(traffic);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getContainerStatuses(_req: Request, res: Response) {
  try {
    const containers = await gatewayService.getContainerStatuses();
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
