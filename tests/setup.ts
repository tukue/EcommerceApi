import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg-core';
import * as schema from '../shared/schema';

// Mock database for testing
export const mockDb = () => {
  // Return a mock drizzle instance with mocked query functions
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis()
  };
};

// Mock storage for testing
export class MockStorage {
  private users: Map<number, schema.User> = new Map();
  private products: Map<number, schema.Product> = new Map();
  private carts: Map<number, schema.Cart> = new Map();
  private cartItems: Map<number, schema.CartItem> = new Map();
  private orders: Map<number, schema.Order> = new Map();
  private orderItems: Map<number, schema.OrderItem> = new Map();
  private payments: Map<number, schema.Payment> = new Map();
  private serviceStatuses: Map<string, schema.ServiceStatus> = new Map();
  
  private nextId = 1;
  
  // Helper to get next ID
  private getNextId(): number {
    return this.nextId++;
  }
  
  // User Service methods
  async getUser(id: number): Promise<schema.User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const id = this.getNextId();
    const newUser: schema.User = { ...user, id, isAdmin: false };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async getUsers(): Promise<schema.User[]> {
    return Array.from(this.users.values());
  }
  
  // Product Service methods
  async getProduct(id: number): Promise<schema.Product | undefined> {
    return this.products.get(id);
  }
  
  async getProducts(): Promise<schema.Product[]> {
    return Array.from(this.products.values());
  }
  
  async createProduct(product: schema.InsertProduct): Promise<schema.Product> {
    const id = this.getNextId();
    const newProduct: schema.Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, update: Partial<schema.InsertProduct>): Promise<schema.Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...update };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  // Cart Service methods
  async getCart(id: number): Promise<schema.Cart | undefined> {
    return this.carts.get(id);
  }
  
  async getCartByUserId(userId: number): Promise<schema.Cart | undefined> {
    return Array.from(this.carts.values()).find(cart => cart.userId === userId);
  }
  
  async createCart(cart: schema.InsertCart): Promise<schema.Cart> {
    const id = this.getNextId();
    const newCart: schema.Cart = { ...cart, id, createdAt: new Date() };
    this.carts.set(id, newCart);
    return newCart;
  }
  
  async getCartItems(cartId: number): Promise<schema.CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.cartId === cartId);
  }
  
  async addCartItem(cartItem: schema.InsertCartItem): Promise<schema.CartItem> {
    const id = this.getNextId();
    const newCartItem: schema.CartItem = { ...cartItem, id };
    this.cartItems.set(id, newCartItem);
    return newCartItem;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<schema.CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    const updatedCartItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }
  
  async removeCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }
  
  // Order Service methods
  async getOrder(id: number): Promise<schema.Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrders(): Promise<schema.Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrdersByUserId(userId: number): Promise<schema.Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }
  
  async createOrder(order: schema.InsertOrder): Promise<schema.Order> {
    const id = this.getNextId();
    const now = new Date();
    const newOrder: schema.Order = { 
      ...order, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: schema.OrderStatus): Promise<schema.Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async getOrderItems(orderId: number): Promise<schema.OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }
  
  async addOrderItem(orderItem: schema.InsertOrderItem): Promise<schema.OrderItem> {
    const id = this.getNextId();
    const newOrderItem: schema.OrderItem = { ...orderItem, id };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }
  
  // Payment Service methods
  async getPayment(id: number): Promise<schema.Payment | undefined> {
    return this.payments.get(id);
  }
  
  async getPaymentByOrderId(orderId: number): Promise<schema.Payment | undefined> {
    return Array.from(this.payments.values()).find(payment => payment.orderId === orderId);
  }
  
  async createPayment(payment: schema.InsertPayment): Promise<schema.Payment> {
    const id = this.getNextId();
    const newPayment: schema.Payment = { ...payment, id, createdAt: new Date() };
    this.payments.set(id, newPayment);
    return newPayment;
  }
  
  async updatePaymentStatus(id: number, status: schema.PaymentStatus): Promise<schema.Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, status, updatedAt: new Date() };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  // Service Status methods
  async getServiceStatus(name: string): Promise<schema.ServiceStatus | undefined> {
    return this.serviceStatuses.get(name);
  }
  
  async getServiceStatuses(): Promise<schema.ServiceStatus[]> {
    return Array.from(this.serviceStatuses.values());
  }
  
  async updateServiceStatus(
    name: string, 
    status: schema.ServiceStatus, 
    details?: string
  ): Promise<schema.ServiceStatus> {
    const id = this.serviceStatuses.get(name)?.id ?? this.getNextId();
    const now = new Date();
    
    const serviceStatus: schema.ServiceStatus = { 
      id,
      name,
      status,
      details: details || null,
      lastUpdated: now,
      createdAt: this.serviceStatuses.get(name)?.createdAt || now
    };
    
    this.serviceStatuses.set(name, serviceStatus);
    return serviceStatus;
  }
}