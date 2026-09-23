const express = require("express");
const router = express.Router();

const {
    startExam,
    getQuestions,
    reportViolation
} = require("../controllers/examController");

router.post("/start", startExam);

router.get("/questions/:examId", getQuestions);

router.post("/violation", reportViolation);

module.exports = router;