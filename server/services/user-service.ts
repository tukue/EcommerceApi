import { storage } from "../storage";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { z } from "zod";

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
    return await storage.createUser(user);
  } catch (error) {
    throw error;
  }
};

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  const user = await getUserByUsername(username);
  
  if (!user || user.password !== password) {
    return null;
  }
  
  return user;
};
