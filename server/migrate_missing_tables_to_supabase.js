const { Pool } = require("pg");
require("dotenv").config();

const localPool = new Pool({
  host: "localhost",
  port: 5432,
  database: "ai_invigilator",
  user: "postgres",
  password: "Admin@123",
});

const cloudPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrateMissing() {
  try {
    console.log("🔍 Checking missing tables in local database...");

    // 1. Add status column to exam_incidents if not exists
    await cloudPool.query(`
      ALTER TABLE exam_incidents 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
    `);
    console.log("✅ Added status column to exam_incidents in Supabase");

    // 2. Create live_sessions table
    await cloudPool.query(`
      CREATE TABLE IF NOT EXISTS live_sessions (
        student_id INT PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
        exam_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Normal',
        last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ai_confidence NUMERIC DEFAULT 95,
        face_status VARCHAR(50) DEFAULT 'STABLE',
        eye_status VARCHAR(50) DEFAULT 'OPEN',
        head_direction VARCHAR(50) DEFAULT 'CENTERED',
        phone_detected BOOLEAN DEFAULT FALSE,
        multiple_detected BOOLEAN DEFAULT FALSE,
        audio_status VARCHAR(50) DEFAULT 'QUIET',
        audio_level INT DEFAULT 0
      );
    `);
    console.log("✅ Created live_sessions table in Supabase");

    // 3. Create student_messages table
    await cloudPool.query(`
      CREATE TABLE IF NOT EXISTS student_messages (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Created student_messages table in Supabase");

    // 4. Create performance indexes on exam_incidents for fast dashboard loading
    await cloudPool.query(`
      CREATE INDEX IF NOT EXISTS idx_exam_incidents_student_exam ON exam_incidents (student_id, exam_id);
      CREATE INDEX IF NOT EXISTS idx_exam_incidents_created_at ON exam_incidents (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_live_sessions_last_ping ON live_sessions (last_ping DESC);
    `);
    console.log("✅ Created indexes on exam_incidents & live_sessions");

    // 5. Check if local database had live_sessions and copy them
    try {
      const localLive = await localPool.query("SELECT * FROM live_sessions");
      console.log(`Found ${localLive.rows.length} local live_sessions`);
      for (const l of localLive.rows) {
        await cloudPool.query(`
          INSERT INTO live_sessions (
            student_id, exam_name, status, last_ping, ai_confidence, face_status, eye_status, head_direction, phone_detected, multiple_detected, audio_status, audio_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (student_id) DO NOTHING;
        `, [
          l.student_id, l.exam_name, l.status, l.last_ping, l.ai_confidence, l.face_status, l.eye_status, l.head_direction, l.phone_detected, l.multiple_detected, l.audio_status, l.audio_level
        ]);
      }
    } catch (e) {
      console.log("Local live_sessions note:", e.message);
    }

    console.log("\n🎉 ALL MISSING TABLES & COLUMNS SUCCESSFULLY CREATED IN SUPABASE!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrateMissing();
