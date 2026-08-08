const STORAGE_KEY = "nymia-v3";
const defaultState = {
  onboardingComplete: false,
  profile: { firstName: "", birthDate: "", goals: [], photo: "", lastName: "", height: "", weight: "", phone: "", email: "" },
  notificationChoice: "not-asked",
  items: [],
  metrics: { sleep: "", water: "", activity: "", mood: "" },
  metricHistory: [],
  nutrition: [],
  gratitude: [],
  meditationHistory: [],
  chat: [],
  focusDismissed: false,
  reminders: [],
  cycle: { lastPeriod: "", cycleLength: 28, periodLength: 5, notes: [] },
  quickActions: ["symptom", "treatment", "appointment", "document"],
  settings: { dailySummary: true, medicationAlerts: true, cycleAlerts: true, hydrationAlerts: false, theme: "light", textSize: "medium", color: "lavender", language: "fr" },
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
  return `<header class="home-header"><div class="hello"><h1>Bonjour, ${esc(state.profile.firstName || "toi")} 👋</h1><div class="date">${todayLabel()}</div><div class="mood">💗 Prends soin de toi aujourd’hui</div></div><div class="header-actions"><button class="bell-btn" data-page="reminders" aria-label="Rappels">🔔${pending ? `<i>${pending}</i>` : ""}</button><button class="profile-avatar" data-page="profile">${state.profile.photo ? `<img src="${state.profile.photo}" alt="">` : esc((state.profile.firstName || "N")[0].toUpperCase())}</button></div></header><section class="home-screen">${state.focusDismissed ? "" : `<article class="focus-card"><button class="focus-close" data-dismiss-focus>×</button><img class="focus-art" src="hummingbird.svg" alt="Colibri"><div class="focus-content"><div class="focus-label"><span>★</span> FOCUS DU JOUR</div><h2>${items.length ? "Ton programme est prêt." : "Commence ton premier suivi."}</h2><p>${items.length ? `${items.length} élément${items.length > 1 ? "s" : ""} à retrouver dans ton agenda.` : "Ajoute une information pour personnaliser ton accueil."}</p></div><div class="focus-buttons"><button class="filled" data-add="appointment">${items.length ? "Ajouter" : "Commencer"}</button><button class="outline" data-page="health">Voir ma santé</button></div></article>`}<article class="colibri-card"><div class="colibri-top"><div class="colibri-icon"><img src="hummingbird.svg" alt=""></div><div class="colibri-copy"><div class="colibri-title">Colibri <span class="beta">BETA</span></div><p>Une question sur Nymia ou ton suivi ?</p></div><button class="chev" data-page="colibri">›</button></div><div class="ask-row"><input id="askColibri" placeholder="Pose-moi une question..."><button data-send-colibri aria-label="Envoyer">✦</button></div></article><div class="section-head"><h3>🗓 À VENIR</h3><button data-page="agenda">Voir tout ›</button></div>${items.length ? `<div class="today-list">${items.slice(0, 4).map(itemRow).join("")}</div>` : `<div class="today-empty"><div class="cal">🗓️</div><span>Aucun événement prévu</span></div>`}<div class="section-head"><h3>⚡ MES RACCOURCIS</h3><button data-customize>Personnaliser ›</button></div><div class="quick-actions">${state.quickActions
    .map((id) => {
      const [ic, label] = typeMeta[id];
      return `<button class="quick-action" data-add="${id}"><div class="iconbox">${ic}</div><small>${label}</small></button>`;
    })
    .join(
      "",
    )}</div><div class="section-head"><h3>📈 MON ÉVOLUTION</h3><button data-page="tracking">Voir le suivi ›</button></div><div class="evolution-grid">${metric("sleep", "🌙 Sommeil", state.metrics.sleep || "Aucune donnée", "sleep")}${metric("water", "💧 Hydratation", state.metrics.water || "Aucune donnée", "water")}${metric("activity", "🏃 Activité", state.metrics.activity || "Aucune donnée", "activity")}</div></section>`;
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
    ["appointment", upcomingItems().filter(i=>i.type==="appointment").length, "Rendez-vous", "à venir", "violet"],
    ["reminder", state.reminders.filter(r=>!r.done).length, "Rappels", "actifs", "blue"],
    ["measure", state.metricHistory.length, "Mesures", "enregistrées", "green"],
    ["document", state.items.filter(i=>i.type==="document").length, "Documents", "conservés", "orange"],
  ];
  return `<section class="health-dashboard"><header class="health-title"><div><h2>Ma Santé <span>♡</span></h2><p>Tout ton suivi médical, réuni au même endroit.</p></div><div class="health-tools"><button data-health-search aria-label="Rechercher">${healthIcon("search")}</button><button data-health-overview>${healthIcon("overview")} <span>Aperçu rapide</span></button></div></header><div class="health-section-title"><h3>AJOUTER UNE INFORMATION</h3></div><div class="health-shortcuts">${shortcuts.map(([id, label, color]) => `<button class="health-shortcut" ${id === "cycle" ? 'data-page="cycle-detail"' : id === "document" ? 'data-page="documents"' : `data-add="${id}"`}><span class="${color}">${healthIcon(id)}</span><b>${label}</b></button>`).join("")}</div><div class="health-section-title"><h3>PROCHAIN RENDEZ-VOUS</h3><button data-page="agenda">Voir l’agenda ›</button></div>${appointment ? `<article class="health-appointment" data-item="${appointment.id}"><div class="appointment-icon">${healthIcon("appointment")}</div><div class="appointment-copy"><b>${esc(appointment.time || "Aujourd’hui")}</b><h3>${esc(appointment.title)}</h3><p>${esc(appointment.details || "Rendez-vous médical")}</p></div><button data-item="${appointment.id}">Voir détails</button></article>` : `<article class="health-appointment empty-appointment"><div class="appointment-icon">${healthIcon("appointment")}</div><div class="appointment-copy"><h3>Aucun rendez-vous à venir</h3><p>Ajoute ton prochain rendez-vous médical.</p></div><button data-add="appointment">Ajouter</button></article>`}<div class="health-section-title"><h3>MON DOSSIER EN CHIFFRES</h3><button data-page="health-overview">Ouvrir le bilan ›</button></div><div class="health-summaries">${summaries.map(([id, count, label, note, color]) => `<button class="health-summary ${color}" data-page="health-overview"><span>${healthIcon(id)}</span><strong>${count}</strong><b>${label}</b><small>${note}</small><svg class="summary-spark" viewBox="0 0 120 28" preserveAspectRatio="none"><polyline points="0,23 14,21 25,12 39,19 53,20 68,10 80,15 92,8 106,13 120,7"/></svg></button>`).join("")}</div><div class="health-section-title"><h3>TRAITEMENTS EN COURS</h3><button data-page="treatments">Voir tout ›</button></div><div class="treatment-panel">${
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
  const hasNutrition=state.nutrition.length>0;
  const today = [
    ["activity", "sport", "ACTIVITÉ", state.metrics.activity || "—", state.metrics.activity ? "pas" : "Aucune donnée", state.metrics.activity ? 55 : 0, "mint"],
    ["nutrition", "nutrition", "ALIMENTATION", hasNutrition ? `${state.nutrition.length}` : "—", hasNutrition ? "repas enregistrés" : "Aucune donnée", hasNutrition ? Math.min(100,state.nutrition.length*20) : 0, "peach"],
    ["water", "water", "HYDRATATION", state.metrics.water || "—", state.metrics.water ? "aujourd’hui" : "Aucune donnée", state.metrics.water ? 70 : 0, "blue"],
    ["sleep", "sleep", "SOMMEIL", state.metrics.sleep || "—", state.metrics.sleep ? "la nuit dernière" : "Aucune donnée", state.metrics.sleep ? 75 : 0, "lilac"],
  ];
  return `<section class="wellness-dashboard"><header class="wellness-title"><div><h2>Bien-être <span>❧</span></h2><p>Prends soin de ton corps, de ton esprit et de ton énergie.</p></div><div class="health-tools"><button aria-label="Rechercher">${healthIcon("search")}</button><button data-page="tracking">${healthIcon("overview")}</button></div></header><div class="wellness-heading"><h3>MES OUTILS BIEN-ÊTRE</h3></div><div class="wellness-shortcuts">${quick.map(([id, icon, label, color]) => `<button class="wellness-shortcut" data-page="${id === "cycle" ? "cycle-detail" : id}"><span class="${color}">${healthIcon(icon)}</span><b>${label}</b></button>`).join("")}</div><article class="wellness-focus"><button class="focus-close" aria-label="Fermer">×</button><div class="wellness-focus-copy"><div class="wellness-focus-label">✦ &nbsp; FOCUS DU JOUR</div><h3>Respire, recentre-toi,<br>tu es au bon endroit.</h3><p>Choisis 1, 5 ou 10 minutes<br>pour une vraie pause guidée.</p><button data-page="meditation">▶ &nbsp; Choisir ma pause</button></div><div class="wellness-figure"><div class="figure-head"></div><div class="figure-body"></div><div class="figure-legs"></div><i></i><i></i><i></i></div></article><div class="wellness-section-head"><h3>MES DONNÉES DU JOUR</h3><button data-page="tracking">Voir tout ›</button></div><div class="wellness-stats">${today.map(([id, icon, label, value, unit, percent, color]) => `<button class="wellness-stat ${color}" data-page="${id}"><div class="wellness-stat-top"><span>${healthIcon(icon)}</span><small>${label}</small></div><strong>${esc(value)}</strong><b>${unit}</b><div class="wellness-progress"><i style="width:${percent}%"></i></div><p>${percent ? percent+" % de l’objectif" : "À renseigner"}</p></button>`).join("")}</div><div class="wellness-section-head"><h3>MES PROGRAMMES</h3><button data-page="programs">Voir tout ›</button></div><div class="wellness-programs"><button class="wellness-program fitness" data-program="fitness"><span>Remise en forme<small>4 semaines</small></span><i>Ouvrir</i><b>›</b></button><button class="wellness-program food" data-program="food"><span>Équilibre alimentaire<small>3 semaines</small></span><i>Ouvrir</i><b>›</b></button><button class="wellness-program calm" data-program="calm"><span>Gestion du stress<small>7 jours</small></span><i>Ouvrir</i><b>›</b></button></div><div class="wellness-section-head"><h3>MON JOURNAL POSITIF</h3></div><div class="wellness-inspiration"><article><span>“</span><p>${state.gratitude.length ? esc(state.gratitude[state.gratitude.length-1].text) : "Ajoute une pensée positive réellement vécue aujourd’hui."}</p><i>❀</i></article><button data-gratitude>${healthIcon("gratitude")}<span><b>Journal de gratitude</b><small>${state.gratitude.length} note${state.gratitude.length>1?"s":""} enregistrée${state.gratitude.length>1?"s":""}</small></span><strong>›</strong></button></div></section>`;
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
function innerHeader(title, subtitle, back="home") {
  return `<div class="inner-head"><button data-page="${back}" aria-label="Retour">‹</button><div><h2>${title}</h2><p>${subtitle}</p></div></div>`;
}
function journalPage(){
  const info=cycleInfo(),notes=state.cycle.notes.slice().reverse();
  const signals=[];
  if(state.metrics.water) signals.push(["💧","Hydratation",state.metrics.water,"water"]);
  if(state.metrics.sleep) signals.push(["☾","Sommeil",state.metrics.sleep,"sleep"]);
  if(state.metrics.activity) signals.push(["👟","Activité",state.metrics.activity,"activity"]);
  if(state.nutrition.length) signals.push(["🥗","Nutrition",`${state.nutrition.length} repas enregistrés`,"nutrition"]);
  if(info) signals.push(["🌸","Cycle",info.delta>=0?`Règles estimées dans ${info.delta} jour${info.delta>1?"s":""}`:"Cycle à mettre à jour","cycle-detail"]);
  const hasData=signals.length||notes.length;
  return `<section class="journal-dashboard"><header class="journal-title"><div><h2>Mon Carnet <span>📔</span></h2><p>Ton espace d’évolution personnelle.<br><b>Uniquement à partir de tes propres données.</b></p></div><div class="journal-tools"><button aria-label="Rechercher">⌕</button><button class="journal-add" data-cycle-note>+</button><small>Nouvelle note</small></div></header>${hasData?`<article class="journal-summary"><div class="journal-bird"><h3>Ce que Colibri a remarqué<br>cette semaine ♡</h3><small>D’après tes saisies</small><img src="hummingbird.svg" alt="Colibri"></div><div class="journal-observations"><b>${signals.length?"Voici les informations que tu as enregistrées :":"Aucune donnée de suivi cette semaine."}</b>${signals.map(([ic,t,v])=>`<p>${ic} <strong>${t}</strong><br>${esc(v)}</p>`).join("")}</div><div class="journal-kind"><span>♡</span><b>Aucun jugement.</b><p>Ce carnet résume tes données sans inventer de conclusion médicale.</p></div></article>`:`<article class="journal-no-data"><img src="hummingbird.svg" alt=""><h3>Ton carnet est encore vide</h3><p>Colibri ne fera aucune remarque tant que tu n’auras pas renseigné de données.</p><button data-page="tracking">Commencer mon suivi</button></article>`}<article class="journal-next"><span>◎</span><div><b>Mes objectifs personnels</b><p>Choisis tes objectifs au lieu d’être redirigée vers une page générale.</p></div><button data-page="goals">Ouvrir mes objectifs ›</button></article><div class="journal-section"><h3>Mes sujets suivis</h3><button data-page="tracking">Tout voir ›</button></div>${signals.length?`<div class="journal-topics">${signals.map(([ic,t,v,page],i)=>`<button class="topic-button" data-page="${page}"><span>${ic}</span><b>${t}</b><p>${esc(v)}</p><em>Voir mon suivi</em></button>`).join("")}</div>`:`<div class="today-empty">Aucun sujet analysé sans données.</div>`}<div class="journal-bottom"><article><h3>Mes pistes personnelles</h3>${signals.length?`<p>Les conseils apparaîtront progressivement à partir de tes objectifs et de tes données. Ils resteront généraux et prudents.</p><button class="wide-secondary" data-page="goals">Définir mes objectifs</button>`:`<p class="muted">Aucune piste affichée : il n’y a pas encore assez d’informations.</p>`}</article><article><h3>Mes notes récentes <button data-cycle-note>Ajouter ›</button></h3>${notes.length?notes.slice(0,3).map(n=>`<p class="journal-note"><span>♡</span><b>${fmtDate(n.date)}</b><small>${esc(n.text)}</small></p>`).join(""):`<div class="journal-empty"><span>♡</span><b>Ton carnet commence ici</b><p>Ajoute une pensée ou un ressenti.</p></div>`}</article></div><button class="journal-cycle-settings" data-page="cycle-detail">🌸 Ouvrir mon suivi du cycle</button></section>`;
}
function agendaPage() {
  const appointments=upcomingItems().filter(i=>i.type==="appointment");
  return `<section class="module-page functional-page">${innerHeader("Mes rendez-vous","Tous tes rendez-vous à venir.")}<button class="wide-primary" data-add="appointment">+ Ajouter un rendez-vous</button>${appointments.length?`<div class="functional-list">${appointments.map(itemRow).join("")}</div>`:`<div class="empty"><div class="empty-icon">🗓️</div><h3>Aucun rendez-vous à venir</h3><p>Les rendez-vous que tu ajoutes apparaîtront ici.</p></div>`}</section>`;
}
function documentsPage() {
  const docs=state.items.filter(i=>i.type==="document");
  return `<section class="module-page functional-page">${innerHeader("Mes documents","Ordonnances, résultats et documents personnels.","health")}<button class="wide-primary" data-upload-document>+ Importer un document</button>${docs.length?`<div class="functional-list">${docs.map(d=>`<article class="file-row"><span>📄</span><div><b>${esc(d.title)}</b><small>${fmtDate(d.date)}${d.fileName?" · "+esc(d.fileName):""}</small></div>${d.fileData?`<button data-download-document="${d.id}">Télécharger</button>`:""}<button data-delete-document="${d.id}">×</button></article>`).join("")}</div>`:`<div class="empty"><div class="empty-icon">📁</div><h3>Aucun document</h3><p>Importe une photo ou un fichier PDF depuis ton téléphone.</p></div>`}<p class="storage-note">Les fichiers restent uniquement dans cette application sur cet appareil. Les fichiers volumineux peuvent dépasser la capacité de stockage du navigateur.</p></section>`;
}
function trackingPage() {
  const rows=[["sleep","🌙","Sommeil"],["activity","👟","Pas et activité"],["water","💧","Hydratation"],["nutrition","🥗","Nutrition"]];
  return `<section class="module-page functional-page">${innerHeader("Mon suivi quotidien","Des données réelles, jamais inventées.","wellbeing")}<div class="phone-limit"><b>Synchronisation iPhone</b><p>Cette version web ne peut pas lire Apple Santé automatiquement. Tu peux saisir tes valeurs ou les importer manuellement.</p></div><div class="tracking-list">${rows.map(([id,ic,l])=>`<button data-page="${id}"><span>${ic}</span><div><b>${l}</b><small>${id==="nutrition"?(state.nutrition.length?state.nutrition.length+" repas enregistrés":"Aucune donnée"):state.metrics[id]||"Aucune donnée"}</small></div><i>›</i></button>`).join("")}</div><div class="history"><h3>Historique récent</h3>${state.metricHistory.length?state.metricHistory.slice(-12).reverse().map(h=>`<div><b>${esc(h.label)}</b><span>${fmtDate(h.date)} · ${esc(h.value)}</span></div>`).join(""):`<p class="muted">Aucune donnée enregistrée.</p>`}</div></section>`;
}
function metricDetailPage(id) {
  const cfg={sleep:["Sommeil","🌙","Heures dormies","ex. 7 h 30"],activity:["Pas et activité","👟","Nombre de pas","ex. 6 200 pas"],water:["Hydratation","💧","Eau consommée","ex. 1,5 L"]}[id];
  const history=state.metricHistory.filter(h=>h.label===cfg[0] || (id==="activity"&&h.label==="Activité") || (id==="water"&&h.label==="Hydratation"));
  return `<section class="module-page functional-page">${innerHeader(cfg[0],"Suis ton évolution avec tes propres données.","wellbeing")}<article class="data-hero"><span>${cfg[1]}</span><b>${esc(state.metrics[id]||"Aucune donnée")}</b><small>Dernière valeur enregistrée</small></article><button class="wide-primary" data-metric="${id}">+ Renseigner aujourd’hui</button>${id==="water"?`<button class="wide-secondary" data-hydration-reminder>${state.settings.hydrationAlerts?"Modifier mon rappel d’hydratation":"Créer un rappel d’hydratation"}</button>`:""}<div class="history"><h3>Historique</h3>${history.length?history.slice().reverse().map(h=>`<div><b>${fmtDate(h.date)}</b><span>${esc(h.value)}</span></div>`).join(""):`<p class="muted">Aucune mesure pour le moment.</p>`}</div></section>`;
}
function nutritionPage() {
  return `<section class="module-page functional-page">${innerHeader("Nutrition","Enregistre ce que tu manges, sans jugement.","wellbeing")}<button class="wide-primary" data-add-meal>+ Ajouter un repas</button>${state.nutrition.length?`<div class="functional-list">${state.nutrition.slice().reverse().map(n=>`<article class="meal-row"><span>🥗</span><div><b>${esc(n.name)}</b><small>${fmtDate(n.date)} · ${esc(n.type)}</small><p>${esc(n.details||"")}</p></div><button data-delete-meal="${n.id}">×</button></article>`).join("")}</div>`:`<div class="empty"><div class="empty-icon">🥗</div><h3>Aucun repas enregistré</h3><p>Commence par ajouter un repas ou une collation.</p></div>`}</section>`;
}
function meditationPage() {
  return `<section class="module-page functional-page">${innerHeader("Méditation et respiration","Choisis une durée et lance un vrai compte à rebours.","wellbeing")}<div class="duration-grid">${[1,5,10].map(m=>`<button data-start-timer="${m}"><b>${m}</b><small>minute${m>1?"s":""}</small></button>`).join("")}</div><div class="history"><h3>Mes pauses terminées</h3>${state.meditationHistory.length?state.meditationHistory.slice().reverse().map(h=>`<div><b>${fmtDate(h.date)}</b><span>${h.minutes} min</span></div>`).join(""):`<p class="muted">Aucune pause terminée.</p>`}</div></section>`;
}
function programsPage() {
  return `<section class="module-page functional-page">${innerHeader("Mes programmes","Des étapes simples que tu peux cocher.","wellbeing")}<div class="program-list">${[["fitness","Remise en forme","Marcher 15 min|Étirements 5 min|Boire après l’effort"],["food","Équilibre alimentaire","Ajouter un légume|Préparer un repas maison|Boire un verre d’eau"],["calm","Gestion du stress","Respirer 5 min|Couper les écrans 20 min|Noter une pensée positive"]].map(([id,t,steps])=>`<article><h3>${t}</h3>${steps.split("|").map((s,i)=>`<label><input type="checkbox" data-program-step="${id}-${i}" ${state.settings[`step-${id}-${i}`]?"checked":""}> ${s}</label>`).join("")}</article>`).join("")}</div></section>`;
}
function treatmentsPage(){const list=state.items.filter(i=>i.type==="treatment");return `<section class="module-page functional-page">${innerHeader("Mes traitements","Traitements enregistrés et rappels associés.","health")}<button class="wide-primary" data-add="treatment">+ Ajouter un traitement</button>${list.length?`<div class="functional-list">${list.map(itemRow).join("")}</div><button class="wide-secondary" data-treatment-reminders>Créer les rappels manquants</button>`:`<div class="empty"><div class="empty-icon">💊</div><h3>Aucun traitement</h3></div>`}<button class="wide-secondary" data-page="reminders">Gérer tous mes rappels</button></section>`}
function healthOverviewPage(){const counts=Object.keys(typeMeta).map(id=>[typeMeta[id][0],typeMeta[id][1],state.items.filter(i=>i.type===id).length]);return `<section class="module-page functional-page">${innerHeader("Bilan de mon dossier","Un récapitulatif, différent des boutons d’ajout.","health")}<div class="overview-grid">${counts.map(([ic,l,n])=>`<article><span>${ic}</span><b>${n}</b><small>${l}</small></article>`).join("")}</div></section>`}
function goalsPage(){const goals=[["sleep","Mieux dormir"],["water","Boire suffisamment"],["activity","Bouger davantage"],["nutrition","Mieux manger"],["cycle","Suivre mon cycle"],["health","Organiser ma santé"]];return `<section class="module-page functional-page">${innerHeader("Mes objectifs","Choisis ce qui compte vraiment pour toi.","profile")}<div class="goal-list">${goals.map(([id,l])=>`<label><input type="checkbox" data-profile-goal="${id}" ${state.profile.goals.includes(id)?"checked":""}><span>${l}</span></label>`).join("")}</div></section>`}
function privacyPage(){return `<section class="module-page functional-page">${innerHeader("Confidentialité","Comprendre où restent tes informations.","profile")}<article class="privacy-detail"><h3>🔒 Stockage local</h3><p>Tes données sont enregistrées dans le navigateur de cet appareil. Nymia ne les envoie pas sur un serveur.</p><h3>Suppression</h3><p>Tu peux effacer toutes les données depuis le profil.</p><h3>Photo et documents</h3><p>Ils restent également sur cet appareil. Une désinstallation ou un nettoyage de Safari peut les supprimer : utilise la sauvegarde.</p></article></section>`}
function backupPage(){return `<section class="module-page functional-page">${innerHeader("Sauvegarde","Créer une copie ou restaurer l’application.","profile")}<button class="wide-primary" data-export>Créer une sauvegarde</button><label class="import-backup">Restaurer une sauvegarde<input type="file" accept="application/json" data-import-backup></label><p class="storage-note">La sauvegarde contient tes données Nymia au format JSON. L’export simple sert à récupérer une copie ; la restauration réinjecte cette copie dans l’application.</p></section>`}
function cycleDetailPage(){const info=cycleInfo();return `<section class="module-page functional-page">${innerHeader("Suivi du cycle","Un écran clair pour tes dates et symptômes.","cycle")}<article class="cycle-detail-hero"><span>🌸</span><div><small>Prochaines règles estimées</small><h3>${info?fmtDate(info.next,{day:"numeric",month:"long",year:"numeric"}):"Cycle non configuré"}</h3><p>${info?`${info.delta} jour${info.delta>1?"s":""} restant${info.delta>1?"s":""}`:"Ajoute le premier jour de tes dernières règles."}</p></div></article><button class="wide-primary" data-cycle-settings>${info?"Modifier mes dates":"Configurer mon cycle"}</button><div class="cycle-grid"><article><span>Durée moyenne</span><b>${state.cycle.cycleLength} jours</b></article><article><span>Durée des règles</span><b>${state.cycle.periodLength} jours</b></article></div><div class="safety-note">Les estimations ne sont ni un diagnostic ni un moyen de contraception.</div><div class="section-head"><h3>JOURNAL DU CYCLE</h3><button data-cycle-note>Ajouter ›</button></div>${state.cycle.notes.length?`<div class="notes-list">${state.cycle.notes.slice().reverse().map(n=>`<div><b>${fmtDate(n.date)}</b><p>${esc(n.text)}</p></div>`).join("")}</div>`:`<div class="today-empty">Aucun symptôme ou ressenti enregistré.</div>`}</section>`}
function remindersPage() {
  const list = [...state.reminders].sort(
    (a, b) =>
      a.done - b.done ||
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  );
  return `<section class="module-page functional-page">${innerHeader("Mes notifications","Traitements, hydratation et tâches importantes.","home")}<button class="page-add reminder-add" data-add-reminder>+</button><div class="reminder-tabs"><span>${list.filter((r) => !r.done).length} à faire</span><span>${list.filter((r) => r.done).length} terminé${list.filter((r) => r.done).length > 1 ? "s" : ""}</span></div>${list.length ? `<div class="reminder-list">${list.map((r) => `<article class="reminder-row ${r.done ? "done" : ""}"><button data-toggle-reminder="${r.id}" aria-label="Marquer comme fait">${r.done ? "✓" : ""}</button><div><h3>${esc(r.title)}</h3><p>${fmtDate(r.date)} · ${esc(r.time || "Sans heure")}</p></div><button data-delete-reminder="${r.id}" aria-label="Supprimer">×</button></article>`).join("")}</div>` : `<div class="empty"><div class="empty-icon">🔔</div><h3>Aucun rappel</h3><p>Ajoute un rappel pour un traitement ou l’hydratation.</p></div>`}<button class="wide-secondary" data-request-notification>${state.notificationChoice === "granted" ? "Notifications autorisées" : "Activer les notifications"}</button></section>`;
}
function colibriAnswer(q) {
  const s = q.toLowerCase();
  if (/urgence|mal.*poitrine|difficulté.*respir|suicide|saignement abondant|perte de connaissance/.test(s))
    return `Si la situation est urgente ou inquiétante, appelle immédiatement le 15 ou le 112. Je ne peux pas évaluer une urgence médicale.`;
  if (/mal au ventre|ventre|digestion|nausée/.test(s))
    return `Pour un inconfort digestif léger, privilégie temporairement de petites portions simples : riz, banane, compote, pain grillé, légumes bien cuits, bouillon, et bois régulièrement par petites gorgées. Évite l’alcool, les plats très gras ou épicés. Si la douleur est forte, localisée, persiste, s’accompagne de fièvre, vomissements répétés, sang ou grossesse possible, demande rapidement un avis médical. Je ne peux pas te conseiller un médicament sans connaître ta situation.`;
  if (/manger|nutrition|repas|aliment|maigrir|grossir/.test(s))
    return `Je peux proposer des repères généraux : une source de légumes ou fruits, une protéine, un féculent adapté à ta faim et de l’eau. Dis-moi ton objectif, tes allergies, ce que tu n’aimes pas et ce que tu as à la maison pour une suggestion plus utile. Pour un régime médical, une grossesse, un diabète ou des troubles alimentaires, il faut l’avis d’un professionnel.`;
  if (/mal de tête|migraine/.test(s))
    return `Pour un mal de tête léger : repose-toi au calme, hydrate-toi et évite les écrans quelques minutes. Une douleur brutale inhabituelle, après un choc, avec fièvre, raideur de nuque, faiblesse ou trouble de la parole nécessite un avis urgent. Pour un médicament, vérifie avec un pharmacien ou un médecin selon tes antécédents et traitements.`;
  if (/rappel|notification/.test(s))
    return `Va dans « Rappels », puis appuie sur +. Tu peux choisir une date et une heure, puis autoriser les notifications.`;
  if (/cycle|règle|regle/.test(s))
    return `Dans « Mon Carnet », le suivi du cycle estime tes prochaines règles à partir de la dernière date et de la durée moyenne indiquées. Ces dates restent indicatives.`;
  if (/traitement|médicament|medicament/.test(s))
    return `Tu peux enregistrer un traitement depuis « Ma santé » ou le bouton +. Pour un conseil médical ou un effet indésirable, contacte un professionnel de santé ou un pharmacien.`;
  if (/sommeil|eau|hydratation|activité|activite/.test(s))
    return `Tu peux compléter cet indicateur dans « Bien-être ». Nymia conserve ensuite un petit historique de tes saisies.`;
  return `Je peux t’aider sur l’utilisation de Nymia, l’organisation, l’alimentation générale, le sommeil, l’hydratation et des gestes de bien-être prudents. Décris davantage ta situation (depuis quand, intensité, symptômes associés, allergies ou traitements) : je te donnerai des repères sans poser de diagnostic.`;
}
function colibriPage() {
  return `<section class="module-page colibri-page"><div class="page-title"><div><h2>Colibri</h2><p>Ton guide dans Nymia.</p></div></div><div class="assistant-warning">Colibri ne remplace pas un médecin et ne pose pas de diagnostic.</div><div class="chat-list">${state.chat.length ? state.chat.map((m) => `<div class="chat-bubble ${m.role}">${esc(m.text)}</div>`).join("") : `<div class="empty"><div class="empty-icon"><img src="hummingbird.svg" alt=""></div><h3>Bonjour ${esc(state.profile.firstName || "")}</h3><p>Demande-moi comment utiliser Nymia.</p></div>`}</div><div class="suggestions">${["Créer un rappel", "Ouvrir Mon Carnet", "Ajouter un traitement"].map((q) => `<button data-suggestion="${q}">${q}</button>`).join("")}</div><div class="chat-compose"><input id="chatInput" placeholder="Écris ta question..."><button data-chat-send>Envoyer</button></div></section>`;
}
function profilePage() {
  const name = esc(state.profile.firstName || "Nymia");
  return `<section class="profile-dashboard"><header class="profile-title"><div><h2>Profil <span>🕊️</span></h2><p>Ton espace, tes réglages, ta confidentialité.</p></div><button data-page="reminders">♧<i></i></button></header><article class="profile-welcome"><button class="profile-photo ${state.profile.photo?"has-photo":""}" data-profile-photo ${state.profile.photo?`style="background-image:url('${state.profile.photo}')"`:""} aria-label="Choisir une photo"></button><div><h3>Bonjour, ${name} <span>♥</span></h3><p>Prendre soin de toi, chaque jour,<br>à ton rythme.</p><button data-edit-profile>✎ Modifier mon profil</button></div><blockquote>“<p>Chaque petit pas compte.<br>Tu es en chemin et tu fais déjà de belles choses.</p><small>♥ Colibri</small></blockquote></article><h3 class="profile-section-title">Mon compte</h3><div class="profile-account">${[["♙","Informations personnelles","Nom, âge, taille, poids, coordonnées…","edit-profile"],["◎","Mes objectifs","Une page dédiée à tes objectifs","goals"],["♧","Notifications","Gérer les rappels et alertes","reminders"],["♙","Confidentialité","Données, partage, sécurité","privacy"] ,["↥","Sauvegarde","Sauvegarder et restaurer les données","backup"],["⇩","Exporter mes données","Télécharger une copie personnelle","export"]].map(([ic,t,p,a])=>`<button ${a==="edit-profile"?'data-edit-profile':a==="export"?'data-export':`data-page="${a}"`}><span>${ic}</span><b>${t}</b><small>${p}</small><i>›</i></button>`).join("")}</div><h3 class="profile-section-title">Personnalisation</h3><article class="profile-custom"><button data-pref="theme"><span>☾</span><b>Thème</b><small>${state.settings.theme==="dark"?"Sombre":"Clair"}</small><i>›</i></button><button data-pref="textSize"><span>Aa</span><b>Taille du texte</b><small>${state.settings.textSize==="large"?"Grande":"Moyenne"}</small><i>›</i></button><button data-pref="color"><span>♡</span><b>Couleurs</b><small>${state.settings.color==="rose"?"Rose":"Lavande"}</small><i>›</i></button><button data-pref="language"><span>☻</span><b>Langue</b><small>Français</small><i>›</i></button><div class="profile-notebook"></div></article><h3 class="profile-section-title">Support & à propos</h3><div class="profile-support"><div><button data-help>ⓘ <span><b>Centre d’aide</b><small>FAQ et fonctionnement</small></span><i>›</i></button><button data-contact>☵ <span><b>Nous contacter</b><small>Informations de contact</small></span><i>›</i></button><button data-about>ⓘ <span><b>À propos de Nymia</b><small>Notre mission, nos valeurs</small></span><i>›</i></button><button data-rate>☆ <span><b>Noter l’application</b><small>Ton avis nous aide à nous améliorer</small></span><i>›</i></button></div><article><img src="hummingbird.svg" alt="Colibri"><p>Nymia <span>♥</span> :<br>ton alliée bienveillante<br>pour ta santé et ton bien-être.</p><small>Version 1.0.0</small></article></div><button class="profile-reset" data-reset>Effacer toutes mes données</button></section>`;
}
function shellContent(page) {
  const pages={home,health:healthPage,wellbeing:wellbeingPage,cycle:journalPage,reminders:remindersPage,colibri:colibriPage,profile:profilePage,agenda:agendaPage,documents:documentsPage,tracking:trackingPage,nutrition:nutritionPage,meditation:meditationPage,programs:programsPage,treatments:treatmentsPage,"health-overview":healthOverviewPage,goals:goalsPage,privacy:privacyPage,backup:backupPage,"cycle-detail":cycleDetailPage,sleep:()=>metricDetailPage("sleep"),activity:()=>metricDetailPage("activity"),water:()=>metricDetailPage("water")};
  return (pages[page]||profilePage)();
}
function renderShell(page = "home") {
  currentPage = page;
  const navItem=(id,ic,label)=>`<button data-page="${id}" class="${id===page?"active":""}">${ic}<small>${label}</small></button>`;
  app.innerHTML = `<div class="shell page-${page}">${shellContent(page)}<button class="fab" data-open-add aria-label="Ajouter">+</button><nav>${navItem("home","⌂","Accueil")}${navItem("health","♡","Ma santé")}${navItem("wellbeing","◡","Bien-être")}<span class="nav-gap"></span>${navItem("colibri","🕊","Colibri")}${navItem("cycle","▣","Mon Carnet")}${navItem("profile","♙","Profil")}</nav></div>`;
  bindShell();
}
function bindShell() {
  document
    .querySelectorAll("[data-page]")
    .forEach((b) => (b.onclick = () => renderShell(b.dataset.page)));
  document
    .querySelectorAll("[data-add]")
    .forEach((b) => (b.onclick = () => b.dataset.add === "document" ? openDocumentUpload() : openForm(b.dataset.add)));
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
    ?.addEventListener("click", () => {
      const d=sheet(
        "Journal de gratitude",
        '<form id="gratitudeForm"><label>Mes 3 choses positives aujourd’hui</label><textarea name="gratitude" required placeholder="1. Une belle chose…\n2. Un petit plaisir…\n3. Une personne ou un moment…"></textarea><button class="save">Enregistrer</button></form>',
      );
      d.querySelector("form").onsubmit=e=>{e.preventDefault();state.gratitude.push({id:Date.now(),date:todayISO(),text:new FormData(e.target).get("gratitude").trim()});save();d.remove();renderShell("wellbeing");toast("Pensée enregistrée")};
    });
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
  document.querySelector("[data-health-overview]")?.addEventListener("click",()=>renderShell("health-overview"));
  document.querySelector("[data-health-search]")?.addEventListener("click",openHealthSearch);
  document.querySelectorAll("[data-program]").forEach(b=>b.onclick=()=>openProgram(b.dataset.program));
  document.querySelectorAll("[data-start-timer]").forEach(b=>b.onclick=()=>startPauseTimer(Number(b.dataset.startTimer)));
  document.querySelector("[data-upload-document]")?.addEventListener("click",openDocumentUpload);
  document.querySelectorAll("[data-download-document]").forEach(b=>b.onclick=()=>downloadDocument(Number(b.dataset.downloadDocument)));
  document.querySelectorAll("[data-delete-document]").forEach(b=>b.onclick=()=>deleteDocument(Number(b.dataset.deleteDocument)));
  document.querySelector("[data-add-meal]")?.addEventListener("click",openMealForm);
  document.querySelectorAll("[data-delete-meal]").forEach(b=>b.onclick=()=>{state.nutrition=state.nutrition.filter(n=>n.id!==Number(b.dataset.deleteMeal));save();renderShell("nutrition")});
  document.querySelector("[data-hydration-reminder]")?.addEventListener("click",openHydrationReminder);
  document.querySelector("[data-treatment-reminders]")?.addEventListener("click",createTreatmentReminders);
  document.querySelectorAll("[data-program-step]").forEach(i=>i.onchange=()=>{state.settings[`step-${i.dataset.programStep}`]=i.checked;save()});
  document.querySelectorAll("[data-profile-goal]").forEach(i=>i.onchange=()=>{state.profile.goals=i.checked?[...new Set([...state.profile.goals,i.dataset.profileGoal])]:state.profile.goals.filter(g=>g!==i.dataset.profileGoal);save();toast("Objectifs mis à jour")});
  document.querySelector("[data-profile-photo]")?.addEventListener("click",openProfilePhoto);
  document.querySelectorAll("[data-pref]").forEach(b=>b.onclick=()=>openPreference(b.dataset.pref));
  document.querySelector("[data-import-backup]")?.addEventListener("change",importBackup);
  document.querySelector("[data-help]")?.addEventListener("click",()=>sheet("Centre d’aide",'<div class="detail-card"><h3>Besoin d’aide ?</h3><p>Utilise le bouton + pour ajouter une information. Chaque page possède maintenant son propre écran de détail.</p></div>'));
  document.querySelector("[data-contact]")?.addEventListener("click",()=>sheet("Nous contacter",'<div class="detail-card"><p>Ajoute ici l’adresse de contact officielle de Nymia lorsqu’elle sera créée.</p></div>'));
  document.querySelector("[data-rate]")?.addEventListener("click",()=>toast("La notation sera disponible lors de la publication sur l’App Store"));
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
function startPauseTimer(minutes){
  let remaining=minutes*60,timer;
  const d=sheet("Ma pause",`<div class="pause-card"><div class="pause-orb" data-timer>${String(minutes).padStart(2,"0")}:00</div><h3 data-breathe>Respire doucement</h3><p>Inspire 4 secondes, puis expire 6 secondes.</p><button class="wide-primary" data-stop-timer>Arrêter la pause</button></div>`);
  const draw=()=>{const el=d.querySelector("[data-timer]");if(!el)return;el.textContent=`${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;d.querySelector("[data-breathe]").textContent=(remaining%10)>=6?"Expire doucement":"Inspire doucement"};
  draw();timer=setInterval(()=>{remaining--;draw();if(remaining<=0){clearInterval(timer);state.meditationHistory.push({date:todayISO(),minutes});save();d.querySelector(".pause-card").innerHTML='<div class="pause-orb">✓</div><h3>Pause terminée</h3><p>Bravo, ce moment est enregistré.</p><button class="wide-primary" data-finish>Fermer</button>';d.querySelector("[data-finish]").onclick=()=>{d.remove();renderShell("meditation")}}},1000);
  d.querySelector("[data-stop-timer]").onclick=()=>{clearInterval(timer);d.remove()};
  d.querySelector("[data-close]").addEventListener("click",()=>clearInterval(timer));
}
function openProgram(id){renderShell("programs");setTimeout(()=>document.querySelector(`[data-program-step^="${id}-"]`)?.scrollIntoView({behavior:"smooth",block:"center"}),50)}
function openHealthSearch(){const d=sheet("Rechercher dans Ma Santé",'<input class="input" data-health-query placeholder="Traitement, rendez-vous, document…"><div data-health-results></div>');const input=d.querySelector("[data-health-query]"),out=d.querySelector("[data-health-results]");input.oninput=()=>{const q=input.value.toLowerCase();const found=state.items.filter(i=>(i.title+" "+(i.details||"")).toLowerCase().includes(q));out.innerHTML=q?(found.length?found.map(i=>`<button class="search-result" data-search-item="${i.id}">${typeMeta[i.type][0]} ${esc(i.title)}</button>`).join(""):'<p class="muted">Aucun résultat</p>'):"";out.querySelectorAll("[data-search-item]").forEach(b=>b.onclick=()=>{d.remove();openItemDetail(Number(b.dataset.searchItem))})}}
function openDocumentUpload(){const d=sheet("Importer un document",'<form><label>Nom du document</label><input name="title" required placeholder="Ex. Ordonnance"><label>Fichier ou photo</label><input name="file" type="file" accept="image/*,.pdf" required><button class="save">Importer</button></form><p class="storage-note">Taille conseillée : moins de 2 Mo.</p>');d.querySelector("form").onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),file=fd.get("file");if(file.size>2500000)return toast("Fichier trop volumineux (maximum conseillé : 2,5 Mo)");const reader=new FileReader();reader.onload=()=>{state.items.push({id:Date.now(),type:"document",title:fd.get("title").trim(),date:todayISO(),time:"",details:"",fileName:file.name,fileType:file.type,fileData:reader.result});try{save()}catch{state.items.pop();return toast("Stockage insuffisant pour ce fichier")}d.remove();renderShell("documents");toast("Document importé")};reader.readAsDataURL(file)}}
function downloadDocument(id){const doc=state.items.find(i=>i.id===id);if(!doc?.fileData)return;const a=document.createElement("a");a.href=doc.fileData;a.download=doc.fileName||doc.title;a.click()}
function deleteDocument(id){if(!confirm("Supprimer ce document ?"))return;state.items=state.items.filter(i=>i.id!==id);save();renderShell("documents")}
function openMealForm(){const d=sheet("Ajouter un repas",'<form><label>Type de repas</label><select name="type"><option>Petit-déjeuner</option><option>Déjeuner</option><option>Dîner</option><option>Collation</option></select><label>Ce que j’ai mangé</label><input name="name" required placeholder="Ex. Poulet, riz et légumes"><label>Note facultative</label><textarea name="details" placeholder="Faim, digestion, ressenti…"></textarea><button class="save">Enregistrer</button></form>');d.querySelector("form").onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);state.nutrition.push({id:Date.now(),date:todayISO(),type:fd.get("type"),name:fd.get("name").trim(),details:fd.get("details").trim()});save();d.remove();renderShell("nutrition");toast("Repas enregistré")}}
function openHydrationReminder(){const d=sheet("Rappel d’hydratation",'<form><label>Heure du rappel</label><input type="time" name="time" required value="10:00"><button class="save">Enregistrer</button></form>');d.querySelector("form").onsubmit=e=>{e.preventDefault();const time=new FormData(e.target).get("time");state.settings.hydrationAlerts=true;state.reminders.push({id:Date.now(),title:"Boire un verre d’eau",date:todayISO(),time,done:false});save();d.remove();renderShell("water");toast("Rappel d’hydratation créé")}}
function createTreatmentReminders(){let added=0;state.items.filter(i=>i.type==="treatment").forEach((t,i)=>{const title=`Prendre ${t.title}`;if(!state.reminders.some(r=>r.title===title)){state.reminders.push({id:Date.now()+i,title,date:t.date||todayISO(),time:t.time||"08:00",done:false});added++}});save();renderShell("treatments");toast(added?`${added} rappel${added>1?"s":""} créé${added>1?"s":""}`:"Tous les rappels existent déjà")}
function openProfilePhoto(){const input=document.createElement("input");input.type="file";input.accept="image/*";input.onchange=()=>{const file=input.files[0];if(!file)return;if(file.size>2500000)return toast("Choisis une photo de moins de 2,5 Mo");const reader=new FileReader();reader.onload=()=>{state.profile.photo=reader.result;try{save()}catch{return toast("Photo trop volumineuse")};renderShell("profile");toast("Photo mise à jour")};reader.readAsDataURL(file)};input.click()}
function openPreference(pref){const options={theme:["Thème",[["light","Clair"],["dark","Sombre"]]],textSize:["Taille du texte",[["medium","Moyenne"],["large","Grande"]]],color:["Couleur principale",[["lavender","Lavande"],["rose","Rose"]]],language:["Langue",[["fr","Français"]]]}[pref];const d=sheet(options[0],`<div class="preference-list">${options[1].map(([v,l])=>`<button data-pref-value="${v}" class="${state.settings[pref]===v?"selected":""}">${l}</button>`).join("")}</div>`);d.querySelectorAll("[data-pref-value]").forEach(b=>b.onclick=()=>{state.settings[pref]=b.dataset.prefValue;save();d.remove();applyPreferences();renderShell("profile")})}
function applyPreferences(){document.documentElement.dataset.theme=state.settings.theme;document.documentElement.dataset.color=state.settings.color;document.documentElement.style.fontSize=state.settings.textSize==="large"?"18px":"16px"}
function importBackup(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);state=deepMerge(clone(defaultState),parsed);save();applyPreferences();renderShell("profile");toast("Sauvegarde restaurée")}catch{toast("Fichier de sauvegarde invalide")}};reader.readAsText(file)}
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
        b.dataset.menuAdd === "document" ? openDocumentUpload() : openForm(b.dataset.menuAdd);
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
      `<form id="itemForm"><label>Titre</label><input name="title" required value="${esc(item?.title || "")}" placeholder="${label}"><div class="two-cols"><div><label>Date</label><input name="date" type="date" value="${esc(item?.date || todayISO())}"></div><div><label>Heure</label><input name="time" type="time" value="${esc(item?.time || "")}"></div></div><label>Détails</label><textarea name="details" placeholder="Informations facultatives">${esc(item?.details || "")}</textarea>${type==="treatment"?'<label class="check-line"><input type="checkbox" name="createReminder" checked> Créer aussi un rappel de prise</label>':""}<button class="save">Enregistrer</button></form>`,
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
    if(type==="treatment"&&fd.get("createReminder")&&!item) state.reminders.push({id:Date.now()+1,title:`Prendre ${data.title}`,date:data.date,time:data.time,done:false});
    save();
    d.remove();
    renderShell(["health","agenda","treatments"].includes(currentPage) ? currentPage : "home");
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
    renderShell(["sleep","water","activity"].includes(currentPage) ? currentPage : "wellbeing");
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
    renderShell(currentPage === "cycle-detail" ? "cycle-detail" : "cycle");
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
    renderShell(currentPage === "cycle-detail" ? "cycle-detail" : "cycle");
    toast("Note ajoutée");
  };
}
function openCustomize() {
  const d = sheet(
    "Actions rapides",
    `<p class="muted">Choisis librement les raccourcis utiles sur ton accueil.</p><div class="choices compact">${Object.entries(
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
        else picks.push(id);
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
    `<form><div class="two-cols"><div><label>Prénom</label><input name="firstName" required value="${esc(state.profile.firstName)}"></div><div><label>Nom</label><input name="lastName" value="${esc(state.profile.lastName)}"></div></div><label>Date de naissance</label><input name="birthDate" type="date" value="${esc(state.profile.birthDate)}"><div class="two-cols"><div><label>Taille (cm)</label><input name="height" type="number" min="50" max="250" value="${esc(state.profile.height)}"></div><div><label>Poids (kg)</label><input name="weight" type="number" min="20" max="400" step="0.1" value="${esc(state.profile.weight)}"></div></div><label>Téléphone</label><input name="phone" type="tel" value="${esc(state.profile.phone)}"><label>E-mail</label><input name="email" type="email" value="${esc(state.profile.email)}"><button class="save">Enregistrer</button></form>`,
  );
  d.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.profile.firstName = fd.get("firstName").trim();
    state.profile.lastName = fd.get("lastName").trim();
    state.profile.birthDate = fd.get("birthDate");
    state.profile.height = fd.get("height");
    state.profile.weight = fd.get("weight");
    state.profile.phone = fd.get("phone").trim();
    state.profile.email = fd.get("email").trim();
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
applyPreferences();
if (state.onboardingComplete) renderShell("home");
else onboarding();
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
