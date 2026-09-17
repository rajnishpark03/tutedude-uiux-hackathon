import { db, json } from "./_db.js";

const COLS = ["id", "full_name", "email", "phone", "college", "role", "participation", "teammate_name", "teammate_email", "heard_from", "created_at"];

function authorized(req, url) {
  const key = url.searchParams.get("key") || req.headers["x-admin-key"];
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

// GET /api/registrations?key=ADMIN_KEY&q=search&limit=50&offset=0
// GET /api/registrations?key=ADMIN_KEY&format=csv   (full export)
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }
  const url = new URL(req.url, "http://localhost");
  if (!authorized(req, url)) return json(res, 401, { ok: false, error: "Unauthorized" });

  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const pattern = `%${q}%`;
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  try {
    const sql = db();

    if (url.searchParams.get("format") === "csv") {
      const rows = await sql`SELECT * FROM registrations ORDER BY created_at DESC`;
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [COLS.join(","), ...rows.map((r) => COLS.map((c) => esc(r[c] instanceof Date ? r[c].toISOString() : r[c])).join(","))].join("\n");
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="registrations.csv"');
      res.setHeader("Cache-Control", "no-store");
      return res.end("﻿" + csv);
    }

    const rows = await sql`
      SELECT id, full_name, email, phone, college, role, participation, teammate_name, teammate_email, heard_from, created_at
      FROM registrations
      WHERE ${q} = '' OR full_name ILIKE ${pattern} OR email ILIKE ${pattern} OR phone ILIKE ${pattern} OR college ILIKE ${pattern}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [{ total }] = await sql`
      SELECT count(*)::int AS total FROM registrations
      WHERE ${q} = '' OR full_name ILIKE ${pattern} OR email ILIKE ${pattern} OR phone ILIKE ${pattern} OR college ILIKE ${pattern}
    `;
    return json(res, 200, { ok: true, total, limit, offset, registrations: rows });
  } catch (err) {
    console.error("registrations error:", err);
    return json(res, 500, { ok: false, error: err.message === "DATABASE_URL is not configured" ? "Database not connected." : "Could not load registrations." });
  }
}
