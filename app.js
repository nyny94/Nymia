const STORAGE_KEY = "nymia-v3";
const defaultState = {
  onboardingComplete: false,
  profile: { firstName: "", birthDate: "", goals: [] },
  notificationChoice: "not-asked",
  items: [],
  metrics: { sleep: "", water: "", activity: "", mood: "" },
  metricHistory: [],
  chat: [],
  focusDismissed: false,
  reminders: [],
  cycle: { lastPeriod: "", cycleLength: 28, periodLength: 5, notes: [] },
  quickActions: ["symptom", "treatment", "appointment", "document"],
  settings: { dailySummary: true, medicationAlerts: true, cycleAlerts: true },
};
let state = loadState(),
  step = 0,
  currentPage = "home";
const app = document.querySelector("#app"),
  toastEl = document.querySelector("#toast");
const typeMeta = {
  symptom: ["🩺", "Symptôme"],
  treatment: ["💊", "Traitement"],
  appointment: ["🗓️", "Rendez-vous"],
  exam: ["🧪", "Examen"],
  document: ["📁", "Document"],
  measure: ["〽️", "Mesure"],
  note: ["📝", "Note"],
  meal: ["🥣", "Repas"],
};
const goalOptions = [
  ["health", "🩺", "Organiser ma santé"],
  ["wellbeing", "🌿", "Suivre mon bien-être"],
  ["cycle", "📔", "Tenir mon carnet"],
  ["documents", "📄", "Centraliser mes documents"],
  ["reminders", "🔔", "Recevoir des rappels"],
];
function clone(v) {
  return JSON.parse(JSON.stringify(v));
}
function loadState() {
  try {
    const raw = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem("nymia-home-v2") ||
        "{}",
    );
    return deepMerge(clone(defaultState), raw);
  } catch {
    return clone(defaultState);
  }
}
function deepMerge(base, extra) {
  Object.keys(extra || {}).forEach((k) => {
    if (
      extra[k] &&
      typeof extra[k] === "object" &&
      !Array.isArray(extra[k]) &&
      base[k]
    )
      base[k] = deepMerge(base[k], extra[k]);
    else base[k] = extra[k];
  });
  return base;
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function esc(v = "") {
  return String(v).replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
function toast(m) {
  toastEl.textContent = m;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1900);
}
function fmtDate(value, opts = { day: "numeric", month: "long" }) {
  if (!value) return "Non renseignée";
  return new Intl.DateTimeFormat("fr-FR", opts).format(
    new Date(value + "T12:00:00"),
  );
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(date, days) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  return Math.round(
    (new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000,
  );
}
function progress() {
  return `<div class="progress">${[0, 1, 2, 3, 4].map((i) => `<span class="${i <= step ? "active" : ""}"></span>`).join("")}</div>`;
}
function layout(c, b = "") {
  return `<main class="onboarding">${progress()}<div class="brand">Nymia</div><section class="hero">${c}</section><div class="actions">${b}</div></main>`;
}
function welcome() {
  return layout(
    `<div class="hero-visual"><img src="hummingbird.svg" alt="Colibri Nymia"></div><h1>Ta santé, enfin organisée simplement.</h1><p class="lead">Santé, bien-être, cycle et rappels réunis dans ton espace personnel.</p>`,
    `<button class="primary" data-next>Commencer</button>`,
  );
}
function features() {
  return layout(
    `<h1>Tout au même endroit</h1><p class="lead">Tu avances à ton rythme et tu gardes le contrôle.</p><div class="feature-list"><div class="feature"><div class="feature-icon">🩺</div><div><b>Suivi santé</b><small>Traitements, symptômes et rendez-vous.</small></div></div><div class="feature"><div class="feature-icon">🌸</div><div><b>Cycle et bien-être</b><small>Des repères simples au quotidien.</small></div></div><div class="feature"><div class="feature-icon">🔒</div><div><b>Données privées</b><small>Conservées uniquement sur cet appareil.</small></div></div></div>`,
    `<button class="primary" data-next>Continuer</button><button class="ghost" data-back>Retour</button>`,
  );
}
function profile() {
  return layout(
    `<h1>Faisons connaissance</h1><div class="form-wrap"><label class="label" for="firstName">Prénom</label><input class="input" id="firstName" value="${esc(state.profile.firstName)}" placeholder="Ton prénom"><label class="label" for="birthDate">Date de naissance (facultatif)</label><input class="input" id="birthDate" type="date" value="${esc(state.profile.birthDate)}"></div>`,
    `<button class="primary" data-save-profile>Continuer</button><button class="ghost" data-back>Retour</button>`,
  );
}
function goals() {
  return layout(
    `<h1>Que veux-tu suivre ?</h1><div class="choices">${goalOptions.map(([id, ic, l]) => `<button class="choice ${state.profile.goals.includes(id) ? "selected" : ""}" data-goal="${id}"><span>${ic}</span><b>${l}</b></button>`).join("")}</div>`,
    `<button class="primary" data-save-goals>Continuer</button><button class="ghost" data-back>Retour</button>`,
  );
}
function notifications() {
  return layout(
    `<h1>Rester informée</h1><div class="permission-card"><div class="row"><div class="bell">🔔</div><div><b>Rappels Nymia</b><p>Pour les traitements et rendez-vous que tu choisis.</p></div></div><div class="permission-status">Tu pourras modifier ce choix dans ton profil.</div></div>`,
    `<button class="primary" data-enable-notifications>Autoriser</button><button class="secondary" data-finish>Plus tard</button><button class="ghost" data-back>Retour</button>`,
  );
}
function onboarding() {
  app.innerHTML = [welcome, features, profile, goals, notifications][step]();
  bindOnboarding();
}
function bindOnboarding() {
  document.querySelector("[data-next]")?.addEventListener("click", () => {
    step++;
    onboarding();
  });
  document.querySelector("[data-back]")?.addEventListener("click", () => {
    step = Math.max(0, step - 1);
    onboarding();
  });
  document
    .querySelector("[data-save-profile]")
    ?.addEventListener("click", () => {
      const n = document.querySelector("#firstName").value.trim();
      if (!n) return toast("Entre ton prénom");
      state.profile.firstName = n;
      state.profile.birthDate = document.querySelector("#birthDate").value;
      save();
      step++;
      onboarding();
    });
  document.querySelectorAll("[data-goal]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.goal;
        state.profile.goals = state.profile.goals.includes(id)
          ? state.profile.goals.filter((x) => x !== id)
          : [...state.profile.goals, id];
        save();
        onboarding();
      }),
  );
  document.querySelector("[data-save-goals]")?.addEventListener("click", () => {
    if (!state.profile.goals.length)
      return toast("Choisis au moins un objectif");
    step++;
    onboarding();
  });
  document
    .querySelector("[data-enable-notifications]")
    ?.addEventListener("click", async () => {
      try {
        state.notificationChoice =
          "Notification" in window
            ? await Notification.requestPermission()
            : "unsupported";
      } catch {
        state.notificationChoice = "unsupported";
      }
      save();
      finishOnboarding();
    });
  document
    .querySelector("[data-finish]")
    ?.addEventListener("click", finishOnboarding);
}
function finishOnboarding() {
  state.onboardingComplete = true;
  save();
  renderShell("home");
}
function todayLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date())
    .replace(/^./, (c) => c.toUpperCase());
}
function upcomingItems() {
  return [...state.items]
    .filter((i) => !i.date || i.date >= todayISO())
    .sort(
      (a, b) =>
        (a.date || todayISO()).localeCompare(b.date || todayISO()) ||
        (a.time || "99:99").localeCompare(b.time || "99:99"),
    );
}
function home() {
  const items = upcomingItems(),
    pending = state.reminders.filter((r) => !r.done).length;
  return `<header class="home-header"><div class="hello"><h1>Bonjour, ${esc(state.profile.firstName || "toi")} 👋</h1><div class="date">${todayLabel()}</div><div class="mood">💗 Prends soin de toi aujourd’hui</div></div><div class="header-actions"><button class="bell-btn" data-page="reminders" aria-label="Rappels">🔔${pending ? `<i>${pending}</i>` : ""}</button><button class="profile-avatar" data-page="profile">${esc((state.profile.firstName || "N")[0].toUpperCase())}</button></div></header><section class="home-screen">${state.focusDismissed ? "" : `<article class="focus-card"><button class="focus-close" data-dismiss-focus>×</button><img class="focus-art" src="hummingbird.svg" alt="Colibri"><div class="focus-content"><div class="focus-label"><span>★</span> FOCUS DU JOUR</div><h2>${items.length ? "Ton programme est prêt." : "Commence ton premier suivi."}</h2><p>${items.length ? `${items.length} élément${items.length > 1 ? "s" : ""} à retrouver dans ton agenda.` : "Ajoute une information pour personnaliser ton accueil."}</p></div><div class="focus-buttons"><button class="filled" data-add="appointment">${items.length ? "Ajouter" : "Commencer"}</button><button class="outline" data-page="health">Voir ma santé</button></div></article>`}<article class="colibri-card"><div class="colibri-top"><div class="colibri-icon"><img src="hummingbird.svg" alt=""></div><div class="colibri-copy"><div class="colibri-title">Colibri <span class="beta">BETA</span></div><p>Une question sur Nymia ou ton suivi ?</p></div><button class="chev" data-page="colibri">›</button></div><div class="ask-row"><input id="askColibri" placeholder="Pose-moi une question..."><button data-send-colibri aria-label="Envoyer">✦</button></div></article><div class="section-head"><h3>🗓 À VENIR</h3><button data-page="health">Voir tout ›</button></div>${items.length ? `<div class="today-list">${items.slice(0, 4).map(itemRow).join("")}</div>` : `<div class="today-empty"><div class="cal">🗓️</div><span>Aucun événement prévu</span></div>`}<div class="section-head"><h3>⚡ ACTIONS RAPIDES</h3><button data-customize>Personnaliser ›</button></div><div class="quick-actions">${state.quickActions
    .map((id) => {
      const [ic, label] = typeMeta[id];
      return `<button class="quick-action" data-add="${id}"><div class="iconbox">${ic}</div><small>${label}</small></button>`;
    })
    .join(
      "",
    )}<button class="quick-action" data-page="cycle"><div class="iconbox">📔</div><small>Mon Carnet</small></button><button class="quick-action" data-page="reminders"><div class="iconbox">🔔</div><small>Rappel</small></button></div><div class="section-head"><h3>📈 MON ÉVOLUTION</h3><button data-page="wellbeing">Voir plus ›</button></div><div class="evolution-grid">${metric("sleep", "🌙 Sommeil", state.metrics.sleep || "Aucune donnée", "sleep")}${metric("water", "💧 Hydratation", state.metrics.water || "Aucune donnée", "water")}${metric("activity", "🏃 Activité", state.metrics.activity || "Aucune donnée", "activity")}</div></section>`;
}
function itemRow(i) {
  return `<button class="today-row" data-item="${i.id}"><div class="time-pill">${esc(i.time || fmtDate(i.date, { day: "2-digit", month: "2-digit" }))}</div><div><b>${typeMeta[i.type][0]} ${esc(i.title)}</b><small>${esc(typeMeta[i.type][1])}${i.date ? " · " + fmtDate(i.date) : ""}</small></div><span>›</span></button>`;
}
function metric(id, title, value, cls) {
  return `<button class="metric-card ${cls}" data-metric="${id}"><div class="metric-title">${title}</div><div class="metric-value">${esc(value)}</div><div class="metric-note">Appuie pour renseigner</div><svg class="spark" viewBox="0 0 120 35"><polyline points="0,26 15,30 29,28 43,17 58,20 71,15 87,19 104,12 120,8"/></svg></button>`;
}
function healthIcon(type) {
  const paths = {
    symptom: '<path d="M7 3v5a5 5 0 0 0 10 0V3M5 3h4M15 3h4M12 13v3a4 4 0 0 0 8 0v-1"/><circle cx="20" cy="12" r="2"/>',
    treatment: '<path d="m10.5 20.5-7-7a4.24 4.24 0 0 1 6-6l7 7a4.24 4.24 0 0 1-6 6Z"/><path d="m8.5 8.5 7 7"/>',
    appointment: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    exam: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 16h10"/>',
    document: '<path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2"/>',
    measure: '<path d="M2 13h4l2-7 4 13 3-9 2 3h5"/>',
    cycle: '<circle cx="12" cy="9" r="5"/><path d="M12 14v8M8.5 18h7"/><path d="M5 6 2 3M19 6l3-3"/>',
    overview: '<path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    reminder: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    sport: '<path d="m13 5 2-2 2 2-2 2ZM6 21l3-6 3 2 2 4M8 9l3 2 3-3 4 2M11 11l-2 4M4 12l4-3"/>',
    nutrition: '<path d="M4 11h16a8 8 0 0 1-16 0ZM8 20h8M12 3v5M8 5l2 3M16 5l-2 3"/>',
    meditation: '<circle cx="12" cy="5" r="2"/><path d="M12 8v5M8 10l4 3 4-3M5 19c2-4 5-5 7-3 2-2 5-1 7 3M3 21h18"/>',
    sleep: '<path d="M20 15.5A8 8 0 1 1 8.5 4 6.5 6.5 0 0 0 20 15.5Z"/><path d="m18 4 .5 1.5L20 6l-1.5.5L18 8l-.5-1.5L16 6l1.5-.5Z"/>',
    water: '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/>',
    feminine: '<path d="M12 21c4-3 7-7 7-11a7 7 0 0 0-14 0c0 4 3 8 7 11Z"/><path d="M8 12c2 1 6 1 8 0M12 7v8"/>',
    gratitude: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  };
  return `<svg class="health-line-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[type] || paths.symptom}</svg>`;
}
function healthPage() {
  const appointment = upcomingItems().find((i) => i.type === "appointment");
  const treatments = state.items.filter((i) => i.type === "treatment");
  const shortcuts = [
    ["symptom", "Symptômes", "pink"],
    ["treatment", "Traitements", "purple"],
    ["appointment", "Rendez-vous", "blue"],
    ["exam", "Examens", "green"],
    ["document", "Documents", "orange"],
    ["measure", "Mesures", "cyan"],
    ["cycle", "Santé féminine", "rose"],
  ];
  const summaries = [
    [
      "symptom",
      state.items.filter((i) => i.type === "symptom").length,
      "Symptômes",
      "ce mois-ci",
      "violet",
    ],
    ["treatment", treatments.length, "Traitements", "en cours", "blue"],
    [
      "exam",
      state.items.filter((i) => i.type === "exam").length,
      "Examens",
      "ce mois-ci",
      "green",
    ],
    [
      "document",
      state.items.filter((i) => i.type === "document").length,
      "Documents",
      "enregistrés",
      "orange",
    ],
  ];
  return `<section class="health-dashboard"><header class="health-title"><div><h2>Ma Santé <span>♡</span></h2><p>Tout ton suivi médical, réuni au même endroit.</p></div><div class="health-tools"><button data-health-search aria-label="Rechercher">${healthIcon("search")}</button><button data-health-overview>${healthIcon("overview")} <span>Aperçu rapide</span></button></div></header><div class="health-section-title"><h3>ACCÈS RAPIDE</h3></div><div class="health-shortcuts">${shortcuts.map(([id, label, color]) => `<button class="health-shortcut" ${id === "cycle" ? 'data-page="cycle"' : `data-add="${id}"`}><span class="${color}">${healthIcon(id)}</span><b>${label}</b></button>`).join("")}</div><div class="health-section-title"><h3>AUJOURD’HUI</h3><button data-page="reminders">Voir tout ›</button></div>${appointment ? `<article class="health-appointment" data-item="${appointment.id}"><div class="appointment-icon">${healthIcon("appointment")}</div><div class="appointment-copy"><b>${esc(appointment.time || "Aujourd’hui")}</b><h3>${esc(appointment.title)}</h3><p>${esc(appointment.details || "Rendez-vous médical")}</p></div><button data-item="${appointment.id}">Voir détails</button></article>` : `<article class="health-appointment empty-appointment"><div class="appointment-icon">${healthIcon("appointment")}</div><div class="appointment-copy"><h3>Aucun rendez-vous aujourd’hui</h3><p>Ajoute ton prochain rendez-vous médical.</p></div><button data-add="appointment">Ajouter</button></article>`}<div class="health-section-title"><h3>MES RÉSUMÉS</h3><button data-health-customize>Personnaliser ›</button></div><div class="health-summaries">${summaries.map(([id, count, label, note, color]) => `<button class="health-summary ${color}" data-add="${id}"><span>${healthIcon(id)}</span><strong>${count}</strong><b>${label}</b><small>${note}</small><svg class="summary-spark" viewBox="0 0 120 28" preserveAspectRatio="none"><polyline points="0,23 14,21 25,12 39,19 53,20 68,10 80,15 92,8 106,13 120,7"/></svg></button>`).join("")}</div><div class="health-section-title"><h3>TRAITEMENTS EN COURS</h3><button data-add="treatment">Voir tout ›</button></div><div class="treatment-panel">${
    treatments.length
      ? treatments
          .slice(0, 4)
          .map(
            (t, i) =>
              `<button class="treatment-row" data-item="${t.id}"><span class="treatment-med ${["purple", "green", "orange"][i % 3]}">${healthIcon("treatment")}</span><div><h4>${esc(t.title)}</h4><p>${esc(t.details || "Traitement enregistré")}</p></div><div class="next-dose"><small>◷ Prochaine prise</small><b>${t.time ? `${todayISO() === t.date ? "Aujourd’hui" : "Prochainement"} ${esc(t.time)}` : "À définir"}</b></div><i>›</i></button>`,
          )
          .join("")
      : `<div class="treatment-empty"><span>${healthIcon("treatment")}</span><div><b>Aucun traitement enregistré</b><p>Ajoute un traitement pour suivre tes prochaines prises.</p></div><button data-add="treatment">Ajouter</button></div>`
  }<button class="manage-treatment" data-page="reminders">${healthIcon("reminder")} Gérer mes rappels de traitements <b>›</b></button></div></section>`;
}
function wellbeingPage() {
  const quick = [
    ["activity", "sport", "Sport", "mint"],
    ["nutrition", "nutrition", "Nutrition", "peach"],
    ["meditation", "meditation", "Méditation", "lilac"],
    ["sleep", "sleep", "Sommeil", "pink"],
    ["water", "water", "Hydratation", "blue"],
    ["cycle", "feminine", "Bien-être féminin", "gold"],
  ];
  const today = [
    ["activity", "sport", "ACTIVITÉ", state.metrics.activity || "6 200", "pas", 62, "mint"],
    ["nutrition", "nutrition", "ALIMENTATION", "1 420", "kcal", 71, "peach"],
    ["water", "water", "HYDRATATION", state.metrics.water || "1,6 L", "d’eau", 80, "blue"],
    ["sleep", "sleep", "SOMMEIL", state.metrics.sleep || "7h30", "de sommeil", 94, "lilac"],
  ];
  return `<section class="wellness-dashboard"><header class="wellness-title"><div><h2>Bien-être <span>❧</span></h2><p>Prends soin de ton corps, de ton esprit et de ton énergie.</p></div><div class="health-tools"><button aria-label="Rechercher">${healthIcon("search")}</button><button data-page="wellbeing">${healthIcon("overview")}</button></div></header><div class="wellness-heading"><h3>ACCÈS RAPIDE</h3></div><div class="wellness-shortcuts">${quick.map(([id, icon, label, color]) => `<button class="wellness-shortcut" ${id === "cycle" ? 'data-page="cycle"' : id === "activity" || id === "sleep" || id === "water" ? `data-metric="${id}"` : `data-wellness="${id}"`}><span class="${color}">${healthIcon(icon)}</span><b>${label}</b></button>`).join("")}</div><article class="wellness-focus"><button class="focus-close" aria-label="Fermer">×</button><div class="wellness-focus-copy"><div class="wellness-focus-label">✦ &nbsp; FOCUS DU JOUR</div><h3>Respire, recentre-toi,<br>tu es au bon endroit.</h3><p>10 minutes pour toi aujourd’hui<br>peuvent tout changer.</p><button data-start-pause>▶ &nbsp; Commencer ma pause</button></div><div class="wellness-figure"><div class="figure-head"></div><div class="figure-body"></div><div class="figure-legs"></div><i></i><i></i><i></i></div></article><div class="wellness-section-head"><h3>AUJOURD’HUI</h3><button>Voir plus ›</button></div><div class="wellness-stats">${today.map(([id, icon, label, value, unit, percent, color]) => `<button class="wellness-stat ${color}" ${id === "nutrition" ? 'data-wellness="nutrition"' : `data-metric="${id}"`}><div class="wellness-stat-top"><span>${healthIcon(icon)}</span><small>${label}</small></div><strong>${esc(value)}</strong><b>${unit}</b><div class="wellness-progress"><i style="width:${percent}%"></i></div><p>${percent} % de l’objectif</p></button>`).join("")}</div><div class="wellness-section-head"><h3>PROGRAMMES SÉLECTIONNÉS</h3><button>Voir tout ›</button></div><div class="wellness-programs"><button class="wellness-program fitness"><span>Remise en forme<small>4 semaines</small></span><i>60 %</i><b>›</b></button><button class="wellness-program food"><span>Équilibre alimentaire<small>3 semaines</small></span><i>40 %</i><b>›</b></button><button class="wellness-program calm"><span>Gestion du stress<small>7 jours</small></span><i>20 %</i><b>›</b></button></div><div class="wellness-section-head"><h3>INSPIRATION DU JOUR</h3></div><div class="wellness-inspiration"><article><span>“</span><p>Tu n’as pas besoin d’être parfaite,<br>tu as juste besoin d’être constante.</p><i>❀</i></article><button data-gratitude>${healthIcon("gratitude")}<span><b>Journal de gratitude</b><small>3 choses positives aujourd’hui ?</small></span><strong>›</strong></button></div></section>`;
}
function cycleInfo() {
  if (!state.cycle.lastPeriod) return null;
  const next = addDays(
      state.cycle.lastPeriod,
      Number(state.cycle.cycleLength) || 28,
    ),
    ovulation = addDays(next, -14),
    delta = daysBetween(todayISO(), next);
  return { next, ovulation, delta };
}
function cyclePage() {
  const info = cycleInfo();
  const notes = state.cycle.notes.slice().reverse();
  const cycleText = info && info.delta >= 0 ? `Règles dans ${info.delta} jour${info.delta > 1 ? "s" : ""}` : "Cycle à configurer";
  return `<section class="journal-dashboard"><header class="journal-title"><div><h2>Mon Carnet <span>📔</span></h2><p>Ton espace d’évolution personnelle.<br><b>Nymia t’accompagne avec bienveillance, sans jugement.</b></p></div><div class="journal-tools"><button aria-label="Rechercher">⌕</button><button class="journal-add" data-cycle-note>+</button><small>Nouvelle note</small></div></header><article class="journal-summary"><div class="journal-bird"><h3>Ce que Colibri a remarqué<br>cette semaine ♡</h3><small>Cette semaine</small><img src="hummingbird.svg" alt="Colibri"></div><div class="journal-observations"><b>Cette semaine, on avance ensemble, à ton rythme.</b><p>💧 <strong>Hydratation à surveiller</strong><br>Ton corps a besoin de régularité.</p><p>☾ <strong>Sommeil et récupération</strong><br>Écoute ton énergie et accorde-toi du repos.</p><p>🍴 <strong>Repas plus équilibrés</strong><br>Rien de grave, on ajuste ensemble.</p><p>🌸 <strong>${cycleText}</strong><br>Pense à ton confort et à tes besoins.</p></div><div class="journal-kind"><span>♡</span><b>Tu n’as rien raté.</b><p>Chaque semaine est une nouvelle occasion de prendre soin de toi.</p><button>Voir le détail ›</button></div></article><article class="journal-next"><span>🪄</span><div><b>Pour la semaine prochaine</b><p>Petit pas par petit pas. On y va doucement, sans pression.</p></div><button data-page="wellbeing">◎ Mes objectifs ›</button></article><div class="journal-section"><h3>Mes sujets clés <small>ⓘ</small></h3><button>Tout voir ›</button></div><p class="journal-subtitle">Ce qui compte pour toi, analysé avec bienveillance.</p><div class="journal-topics">${[["♡","Santé","Prends soin de toi et repose-toi quand ton corps te le dit.","À surveiller","rose"],["🥗","Alimentation","Reviens doucement vers des repas simples et nourrissants.","À rééquilibrer","green"],["☾","Sommeil","Un coucher régulier sera ton meilleur allié.","À prendre en main","purple"],["👟","Activité","Même 10 min par jour peuvent faire la différence.","À relancer","blue"],["❀","Cycle",cycleText + ". Pense à ton confort.","À anticiper","orange"]].map(([ic,t,p,b,c])=>`<article class="${c}"><span>${ic}</span><b>${t}</b><p>${p}</p><em>${b}</em></article>`).join("")}</div><div class="journal-section"><h3>Mes trackers <small>— cette semaine</small></h3><button data-page="wellbeing">Voir le détail ›</button></div><div class="journal-trackers">${[["💧","Hydratation",state.metrics.water||"1,0 L / jour","Insuffisant","blue"],["🥗","Repas équilibrés","3 / 7 jours","À améliorer","green"],["☾","Sommeil",state.metrics.sleep||"5h45 / nuit","Trop faible","purple"],["🚶","Pas quotidiens",state.metrics.activity||"4 210 pas","En dessous","orange"],["❀","Bien-être","2 / 7 jours","Prends soin de toi","rose"]].map(([ic,t,v,s,c])=>`<button class="${c}" data-page="wellbeing"><span>${ic}</span><b>${t}</b><strong>${esc(v)}</strong><small>${s}</small><i></i></button>`).join("")}</div><div class="journal-bottom"><article><h3>Mes pistes pour aller mieux</h3><p>☾ <b>Me coucher 30 min plus tôt</b><small>Pour récupérer et améliorer mes nuits</small></p><p>💧 <b>Boire 1,5 L d’eau par jour</b><small>Commencer la journée avec un grand verre</small></p><p>🥗 <b>Préparer 3 repas maison simples</b><small>Équilibrés, rassasiants et bons pour moi</small></p></article><article><h3>Mes notes récentes <button data-cycle-note>Tout voir ›</button></h3>${notes.length ? notes.slice(0,3).map(n=>`<p class="journal-note"><span>♡</span><b>${fmtDate(n.date)}</b><small>${esc(n.text)}</small></p>`).join("") : `<div class="journal-empty"><span>♡</span><b>Ton carnet commence ici</b><p>Ajoute un moment, une pensée ou une petite victoire.</p><button data-cycle-note>Écrire ma première note</button></div>`}</article></div><button class="journal-cycle-settings" data-cycle-settings>🌸 ${info ? "Modifier les informations de mon cycle" : "Configurer le suivi de mon cycle"}</button></section>`;
}
function remindersPage() {
  const list = [...state.reminders].sort(
    (a, b) =>
      a.done - b.done ||
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  );
  return `<section class="module-page"><div class="page-title"><div><h2>Mes rappels</h2><p>Traitements, rendez-vous et tâches importantes.</p></div><button class="page-add" data-add-reminder>+</button></div><div class="reminder-tabs"><span>${list.filter((r) => !r.done).length} à faire</span><span>${list.filter((r) => r.done).length} terminé${list.filter((r) => r.done).length > 1 ? "s" : ""}</span></div>${list.length ? `<div class="reminder-list">${list.map((r) => `<article class="reminder-row ${r.done ? "done" : ""}"><button data-toggle-reminder="${r.id}" aria-label="Marquer comme fait">${r.done ? "✓" : ""}</button><div><h3>${esc(r.title)}</h3><p>${fmtDate(r.date)} · ${esc(r.time || "Sans heure")}</p></div><button data-delete-reminder="${r.id}" aria-label="Supprimer">×</button></article>`).join("")}</div>` : `<div class="empty"><div class="empty-icon">🔔</div><h3>Aucun rappel</h3><p>Ajoute un rappel pour un traitement ou un rendez-vous.</p></div>`}<button class="wide-secondary" data-request-notification>${state.notificationChoice === "granted" ? "Notifications autorisées" : "Activer les notifications"}</button></section>`;
}
function colibriAnswer(q) {
  const s = q.toLowerCase();
  if (/urgence|respire|poitrine|suicide|saignement/.test(s))
    return `Si la situation est urgente ou inquiétante, appelle immédiatement le 15 ou le 112. Je ne peux pas évaluer une urgence médicale.`;
  if (/rappel|notification/.test(s))
    return `Va dans « Rappels », puis appuie sur +. Tu peux choisir une date et une heure, puis autoriser les notifications.`;
  if (/cycle|règle|regle/.test(s))
    return `Dans « Mon Carnet », le suivi du cycle estime tes prochaines règles à partir de la dernière date et de la durée moyenne indiquées. Ces dates restent indicatives.`;
  if (/traitement|médicament|medicament/.test(s))
    return `Tu peux enregistrer un traitement depuis « Ma santé » ou le bouton +. Pour un conseil médical ou un effet indésirable, contacte un professionnel de santé ou un pharmacien.`;
  if (/sommeil|eau|hydratation|activité|activite/.test(s))
    return `Tu peux compléter cet indicateur dans « Bien-être ». Nymia conserve ensuite un petit historique de tes saisies.`;
  return `Je peux t’aider à utiliser Nymia, organiser tes rappels et retrouver tes suivis. Pour une question médicale personnelle, demande conseil à un professionnel de santé.`;
}
function colibriPage() {
  return `<section class="module-page colibri-page"><div class="page-title"><div><h2>Colibri</h2><p>Ton guide dans Nymia.</p></div></div><div class="assistant-warning">Colibri ne remplace pas un médecin et ne pose pas de diagnostic.</div><div class="chat-list">${state.chat.length ? state.chat.map((m) => `<div class="chat-bubble ${m.role}">${esc(m.text)}</div>`).join("") : `<div class="empty"><div class="empty-icon"><img src="hummingbird.svg" alt=""></div><h3>Bonjour ${esc(state.profile.firstName || "")}</h3><p>Demande-moi comment utiliser Nymia.</p></div>`}</div><div class="suggestions">${["Créer un rappel", "Ouvrir Mon Carnet", "Ajouter un traitement"].map((q) => `<button data-suggestion="${q}">${q}</button>`).join("")}</div><div class="chat-compose"><input id="chatInput" placeholder="Écris ta question..."><button data-chat-send>Envoyer</button></div></section>`;
}
function profilePage() {
  const name = esc(state.profile.firstName || "Nymia");
  return `<section class="profile-dashboard"><header class="profile-title"><div><h2>Profil <span>🕊️</span></h2><p>Ton espace, tes réglages, ta confidentialité.</p></div><button data-page="reminders">♧<i></i></button></header><article class="profile-welcome"><div class="profile-photo"></div><div><h3>Bonjour, ${name} <span>♥</span></h3><p>Prendre soin de toi, chaque jour,<br>à ton rythme.</p><button data-edit-profile>✎ Modifier mon profil</button></div><blockquote>“<p>Chaque petit pas compte.<br>Tu es en chemin et tu fais déjà de belles choses.</p><small>♥ Colibri</small></blockquote></article><h3 class="profile-section-title">Mon compte</h3><div class="profile-account">${[["♙","Informations personnelles","Nom, âge, taille, poids, coordonnées…","edit-profile"],["◎","Mes objectifs","Mes objectifs santé, bien-être et personnels","wellbeing"],["♧","Notifications","Gérer les rappels, alertes et préférences","reminders"],["♙","Confidentialité","Données, partage, sécurité",""] ,["↥","Sauvegarde","Sauvegarder et restaurer mes données","export"],["⇩","Exporter mes données","Télécharger mes données personnelles","export"]].map(([ic,t,p,a])=>`<button ${a==="edit-profile"?'data-edit-profile':a==="export"?'data-export':a?`data-page="${a}"`:''}><span>${ic}</span><b>${t}</b><small>${p}</small><i>›</i></button>`).join("")}</div><h3 class="profile-section-title">Personnalisation</h3><article class="profile-custom"><button><span>☾</span><b>Thème</b><small>Clair</small><i>›</i></button><button><span>Aa</span><b>Taille du texte</b><small>Moyenne</small><i>›</i></button><button><span>♡</span><b>Couleurs</b><small>Lavande</small><i>›</i></button><button><span>☻</span><b>Langue</b><small>Français</small><i>›</i></button><div class="profile-notebook"></div></article><h3 class="profile-section-title">Support & à propos</h3><div class="profile-support"><div><button>ⓘ <span><b>Centre d’aide</b><small>FAQ, guides et articles</small></span><i>›</i></button><button>☵ <span><b>Nous contacter</b><small>Écris-nous, nous sommes là pour toi</small></span><i>›</i></button><button data-about>ⓘ <span><b>À propos de Nymia</b><small>Notre mission, nos valeurs</small></span><i>›</i></button><button>☆ <span><b>Noter l’application</b><small>Ton avis nous aide à nous améliorer</small></span><i>›</i></button></div><article><img src="hummingbird.svg" alt="Colibri"><p>Nymia <span>♥</span> :<br>ton alliée bienveillante<br>pour ta santé et ton bien-être.</p><small>Version 1.0.0</small></article></div><button class="profile-reset" data-reset>⇥ &nbsp; Se déconnecter</button></section>`;
}
function shellContent(page) {
  return page === "home"
    ? home()
    : page === "health"
      ? healthPage()
      : page === "wellbeing"
        ? wellbeingPage()
        : page === "cycle"
          ? cyclePage()
          : page === "reminders"
            ? remindersPage()
            : page === "colibri"
              ? colibriPage()
              : profilePage();
}
function renderShell(page = "home") {
  currentPage = page;
  const navItem=(id,ic,label)=>`<button data-page="${id}" class="${id===page?"active":""}">${ic}<small>${label}</small></button>`;
  app.innerHTML = `<div class="shell">${shellContent(page)}<button class="fab" data-open-add aria-label="Ajouter">+</button><nav>${navItem("home","⌂","Accueil")}${navItem("health","♡","Ma santé")}${navItem("wellbeing","◡","Bien-être")}<span class="nav-gap"></span>${navItem("colibri","🕊","Colibri")}${navItem("cycle","▣","Mon Carnet")}${navItem("profile","♙","Profil")}</nav></div>`;
  bindShell();
}
function bindShell() {
  document
    .querySelectorAll("[data-page]")
    .forEach((b) => (b.onclick = () => renderShell(b.dataset.page)));
  document
    .querySelectorAll("[data-add]")
    .forEach((b) => (b.onclick = () => openForm(b.dataset.add)));
  document
    .querySelector("[data-open-add]")
    ?.addEventListener("click", openAddMenu);
  document
    .querySelectorAll("[data-metric]")
    .forEach((b) => (b.onclick = () => openMetric(b.dataset.metric)));
  document
    .querySelectorAll("[data-item]")
    .forEach((b) => (b.onclick = () => openItemDetail(Number(b.dataset.item))));
  document.querySelectorAll("[data-mood]").forEach(
    (b) =>
      (b.onclick = () => {
        state.metrics.mood = b.dataset.mood;
        state.metricHistory.push({
          date: todayISO(),
          label: "Humeur",
          value: b.dataset.mood,
        });
        save();
        renderShell("wellbeing");
        toast("Humeur enregistrée");
      }),
  );
  document
    .querySelector("[data-dismiss-focus]")
    ?.addEventListener("click", () => {
      state.focusDismissed = true;
      save();
      renderShell("home");
    });
  document
    .querySelector("[data-send-colibri]")
    ?.addEventListener("click", () =>
      sendChat(document.querySelector("#askColibri").value),
    );
  document
    .querySelector("[data-chat-send]")
    ?.addEventListener("click", () =>
      sendChat(document.querySelector("#chatInput").value),
    );
  document
    .querySelectorAll("[data-suggestion]")
    .forEach((b) => (b.onclick = () => sendChat(b.dataset.suggestion)));
  document
    .querySelector("[data-customize]")
    ?.addEventListener("click", openCustomize);
  document.querySelectorAll("[data-wellness]").forEach(
    (b) =>
      (b.onclick = () =>
        toast(
          b.dataset.wellness === "nutrition"
            ? "Le suivi nutrition arrive dans la prochaine étape"
            : "Ce programme arrive dans la prochaine étape",
        )),
  );
  document
    .querySelector("[data-start-pause]")
    ?.addEventListener("click", () =>
      sheet(
        "Ma pause",
        '<div class="pause-card"><div class="pause-orb">10:00</div><h3>Respire doucement</h3><p>Inspire pendant 4 secondes, puis expire pendant 6 secondes.</p><button class="wide-primary" data-close-pause>Terminer ma pause</button></div>',
      ),
    );
  document
    .querySelector("[data-gratitude]")
    ?.addEventListener("click", () =>
      sheet(
        "Journal de gratitude",
        '<form id="gratitudeForm"><label>Mes 3 choses positives aujourd’hui</label><textarea name="gratitude" required placeholder="1. Une belle chose…\n2. Un petit plaisir…\n3. Une personne ou un moment…"></textarea><button class="save">Enregistrer</button></form>',
      ),
    );
  document
    .querySelector("[data-cycle-settings]")
    ?.addEventListener("click", openCycleSettings);
  document
    .querySelectorAll("[data-cycle-note]")
    .forEach((b) => b.addEventListener("click", openCycleNote));
  document
    .querySelector("[data-add-reminder]")
    ?.addEventListener("click", openReminder);
  document.querySelectorAll("[data-toggle-reminder]").forEach(
    (b) =>
      (b.onclick = () => {
        const r = state.reminders.find(
          (x) => x.id === Number(b.dataset.toggleReminder),
        );
        r.done = !r.done;
        save();
        renderShell("reminders");
      }),
  );
  document.querySelectorAll("[data-delete-reminder]").forEach(
    (b) =>
      (b.onclick = () => {
        state.reminders = state.reminders.filter(
          (x) => x.id !== Number(b.dataset.deleteReminder),
        );
        save();
        renderShell("reminders");
        toast("Rappel supprimé");
      }),
  );
  document
    .querySelector("[data-request-notification]")
    ?.addEventListener("click", requestNotifications);
  document
    .querySelectorAll("[data-edit-profile]")
    .forEach((b) => b.addEventListener("click", openProfileEdit));
  document
    .querySelectorAll("[data-export]")
    .forEach((b) => b.addEventListener("click", exportData));
  document
    .querySelectorAll("[data-about]")
    .forEach((b) => b.addEventListener("click", () =>
      sheet(
        "À propos",
        `<div class="detail-card"><h3>Nymia version 3</h3><p>Un espace personnel pour organiser santé, bien-être, cycle et rappels.</p><div class="safety-note">Nymia ne remplace jamais un professionnel de santé. En cas d’urgence, appelle le 15 ou le 112.</div></div>`,
      ),
    ));
  document.querySelector("[data-reset]")?.addEventListener("click", () => {
    if (confirm("Effacer toutes les données de Nymia ?")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("nymia-home-v2");
      state = clone(defaultState);
      step = 0;
      onboarding();
    }
  });
}
function sendChat(q) {
  q = (q || "").trim();
  if (!q) return toast("Écris une question");
  state.chat.push(
    { id: Date.now(), role: "user", text: q },
    { id: Date.now() + 1, role: "assistant", text: colibriAnswer(q) },
  );
  save();
  renderShell("colibri");
}
function sheet(title, body) {
  const d = document.createElement("div");
  d.className = "modal-backdrop";
  d.innerHTML = `<div class="sheet"><div class="sheet-handle"></div><div class="sheet-head"><h2>${title}</h2><button data-close>×</button></div>${body}</div>`;
  document.body.appendChild(d);
  d.onclick = (e) => {
    if (e.target === d) d.remove();
  };
  d.querySelector("[data-close]").onclick = () => d.remove();
  return d;
}
function openAddMenu() {
  const d = sheet(
    "Ajouter",
    `<div class="add-menu">${Object.entries(typeMeta)
      .map(
        ([id, [ic, l]]) =>
          `<button data-menu-add="${id}"><span>${ic}</span>${l}</button>`,
      )
      .join(
        "",
      )}<button data-menu-reminder><span>🔔</span>Rappel</button></div>`,
  );
  d.querySelectorAll("[data-menu-add]").forEach(
    (b) =>
      (b.onclick = () => {
        d.remove();
        openForm(b.dataset.menuAdd);
      }),
  );
  d.querySelector("[data-menu-reminder]").onclick = () => {
    d.remove();
    openReminder();
  };
}
function openForm(type, item = null) {
  const [, label] = typeMeta[type],
    d = sheet(
      `${item ? "Modifier" : "Ajouter"} : ${label}`,
      `<form id="itemForm"><label>Titre</label><input name="title" required value="${esc(item?.title || "")}" placeholder="${label}"><div class="two-cols"><div><label>Date</label><input name="date" type="date" value="${esc(item?.date || todayISO())}"></div><div><label>Heure</label><input name="time" type="time" value="${esc(item?.time || "")}"></div></div><label>Détails</label><textarea name="details" placeholder="Informations facultatives">${esc(item?.details || "")}</textarea><button class="save">Enregistrer</button></form>`,
    );
  d.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target),
      data = {
        id: item?.id || Date.now(),
        type,
        title: fd.get("title").trim(),
        date: fd.get("date"),
        time: fd.get("time"),
        details: fd.get("details"),
      };
    if (item) Object.assign(item, data);
    else state.items.push(data);
    save();
    d.remove();
    renderShell(currentPage === "health" ? "health" : "home");
    toast(`${label} ${item ? "modifié" : "ajouté"}`);
  };
}
function openItemDetail(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const [, label] = typeMeta[item.type],
    d = sheet(
      label,
      `<div class="detail-card"><h3>${esc(item.title)}</h3><p><b>Date :</b> ${fmtDate(item.date, { day: "numeric", month: "long", year: "numeric" })}</p><p><b>Heure :</b> ${esc(item.time || "Non renseignée")}</p>${item.details ? `<p>${esc(item.details)}</p>` : ""}<div class="detail-actions"><button data-edit>Modifier</button><button class="delete" data-delete>Supprimer</button></div></div>`,
    );
  d.querySelector("[data-edit]").onclick = () => {
    d.remove();
    openForm(item.type, item);
  };
  d.querySelector("[data-delete]").onclick = () => {
    if (confirm("Supprimer cet élément ?")) {
      state.items = state.items.filter((i) => i.id !== id);
      save();
      d.remove();
      renderShell(currentPage);
      toast("Élément supprimé");
    }
  };
}
function openMetric(id) {
  const labels = {
      sleep: ["Sommeil", "ex. 7 h 30"],
      water: ["Hydratation", "ex. 1,8 L"],
      activity: ["Activité", "ex. 6 200 pas"],
    },
    [label, p] = labels[id],
    d = sheet(
      `Renseigner : ${label}`,
      `<form><label>Valeur du jour</label><input name="value" required value="${esc(state.metrics[id])}" placeholder="${p}"><button class="save">Enregistrer</button></form>`,
    );
  d.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const value = new FormData(e.target).get("value").trim();
    state.metrics[id] = value;
    state.metricHistory.push({ date: todayISO(), label, value });
    save();
    d.remove();
    renderShell("wellbeing");
    toast(`${label} mis à jour`);
  };
}
function openReminder() {
  const d = sheet(
    "Nouveau rappel",
    `<form><label>Titre du rappel</label><input name="title" required placeholder="Ex. Prendre mon traitement"><div class="two-cols"><div><label>Date</label><input name="date" type="date" required value="${todayISO()}"></div><div><label>Heure</label><input name="time" type="time"></div></div><button class="save">Créer le rappel</button></form>`,
  );
  d.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.reminders.push({
      id: Date.now(),
      title: fd.get("title").trim(),
      date: fd.get("date"),
      time: fd.get("time"),
      done: false,
    });
    save();
    d.remove();
    renderShell("reminders");
    toast("Rappel créé");
  };
}
async function requestNotifications() {
  try {
    state.notificationChoice =
      "Notification" in window
        ? await Notification.requestPermission()
        : "unsupported";
    save();
    renderShell("reminders");
    toast(
      state.notificationChoice === "granted"
        ? "Notifications autorisées"
        : "Notifications non autorisées",
    );
  } catch {
    toast("Notifications indisponibles");
  }
}
function openCycleSettings() {
  const d = sheet(
    "Suivi du cycle dans Mon Carnet",
    `<form><label>Premier jour des dernières règles</label><input name="lastPeriod" type="date" required value="${esc(state.cycle.lastPeriod)}"><div class="two-cols"><div><label>Cycle moyen</label><input name="cycleLength" type="number" min="15" max="60" value="${state.cycle.cycleLength}"></div><div><label>Durée des règles</label><input name="periodLength" type="number" min="1" max="15" value="${state.cycle.periodLength}"></div></div><button class="save">Enregistrer</button></form>`,
  );
  d.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.cycle.lastPeriod = fd.get("lastPeriod");
    state.cycle.cycleLength = Number(fd.get("cycleLength"));
    state.cycle.periodLength = Number(fd.get("periodLength"));
    save();
    d.remove();
    renderShell("cycle");
    toast("Mon Carnet a été mis à jour");
  };
}
function openCycleNote() {
  const d = sheet(
    "Ajouter une note",
    `<form><label>Date</label><input name="date" type="date" value="${todayISO()}"><label>Note</label><textarea name="text" required placeholder="Douleur, humeur, énergie..."></textarea><button class="save">Enregistrer</button></form>`,
  );
  d.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.cycle.notes.push({
      id: Date.now(),
      date: fd.get("date"),
      text: fd.get("text").trim(),
    });
    save();
    d.remove();
    renderShell("cycle");
    toast("Note ajoutée");
  };
}
function openCustomize() {
  const d = sheet(
    "Actions rapides",
    `<p class="muted">Choisis quatre actions à afficher sur l’accueil.</p><div class="choices compact">${Object.entries(
      typeMeta,
    )
      .map(
        ([id, [ic, l]]) =>
          `<button type="button" class="choice ${state.quickActions.includes(id) ? "selected" : ""}" data-quick="${id}"><span>${ic}</span><b>${l}</b></button>`,
      )
      .join(
        "",
      )}</div><button class="wide-primary" data-save-quick>Enregistrer</button>`,
  );
  let picks = [...state.quickActions];
  d.querySelectorAll("[data-quick]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.quick;
        if (picks.includes(id)) picks = picks.filter((x) => x !== id);
        else if (picks.length < 4) picks.push(id);
        else return toast("Choisis au maximum 4 actions");
        b.classList.toggle("selected");
      }),
  );
  d.querySelector("[data-save-quick]").onclick = () => {
    if (!picks.length) return toast("Choisis au moins une action");
    state.quickActions = picks;
    save();
    d.remove();
    renderShell("home");
  };
}
function openProfileEdit() {
  const d = sheet(
    "Mes informations",
    `<form><label>Prénom</label><input name="firstName" required value="${esc(state.profile.firstName)}"><label>Date de naissance</label><input name="birthDate" type="date" value="${esc(state.profile.birthDate)}"><button class="save">Enregistrer</button></form>`,
  );
  d.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.profile.firstName = fd.get("firstName").trim();
    state.profile.birthDate = fd.get("birthDate");
    save();
    d.remove();
    renderShell("profile");
    toast("Profil mis à jour");
  };
}
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `nymia-export-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Export préparé");
}
if (state.onboardingComplete) renderShell("home");
else onboarding();
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
