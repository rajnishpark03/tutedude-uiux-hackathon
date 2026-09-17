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
    if (body.errors) showErrors(body.errors);
    else status.textContent = body.error || "Something went wrong. Please try again.";
  } catch {
    status.textContent = "Network error. Check your connection and try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Register for Free";
  }
});
