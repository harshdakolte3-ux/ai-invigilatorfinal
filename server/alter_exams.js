const pool = require("./config/db");

async function alterExams() {
  try {
    await pool.query(`
      ALTER TABLE exams 
      ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
      ADD COLUMN IF NOT EXISTS duration_minutes INT,
      ADD COLUMN IF NOT EXISTS exam_date DATE DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT CURRENT_TIME,
      ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT CURRENT_TIME,
      ADD COLUMN IF NOT EXISTS created_by INT DEFAULT 1;
    `);
    console.log("✅ Exams table columns added successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error altering exams:", err);
    process.exit(1);
  }
}

alterExams();
