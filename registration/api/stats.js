import { db, json } from "./_db.js";

// GET /api/stats?key=ADMIN_KEY
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const url = new URL(req.url, "http://localhost");
  const key = url.searchParams.get("key") || req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return json(res, 401, { ok: false, error: "Unauthorized" });

  try {
    const sql = db();
    const [totals] = await sql`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE participation = 'solo')::int AS solo,
             count(*) FILTER (WHERE participation = 'team')::int AS team,
             count(*) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')::int AS today,
             count(*) FILTER (WHERE created_at >= now() - interval '1 hour')::int AS last_hour
      FROM registrations
    `;
    const roles = await sql`SELECT role, count(*)::int AS count FROM registrations GROUP BY role ORDER BY count DESC`;
    const sources = await sql`SELECT coalesce(heard_from, 'Not answered') AS source, count(*)::int AS count FROM registrations GROUP BY 1 ORDER BY count DESC`;
    const daily = await sql`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon') AS day, count(*)::int AS count
      FROM registrations
      WHERE created_at >= now() - interval '14 days'
      GROUP BY date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata'), 1
      ORDER BY date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata')
    `;
    return json(res, 200, { ok: true, ...totals, roles, sources, daily });
  } catch (err) {
    console.error("stats error:", err);
    return json(res, 500, { ok: false, error: err.message === "DATABASE_URL is not configured" ? "Database not connected." : "Could not load stats." });
  }
}
