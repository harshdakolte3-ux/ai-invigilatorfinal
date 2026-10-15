const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const examRoutes = require("./routes/examRoutes");
const resultRoutes = require("./routes/resultRoutes");
const proctorRoutes = require("./routes/proctorRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));


// Student APIs
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

// Admin APIs
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);
    
// Exam APIs
app.use("/api/exam", examRoutes);
app.use("/exam", examRoutes);

// Result APIs
app.use("/api/result", resultRoutes);
app.use("/result", resultRoutes);

// Proctor APIs
app.use("/api/proctor", proctorRoutes);
app.use("/proctor", proctorRoutes);

app.get("/", (req,res)=>{
    res.send("AI Invigilator Backend Running Successfully");
});


app.get("/test-db", async(req,res)=>{
    try{

        const result = await pool.query("SELECT NOW()");

        res.json({
            success:true,
            message:"Database Connected Successfully",
            time:result.rows[0]
        });

    }catch(error){

        console.log(error);

        res.status(500).json({
            success:false,
            message:"Database Connection Failed",
            error: error ? (error.message || String(error)) : "Unknown error"
        });
    }
});

app.get("/test-supabase", async (req, res) => {
    const { Pool } = require("pg");
    const results = {};
    const testConfigs = [
        { name: "direct", url: "postgresql://postgres:harshda%4020082817@db.swcqnklgfprmpamibvxe.supabase.co:5432/postgres" },
        { name: "pooler_ne1_6543", url: "postgresql://postgres.swcqnklgfprmpamibvxe:harshda%4020082817@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres" },
        { name: "pooler_ne1_5432", url: "postgresql://postgres.swcqnklgfprmpamibvxe:harshda%4020082817@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres" },
        { name: "pooler_s1_6543", url: "postgresql://postgres.swcqnklgfprmpamibvxe:harshda%4020082817@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" },
        { name: "pooler_se1_6543", url: "postgresql://postgres.swcqnklgfprmpamibvxe:harshda%4020082817@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" },
    ];
    for (const cfg of testConfigs) {
        const p = new Pool({ connectionString: cfg.url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 3500 });
        try {
            const r = await p.query("SELECT NOW()");
            results[cfg.name] = { success: true, time: r.rows[0] };
        } catch (e) {
            results[cfg.name] = { success: false, error: e.message, code: e.code };
        } finally {
            await p.end().catch(() => {});
        }
    }
    res.json(results);
});


const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});