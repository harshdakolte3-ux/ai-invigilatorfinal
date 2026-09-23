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