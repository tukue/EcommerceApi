import { ServiceClient } from './service-client';
import { ServiceRegistry } from './service-registry';
import { User, InsertUser } from '@shared/schema';

/**
 * Client for communicating with the User Service
 */
export class UserServiceClient extends ServiceClient {
  constructor() {
    const registry = ServiceRegistry.getInstance();
    const serviceConfig = registry.getService('user-service');
    
    if (!serviceConfig) {
      throw new Error('User service not registered');
    }
    
    super(serviceConfig.url, serviceConfig.name);
  }
  
  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    return this.get<User[]>('');
  }
  
  /**
   * Get user by ID
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      return await this.get<User>(`/${id}`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      return await this.get<User>(`/by-username/${username}`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }
  
  /**
   * Create user
   */
  async createUser(user: InsertUser): Promise<User> {
    return this.post<User>('', user);
  }
  
  /**
   * Authenticate user
   */
  async authenticateUser(username: string, password: string): Promise<User | undefined> {
    try {
      return await this.post<User>('/login', { username, password });
    } catch (error: any) {
      if (error.response && (error.response.status === 401 || error.response.status === 404)) {
        return undefined;
      }
      throw error;
    }
  }
}