const pool = require("./config/db");
const bcrypt = require("bcrypt");

async function setupDatabase() {
  console.log("🔄 Connecting to database and running schema setup...");
  try {
    // 1. Create Admins Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        admin_id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Admins table ready");

    // 2. Create Students Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id SERIAL PRIMARY KEY,
        enrollment_no VARCHAR(100),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        course VARCHAR(100),
        semester VARCHAR(50),
        profile_photo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Students table ready");

    // 3. Create Exams Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        exam_id SERIAL PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        total_questions INT DEFAULT 10,
        duration INT DEFAULT 50,
        total_marks INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Exams table ready");

    // 4. Create Questions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        question_id SERIAL PRIMARY KEY,
        exam_id INT REFERENCES exams(exam_id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option VARCHAR(10) NOT NULL
      );
    `);
    console.log("✅ Questions table ready");

    // 5. Create Student Exams Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_exams (
        student_exam_id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
        exam_id INT REFERENCES exams(exam_id) ON DELETE CASCADE,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Student Exams table ready");

    // 6. Create Violations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS violations (
        violation_id SERIAL PRIMARY KEY,
        student_exam_id INT REFERENCES student_exams(student_exam_id) ON DELETE SET NULL,
        violation_type VARCHAR(100),
        severity VARCHAR(50),
        description TEXT,
        violation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Violations table ready");

    // 7. Create Violation Evidence Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS violation_evidence (
        evidence_id SERIAL PRIMARY KEY,
        violation_id INT REFERENCES violations(violation_id) ON DELETE CASCADE,
        image_url TEXT,
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Violation Evidence table ready");

    // 8. Create Exam Incidents Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_incidents (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
        exam_id INT,
        incident_type VARCHAR(100),
        message TEXT,
        image_filename VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Exam Incidents table ready");

    // 9. Create Results Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS results (
        result_id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
        exam_id INT REFERENCES exams(exam_id) ON DELETE CASCADE,
        score NUMERIC DEFAULT 0,
        total_marks NUMERIC DEFAULT 100,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Results table ready");

    // 10. Seed Default Admin if not exists
    const adminCheck = await pool.query("SELECT * FROM admins WHERE email = $1", ["admin@invigilator.com"]);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      await pool.query(
        "INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)",
        ["Super Admin", "admin@invigilator.com", hashedPassword]
      );
      console.log("✅ Default Admin created: admin@invigilator.com (Password: Admin@123)");
    } else {
      console.log("ℹ️ Admin already exists");
    }

    // 11. Seed Default Exam (exam_id = 2 as expected by ActiveExam)
    const examCheck = await pool.query("SELECT * FROM exams WHERE exam_id = 2");
    if (examCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO exams (exam_id, exam_name, total_questions, duration, total_marks)
        VALUES (2, 'AI & Machine Learning Assessment', 5, 50, 100)
        ON CONFLICT (exam_id) DO NOTHING;
      `);
      console.log("✅ Default Exam (ID: 2) created");

      // Insert Questions for Exam 2
      await pool.query(`
        INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
        (2, 'Which of the following is a supervised learning algorithm?', 'K-Means Clustering', 'Linear Regression', 'Apriori Algorithm', 'PCA', 'B'),
        (2, 'What is the primary role of the MediaPipe Face Landmarker model in this system?', 'Object Detection', 'Facial Landmark & Eye Aspect Ratio Tracking', 'Speech Recognition', 'Data Encryption', 'B'),
        (2, 'Which protocol is used for real-time bidirectional communication between student and proctor dashboard?', 'HTTP GET polling', 'WebSockets / Socket.io', 'SMTP', 'FTP', 'B'),
        (2, 'In machine learning, what does EAR stand for in eye-closure detection?', 'Early Accuracy Rate', 'Eye Aspect Ratio', 'Extended Attention Range', 'Estimated Activity Radius', 'B'),
        (2, 'What type of database architecture ensures multiple remote team members access synchronized records?', 'Local Isolated Storage', 'Centralized Managed Cloud Database', 'Browser LocalStorage', 'Offline Cache', 'B');
      `);
      // Sync sequence
      await pool.query(`SELECT setval(pg_get_serial_sequence('exams', 'exam_id'), COALESCE((SELECT MAX(exam_id) FROM exams), 1));`);
      console.log("✅ Sample Questions for Exam 2 seeded successfully");
    } else {
      console.log("ℹ️ Exam 2 already exists");
    }

    console.log("\n🎉 ALL TABLES & INITIAL DATA READY IN CLOUD DATABASE!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database setup error:", err);
    process.exit(1);
  }
}

setupDatabase();
