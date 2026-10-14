const pool = require("./config/db");

async function test() {
  const start = Date.now();
  const query = `
    WITH result_boundaries AS (
        SELECT 
            r.result_id,
            COALESCE(
                LAG(r.submitted_at) OVER (PARTITION BY r.student_id, r.exam_id ORDER BY r.submitted_at), 
                '1970-01-01'::timestamp
            ) as previous_submitted_at
        FROM results r
    )
    SELECT
        r.result_id,
        s.student_id,
        s.full_name,
        s.email,
        s.profile_photo,
        e.exam_name,
        r.score,
        r.total_marks,
        r.submitted_at,
        COUNT(CASE WHEN i.incident_type ILIKE '%tab%' THEN 1 END) as tab_switches,
        COUNT(CASE WHEN i.incident_type ILIKE '%phone%' OR i.incident_type ILIKE '%mobile%' THEN 1 END) as phone_detected,
        COUNT(CASE WHEN i.incident_type ILIKE '%multi%' THEN 1 END) as multi_faces,
        COUNT(CASE WHEN i.incident_type ILIKE '%screen%' OR i.incident_type ILIKE '%exit%' THEN 1 END) as fullscreen_exits,
        COUNT(CASE WHEN i.incident_type ILIKE '%look%' THEN 1 END) as head_movements,
        COUNT(CASE WHEN i.incident_type ILIKE '%face_not_detected%' THEN 1 END) as no_face_detected,
        COUNT(CASE WHEN i.incident_type ILIKE '%sleep%' THEN 1 END) as eyes_closed
    FROM results r
    JOIN result_boundaries b ON r.result_id = b.result_id
    JOIN students s ON r.student_id = s.student_id
    JOIN exams e ON r.exam_id = e.exam_id
    LEFT JOIN exam_incidents i 
        ON i.student_id = r.student_id 
        AND i.exam_id = r.exam_id 
        AND i.created_at <= r.submitted_at 
        AND i.created_at > b.previous_submitted_at
    GROUP BY 
        r.result_id, s.student_id, s.full_name, s.email, s.profile_photo, e.exam_name, r.score, r.total_marks, r.submitted_at
    ORDER BY r.submitted_at DESC
  `;
  const res = await pool.query(query);
  console.log(`⚡ OPTIMIZED QUERY TOOK: ${Date.now() - start} ms, fetched ${res.rows.length} rows`);
  process.exit(0);
}

test();
