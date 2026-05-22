import type { Request, Response } from "express";
import { z } from "zod";
import * as cartService from "../services/cart-service";

const addItemSchema = z.object({
  productId: z.number().positive(),
  quantity: z.number().min(1),
});

export async function getCart(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userCart = await cartService.getCartByUserId(req.session.user.id);

    if (!userCart) {
      const newCart = await cartService.createCart({ userId: req.session.user.id });
      return res.json(await cartService.getCartWithItems(newCart.id));
    }

    const cartWithItems = await cartService.getCartWithItems(userCart.id);
    res.json(cartWithItems);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function addCartItem(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { productId, quantity } = addItemSchema.parse(req.body);

    const userCart = await cartService.getCartByUserId(req.session.user.id);
    const cartId = userCart
      ? userCart.id
      : (await cartService.createCart({ userId: req.session.user.id })).id;

    await cartService.addItemToCart(cartId, productId, quantity);
    const cartWithItems = await cartService.getCartWithItems(cartId);

    res.status(201).json(cartWithItems);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateCartItem(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);
    const { quantity } = req.body;

    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const updatedItem = await cartService.updateCartItemQuantity(id, quantity);
    if (!updatedItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const userCart = await cartService.getCartByUserId(req.session.user.id);
    if (!userCart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const cartWithItems = await cartService.getCartWithItems(userCart.id);
    res.json(cartWithItems);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function removeCartItem(req: Request, res: Response) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);
    const deleted = await cartService.removeCartItem(id);

    if (!deleted) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const userCart = await cartService.getCartByUserId(req.session.user.id);
    if (!userCart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const cartWithItems = await cartService.getCartWithItems(userCart.id);
    res.json(cartWithItems);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
