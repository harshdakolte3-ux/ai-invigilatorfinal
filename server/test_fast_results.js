const pool = require("./config/db");

async function testFast() {
  const start = Date.now();
  const query = `
    WITH result_boundaries AS (
        SELECT 
            r.result_id,
            r.student_id,
            r.exam_id,
            r.score,
            r.total_marks,
            r.submitted_at,
            COALESCE(
                LAG(r.submitted_at) OVER (PARTITION BY r.student_id, r.exam_id ORDER BY r.submitted_at), 
                '1970-01-01'::timestamp
            ) as previous_submitted_at
        FROM results r
    )
    SELECT
        b.result_id,
        s.student_id,
        s.full_name,
        s.email,
        s.profile_photo,
        e.exam_name,
        b.score,
        b.total_marks,
        b.submitted_at,
        COUNT(CASE WHEN i.incident_type ILIKE '%tab%' THEN 1 END)::int as tab_switches,
        COUNT(CASE WHEN i.incident_type ILIKE '%phone%' OR i.incident_type ILIKE '%mobile%' THEN 1 END)::int as phone_detected,
        COUNT(CASE WHEN i.incident_type ILIKE '%multi%' THEN 1 END)::int as multi_faces,
        COUNT(CASE WHEN i.incident_type ILIKE '%screen%' OR i.incident_type ILIKE '%exit%' THEN 1 END)::int as fullscreen_exits,
        COUNT(CASE WHEN i.incident_type ILIKE '%look%' THEN 1 END)::int as head_movements,
        COUNT(CASE WHEN i.incident_type ILIKE '%face_not_detected%' THEN 1 END)::int as no_face_detected,
        COUNT(CASE WHEN i.incident_type ILIKE '%sleep%' THEN 1 END)::int as eyes_closed
    FROM result_boundaries b
    JOIN students s ON b.student_id = s.student_id
    JOIN exams e ON b.exam_id = e.exam_id
    LEFT JOIN exam_incidents i 
        ON i.student_id = b.student_id 
        AND i.exam_id = b.exam_id 
        AND i.created_at <= b.submitted_at 
        AND i.created_at > b.previous_submitted_at
    GROUP BY 
        b.result_id, s.student_id, s.full_name, s.email, s.profile_photo, e.exam_name, b.score, b.total_marks, b.submitted_at
    ORDER BY b.submitted_at DESC
    LIMIT 100
  `;
  try {
    const res = await pool.query(query);
    console.log(`🚀 QUERY SUCCEEDED IN ${Date.now() - start} ms! Rows: ${res.rows.length}`);
    console.log("Sample row:", res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("Query error:", err);
    process.exit(1);
  }
}

testFast();
