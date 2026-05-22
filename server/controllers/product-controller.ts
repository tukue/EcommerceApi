import type { Request, Response } from "express";
import { z } from "zod";
import * as productService from "../services/product-service";
import { insertProductSchema } from "@shared/schema";

export function requireAdmin(req: Request, res: Response): boolean {
  if (!req.session.user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

export async function getProducts(req: Request, res: Response) {
  try {
    const filters: productService.ProductFilter = {};

    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.category) filters.category = req.query.category as string;

    if (req.query.minPrice) {
      const minPrice = parseFloat(req.query.minPrice as string);
      if (!isNaN(minPrice)) filters.minPrice = minPrice;
    }

    if (req.query.maxPrice) {
      const maxPrice = parseFloat(req.query.maxPrice as string);
      if (!isNaN(maxPrice)) filters.maxPrice = maxPrice;
    }

    if (req.query.inStock) {
      filters.inStock = req.query.inStock === "true";
    }

    if (req.query.sortBy && ["price", "name", "category"].includes(req.query.sortBy as string)) {
      filters.sortBy = req.query.sortBy as "price" | "name" | "category";
    }

    if (req.query.sortOrder && ["asc", "desc"].includes(req.query.sortOrder as string)) {
      filters.sortOrder = req.query.sortOrder as "asc" | "desc";
    }

    const products = await productService.getProducts(Object.keys(filters).length > 0 ? filters : undefined);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const product = await productService.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createProduct(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;
  try {
    const productData = insertProductSchema.parse(req.body);
    const product = await productService.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateProduct(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const productData = insertProductSchema.partial().parse(req.body);
    const product = await productService.updateProduct(id, productData);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const deleted = await productService.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
