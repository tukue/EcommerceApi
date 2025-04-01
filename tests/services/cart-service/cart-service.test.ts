import { MockStorage } from '../../setup';
import * as cartService from '../../../server/services/cart-service';
import { InsertCart, InsertCartItem, InsertProduct, InsertUser, Cart, CartItem, Product, User } from '../../../shared/schema';

// Mock the storage
jest.mock('../../../server/storage', () => {
  const mockStorage = new MockStorage();
  return { storage: mockStorage };
});

describe('Cart Service', () => {
  let testUser: User;
  let testProduct: Product;
  let testCart: Cart;
  let testCartItem: CartItem;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test data
    const mockUser: InsertUser = {
      username: 'cartuser',
      email: 'cart@example.com',
      password: 'password123'
    };
    
    const mockProduct: InsertProduct = {
      name: 'Cart Test Product',
      description: 'Product for cart testing',
      price: 19.99,
      category: 'Test',
      inventory: 10,
      imageUrl: 'https://example.com/image.jpg'
    };
    
    // Need to access the storage mock directly
    const { storage } = require('../../../server/storage');
    
    testUser = await storage.createUser(mockUser);
    testProduct = await storage.createProduct(mockProduct);
    
    const mockCart: InsertCart = {
      userId: testUser.id
    };
    
    testCart = await cartService.createCart(mockCart);
    
    const mockCartItem: InsertCartItem = {
      cartId: testCart.id,
      productId: testProduct.id,
      quantity: 2
    };
    
    testCartItem = await cartService.addItemToCart(testCart.id, testProduct.id, 2);
  });

  describe('createCart', () => {
    it('should create a new cart', async () => {
      const newUserData: InsertUser = {
        username: 'newcartuser',
        email: 'newcart@example.com',
        password: 'password123'
      };
      
      const { storage } = require('../../../server/storage');
      const newUser = await storage.createUser(newUserData);
      
      const newCart: InsertCart = {
        userId: newUser.id
      };
      
      const result = await cartService.createCart(newCart);
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(newUser.id);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getCart', () => {
    it('should return a cart by ID', async () => {
      const cart = await cartService.getCart(testCart.id);
      
      expect(cart).toBeDefined();
      expect(cart?.id).toBe(testCart.id);
      expect(cart?.userId).toBe(testUser.id);
    });

    it('should return undefined for non-existent cart', async () => {
      const cart = await cartService.getCart(999);
      
      expect(cart).toBeUndefined();
    });
  });

  describe('getCartByUserId', () => {
    it('should return a cart by user ID', async () => {
      const cart = await cartService.getCartByUserId(testUser.id);
      
      expect(cart).toBeDefined();
      expect(cart?.id).toBe(testCart.id);
      expect(cart?.userId).toBe(testUser.id);
    });

    it('should return undefined for non-existent user cart', async () => {
      const cart = await cartService.getCartByUserId(999);
      
      expect(cart).toBeUndefined();
    });
  });

  describe('getCartWithItems', () => {
    it('should return a cart with items', async () => {
      const cartWithItems = await cartService.getCartWithItems(testCart.id);
      
      expect(cartWithItems).toBeDefined();
      expect(cartWithItems?.id).toBe(testCart.id);
      expect(cartWithItems?.items).toBeDefined();
      expect(cartWithItems?.items.length).toBeGreaterThan(0);
      expect(cartWithItems?.items[0].productId).toBe(testProduct.id);
      expect(cartWithItems?.totalItems).toBe(2);
      expect(cartWithItems?.subtotal).toBe(testProduct.price * 2);
    });
  });

  describe('addItemToCart', () => {
    it('should add a new item to the cart', async () => {
      const { storage } = require('../../../server/storage');
      
      const newProduct: InsertProduct = {
        name: 'Another Cart Product',
        description: 'Another product for testing',
        price: 29.99,
        category: 'Test',
        inventory: 5,
        imageUrl: 'https://example.com/another-image.jpg'
      };
      
      const product = await storage.createProduct(newProduct);
      
      const cartItem = await cartService.addItemToCart(testCart.id, product.id, 3);
      
      expect(cartItem).toBeDefined();
      expect(cartItem.cartId).toBe(testCart.id);
      expect(cartItem.productId).toBe(product.id);
      expect(cartItem.quantity).toBe(3);
      
      // Check if the cart now has the new item
      const cartWithItems = await cartService.getCartWithItems(testCart.id);
      expect(cartWithItems?.items.length).toBe(2);
      expect(cartWithItems?.totalItems).toBe(5); // 2 + 3
    });
    
    it('should update quantity if item already exists', async () => {
      // Add the same product again
      const cartItem = await cartService.addItemToCart(testCart.id, testProduct.id, 3);
      
      expect(cartItem).toBeDefined();
      expect(cartItem.cartId).toBe(testCart.id);
      expect(cartItem.productId).toBe(testProduct.id);
      expect(cartItem.quantity).toBe(5); // 2 + 3
      
      // Check if the cart still has only one item but with updated quantity
      const cartWithItems = await cartService.getCartWithItems(testCart.id);
      expect(cartWithItems?.items.length).toBe(1);
      expect(cartWithItems?.totalItems).toBe(5);
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update the quantity of an existing cart item', async () => {
      const updatedItem = await cartService.updateCartItemQuantity(testCartItem.id, 4);
      
      expect(updatedItem).toBeDefined();
      expect(updatedItem?.id).toBe(testCartItem.id);
      expect(updatedItem?.quantity).toBe(4);
      
      // Check if the cart reflects the updated quantity
      const cartWithItems = await cartService.getCartWithItems(testCart.id);
      expect(cartWithItems?.totalItems).toBe(4);
    });

    it('should return undefined for non-existent cart item', async () => {
      const result = await cartService.updateCartItemQuantity(999, 3);
      
      expect(result).toBeUndefined();
    });
  });

  describe('removeCartItem', () => {
    it('should remove an item from the cart', async () => {
      const result = await cartService.removeCartItem(testCartItem.id);
      
      expect(result).toBe(true);
      
      // Check if the cart no longer has the item
      const cartWithItems = await cartService.getCartWithItems(testCart.id);
      expect(cartWithItems?.items.length).toBe(0);
      expect(cartWithItems?.totalItems).toBe(0);
    });

    it('should return false for non-existent cart item', async () => {
      const result = await cartService.removeCartItem(999);
      
      expect(result).toBe(false);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from the cart', async () => {
      // Add another item to ensure multiple items are cleared
      const { storage } = require('../../../server/storage');
      
      const anotherProduct = await storage.createProduct({
        name: 'One More Product',
        description: 'Another product for testing clear cart',
        price: 15.99,
        category: 'Test',
        inventory: 8,
        imageUrl: 'https://example.com/one-more-image.jpg'
      });
      
      await cartService.addItemToCart(testCart.id, anotherProduct.id, 1);
      
      // Verify we have multiple items
      let cartWithItems = await cartService.getCartWithItems(testCart.id);
      expect(cartWithItems?.items.length).toBe(2);
      
      // Clear the cart
      const result = await cartService.clearCart(testCart.id);
      
      expect(result).toBe(true);
      
      // Check if the cart is empty
      cartWithItems = await cartService.getCartWithItems(testCart.id);
      expect(cartWithItems?.items.length).toBe(0);
      expect(cartWithItems?.totalItems).toBe(0);
      expect(cartWithItems?.subtotal).toBe(0);
    });
  });
});