import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { Payment } from '@shared/schema';

export const fetchPayment = async (id: number): Promise<Payment> => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

export const processPayment = async (
  orderId: number, 
  paymentMethod: string, 
  mockSuccess: boolean = true
): Promise<Payment> => {
  const response = await api.post(`/orders/${orderId}/payment`, { 
    paymentMethod,
    mockSuccess
  });
  
  await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
  await queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
  
  return response.data;
};
