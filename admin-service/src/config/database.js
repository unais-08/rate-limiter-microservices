import pg from "pg";
import config from "../config/index.js";

const { Pool } = pg;

const pool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.user,
  password: config.postgres.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on PostgreSQL client", err);
});

export const query = async (text, params) => {
  const result = await pool.query(text, params);
  return result;
};

export const getClient = async () => {
  return await pool.connect();
};

export const closePool = async () => {
  await pool.end();
  console.log("🔌 PostgreSQL connection pool closed");
};

export default pool;
