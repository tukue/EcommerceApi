// Export all service clients
export * from './service-client';
export * from './service-registry';
export * from './user-service-client';
export * from './product-service-client';
export * from './cart-service-client';
export * from './order-service-client';
export * from './payment-service-client';
export * from './notification-service-client';
export * from './api-gateway-client';

export { isStripeConfigured } from '../services/stripe-service';
// ServiceManager - main entry point for service integration
import { ServiceRegistry } from './service-registry';
import { UserServiceClient } from './user-service-client';
import { ProductServiceClient } from './product-service-client';
import { CartServiceClient } from './cart-service-client';
import { OrderServiceClient } from './order-service-client';
import { PaymentServiceClient } from './payment-service-client';
import { NotificationServiceClient } from './notification-service-client';
import { ApiGatewayClient } from './api-gateway-client';
import { log } from '../vite';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "API documentation for the E-Commerce platform",
    },
    components: {
      schemas: {
        Order: {
          type: "object",
          properties: {
            id: { type: "integer", description: "The unique identifier for the order" },
            userId: { type: "integer", description: "The ID of the user who placed the order" },
            status: {
              type: "string",
              enum: ["pending", "processing", "shipped", "delivered", "completed", "cancelled"],
              description: "The status of the order",
            },
            total: { type: "number", description: "The total amount for the order" },
            shippingAddress: { type: "string", description: "The shipping address for the order" },
            createdAt: { type: "string", format: "date-time", description: "The date and time the order was created" },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            id: { type: "integer", description: "The unique identifier for the order item" },
            orderId: { type: "integer", description: "The ID of the order this item belongs to" },
            productId: { type: "integer", description: "The ID of the product" },
            quantity: { type: "integer", description: "The quantity of the product" },
            price: { type: "number", description: "The price of the product" },
          },
        },
      },
    },
  },
  apis: ["./server/routes.ts"], // Path to your API route definitions
};

/**
 * Service Manager - manages service clients
 */
export class ServiceManager {
  private static instance: ServiceManager;
  
  private registry: ServiceRegistry;
  
  // Service clients
  private _userService: UserServiceClient | null = null;
  private _productService: ProductServiceClient | null = null;
  private _cartService: CartServiceClient | null = null;
  private _orderService: OrderServiceClient | null = null;
  private _paymentService: PaymentServiceClient | null = null;
  private _notificationService: NotificationServiceClient | null = null;
  private _apiGateway: ApiGatewayClient | null = null;
  
  private constructor() {
    this.registry = ServiceRegistry.getInstance();
    log('ServiceManager initialized', 'service-manager');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }
  
  /**
   * Get user service client
   */
  public get users(): UserServiceClient {
    if (!this._userService) {
      try {
        this._userService = new UserServiceClient();
      } catch (error) {
        log(`Error creating UserServiceClient: ${error}`, 'service-manager');
        throw error;
      }
    }
    return this._userService;
  }
  
  /**
   * Get product service client
   */
  public get products(): ProductServiceClient {
    if (!this._productService) {
      try {
        this._productService = new ProductServiceClient();
      } catch (error) {
        log(`Error creating ProductServiceClient: ${error}`, 'service-manager');
        throw error;
      }
    }
    return this._productService;
  }
  
  /**
   * Get cart service client
   */
  public get carts(): CartServiceClient {
    if (!this._cartService) {
      try {
        this._cartService = new CartServiceClient();
      } catch (error) {
        log(`Error creating CartServiceClient: ${error}`, 'service-manager');
        throw error;
      }
    }
    return this._cartService;
  }
  
  /**
   * Get order service client
   */
  public get orders(): OrderServiceClient {
    if (!this._orderService) {
      try {
        this._orderService = new OrderServiceClient();
      } catch (error) {
        log(`Error creating OrderServiceClient: ${error}`, 'service-manager');
        throw error;
      }
    }
    return this._orderService;
  }
  
  /**
   * Get payment service client
   */
  public get payments(): PaymentServiceClient {
    if (!this._paymentService) {
      try {
        this._paymentService = new PaymentServiceClient();
      } catch (error) {
        log(`Error creating PaymentServiceClient: ${error}`, 'service-manager');
        throw error;
      }
    }
    return this._paymentService;
  }
  
  /**
   * Get notification service client
   */
  public get notifications(): NotificationServiceClient {
    if (!this._notificationService) {
      try {
        this._notificationService = new NotificationServiceClient();
      } catch (error) {
        log(`Error creating NotificationServiceClient: ${error}`, 'service-manager');
        throw error;
      }
    }
    return this._notificationService;
  }
  
  /**
   * Get API gateway client
   */
  public get gateway(): ApiGatewayClient {
    if (!this._apiGateway) {
      try {
        this._apiGateway = new ApiGatewayClient();
      } catch (error) {
        log(`Error creating ApiGatewayClient: ${error}`, 'service-manager');
        throw error;
      }
    }
    return this._apiGateway;
  }
  
  /**
   * Check health of all services
   */
  public async checkServicesHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    try {
      health['users'] = await this.users.checkHealth();
    } catch (error) {
      health['users'] = false;
    }
    
    try {
      health['products'] = await this.products.checkHealth();
    } catch (error) {
      health['products'] = false;
    }
    
    try {
      health['carts'] = await this.carts.checkHealth();
    } catch (error) {
      health['carts'] = false;
    }
    
    try {
      health['orders'] = await this.orders.checkHealth();
    } catch (error) {
      health['orders'] = false;
    }
    
    try {
      health['payments'] = await this.payments.checkHealth();
    } catch (error) {
      health['payments'] = false;
    }
    
    try {
      health['notifications'] = await this.notifications.checkHealth();
    } catch (error) {
      health['notifications'] = false;
    }
    
    return health;
  }
}

// Export an instance of the service manager
export const services = ServiceManager.getInstance();