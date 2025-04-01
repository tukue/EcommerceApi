import { storage } from "../storage";
import { insertOrderSchema, insertOrderItemSchema, OrderStatus, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type OrderWithItems, type Product } from "@shared/schema";
import { getCartWithItems } from "./cart-service";
import { z } from "zod";

export const validateOrder = (data: unknown) => {
  return insertOrderSchema.parse(data);
};

export const validateOrderItem = (data: unknown) => {
  return insertOrderItemSchema.parse(data);
};

export const getOrders = async (): Promise<Order[]> => {
  return await storage.getOrders();
};

export const getOrder = async (id: number): Promise<Order | undefined> => {
  return await storage.getOrder(id);
};

export const getOrdersByUserId = async (userId: number): Promise<Order[]> => {
  return await storage.getOrdersByUserId(userId);
};

export const createOrder = async (order: InsertOrder): Promise<Order> => {
  try {
    validateOrder(order);
    return await storage.createOrder(order);
  } catch (error) {
    throw error;
  }
};

export const updateOrderStatus = async (id: number, status: OrderStatus): Promise<Order | undefined> => {
  return await storage.updateOrderStatus(id, status);
};

export const getOrderWithItems = async (orderId: number): Promise<OrderWithItems | undefined> => {
  const order = await storage.getOrder(orderId);
  if (!order) return undefined;

  const user = await storage.getUser(order.userId);
  if (!user) return undefined;

  const orderItems = await storage.getOrderItems(orderId);
  const itemsWithProducts: (OrderItem & { product: Product })[] = [];

  for (const item of orderItems) {
    const product = await storage.getProduct(item.productId);
    if (product) {
      itemsWithProducts.push({ ...item, product });
    }
  }

  return {
    ...order,
    items: itemsWithProducts,
    user
  };
};

export const createOrderFromCart = async (userId: number, shippingAddress: string): Promise<OrderWithItems | undefined> => {
  const cart = await storage.getCartByUserId(userId);
  if (!cart) throw new Error("Cart not found");

  const cartWithItems = await getCartWithItems(cart.id);
  if (!cartWithItems || cartWithItems.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // Create the order
  const order = await createOrder({
    userId,
    status: OrderStatus.PENDING,
    total: cartWithItems.subtotal,
    shippingAddress
  });

  // Add order items
  for (const item of cartWithItems.items) {
    await storage.addOrderItem({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price
    });

    // Update inventory
    const product = item.product;
    if (product.inventory) {
      await storage.updateProduct(product.id, {
        inventory: Math.max(0, product.inventory - item.quantity)
      });
    }
  }

  // Clear the cart
  for (const item of cartWithItems.items) {
    await storage.removeCartItem(item.id);
  }

  return getOrderWithItems(order.id);
};
