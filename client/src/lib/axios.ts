import axios from 'axios';
import { queryClient } from './queryClient';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear any user data from the query cache
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
    return Promise.reject(error);
  }
);

export default api;
