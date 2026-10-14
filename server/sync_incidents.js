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

async function syncIncidents() {
  try {
    console.log("🔄 Syncing exam_incidents in batches...");
    const totalRes = await localPool.query("SELECT count(*) FROM exam_incidents");
    const total = parseInt(totalRes.rows[0].count);
    console.log(`Total incidents to sync: ${total}`);

    const batchSize = 500;
    for (let offset = 0; offset < total; offset += batchSize) {
      const res = await localPool.query(
        "SELECT id, student_id, exam_id, incident_type, message, image_filename, created_at FROM exam_incidents ORDER BY id LIMIT $1 OFFSET $2",
        [batchSize, offset]
      );
      if (res.rows.length === 0) break;

      // Construct bulk insert
      const values = [];
      const placeholders = res.rows.map((r, i) => {
        const base = i * 7;
        values.push(r.id, r.student_id, r.exam_id, r.incident_type, r.message, r.image_filename, r.created_at);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
      });

      const query = `
        INSERT INTO exam_incidents (id, student_id, exam_id, incident_type, message, image_filename, created_at)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (id) DO NOTHING
      `;
      await cloudPool.query(query, values);
      console.log(`Synced ${offset + res.rows.length} / ${total} incidents`);
    }

    // Sync sequence
    await cloudPool.query(`SELECT setval(pg_get_serial_sequence('exam_incidents', 'id'), COALESCE((SELECT MAX(id) FROM exam_incidents), 1));`);
    console.log("🎉 ALL INCIDENTS SYNCED TO SUPABASE!");
    process.exit(0);
  } catch (err) {
    console.error("Error syncing incidents:", err);
    process.exit(1);
  }
}

syncIncidents();
