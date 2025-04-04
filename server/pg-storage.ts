import { db } from './db.js';
import { eq, desc } from 'drizzle-orm';
import {
  users, products, carts, cartItems, orders, orderItems, payments, serviceStatuses,
  User, InsertUser, Product, InsertProduct, Cart, InsertCart, CartItem, InsertCartItem,
  Order, InsertOrder, OrderItem, InsertOrderItem, Payment, InsertPayment,
  ServiceStatus, OrderStatus, PaymentStatus, ServiceStatus as ServiceStatusEnum
} from '../shared/schema';
import { IStorage } from './storage';
import { DbServiceStatus, dbToServiceStatus, validateOrderStatus, validatePaymentStatus, validateServiceStatus } from './db-types';

export class PgStorage implements IStorage {
  // User Service
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0] as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return results[0] as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      username: user.username,
      password: user.password,
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      isAdmin: false
    }).returning();
    return result[0] as User;
  }

  async getUsers(): Promise<User[]> {
    const results = await db.select().from(users);
    return results as User[];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0] as User;
  }

  // Product Service
  async getProduct(id: number): Promise<Product | undefined> {
    const results = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return results[0] as Product;
  }

  async getProducts(): Promise<Product[]> {
    const results = await db.select().from(products);
    return results as Product[];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values({
      name: product.name,
      description: product.description || null,
      price: product.price,
      imageUrl: product.imageUrl || null,
      sku: product.sku,
      inventory: product.inventory || null,
      category: product.category || null
    }).returning();
    return result[0] as Product;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const values: any = {};

    if (product.name !== undefined) values.name = product.name;
    if (product.description !== undefined) values.description = product.description;
    if (product.price !== undefined) values.price = product.price;
    if (product.imageUrl !== undefined) values.imageUrl = product.imageUrl;
    if (product.sku !== undefined) values.sku = product.sku;
    if (product.inventory !== undefined) values.inventory = product.inventory;
    if (product.category !== undefined) values.category = product.category;

    const result = await db.update(products)
      .set(values)
      .where(eq(products.id, id))
      .returning();

    return result[0] as Product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  // Cart Service
  async getCart(id: number): Promise<Cart | undefined> {
    const results = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
    return results[0] as Cart;
  }

  async getCartByUserId(userId: number): Promise<Cart | undefined> {
    const results = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    return results[0] as Cart;
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const result = await db.insert(carts).values({
      userId: cart.userId
    }).returning();
    return result[0] as Cart;
  }

  async getCartItems(cartId: number): Promise<CartItem[]> {
    const results = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
    return results as CartItem[];
  }

  async addCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const result = await db.insert(cartItems).values({
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      quantity: cartItem.quantity || 1
    }).returning();
    return result[0] as CartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const result = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();

    return result[0] as CartItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id)).returning();
    return result.length > 0;
  }

  // Order Service
  async getOrder(id: number): Promise<Order | undefined> {
    const results = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return results[0] as Order;
  }

  async getOrders(): Promise<Order[]> {
    const results = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return results.map((order: any) => ({
      ...order,
      status: validateOrderStatus(order.status)
    })) as Order[];
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    const results = await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    return results.map((order: any) => ({
      ...order,
      status: validateOrderStatus(order.status)
    })) as Order[];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values({
      userId: order.userId,
      status: order.status || OrderStatus.PENDING,
      total: order.total,
      shippingAddress: order.shippingAddress || null
    }).returning();
    return {
      ...result[0],
      status: validateOrderStatus(result[0].status)
    } as Order;
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();

    if (result.length === 0) return undefined;

    return {
      ...result[0],
      status: validateOrderStatus(result[0].status)
    } as Order;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const results = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return results as OrderItem[];
  }

  async addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values({
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      price: orderItem.price
    }).returning();
    return result[0] as OrderItem;
  }

  // Payment Service
  async getPayment(id: number): Promise<Payment | undefined> {
    const results = await db.select().from(payments).where(eq(payments.id, id)).limit(1);

    if (results.length === 0) return undefined;

    return {
      ...results[0],
      status: validatePaymentStatus(results[0].status)
    } as Payment;
  }

  async getPaymentByOrderId(orderId: number): Promise<Payment | undefined> {
    const results = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);

    if (results.length === 0) return undefined;

    return {
      ...results[0],
      status: validatePaymentStatus(results[0].status)
    } as Payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values({
      orderId: payment.orderId,
      amount: payment.amount,
      status: payment.status || PaymentStatus.PENDING,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId || null
    }).returning();

    return {
      ...result[0],
      status: validatePaymentStatus(result[0].status)
    } as Payment;
  }

  async updatePaymentStatus(id: number, status: PaymentStatus): Promise<Payment | undefined> {
    const result = await db.update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();

    if (result.length === 0) return undefined;

    return {
      ...result[0],
      status: validatePaymentStatus(result[0].status)
    } as Payment;
  }

  // Service Status
  async getServiceStatus(name: string): Promise<ServiceStatus | undefined> {
    const results = await db.select().from(serviceStatuses).where(eq(serviceStatuses.name, name)).limit(1);

    if (results.length === 0) return undefined;

    return dbToServiceStatus(results[0] as DbServiceStatus);
  }

  async getServiceStatuses(): Promise<ServiceStatus[]> {
    const results = await db.select().from(serviceStatuses);
    return results.map((status: any) => dbToServiceStatus(status as DbServiceStatus));
  }

  async updateServiceStatus(name: string, status: ServiceStatusEnum, details?: string): Promise<ServiceStatus> {
    // Try to update first
    const updateResult = await db.update(serviceStatuses)
      .set({
        status: status as string,
        details: details || null,
        lastUpdated: new Date()
      })
      .where(eq(serviceStatuses.name, name))
      .returning();

    if (updateResult.length > 0) {
      return dbToServiceStatus(updateResult[0] as DbServiceStatus);
    }

    // If update didn't affect any rows, insert a new record
    const insertResult = await db.insert(serviceStatuses)
      .values({
        name,
        status: status as string,
        details: details || null
      })
      .returning();

    return dbToServiceStatus(insertResult[0] as DbServiceStatus);
  }
}