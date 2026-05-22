import type { Request, Response } from "express";
import { OrderStatus } from "@shared/schema";
import * as orderService from "../services/order-service";

export async function getOrders(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const orders = req.session.user.isAdmin
      ? await orderService.getOrders()
      : await orderService.getOrdersByUserId(req.session.user.id);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);
    const order = await orderService.getOrderWithItems(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!req.session.user.isAdmin && order.userId !== req.session.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { shippingAddress } = req.body;
    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    const order = await orderService.createOrderFromCart(req.session.user.id, shippingAddress);

    if (!order) {
      return res.status(400).json({ error: "Failed to create order" });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    if (!req.session.user?.isAdmin) {
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
}
