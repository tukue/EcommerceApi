import { storage } from "../storage";
import { insertProductSchema, type Product, type InsertProduct } from "@shared/schema";
import { z } from "zod";

export const validateProduct = (data: unknown) => {
  return insertProductSchema.parse(data);
};

export const validateProductUpdate = (data: unknown) => {
  return insertProductSchema.partial().parse(data);
};

export interface ProductFilter {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price' | 'name' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export const getProducts = async (filters?: ProductFilter): Promise<Product[]> => {
  const products = await storage.getProducts();

  if (!filters) {
    return products;
  }

  let filteredProducts = [...products];

  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm)) ||
      (product.category && product.category.toLowerCase().includes(searchTerm))
    );
  }

  // Apply category filter
  if (filters.category) {
    filteredProducts = filteredProducts.filter(product =>
      product.category && product.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  // Apply price range filters
  if (filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.price <= filters.maxPrice!);
  }

  // Apply in-stock filter
  if (filters.inStock !== undefined) {
    filteredProducts = filteredProducts.filter(product =>
      filters.inStock ? (product.inventory && product.inventory > 0) : true
    );
  }

  // Apply sorting
  if (filters.sortBy) {
    filteredProducts.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  return filteredProducts;
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
