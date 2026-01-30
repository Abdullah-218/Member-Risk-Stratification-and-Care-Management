import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * PostgreSQL Connection Pool Configuration
 * Connects to PostgreSQL database (running in Docker on port 5433)
 */
const pool = new Pool({
  user: process.env.DB_USER || 'abdullah',
  password: process.env.DB_PASSWORD || 'abdullah123',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'risk_predictionDB',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connected successfully');
    console.log(`  Connected to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    return true;
  } catch (error) {
    console.warn('⚠ Database connection warning:', error.message);
    console.warn('  Backend will run in mock mode. Create database for full functionality.');
    return false;
  }
};

/**
 * Execute a query
 */
export const query = (text, params) => {
  return pool.query(text, params);
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = () => {
  return pool.connect();
};

export default pool;
