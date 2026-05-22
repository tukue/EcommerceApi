import type { Request, Response } from "express";
import { z } from "zod";
import * as userService from "../services/user-service";
import { insertUserSchema } from "@shared/schema";

function requireOwnershipOrAdmin(req: Request, res: Response, userId: number): boolean {
  if (!req.session.user) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  if (userId !== req.session.user.id && !req.session.user.isAdmin) {
    res.status(403).json({ error: "Access denied" });
    return false;
  }
  return true;
}

export async function getUsers(_req: Request, res: Response) {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);
    if (!requireOwnershipOrAdmin(req, res, userId)) return;

    const user = await userService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);
    if (!requireOwnershipOrAdmin(req, res, userId)) return;

    const { email, firstName, lastName } = req.body;
    const updateData: Partial<{ email: string; firstName: string; lastName: string }> = {};
    if (email) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    const updatedUser = await userService.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updatePassword(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = Number(req.params.id);
    if (userId !== req.session.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    const user = await userService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isAuthenticated = await userService.authenticateUser(user.username, currentPassword);
    if (!isAuthenticated) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    await userService.updateUser(userId, { password: newPassword });
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createUser(req: Request, res: Response) {
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
}
