import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || "rate_limiter_analytics",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on PostgreSQL client", err);
  process.exit(-1);
});

// Initialize database schema
export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log("🔄 Initializing database schema...");

    // Create request_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS request_logs (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) NOT NULL,
        endpoint VARCHAR(500) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time_ms INTEGER NOT NULL,
        rate_limit_hit BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_api_key ON request_logs(api_key);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_endpoint ON request_logs(endpoint);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON request_logs(timestamp);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_hit ON request_logs(rate_limit_hit);
    `);

    // Create api_key_metrics table for aggregated stats
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_key_metrics (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        total_requests INTEGER DEFAULT 0,
        total_rate_limited INTEGER DEFAULT 0,
        avg_response_time_ms FLOAT DEFAULT 0,
        last_request_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create endpoint_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS endpoint_metrics (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(500) UNIQUE NOT NULL,
        method VARCHAR(10) NOT NULL,
        total_requests INTEGER DEFAULT 0,
        avg_response_time_ms FLOAT DEFAULT 0,
        last_request_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(endpoint, method)
      );
    `);

    console.log("✅ Database schema initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Query helper
export const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log(
    `📊 Query executed in ${duration}ms: ${text.substring(0, 50)}...`,
  );
  return result;
};

// Get a client from the pool
export const getClient = async () => {
  return await pool.connect();
};

// Close pool
export const closePool = async () => {
  await pool.end();
  console.log("🔌 PostgreSQL connection pool closed");
};

export default pool;
