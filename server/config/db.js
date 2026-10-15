const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const cloudConnectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:harshda%4020082817@db.swcqnklgfprmpamibvxe.supabase.co:5432/postgres";

const cloudPool = new Pool({
  connectionString: cloudConnectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 3000,
});

const localPool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || "ai_invigilator",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Admin@123",
});

let useLocal = false;

const pool = {
  query: async (...args) => {
    if (useLocal) {
      return localPool.query(...args);
    }
    try {
      return await cloudPool.query(...args);
    } catch (err) {
      if (
        err.code === "ENOTFOUND" ||
        err.code === "ENETUNREACH" ||
        err.code === "ETIMEDOUT" ||
        err.code === "ECONNREFUSED"
      ) {
        console.warn(
          `[Database] Cloud DB unreachable (${err.code}). Switching to Local PostgreSQL.`
        );
        useLocal = true;
        return localPool.query(...args);
      }
      throw err;
    }
  },
  connect: async () => {
    if (useLocal) {
      return localPool.connect();
    }
    try {
      return await cloudPool.connect();
    } catch (err) {
      if (
        err.code === "ENOTFOUND" ||
        err.code === "ENETUNREACH" ||
        err.code === "ETIMEDOUT" ||
        err.code === "ECONNREFUSED"
      ) {
        console.warn(
          `[Database] Cloud DB unreachable (${err.code}). Switching to Local PostgreSQL.`
        );
        useLocal = true;
        return localPool.connect();
      }
      throw err;
    }
  },
  on: (...args) => {
    cloudPool.on(...args);
    localPool.on(...args);
  },
  end: () => Promise.all([cloudPool.end(), localPool.end()]),
};

module.exports = pool;