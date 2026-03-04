import { Pool } from 'pg';

// Create a connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

// Helper function to get a client
export async function getClient() {
  return await pool.connect();
}

// Helper for simple queries
export async function query(text: string, params?: any[]) {
  return await pool.query(text, params);
}
