import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { CartWithItems } from '@shared/schema';

export const fetchCart = async (): Promise<CartWithItems> => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCart = async (productId: number, quantity: number): Promise<CartWithItems> => {
  const response = await api.post('/cart/items', { productId, quantity });
  await queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
  return response.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number): Promise<CartWithItems> => {
  const response = await api.put(`/cart/items/${cartItemId}`, { quantity });
  await queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
  return response.data;
};

export const removeCartItem = async (cartItemId: number): Promise<CartWithItems> => {
  const response = await api.delete(`/cart/items/${cartItemId}`);
  await queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
  return response.data;
};
