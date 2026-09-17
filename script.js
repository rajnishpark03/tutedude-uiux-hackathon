// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Scroll reveal for sections and step cards
const revealTargets = document.querySelectorAll(
  ".hero__content, .hero__visual, .about__content, .about__tags, .prize-banner__inner, .process__intro, .timeline__day, .cta__card"
);
revealTargets.forEach((el) => el.classList.add("reveal"));
const isMobile = window.matchMedia("(max-width: 960px)").matches;
const mobileSteps = isMobile ? Array.from(document.querySelectorAll(".step")) : [];
mobileSteps.forEach((el, i) => { el.classList.add("reveal"); el.style.transitionDelay = `${Math.min(i, 4) * 60}ms`; });

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => io.observe(el));
  mobileSteps.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
  mobileSteps.forEach((el) => el.classList.add("is-visible"));
}

// Scroll-stacking cards (How it works + memes): shrink a card slightly as the next one covers it
const stackEls = Array.from(document.querySelectorAll(".steps, .memes__stack"));
const stacks = stackEls.map((el) =>
  Array.from(el.children).filter((c) => c.classList.contains("step") || c.classList.contains("meme"))
);
const steps = stacks[0] || [];
const progressEl = document.querySelector(".progress");
const progressItems = progressEl ? Array.from(progressEl.querySelectorAll("li[data-step]")) : [];
const introEl = document.querySelector(".process__intro");
const ctaEl = document.querySelector(".process__cta");
const mobileQuery = window.matchMedia("(max-width: 960px)");

// On phones the progress list lives inside the stack (sticky at the top);
// on desktop it sits in the sticky intro column.
function placeProgress() {
  if (!progressEl || !stackEls[0]) return;
  if (progressEl.parentElement === stackEls[0]) introEl.insertBefore(progressEl, ctaEl);
}

// Keep the stack (and the intro column) vertically centred in the viewport
function centerStacks() {
  const vh = window.innerHeight;
  stackEls.forEach((el, idx) => {
    const cards = stacks[idx];
    if (!cards.length) return;
    const gap = parseFloat(getComputedStyle(el).getPropertyValue("--stack-gap")) || 14;
    const h = cards[0].offsetHeight + (cards.length - 1) * gap;
    let top = Math.round(vh / 2 - h / 2);
    cards.forEach((card, i) => card.style.setProperty("--i", i));
    if (idx === 0 && mobileQuery.matches) { el.style.removeProperty("--stack-top"); return; }
    top = Math.max(top, 84);
    el.style.setProperty("--stack-top", top + "px");
    el.style.setProperty("--stack-h", cards[0].offsetHeight + "px");
    cards.forEach((card, i) => card.style.setProperty("--i", i));
  });
  if (introEl && !mobileQuery.matches) {
    introEl.style.top = Math.max(80, Math.round(vh / 2 - introEl.offsetHeight / 2)) + "px";
  } else if (introEl) {
    introEl.style.top = "";
  }
}

function updateStack() {
  // Steps: cards after the first stay hidden until they scroll up into view
  const vh = window.innerHeight;
  const mobile = mobileQuery.matches;
  if (mobile) steps.forEach((step) => { step.style.opacity = ""; step.style.removeProperty("--s"); step.style.removeProperty("--co"); step.style.removeProperty("--ty"); });
  stacks.forEach((cards, idx) => {
    if (idx === 0 && mobile) return;
    const n = cards.length;
    if (!n) return;
    const stackTop = parseFloat(getComputedStyle(cards[0]).top) || 0;
    const gap = parseFloat(getComputedStyle(stackEls[idx]).getPropertyValue("--stack-gap")) || 14;
    // depth[i] = how many cards are (continuously) stacked on top of card i
    const depth = new Array(n).fill(0);
    const rawTop = (card) => card.getBoundingClientRect().top - (parseFloat(card.style.getPropertyValue("--ty")) || 0);
    for (let i = n - 2; i >= 0; i--) {
      const curTop = rawTop(cards[i]);
      const curH = cards[i].offsetHeight;
      const nextTop = rawTop(cards[i + 1]);
      const covered = Math.min(Math.max((curTop + curH - nextTop) / curH, 0), 1);
      depth[i] = covered + depth[i + 1] * covered;
    }
    cards.forEach((card, i) => {
      const d = Math.min(depth[i], 4);
      let scale = 1 - d * 0.035;
      let opacity = 1 - d * 0.14;
      // Incoming card: starts near the bottom of the screen and glides up
      // faster than the scroll, landing exactly in its slot (translate does
      // not affect sticky, so the landing point stays precise).
      // Use the layout position (strip the translate we applied last frame)
      const prevTy = parseFloat(card.style.getPropertyValue("--ty")) || 0;
      const top = card.getBoundingClientRect().top - prevTy;
      const slot = stackTop + i * gap;
      let ty = 0;
      if (idx === 0 && top > slot + 1) {
        const dist = top - slot;
        const travel = Math.min(dist, vh * 0.6);
        ty = travel * 1.6;
        const p = Math.min(Math.max(1 - dist / (vh * 0.6), 0), 1);
        scale = 0.94 + 0.06 * p;
        opacity = 0.55 + 0.45 * p;
      }
      card.style.setProperty("--ty", ty.toFixed(1) + "px");
      card.style.setProperty("--s", scale.toFixed(4));
      card.style.setProperty("--co", opacity.toFixed(3));
      card.style.opacity = "";
    });
  });
  // Active step = the last card whose top has reached its sticky position
  let active = 0;
  const stickyTop = steps.length ? parseFloat(getComputedStyle(steps[0]).top) || 0 : 0;
  steps.forEach((step, i) => {
    const rt = step.getBoundingClientRect().top - (parseFloat(step.style.getPropertyValue("--ty")) || 0);
    if (rt <= stickyTop + i * 16 + 24) active = i;
  });
  progressItems.forEach((li, i) => {
    li.classList.toggle("is-active", i === active);
    li.classList.toggle("is-done", i < active);
  });


}
if (stacks.length) {
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => { updateStack(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  const relayout = () => { placeProgress(); centerStacks(); updateStack(); };
  window.addEventListener("resize", relayout);
  window.addEventListener("load", relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();
}


// ---------- Opening ceremony countdown + registration cutoff ----------
const CEREMONY_AT = new Date("2026-09-18T19:00:00+05:30").getTime();
const cdEl = document.getElementById("countdown");
const registerCtas = Array.from(document.querySelectorAll(".js-register"));
const closedModal = document.getElementById("closedModal");
let registrationsClosed = false;

function openClosedModal() {
  if (!closedModal) return;
  closedModal.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeClosedModal() {
  if (!closedModal) return;
  closedModal.hidden = true;
  document.body.style.overflow = "";
}
if (closedModal) {
  closedModal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeClosedModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeClosedModal(); });
}

function closeRegistrations() {
  if (registrationsClosed) return;
  registrationsClosed = true;
  registerCtas.forEach((a) => {
    a.textContent = "Registrations Closed";
    a.classList.add("is-closed");
    a.setAttribute("href", "#");
    a.setAttribute("aria-disabled", "true");
    a.addEventListener("click", (e) => { e.preventDefault(); openClosedModal(); });
  });
  if (cdEl) {
    cdEl.classList.add("is-live");
    document.getElementById("countdownLabel").textContent = "The opening ceremony is live";
  }
}

function tickCountdown() {
  const diff = CEREMONY_AT - Date.now();
  if (diff <= 0) { closeRegistrations(); return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const set = (k, v) => { const el = cdEl && cdEl.querySelector(`[data-cd="${k}"]`); if (el) el.textContent = String(v).padStart(2, "0"); };
  set("d", d); set("h", h); set("m", m); set("s", s);
}
if (cdEl) { tickCountdown(); setInterval(tickCountdown, 1000); }
