import { MockStorage } from '../../setup';
import * as userService from '../../../server/services/user-service';
import { InsertUser, User } from '../../../shared/schema';

// Mock the storage
jest.mock('../../../server/storage', () => {
  const mockStorage = new MockStorage();
  return { storage: mockStorage };
});

describe('User Service', () => {
  const mockUser: InsertUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };

  let createdUser: User;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test data
    createdUser = await userService.createUser(mockUser);
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const newUser: InsertUser = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'newpassword123'
      };
      
      const result = await userService.createUser(newUser);
      
      expect(result).toBeDefined();
      expect(result.username).toBe(newUser.username);
      expect(result.email).toBe(newUser.email);
      expect(result.id).toBeDefined();
      expect(result.isAdmin).toBe(false);
      
      // Password should be handled securely
      expect(result.password).not.toBe(newUser.password);
    });
    
    it('should not allow duplicate usernames', async () => {
      const duplicateUser: InsertUser = {
        username: mockUser.username,
        email: 'another@example.com',
        password: 'anotherpassword'
      };
      
      await expect(userService.createUser(duplicateUser)).rejects.toThrow();
    });
  });

  describe('getUsers', () => {
    it('should return a list of users', async () => {
      const users = await userService.getUsers();
      
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users).toContainEqual(expect.objectContaining({
        username: mockUser.username,
        email: mockUser.email
      }));
    });
  });

  describe('getUser', () => {
    it('should return a user by ID', async () => {
      const user = await userService.getUser(createdUser.id);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.username).toBe(mockUser.username);
    });

    it('should return undefined for non-existent user', async () => {
      const user = await userService.getUser(999);
      
      expect(user).toBeUndefined();
    });
  });

  describe('getUserByUsername', () => {
    it('should return a user by username', async () => {
      const user = await userService.getUserByUsername(mockUser.username);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.username).toBe(mockUser.username);
    });

    it('should return undefined for non-existent username', async () => {
      const user = await userService.getUserByUsername('nonexistentuser');
      
      expect(user).toBeUndefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const result = await userService.verifyPassword(createdUser, mockUser.password);
      
      expect(result).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const result = await userService.verifyPassword(createdUser, 'wrongpassword');
      
      expect(result).toBe(false);
    });
  });
});