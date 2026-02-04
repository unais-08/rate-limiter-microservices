import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "rate_limiter_analytics",
  user: "postgres",
  password: "postgres",
});

console.log("Testing PostgreSQL connection...");

pool
  .query("SELECT NOW() as time")
  .then((result) => {
    console.log("✅ Connection successful!");
    console.log("Current time:", result.rows[0].time);
    pool.end();
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message);
    console.error("Code:", err.code);
    pool.end();
  });
