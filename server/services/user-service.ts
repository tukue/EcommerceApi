import { storage } from "../storage";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { z } from "zod";
import * as authService from "./auth-service";

export const validateUser = (data: unknown) => {
  return insertUserSchema.parse(data);
};

export const getUsers = async (): Promise<User[]> => {
  return await storage.getUsers();
};

export const getUser = async (id: number): Promise<User | undefined> => {
  return await storage.getUser(id);
};

export const getUserByUsername = async (username: string): Promise<User | undefined> => {
  return await storage.getUserByUsername(username);
};

export const createUser = async (user: InsertUser): Promise<User> => {
  try {
    validateUser(user);
    // Use auth service to hash password and create user
    return await authService.registerUser(user);
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (id: number, userData: Partial<InsertUser>): Promise<User | undefined> => {
  // If password is being updated, hash it first
  if (userData.password) {
    userData.password = await authService.hashPassword(userData.password);
  }

  return await storage.updateUser(id, userData);
};

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  // Use auth service for authentication
  return await authService.authenticateUser(username, password);
};
