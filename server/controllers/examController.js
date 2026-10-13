const pool = require("../config/db");

// Start Exam
exports.startExam = async (req, res) => {
    try {
        const { student_id, exam_name } = req.body;

        const exam = await pool.query(
            "SELECT * FROM exams WHERE exam_name = $1",
            [exam_name]
        );

        if (exam.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Exam not found"
            });
        }

        res.json({
            success: true,
            exam: exam.rows[0]
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
// Get Questions
exports.getQuestions = async (req, res) => {
    try {
        const { examId } = req.params;

        const result = await pool.query(
            "SELECT * FROM questions WHERE exam_id = $1",
            [examId]
        );

        res.json({
            success: true,
            questions: result.rows
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Report Violation
exports.reportViolation = async (req, res) => {
    try {
        const { student_id, exam_id, violation_type, severity, description, image_url } = req.body;

        // Find the student_exam_id
        const studentExam = await pool.query(
            "SELECT student_exam_id FROM student_exams WHERE student_id = $1 AND exam_id = $2",
            [student_id, exam_id]
        );

        let student_exam_id = null;
        if (studentExam.rows.length > 0) {
            student_exam_id = studentExam.rows[0].student_exam_id;
        }

        const violationResult = await pool.query(
            `INSERT INTO violations (student_exam_id, violation_type, severity, description, violation_time)
             VALUES ($1, $2, $3, $4, NOW()) RETURNING violation_id`,
            [student_exam_id, violation_type, severity, description]
        );

        const violation_id = violationResult.rows[0].violation_id;

        if (image_url) {
            await pool.query(
                `INSERT INTO violation_evidence (violation_id, image_url, captured_at)
                 VALUES ($1, $2, NOW())`,
                [violation_id, image_url]
            );
        }

        res.json({ success: true, violation_id });
    } catch (error) {
        console.error("Violation report error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Publish AI Generated Exam & Questions
exports.publishExam = async (req, res) => {
    try {
        const { exam_name, subject, duration, total_marks, questions } = req.body;

        const dur = parseInt(duration) || 60;
        const marks = parseInt(total_marks) || 100;

        const examResult = await pool.query(
            `INSERT INTO exams (exam_name, subject, duration, duration_minutes, total_marks, exam_date, start_time, end_time, created_by)
             VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME, CURRENT_TIME + interval '1 hour', 1)
             RETURNING exam_id`,
            [exam_name || 'AI Generated Exam', subject || 'Comprehensive', dur, dur, marks]
        );

        const exam_id = examResult.rows[0].exam_id;

        if (Array.isArray(questions) && questions.length > 0) {
            for (const q of questions) {
                const optA = q.option_a || (q.options ? q.options[0] : 'Option A');
                const optB = q.option_b || (q.options ? q.options[1] : 'Option B');
                const optC = q.option_c || (q.options ? q.options[2] : 'Option C');
                const optD = q.option_d || (q.options ? q.options[3] : 'Option D');
                const correctOpt = (q.correct_option || q.answer || 'A').toString().trim().toUpperCase().charAt(0);

                await pool.query(
                    `INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        exam_id,
                        q.question_text || q.question || 'Sample Question',
                        optA,
                        optB,
                        optC,
                        optD,
                        correctOpt
                    ]
                );
            }
        }

        res.json({
            success: true,
            message: "Exam and questions published successfully",
            exam_id
        });
    } catch (error) {
        console.error("Publish exam error:", error);
        res.status(500).json({
            success: false,
            message: "Server error publishing exam: " + error.message
        });
    }
};