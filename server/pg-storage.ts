import { db } from "./db.js";
import { eq, desc } from "drizzle-orm";
import {
  users, products, carts, cartItems, orders, orderItems, payments, serviceStatuses,
  type User, type InsertUser, type Product, type InsertProduct,
  type Cart, type InsertCart, type CartItem, type InsertCartItem,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Payment, type InsertPayment, type ServiceStatusRecord,
  OrderStatus, PaymentStatus, ServiceStatus as ServiceStatusEnum
} from "../shared/schema";
import { IStorage } from "./storage";
import { dbToServiceStatus, validateOrderStatus, validatePaymentStatus } from "./db-types";

function firstRow<T>(rows: T[]): T | undefined {
  return rows[0];
}

export class PgStorage implements IStorage {
  // User Service
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return firstRow(results);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return firstRow(results);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      username: user.username,
      password: user.password,
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      isAdmin: false,
    }).returning();
    return firstRow(result)!;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return firstRow(result);
  }

  // Product Service
  async getProduct(id: number): Promise<Product | undefined> {
    const results = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return firstRow(results);
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values({
      name: product.name,
      description: product.description || null,
      price: product.price,
      imageUrl: product.imageUrl || null,
      sku: product.sku,
      inventory: product.inventory ?? null,
      category: product.category || null,
    }).returning();
    return firstRow(result)!;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const values: Partial<InsertProduct> = {};
    for (const [key, value] of Object.entries(product)) {
      if (value !== undefined) {
        (values as Record<string, unknown>)[key] = value;
      }
    }

    const result = await db.update(products)
      .set(values)
      .where(eq(products.id, id))
      .returning();

    return firstRow(result);
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  // Cart Service
  async getCart(id: number): Promise<Cart | undefined> {
    const results = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
    return firstRow(results);
  }

  async getCartByUserId(userId: number): Promise<Cart | undefined> {
    const results = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    return firstRow(results);
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const result = await db.insert(carts).values({ userId: cart.userId }).returning();
    return firstRow(result)!;
  }

  async getCartItems(cartId: number): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async addCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const result = await db.insert(cartItems).values({
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      quantity: cartItem.quantity || 1,
    }).returning();
    return firstRow(result)!;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const result = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return firstRow(result);
  }

  async removeCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id)).returning();
    return result.length > 0;
  }

  // Order Service
  async getOrder(id: number): Promise<Order | undefined> {
    const results = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return firstRow(results);
  }

  async getOrders(): Promise<Order[]> {
    const results = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return results.map((order) => ({
      ...order,
      status: validateOrderStatus(order.status),
    }));
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    const results = await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    return results.map((order) => ({
      ...order,
      status: validateOrderStatus(order.status),
    }));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values({
      userId: order.userId,
      status: (order.status as OrderStatus | undefined) ?? OrderStatus.PENDING,
      total: order.total,
      shippingAddress: order.shippingAddress || null,
    }).returning();
    const row = firstRow(result)!;
    return { ...row, status: validateOrderStatus(row.status) };
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();

    const row = firstRow(result);
    if (!row) return undefined;
    return { ...row, status: validateOrderStatus(row.status) };
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values({
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      price: orderItem.price,
    }).returning();
    return firstRow(result)!;
  }

  // Payment Service
  async getPayment(id: number): Promise<Payment | undefined> {
    const results = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    const row = firstRow(results);
    if (!row) return undefined;
    return { ...row, status: validatePaymentStatus(row.status) };
  }

  async getPaymentByOrderId(orderId: number): Promise<Payment | undefined> {
    const results = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
    const row = firstRow(results);
    if (!row) return undefined;
    return { ...row, status: validatePaymentStatus(row.status) };
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values({
      orderId: payment.orderId,
      amount: payment.amount,
      status: (payment.status as PaymentStatus | undefined) ?? PaymentStatus.PENDING,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId || null,
    }).returning();
    const row = firstRow(result)!;
    return { ...row, status: validatePaymentStatus(row.status) };
  }

  async updatePaymentStatus(id: number, status: PaymentStatus): Promise<Payment | undefined> {
    const result = await db.update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();

    const row = firstRow(result);
    if (!row) return undefined;
    return { ...row, status: validatePaymentStatus(row.status) };
  }

  // Service Status
  async getServiceStatus(name: string): Promise<ServiceStatusRecord | undefined> {
    const results = await db.select().from(serviceStatuses).where(eq(serviceStatuses.name, name)).limit(1);
    const row = firstRow(results);
    if (!row) return undefined;
    return dbToServiceStatus(row);
  }

  async getServiceStatuses(): Promise<ServiceStatusRecord[]> {
    const results = await db.select().from(serviceStatuses);
    return results.map((status) => dbToServiceStatus(status));
  }

  async updateServiceStatus(name: string, status: ServiceStatusEnum, details?: string): Promise<ServiceStatusRecord> {
    const updateResult = await db.update(serviceStatuses)
      .set({
        status,
        details: details || null,
        lastUpdated: new Date(),
      })
      .where(eq(serviceStatuses.name, name))
      .returning();

    if (updateResult.length > 0) {
      return dbToServiceStatus(updateResult[0]);
    }

    const insertResult = await db.insert(serviceStatuses)
      .values({ name, status, details: details || null })
      .returning();

    return dbToServiceStatus(insertResult[0]);
  }
}
