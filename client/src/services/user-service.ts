import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { User, InsertUser } from '@shared/schema';

export const login = async (username: string, password: string): Promise<{ user: User }> => {
  const response = await api.post('/auth/login', { username, password });
  await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
  await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get('/auth/me');
    return response.data.user;
  } catch (error) {
    return null;
  }
};

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const fetchUser = async (id: number): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (user: InsertUser): Promise<User> => {
  const response = await api.post('/users', user);
  await queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  return response.data;
};
