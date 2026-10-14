const pool = require("./config/db");
const bcrypt = require("bcrypt");

async function fix() {
  try {
    console.log("🔄 Ensuring exams and admin accounts in Supabase...");

    // 1. Insert or update Operating Systems Final Exam
    await pool.query(`
      INSERT INTO exams (exam_id, exam_name, total_questions, duration, total_marks)
      VALUES (4, 'Operating Systems Final Exam', 5, 50, 100)
      ON CONFLICT (exam_id) DO UPDATE SET exam_name = EXCLUDED.exam_name;
    `);

    // 2. Insert or update Computer Fundamentals
    await pool.query(`
      INSERT INTO exams (exam_id, exam_name, total_questions, duration, total_marks)
      VALUES (5, 'Computer Fundamentals', 5, 50, 100)
      ON CONFLICT (exam_id) DO UPDATE SET exam_name = EXCLUDED.exam_name;
    `);

    // 3. Copy questions from exam 2 to exams 4 and 5 if empty
    for (const targetExamId of [4, 5]) {
      const qCount = await pool.query("SELECT count(*) FROM questions WHERE exam_id = $1", [targetExamId]);
      if (parseInt(qCount.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
          SELECT $1, question_text, option_a, option_b, option_c, option_d, correct_option
          FROM questions WHERE exam_id = 2;
        `, [targetExamId]);
        console.log(`✅ Questions copied to Exam ${targetExamId}`);
      }
    }

    // 4. Also ensure both admin emails exist in students table
    const hashedPass = await bcrypt.hash("Admin@123", 10);
    const adminEmails = [
      { email: "admin@aiinvigilator.com", name: "Harsh Admin" },
      { email: "admin@invigilator.com", name: "Super Admin" }
    ];

    for (const a of adminEmails) {
      await pool.query(`
        INSERT INTO students (enrollment_no, full_name, email, password, phone, course, semester)
        VALUES ('ADM-2026', $1, $2, $3, '9876543210', 'B.Tech CSE', '8')
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
      `, [a.name, a.email, hashedPass]);
      console.log(`✅ Student profile ready for ${a.email}`);
    }

    // Sync sequences
    await pool.query(`SELECT setval(pg_get_serial_sequence('exams', 'exam_id'), COALESCE((SELECT MAX(exam_id) FROM exams), 1));`);
    await pool.query(`SELECT setval(pg_get_serial_sequence('questions', 'question_id'), COALESCE((SELECT MAX(question_id) FROM questions), 1));`);
    await pool.query(`SELECT setval(pg_get_serial_sequence('students', 'student_id'), COALESCE((SELECT MAX(student_id) FROM students), 1));`);

    console.log("🎉 ALL EXAM AND LOGIN RECORDS SYNCHRONIZED!");
    process.exit(0);
  } catch (err) {
    console.error("Fix error:", err);
    process.exit(1);
  }
}

fix();
