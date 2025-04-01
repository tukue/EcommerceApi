import { ServiceClient } from './service-client';
import { ServiceRegistry } from './service-registry';
import { Cart, CartItem, InsertCart, InsertCartItem, CartWithItems } from '@shared/schema';

/**
 * Client for communicating with the Cart Service
 */
export class CartServiceClient extends ServiceClient {
  constructor() {
    const registry = ServiceRegistry.getInstance();
    const serviceConfig = registry.getService('cart-service');
    
    if (!serviceConfig) {
      throw new Error('Cart service not registered');
    }
    
    super(serviceConfig.url, serviceConfig.name);
  }
  
  /**
   * Get cart by ID
   */
  async getCart(id: number): Promise<Cart | undefined> {
    try {
      return await this.get<Cart>(`/${id}`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Get cart by user ID
   */
  async getCartByUserId(userId: number): Promise<Cart | undefined> {
    try {
      return await this.get<Cart>(`/user/${userId}`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Create cart
   */
  async createCart(cart: InsertCart): Promise<Cart> {
    return this.post<Cart>('', cart);
  }
  
  /**
   * Get cart with items
   */
  async getCartWithItems(cartId: number): Promise<CartWithItems | undefined> {
    try {
      return await this.get<CartWithItems>(`/${cartId}/items`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Add item to cart
   */
  async addItemToCart(cartId: number, productId: number, quantity: number): Promise<CartItem> {
    return this.post<CartItem>(`/${cartId}/items`, { productId, quantity });
  }
  
  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(itemId: number, quantity: number): Promise<CartItem | undefined> {
    try {
      return await this.put<CartItem>(`/items/${itemId}`, { quantity });
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Remove item from cart
   */
  async removeCartItem(itemId: number): Promise<boolean> {
    try {
      await this.delete(`/items/${itemId}`);
      return true;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }
  
  /**
   * Clear cart
   */
  async clearCart(cartId: number): Promise<boolean> {
    try {
      await this.delete(`/${cartId}/items`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get cart items
   */
  async getCartItems(cartId: number): Promise<CartItem[]> {
    return this.get<CartItem[]>(`/${cartId}/items/raw`);
  }
}