const $ = (id) => document.getElementById(id);
const PAGE = 50;
let offset = 0;
let query = "";
let total = 0;

const fmtDate = (iso) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, params = {}) {
  const url = new URL(path, location.origin);
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && url.searchParams.set(k, v));
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw new Error(body.error || "Request failed");
  return body;
}

function showDash() {
  $("dash").hidden = false;
  $("csvLink").href = "/api/registrations?format=csv";
}

function renderStats(s) {
  ["total", "today", "last_hour", "solo", "team"].forEach((k) => {
    const el = document.querySelector(`[data-stat="${k}"]`);
    if (el) el.textContent = (s[k] ?? 0).toLocaleString("en-IN");
  });
  const max = Math.max(1, ...s.daily.map((d) => d.count));
  $("daily").innerHTML = s.daily.length
    ? s.daily.map((d) => `<div class="bar"><span class="bar__value">${d.count}</span><div class="bar__fill" style="height:${Math.max(3, (d.count / max) * 90)}%"></div><span class="bar__label">${esc(d.day)}</span></div>`).join("")
    : '<p class="empty">No registrations yet.</p>';
  const list = (rows, keyName) => rows.length
    ? rows.map((r) => `<li><div class="breakdown__row"><span>${esc(r[keyName])}</span><strong>${r.count}</strong></div><div class="breakdown__track"><div class="breakdown__fill" style="width:${(r.count / Math.max(1, s.total)) * 100}%"></div></div></li>`).join("")
    : '<li class="empty">No data yet.</li>';
  $("roles").innerHTML = list(s.roles, "role");
  $("sources").innerHTML = list(s.sources, "source");
  $("updatedAt").textContent = `Updated ${new Date().toLocaleTimeString("en-IN")}`;
}

function renderRows(rows) {
  $("rows").innerHTML = rows.length
    ? rows.map((r) => `<tr>
        <td class="muted">${r.id}</td>
        <td><strong>${esc(r.full_name)}</strong></td>
        <td>${esc(r.email)}</td>
        <td>${esc(r.phone)}</td>
        <td>${esc(r.college)}</td>
        <td>${esc(r.role)}</td>
        <td><span class="pill ${r.participation === "team" ? "pill--team" : ""}">${r.participation === "team" ? "Team" : "Solo"}</span></td>
        <td>${r.teammate_name ? `${esc(r.teammate_name)}<br><span class="muted">${esc(r.teammate_email)}</span>` : "<span class='muted'>–</span>"}</td>
        <td class="muted">${esc(r.heard_from || "–")}</td>
        <td class="muted">${fmtDate(r.created_at)}</td>
      </tr>`).join("")
    : '<tr><td colspan="10" class="muted">No registrations found.</td></tr>';
  const from = total ? offset + 1 : 0;
  const to = Math.min(offset + PAGE, total);
  $("count").textContent = `${total.toLocaleString("en-IN")} registration${total === 1 ? "" : "s"}${query ? ` matching "${query}"` : ""}`;
  $("pageInfo").textContent = total ? `${from}–${to} of ${total.toLocaleString("en-IN")}` : "";
  $("prevBtn").disabled = offset === 0;
  $("nextBtn").disabled = offset + PAGE >= total;
}

async function loadAll() {
  $("dashStatus").textContent = "";
  try {
    const [stats, list] = await Promise.all([
      api("/api/stats"),
      api("/api/registrations", { q: query, limit: PAGE, offset }),
    ]);
    total = list.total;
    renderStats(stats);
    renderRows(list.registrations);
    showDash();
  } catch (err) {
    showDash();
    $("dashStatus").textContent = err.message;
  }
}

$("refreshBtn").addEventListener("click", loadAll);
$("prevBtn").addEventListener("click", () => { offset = Math.max(0, offset - PAGE); loadAll(); });
$("nextBtn").addEventListener("click", () => { offset += PAGE; loadAll(); });
let t;
$("search").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { query = e.target.value.trim(); offset = 0; loadAll(); }, 300); });

loadAll();
