import type { Request, Response } from "express";
import * as userService from "../services/user-service";

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await userService.authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin || false,
    };

    res.json({ user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ success: true });
  });
}

export function getCurrentUser(req: Request, res: Response) {
  res.json({ user: req.session.user || null });
}
