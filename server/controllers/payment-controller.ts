import type { Request, Response } from "express";
import * as paymentService from "../services/payment-service";
import * as orderService from "../services/order-service";
import * as stripeService from "../services/stripe-service";

export async function getPayment(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);
    const payment = await paymentService.getPayment(id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const order = await orderService.getOrder(payment.orderId);
    if (!order) {
      return res.status(404).json({ error: "Associated order not found" });
    }

    if (!req.session.user.isAdmin && order.userId !== req.session.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function processOrderPayment(req: Request, res: Response) {
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

    if (order.userId !== req.session.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const payment = await paymentService.processPayment(orderId, order.total, paymentMethod, mockSuccess !== false);
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency, metadata } = req.body;

    if (!amount || typeof amount !== "number") {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await stripeService.createPaymentIntent(amount, currency || "usd", metadata || {});
    res.status(201).json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function confirmPaymentIntent(req: Request, res: Response) {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const confirmedIntent = await stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
    res.status(200).json(confirmedIntent);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function refundPayment(req: Request, res: Response) {
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
}
