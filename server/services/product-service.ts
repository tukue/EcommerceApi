import { storage } from "../storage";
import { insertProductSchema, type Product, type InsertProduct } from "@shared/schema";
import { z } from "zod";

export const validateProduct = (data: unknown) => {
  return insertProductSchema.parse(data);
};

export const validateProductUpdate = (data: unknown) => {
  return insertProductSchema.partial().parse(data);
};

export const getProducts = async (): Promise<Product[]> => {
  return await storage.getProducts();
};

export const getProduct = async (id: number): Promise<Product | undefined> => {
  return await storage.getProduct(id);
};

export const createProduct = async (product: InsertProduct): Promise<Product> => {
  try {
    validateProduct(product);
    return await storage.createProduct(product);
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (id: number, product: Partial<InsertProduct>): Promise<Product | undefined> => {
  try {
    validateProductUpdate(product);
    return await storage.updateProduct(id, product);
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  return await storage.deleteProduct(id);
};
