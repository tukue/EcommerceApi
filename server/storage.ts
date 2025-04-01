import {
  users, products, carts, cartItems, orders, orderItems, payments, serviceStatuses,
  type User, type InsertUser, type Product, type InsertProduct,
  type Cart, type InsertCart, type CartItem, type InsertCartItem,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Payment, type InsertPayment, type ServiceStatus, type InsertServiceStatus,
  OrderStatus, PaymentStatus, ServiceStatus as ServiceStatusEnum
} from "@shared/schema";

// Storage Interface
export interface IStorage {
  // User Service
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Product Service
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Cart Service
  getCart(id: number): Promise<Cart | undefined>;
  getCartByUserId(userId: number): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  getCartItems(cartId: number): Promise<CartItem[]>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;

  // Order Service
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Payment Service
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByOrderId(orderId: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: PaymentStatus): Promise<Payment | undefined>;

  // Service Status
  getServiceStatus(name: string): Promise<ServiceStatus | undefined>;
  getServiceStatuses(): Promise<ServiceStatus[]>;
  updateServiceStatus(name: string, status: ServiceStatusEnum, details?: string): Promise<ServiceStatus>;
}

// In-Memory Storage Implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private carts: Map<number, Cart>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private payments: Map<number, Payment>;
  private serviceStatuses: Map<string, ServiceStatus>;

  private userId: number;
  private productId: number;
  private cartId: number;
  private cartItemId: number;
  private orderId: number;
  private orderItemId: number;
  private paymentId: number;
  private serviceStatusId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.payments = new Map();
    this.serviceStatuses = new Map();

    this.userId = 1;
    this.productId = 1;
    this.cartId = 1;
    this.cartItemId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.paymentId = 1;
    this.serviceStatusId = 1;

    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "admin",
      email: "admin@microstore.com",
      firstName: "Admin",
      lastName: "User",
    }).then(user => {
      // Update admin status manually
      const adminUser = { ...user, isAdmin: true };
      this.users.set(adminUser.id, adminUser);
    });

    // Initialize with some products
    this.createProduct({
      name: "Wireless Bluetooth Headphones",
      description: "Premium noise-cancelling headphones with 30-hour battery life",
      price: 129.99,
      sku: "HDX-1290",
      inventory: 50,
      category: "Electronics",
    });

    this.createProduct({
      name: "Smart Fitness Watch",
      description: "Track your health metrics, workouts, and notifications",
      price: 89.95,
      sku: "FIT-8832",
      inventory: 8,
      category: "Wearables",
    });

    this.createProduct({
      name: "Ergonomic Office Chair",
      description: "Comfortable mesh chair with lumbar support and adjustable height",
      price: 199.00,
      sku: "CHR-5521",
      inventory: 25,
      category: "Furniture",
    });

    // Initialize service statuses
    this.initializeServiceStatuses();
  }

  private initializeServiceStatuses() {
    const services = [
      { name: "API Gateway", status: ServiceStatusEnum.HEALTHY, details: "Gateway is functioning correctly" },
      { name: "Product Service", status: ServiceStatusEnum.HEALTHY, details: "Service is operating normally" },
      { name: "User Service", status: ServiceStatusEnum.WARNING, details: "High CPU Usage (87%)" },
      { name: "Order Service", status: ServiceStatusEnum.HEALTHY, details: "Service is operating normally" },
      { name: "Cart Service", status: ServiceStatusEnum.HEALTHY, details: "Service is operating normally" },
      { name: "Payment Service", status: ServiceStatusEnum.ERROR, details: "Connection refused to payment gateway" },
      { name: "Notification Service", status: ServiceStatusEnum.HEALTHY, details: "Service is operating normally" },
    ];

    services.forEach(service => {
      this.updateServiceStatus(service.name, service.status, service.details);
    });
  }

  // User Service Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product Service Methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productUpdate };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Cart Service Methods
  async getCart(id: number): Promise<Cart | undefined> {
    return this.carts.get(id);
  }

  async getCartByUserId(userId: number): Promise<Cart | undefined> {
    return Array.from(this.carts.values()).find(
      (cart) => cart.userId === userId,
    );
  }

  async createCart(insertCart: InsertCart): Promise<Cart> {
    const id = this.cartId++;
    const createdAt = new Date();
    const cart: Cart = { ...insertCart, id, createdAt };
    this.carts.set(id, cart);
    return cart;
  }

  async getCartItems(cartId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.cartId === cartId,
    );
  }

  async addCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if the item already exists in the cart
    const existingItem = Array.from(this.cartItems.values()).find(
      (item) => item.cartId === insertCartItem.cartId && item.productId === insertCartItem.productId,
    );

    if (existingItem) {
      // Update the quantity of the existing item
      return this.updateCartItem(existingItem.id, existingItem.quantity + insertCartItem.quantity) as Promise<CartItem>;
    }

    // Add a new item to the cart
    const id = this.cartItemId++;
    const cartItem: CartItem = { ...insertCartItem, id };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;

    // Remove the item if the quantity is 0 or less
    if (quantity <= 0) {
      this.cartItems.delete(id);
      return { ...cartItem, quantity: 0 };
    }

    // Update the quantity
    const updatedItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  // Order Service Methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId,
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const createdAt = new Date();
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt,
      // Ensure order ID is in format ORD-XXXX
      orderId: `ORD-${String(id).padStart(4, '0')}` 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId,
    );
  }

  async addOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemId++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Payment Service Methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByOrderId(orderId: number): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(
      (payment) => payment.orderId === orderId,
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentId++;
    const createdAt = new Date();
    const payment: Payment = { ...insertPayment, id, createdAt };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePaymentStatus(id: number, status: PaymentStatus): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment = { ...payment, status };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Service Status Methods
  async getServiceStatus(name: string): Promise<ServiceStatus | undefined> {
    return this.serviceStatuses.get(name);
  }

  async getServiceStatuses(): Promise<ServiceStatus[]> {
    return Array.from(this.serviceStatuses.values());
  }

  async updateServiceStatus(name: string, status: ServiceStatusEnum, details?: string): Promise<ServiceStatus> {
    const existingStatus = this.serviceStatuses.get(name);
    
    if (existingStatus) {
      const updatedStatus = { 
        ...existingStatus, 
        status, 
        details: details || existingStatus.details,
        lastUpdated: new Date()
      };
      this.serviceStatuses.set(name, updatedStatus);
      return updatedStatus;
    }
    
    // Create a new status if it doesn't exist
    const id = this.serviceStatusId++;
    const lastUpdated = new Date();
    const serviceStatus: ServiceStatus = { 
      id, 
      name, 
      status, 
      details: details || "", 
      lastUpdated 
    };
    this.serviceStatuses.set(name, serviceStatus);
    return serviceStatus;
  }
}

// Create and export a singleton instance
export const storage = new MemStorage();
