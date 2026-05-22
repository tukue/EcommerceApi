import type { Request, Response } from "express";
import * as notificationService from "../services/notification-service";

export async function getNotifications(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const notifications = await notificationService.getUserNotifications(req.session.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function sendNotification(req: Request, res: Response) {
  try {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { recipientId, type, subject, message, metadata } = req.body;

    if (!recipientId || !type || !subject || !message) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const notification = await notificationService.sendNotification({ recipientId, type, subject, message, metadata });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateEmailConfig(req: Request, res: Response) {
  try {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { defaultRecipient, enabled, from } = req.body;

    const configUpdate: Record<string, unknown> = {};
    if (defaultRecipient !== undefined) configUpdate.defaultRecipient = defaultRecipient;
    if (enabled !== undefined) configUpdate.enabled = Boolean(enabled);
    if (from !== undefined) configUpdate.from = from;

    notificationService.configureEmailSettings(configUpdate);

    res.json({ success: true, message: "Email configuration updated" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
