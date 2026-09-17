import { db, json, readJson } from "./_db.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function clean(value, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

export function validate(input) {
  const data = {
    full_name: clean(input.full_name, 120),
    email: clean(input.email, 160).toLowerCase(),
    phone: clean(input.phone, 20).replace(/[\s()-]/g, "").replace(/^\+?91/, ""),
    college: clean(input.college, 160),
    role: clean(input.role, 20),
    participation: clean(input.participation, 10),
    teammate_name: clean(input.teammate_name, 120) || null,
    teammate_email: clean(input.teammate_email, 160).toLowerCase() || null,
    heard_from: clean(input.heard_from, 60) || null,
  };
  const errors = {};

  if (data.full_name.length < 2) errors.full_name = "Enter your full name.";
  if (!EMAIL_RE.test(data.email)) errors.email = "Enter a valid email address.";
  if (!PHONE_RE.test(data.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (data.college.length < 2) errors.college = "Enter your college or company.";
  if (!["student", "professional", "other"].includes(data.role)) errors.role = "Pick one option.";
  if (!["solo", "team"].includes(data.participation)) errors.participation = "Pick solo or team.";
  if (data.participation === "team") {
    if (!data.teammate_name || data.teammate_name.length < 2) errors.teammate_name = "Enter your teammate's name.";
    if (!data.teammate_email || !EMAIL_RE.test(data.teammate_email)) errors.teammate_email = "Enter your teammate's email.";
    if (data.teammate_email && data.teammate_email === data.email) errors.teammate_email = "Teammate email must be different from yours.";
  } else {
    data.teammate_name = null;
    data.teammate_email = null;
  }
  if (input.consent !== true && input.consent !== "true" && input.consent !== "on") errors.consent = "Please agree to continue.";

  return { data, errors };
}

export const CEREMONY_AT = Date.parse("2026-09-18T19:00:00+05:30");

export default async function handler(req, res) {
  if (Date.now() >= CEREMONY_AT) {
    return json(res, 403, { ok: false, closed: true, error: "Registrations are closed. The opening ceremony has already started." });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const body = await readJson(req);
  if (body === null) return json(res, 400, { ok: false, error: "Invalid JSON body" });

  const { data, errors } = validate(body);
  if (Object.keys(errors).length) return json(res, 422, { ok: false, errors });

  try {
    const sql = db();
    const rows = await sql`
      INSERT INTO registrations
        (full_name, email, phone, college, role, participation, teammate_name, teammate_email, heard_from)
      VALUES
        (${data.full_name}, ${data.email}, ${data.phone}, ${data.college}, ${data.role}, ${data.participation},
         ${data.teammate_name}, ${data.teammate_email}, ${data.heard_from})
      RETURNING id, created_at
    `;
    return json(res, 201, { ok: true, id: rows[0].id, created_at: rows[0].created_at });
  } catch (err) {
    if (err && err.code === "23505") {
      return json(res, 409, { ok: false, errors: { email: "This email is already registered." } });
    }
    console.error("register error:", err);
    const message = err && err.message === "DATABASE_URL is not configured"
      ? "Server is not connected to the database yet."
      : "Something went wrong. Please try again.";
    return json(res, 500, { ok: false, error: message });
  }
}
