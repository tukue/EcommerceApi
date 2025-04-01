import { MockStorage } from '../../setup';
import * as productService from '../../../server/services/product-service';
import { InsertProduct, Product } from '../../../shared/schema';

// Mock the storage
jest.mock('../../../server/storage', () => {
  const mockStorage = new MockStorage();
  return { storage: mockStorage };
});

describe('Product Service', () => {
  const mockProduct: InsertProduct = {
    name: 'Test Product',
    description: 'This is a test product',
    price: 19.99,
    category: 'Test Category',
    inventory: 10,
    imageUrl: 'https://example.com/image.jpg'
  };

  let createdProduct: Product;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test data
    createdProduct = await productService.createProduct(mockProduct);
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const newProduct: InsertProduct = {
        name: 'New Product',
        description: 'This is a new test product',
        price: 29.99,
        category: 'Test Category',
        inventory: 15,
        imageUrl: 'https://example.com/new-image.jpg'
      };
      
      const result = await productService.createProduct(newProduct);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(newProduct.name);
      expect(result.price).toBe(newProduct.price);
      expect(result.id).toBeDefined();
    });
  });

  describe('getProducts', () => {
    it('should return a list of products', async () => {
      const products = await productService.getProducts();
      
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      expect(products).toContainEqual(expect.objectContaining({
        name: mockProduct.name,
        price: mockProduct.price
      }));
    });
  });

  describe('getProduct', () => {
    it('should return a product by ID', async () => {
      const product = await productService.getProduct(createdProduct.id);
      
      expect(product).toBeDefined();
      expect(product?.id).toBe(createdProduct.id);
      expect(product?.name).toBe(mockProduct.name);
    });

    it('should return undefined for non-existent product', async () => {
      const product = await productService.getProduct(999);
      
      expect(product).toBeUndefined();
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const updates = {
        name: 'Updated Product Name',
        price: 24.99
      };
      
      const updatedProduct = await productService.updateProduct(createdProduct.id, updates);
      
      expect(updatedProduct).toBeDefined();
      expect(updatedProduct?.name).toBe(updates.name);
      expect(updatedProduct?.price).toBe(updates.price);
      expect(updatedProduct?.description).toBe(mockProduct.description);
    });

    it('should return undefined for non-existent product', async () => {
      const result = await productService.updateProduct(999, { name: 'New Name' });
      
      expect(result).toBeUndefined();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const result = await productService.deleteProduct(createdProduct.id);
      
      expect(result).toBe(true);
      
      // Check product no longer exists
      const product = await productService.getProduct(createdProduct.id);
      expect(product).toBeUndefined();
    });

    it('should return false for non-existent product', async () => {
      const result = await productService.deleteProduct(999);
      
      expect(result).toBe(false);
    });
  });
});