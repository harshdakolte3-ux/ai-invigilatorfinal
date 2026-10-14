const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:harshda%4020082817@db.swcqnklgfprmpamibvxe.supabase.co:5432/postgres";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;