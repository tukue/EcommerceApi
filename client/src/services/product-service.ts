import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { Product, InsertProduct } from '@shared/schema';

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products');
  return response.data;
};

export const fetchProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (product: InsertProduct): Promise<Product> => {
  const response = await api.post('/products', product);
  await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  return response.data;
};

export const updateProduct = async (id: number, product: Partial<InsertProduct>): Promise<Product> => {
  const response = await api.put(`/products/${id}`, product);
  await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  await queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
  return response.data;
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/products/${id}`);
  await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  return response.data.success;
};
