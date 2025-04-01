import { pool } from './simple-db.js';
import * as schema from '../shared/schema.js';

export async function initDatabase() {
  console.log('Initializing database...');

  try {
    // Check if the database connection is working
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as now');
      console.log('Database connection successful!', result.rows[0].now);
    } finally {
      client.release();
    }

    await createTablesIfNotExist();
    await seedDatabase();

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function checkTableExists(tableName: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

export async function createTablesIfNotExist() {
  console.log('Checking and creating tables if they do not exist...');
  
  const client = await pool.connect();
  try {
    // Start a transaction
    await client.query('BEGIN');

    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(255),
        sku VARCHAR(255) NOT NULL UNIQUE,
        inventory INTEGER,
        category VARCHAR(255)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL REFERENCES carts(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(255)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS service_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'healthy',
        details TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Tables created successfully!');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function seedDatabase() {
  console.log('Checking if database needs seeding...');
  
  // Only seed if the users table is empty
  const client = await pool.connect();
  try {
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('Database already has data, skipping seed.');
      return;
    }
    
    console.log('Seeding database with initial data...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Create admin user
    const adminResult = await client.query(`
      INSERT INTO users (username, password, email, first_name, last_name, is_admin) 
      VALUES ('admin', 'admin123', 'admin@example.com', 'Admin', 'User', TRUE)
      RETURNING id
    `);
    const adminId = adminResult.rows[0].id;
    
    // Create regular user
    const userResult = await client.query(`
      INSERT INTO users (username, password, email, first_name, last_name, is_admin) 
      VALUES ('user', 'user123', 'user@example.com', 'Regular', 'User', FALSE)
      RETURNING id
    `);
    const userId = userResult.rows[0].id;
    
    // Create sample products
    const product1Result = await client.query(`
      INSERT INTO products (name, description, price, sku, inventory, category) 
      VALUES ('Laptop', 'Powerful laptop for work and gaming', 999.99, 'LPT-001', 50, 'Electronics')
      RETURNING id
    `);
    const product1Id = product1Result.rows[0].id;
    
    const product2Result = await client.query(`
      INSERT INTO products (name, description, price, sku, inventory, category) 
      VALUES ('Smartphone', 'Latest smartphone with advanced features', 699.99, 'SPH-001', 100, 'Electronics')
      RETURNING id
    `);
    const product2Id = product2Result.rows[0].id;
    
    const product3Result = await client.query(`
      INSERT INTO products (name, description, price, sku, inventory, category) 
      VALUES ('Headphones', 'Noise-cancelling wireless headphones', 199.99, 'HDP-001', 75, 'Audio')
      RETURNING id
    `);
    const product3Id = product3Result.rows[0].id;
    
    // Create cart for user
    const cartResult = await client.query(`
      INSERT INTO carts (user_id) VALUES ($1) RETURNING id
    `, [userId]);
    const cartId = cartResult.rows[0].id;
    
    // Add items to cart
    await client.query(`
      INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, 1)
    `, [cartId, product1Id]);
    
    await client.query(`
      INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, 2)
    `, [cartId, product3Id]);
    
    // Create an order for user
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, status, total, shipping_address) 
      VALUES ($1, 'completed', 399.99, '123 Main St, Anytown, USA')
      RETURNING id
    `, [userId]);
    const orderId = orderResult.rows[0].id;
    
    // Add items to order
    await client.query(`
      INSERT INTO order_items (order_id, product_id, quantity, price) 
      VALUES ($1, $2, 1, 199.99)
    `, [orderId, product3Id]);
    
    await client.query(`
      INSERT INTO order_items (order_id, product_id, quantity, price) 
      VALUES ($1, $2, 1, 199.99)
    `, [orderId, product3Id]);
    
    // Create payment for order
    await client.query(`
      INSERT INTO payments (order_id, amount, status, payment_method, transaction_id) 
      VALUES ($1, 399.99, 'completed', 'credit_card', 'txn_123456789')
    `, [orderId]);
    
    // Create service statuses
    await client.query(`
      INSERT INTO service_statuses (name, status, details) VALUES 
      ('user-service', 'healthy', 'User service running normally'),
      ('product-service', 'healthy', 'Product service running normally'),
      ('cart-service', 'healthy', 'Cart service running normally'),
      ('order-service', 'healthy', 'Order service running normally'),
      ('payment-service', 'healthy', 'Payment service running normally'),
      ('notification-service', 'healthy', 'Notification service running normally')
    `);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database seeded successfully!');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function setupDatabase() {
  try {
    await initDatabase();
    return true;
  } catch (error) {
    console.error('Database setup failed:', error);
    return false;
  }
}