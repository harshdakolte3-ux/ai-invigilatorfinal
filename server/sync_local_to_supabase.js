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

async function sync() {
  try {
    console.log("🔄 Reading local database...");

    // 1. Sync Admins
    const localAdmins = await localPool.query("SELECT * FROM admins");
    console.log(`Found ${localAdmins.rows.length} local admins`);
    for (const a of localAdmins.rows) {
      await cloudPool.query(
        `INSERT INTO admins (email, password)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`,
        [a.email, a.password]
      );
      console.log(`✅ Synced admin: ${a.email}`);
    }

    // 2. Sync Students
    const localStudents = await localPool.query("SELECT * FROM students");
    console.log(`Found ${localStudents.rows.length} local students`);
    for (const s of localStudents.rows) {
      await cloudPool.query(
        `INSERT INTO students (student_id, enrollment_no, full_name, email, password, phone, course, semester, profile_photo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO NOTHING`,
        [s.student_id, s.enrollment_no, s.full_name, s.email, s.password, s.phone, s.course, s.semester, s.profile_photo]
      );
    }
    // sync students sequence
    await cloudPool.query(`SELECT setval(pg_get_serial_sequence('students', 'student_id'), COALESCE((SELECT MAX(student_id) FROM students), 1));`);
    console.log("✅ Synced students and sequence");

    // 3. Sync Exams
    const localExams = await localPool.query("SELECT * FROM exams");
    console.log(`Found ${localExams.rows.length} local exams`);
    for (const e of localExams.rows) {
      await cloudPool.query(
        `INSERT INTO exams (exam_id, exam_name, total_questions, duration, total_marks)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (exam_id) DO NOTHING`,
        [e.exam_id, e.exam_name, e.total_questions || 5, e.duration || 50, e.total_marks || 100]
      );
    }
    await cloudPool.query(`SELECT setval(pg_get_serial_sequence('exams', 'exam_id'), COALESCE((SELECT MAX(exam_id) FROM exams), 1));`);

    // 4. Sync Questions
    const localQuestions = await localPool.query("SELECT * FROM questions");
    console.log(`Found ${localQuestions.rows.length} local questions`);
    for (const q of localQuestions.rows) {
      await cloudPool.query(
        `INSERT INTO questions (question_id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (question_id) DO NOTHING`,
        [q.question_id, q.exam_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option]
      );
    }
    await cloudPool.query(`SELECT setval(pg_get_serial_sequence('questions', 'question_id'), COALESCE((SELECT MAX(question_id) FROM questions), 1));`);

    // 5. Sync Results if any
    try {
      const localResults = await localPool.query("SELECT * FROM results");
      console.log(`Found ${localResults.rows.length} local results`);
      for (const r of localResults.rows) {
        await cloudPool.query(
          `INSERT INTO results (result_id, student_id, exam_id, score, total_marks, submitted_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (result_id) DO NOTHING`,
          [r.result_id, r.student_id, r.exam_id, r.score, r.total_marks, r.submitted_at]
        );
      }
      await cloudPool.query(`SELECT setval(pg_get_serial_sequence('results', 'result_id'), COALESCE((SELECT MAX(result_id) FROM results), 1));`);
    } catch (e) {
      console.log("Results sync note:", e.message);
    }

    console.log("\n🎉 FULL LOCAL TO SUPABASE DATA SYNC COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("Sync error:", err);
    process.exit(1);
  }
}

sync();
