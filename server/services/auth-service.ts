import bcrypt from 'bcryptjs';
import { storage } from "../storage";
import { User } from "@shared/schema";

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password
 * @param hashedPassword Hashed password
 * @returns True if passwords match
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Authenticate a user with username and password
 * @param username Username
 * @param password Plain text password
 * @returns User object if authentication successful, null otherwise
 */
export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  const user = await storage.getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  // If the password is not hashed (legacy), compare directly
  if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$') && !user.password.startsWith('$2y$')) {
    if (user.password === password) {
      // Migrate to hashed password
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, { password: hashedPassword });
      return user;
    }
    return null;
  }
  
  // Compare with hashed password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return null;
  }
  
  return user;
};

/**
 * Register a new user with hashed password
 * @param userData User data with plain text password
 * @returns Created user
 */
export const registerUser = async (userData: { username: string; password: string; email: string; firstName?: string; lastName?: string }): Promise<User> => {
  // Hash the password
  const hashedPassword = await hashPassword(userData.password);
  
  // Create the user with hashed password
  return storage.createUser({
    ...userData,
    password: hashedPassword
  });
};
