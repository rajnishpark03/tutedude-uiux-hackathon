document.getElementById("year").textContent = new Date().getFullYear();

const form = document.getElementById("regForm");
const teamFields = document.getElementById("teamFields");
const status = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

function setTeamVisibility() {
  const team = form.participation.value === "team";
  teamFields.hidden = !team;
  form.teammate_name.required = team;
  form.teammate_email.required = team;
}
form.querySelectorAll('input[name="participation"]').forEach((r) => r.addEventListener("change", setTeamVisibility));
setTeamVisibility();

function clearErrors() {
  form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  status.textContent = "";
}

function showErrors(errors) {
  let first = null;
  Object.entries(errors).forEach(([name, message]) => {
    const slot = form.querySelector(`.error[data-for="${name}"]`);
    if (slot) slot.textContent = message;
    const input = form.elements[name];
    const el = input && (input.length ? input[0] : input);
    if (el) {
      el.closest(".field")?.classList.add("is-invalid");
      if (!first) first = el;
    }
  });
  if (first && typeof first.focus === "function") first.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const data = Object.fromEntries(new FormData(form).entries());
  data.consent = form.consent.checked;

  submitBtn.disabled = true;
  submitBtn.textContent = "Registering…";

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));

    if (res.ok && body.ok) {
      form.hidden = true;
      document.getElementById("successEmail").textContent = data.email;
      document.getElementById("success").hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (body.closed) { showClosed(); return; }
    if (body.errors) showErrors(body.errors);
    else status.textContent = body.error || "Something went wrong. Please try again.";
  } catch {
    status.textContent = "Network error. Check your connection and try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Register for Free";
  }
});


// ---------- Registration cutoff (opening ceremony) ----------
const CEREMONY_AT = new Date("2026-09-18T19:00:00+05:30").getTime();
const cdEl = document.getElementById("countdown");
let closedShown = false;

function showClosed() {
  if (closedShown) return;
  closedShown = true;
  form.hidden = true;
  document.getElementById("success").hidden = true;
  document.getElementById("closed").hidden = false;
  if (cdEl) {
    cdEl.classList.add("is-live");
    document.getElementById("countdownLabel").textContent = "Registrations are closed";
  }
}

function tickCountdown() {
  const diff = CEREMONY_AT - Date.now();
  if (diff <= 0) { showClosed(); return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const set = (key, v) => { const el = cdEl && cdEl.querySelector(`[data-cd="${key}"]`); if (el) el.textContent = String(v).padStart(2, "0"); };
  set("d", d); set("h", h); set("m", m); set("s", s);
}
tickCountdown();
setInterval(tickCountdown, 1000);
