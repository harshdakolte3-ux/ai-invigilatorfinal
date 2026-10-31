const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

let cloudConnectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.swcqnklgfprmpamibvxe:harshda%4020082817@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

if (cloudConnectionString.includes(".pooler.supabase.com:5432")) {
  cloudConnectionString = cloudConnectionString.replace(":5432", ":6543");
}
if (cloudConnectionString.includes("db.swcqnklgfprmpamibvxe.supabase.co")) {
  cloudConnectionString = cloudConnectionString
    .replace("db.swcqnklgfprmpamibvxe.supabase.co:5432", "aws-0-ap-northeast-1.pooler.supabase.com:6543")
    .replace("//postgres:", "//postgres.swcqnklgfprmpamibvxe:");
}

const cloudPool = new Pool({
  connectionString: cloudConnectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 5000,
});

const localPool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || "ai_invigilator",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Admin@123",
});

let useLocal = false;

const isNetworkError = (err) => {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = err.code || "";
  const name = err.name || "";
  return (
    name === "AggregateError" ||
    code === "ENOTFOUND" ||
    code === "ENETUNREACH" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    msg.includes("timeout") ||
    msg.includes("terminated") ||
    msg.includes("unreachable") ||
    msg.includes("failed to connect")
  );
};

const pool = {
  query: async (...args) => {
    if (useLocal) {
      return localPool.query(...args);
    }
    try {
      return await cloudPool.query(...args);
    } catch (err) {
      if (isNetworkError(err)) {
        console.warn(
          `[Database] Cloud DB unreachable (${err.code || err.name}). Switching to Local PostgreSQL.`
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
      if (isNetworkError(err)) {
        console.warn(
          `[Database] Cloud DB unreachable (${err.code || err.name}). Switching to Local PostgreSQL.`
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

pool.query("SELECT NOW()")
  .then(() => console.log("✅ Database connected successfully via " + (cloudConnectionString ? "Supabase Cloud DB" : "Local PostgreSQL")))
  .catch((err) => console.error("❌ Database connection error:", err.message));

module.exports = pool;
