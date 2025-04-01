import { storage } from "../storage";
import { insertCartSchema, insertCartItemSchema, type Cart, type InsertCart, type CartItem, type InsertCartItem, type Product, type CartWithItems } from "@shared/schema";
import { z } from "zod";

export const validateCart = (data: unknown) => {
  return insertCartSchema.parse(data);
};

export const validateCartItem = (data: unknown) => {
  return insertCartItemSchema.parse(data);
};

export const getCart = async (id: number): Promise<Cart | undefined> => {
  return await storage.getCart(id);
};

export const getCartByUserId = async (userId: number): Promise<Cart | undefined> => {
  return await storage.getCartByUserId(userId);
};

export const createCart = async (cart: InsertCart): Promise<Cart> => {
  try {
    validateCart(cart);
    return await storage.createCart(cart);
  } catch (error) {
    throw error;
  }
};

export const getCartWithItems = async (cartId: number): Promise<CartWithItems | undefined> => {
  const cart = await storage.getCart(cartId);
  if (!cart) return undefined;

  const cartItems = await storage.getCartItems(cartId);
  const itemsWithProducts: (CartItem & { product: Product })[] = [];
  let subtotal = 0;
  let totalItems = 0;

  for (const item of cartItems) {
    const product = await storage.getProduct(item.productId);
    if (product) {
      itemsWithProducts.push({ ...item, product });
      subtotal += product.price * item.quantity;
      totalItems += item.quantity;
    }
  }

  return {
    ...cart,
    items: itemsWithProducts,
    subtotal,
    totalItems
  };
};

export const getOrCreateCartForUser = async (userId: number): Promise<Cart> => {
  let cart = await getCartByUserId(userId);
  
  if (!cart) {
    cart = await createCart({ userId });
  }
  
  return cart;
};

export const addItemToCart = async (userId: number, productId: number, quantity: number): Promise<CartItem> => {
  const cart = await getOrCreateCartForUser(userId);
  
  const product = await storage.getProduct(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  
  return await storage.addCartItem({
    cartId: cart.id,
    productId,
    quantity
  });
};

export const updateCartItemQuantity = async (cartItemId: number, quantity: number): Promise<CartItem | undefined> => {
  return await storage.updateCartItem(cartItemId, quantity);
};

export const removeCartItem = async (cartItemId: number): Promise<boolean> => {
  return await storage.removeCartItem(cartItemId);
};

export const clearCart = async (cartId: number): Promise<boolean> => {
  const cartItems = await storage.getCartItems(cartId);
  
  for (const item of cartItems) {
    await storage.removeCartItem(item.id);
  }
  
  return true;
};
