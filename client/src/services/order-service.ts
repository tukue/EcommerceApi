import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { Order, OrderWithItems, OrderStatus } from '@shared/schema';

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders');
  return response.data;
};

export const fetchOrder = async (id: number): Promise<OrderWithItems> => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (shippingAddress: string): Promise<OrderWithItems> => {
  const response = await api.post('/orders', { shippingAddress });
  await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
  await queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
  return response.data;
};

export const updateOrderStatus = async (id: number, status: OrderStatus): Promise<Order> => {
  const response = await api.put(`/orders/${id}/status`, { status });
  await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
  await queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
  return response.data;
};
