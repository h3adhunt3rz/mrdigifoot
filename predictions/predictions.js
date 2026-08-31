/* =========================================================
   MRDIGIFOOT · Prédictions EPL — page statique GitHub Pages
   Carte → vote → Supabase (REST) → stats communautaires
   ========================================================= */

"use strict";

// Config Supabase centralisée (URL + clé anon, publiques) — chargée par
// ../supabase-config.js depuis predictions/index.html. Fallback en dur si absent.
const _supa = (typeof window !== 'undefined' && window.MRDIGIFOOT_SUPABASE) || {};
const SUPABASE_URL = _supa.url || "https://ijvsnxpzvxithsyqoluw.supabase.co";
const SUPABASE_ANON_KEY = _supa.anonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdnNueHB6dnhpdGhzeXFvbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTA1OTksImV4cCI6MjEwMzA2NjU5OX0.DvYijydndGIy8qWT1dnGK8aVYkYHIjVyCWMTKvPq_0M";

/* --- Couleurs / abréviations des clubs (extrait de CLUB_META) --- */
const CLUB_META = {
  "arsenal": { abbr: "ARS", logo: "Arsenal.png", color: "#e30613" },
  "aston-villa": { abbr: "AVL", logo: "", color: "#95bfe5" },
  "bournemouth": { abbr: "BOU", logo: "", color: "#da291c" },
  "brentford": { abbr: "BRE", logo: "", color: "#e30613" },
  "brighton": { abbr: "BHA", logo: "", color: "#0057b8" },
  "burnley": { abbr: "BUR", logo: "", color: "#800000" },
  "chelsea": { abbr: "CHE", logo: "Chelsea.png", color: "#034694" },
  "crystal-palace": { abbr: "CRY", logo: "", color: "#1b458f" },
  "everton": { abbr: "EVE", logo: "", color: "#003399" },
  "fulham": { abbr: "FUL", logo: "", color: "#000000" },
  "ipswich": { abbr: "IPS", logo: "", color: "#0033a0" },
  "leeds": { abbr: "LEE", logo: "", color: "#ffd700" },
  "leicester": { abbr: "LEI", logo: "", color: "#003090" },
  "liverpool": { abbr: "LIV", logo: "Liverpool.png", color: "#c8102e" },
  "manchester-city": { abbr: "MCI", logo: "Manchester City.png", color: "#6cabdd" },
  "manchester-united": { abbr: "MUN", logo: "Manchester United.png", color: "#da291c" },
  "newcastle": { abbr: "NEW", logo: "", color: "#241f20" },
  "nottingham-forest": { abbr: "NFO", logo: "", color: "#dd0000" },
  "southampton": { abbr: "SOU", logo: "", color: "#d71920" },
  "sunderland": { abbr: "SUN", logo: "", color: "#e30613" },
  "tottenham": { abbr: "TOT", logo: "Tottenham.png", color: "#132257" },
  "west-ham": { abbr: "WHU", logo: "", color: "#7a263a" },
  "wolverhampton": { abbr: "WOL", logo: "", color: "#fdb913" }
};
const CLUB_ALIASES = {
  "ipswich-town": "ipswich",
  "leeds-united": "leeds",
  "coventry-city": "coventry",
  "hull-city": "hull",
  "tottenham-hotspur": "tottenham",
  "brighton-&-hove-albion": "brighton",
  "afc-bournemouth": "bournemouth",
  "man-city": "manchester-city",
  "man-united": "manchester-united",
  "nottm-forest": "nottingham-forest",
  "wolves": "wolverhampton"
};

function normalizeTeamId(id) {
    return String(id || "").toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/ü/g, "u");
}

function getClubMeta(teamId) {
    const id = normalizeTeamId(teamId);
    const aliasKey = CLUB_ALIASES[id];
    if (aliasKey) return { id: aliasKey, ...CLUB_META[aliasKey] };
    if (CLUB_META[id]) return { id, ...CLUB_META[id] };
    const fuzzyKey = Object.keys(CLUB_META).find(k => id.includes(k) || k.includes(id));
    if (fuzzyKey) return { id: fuzzyKey, ...CLUB_META[fuzzyKey] };
    const name = teamId || "?";
    const parts = name.replace(/[^a-zA-Z\s-]/g, " ").trim().split(/[\s-]+/).filter(Boolean);
    let abbr = parts.map(p => p[0]).join("").substring(0, 3).toUpperCase();
    if (abbr.length < 3) abbr = name.replace(/[^a-zA-Z]/g, "").toUpperCase().substring(0, 3);
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash % 360);
    const dynamicColor = `hsl(${h}, ${65 + Math.abs(hash % 20)}%, ${35 + Math.abs(hash % 12)}%)`;
    return { id, abbr, logo: "", color: dynamicColor };
}

function logoHTML(teamId, size = 80) {
    const meta = getClubMeta(teamId);
    const boxStyle = `width:${size}px;height:${size}px;min-width:${size}px;min-height:${size}px;max-width:${size}px;max-height:${size}px;background-color:${meta.color};border-radius:14px;box-sizing:border-box;overflow:hidden;flex-shrink:0;box-shadow:0 0 0 2px #fff,0 0 0 5px rgba(192,157,60,0.55),0 6px 16px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:4px;`;
    if (meta.logo) {
        return `<div class="club-logo-box" style="${boxStyle}"><img class="club-logo-img" src="../img/LOGOS/${meta.logo}" alt="${meta.abbr}"></div>`;
    }
    const ballSize = Math.max(12, Math.round(size * 0.4));
    const abbrSize = Math.max(12, Math.round(size * 0.34));
    const isLight = ["#ffffff", "#fde100", "#fdb913", "#95bfe5", "#6cabdd", "#ffd700"].includes(meta.color.toLowerCase());
    const textColor = isLight ? "#111" : "#fff";
    return `<div class="club-logo-box" style="${boxStyle}color:${textColor};flex-direction:column;gap:2px;">
        <img class="logo-ball" src="../img/ballon.png" style="width:${ballSize}px;height:${ballSize}px;opacity:0.85;" alt="">
        <span class="logo-abbr" style="font-size:${abbrSize}px;color:${textColor};">${meta.abbr}</span>
    </div>`;
}

/* --- Helpers --- */
function formatDateDMY(d) {
    if (!d) return "";
    const dt = new Date(d.length === 10 ? d + "T12:00:00" : d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }).replace(/\./g, "");
}

function roundLabel(f) {
    return f.round_label || (f.matchday ? "Journée " + f.matchday : "");
}

/* --- Identifiant visiteur persistant (anti double-vote local) --- */
function getVisitorId() {
    let vid = localStorage.getItem("mrdigifoot_vid");
    if (!vid) {
        vid = (crypto.randomUUID && crypto.randomUUID()) ||
              (Date.now().toString(36) + Math.random().toString(36).slice(2));
        localStorage.setItem("mrdigifoot_vid", vid);
    }
    return vid;
}

/* --- Toast --- */
let _toastTimer = null;
function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

/* --- Supabase : lecture des votes existants --- */
async function fetchVotes() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/visitor_predictions?select=fixture_id,choice,visitor_id`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY }
    });
    if (!res.ok) throw new Error("fetch votes failed: " + res.status);
    return res.json();
}

/* --- Endpoint sécurisé : vérification Turnstile + 1 vote par IP --- */
const VOTE_ENDPOINT = `${SUPABASE_URL}/functions/v1/smart-handler`;

/* Obtient un token Turnstile (captcha invisible).
   Le widget (mode interaction-only) stocke son token automatiquement
   dans window._turnstileToken. On l'attend s'il n'est pas encore prêt. */
function getTurnstileToken() {
    return new Promise((resolve, reject) => {
        const tryOnce = () => {
            if (typeof window.turnstile === "undefined" || !window.TURNSTILE_SITE_KEY) {
                reject(new Error("captcha non configuré"));
                return;
            }
            if (window.turnstileWidgetId == null) {
                // widget pas encore initialisé → on retente brièvement
                return false;
            }
            if (window._turnstileToken) {
                resolve(window._turnstileToken);
                return true;
            }
            // Token pas encore généré : on peut relancer le widget si besoin
            try { window.turnstile.reset(window.turnstileWidgetId); } catch (e) { /* ignore */ }
            return false;
        };

        if (tryOnce()) return;

        let tries = 0;
        const iv = setInterval(() => {
            tries++;
            if (tryOnce()) { clearInterval(iv); }
            else if (tries >= 20) { clearInterval(iv); reject(new Error("captcha non prêt")); }
        }, 250);
    });
}

/* --- Supabase : enregistrement d'un vote sécurisé (1/N/2) ---
   Passe par la Edge Function 'smart-handler' qui :
     1. vérifie le captcha Turnstile (anti-bot),
     2. limite à 1 vote par IP par match. */
async function saveVote(f, choice) {
    const vid = getVisitorId();
    const token = await getTurnstileToken();
    const body = {
        fixture_id: f.id,
        home_team_id: f.home_team_id,
        away_team_id: f.away_team_id,
        home_name: f.home_name,
        away_name: f.away_name,
        matchday: f.matchday,
        season: f.season,
        fixture_date: f.date,
        choice: choice,
        visitor_id: vid,
        turnstile_token: token
    };
    const res = await fetch(VOTE_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": "Bearer " + SUPABASE_ANON_KEY
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        let err = new Error("save vote failed: " + res.status);
        try {
            const data = await res.json();
            err = new Error(data.error || data.message || ("save vote failed: " + res.status));
            err.code = data.error;
        } catch (e) { /* ignore */ }
        throw err;
    }
}

/* --- Mode test : supprime les votes du visiteur courant (bouton caché ?test=1) --- */
async function deleteMyVotes() {
    const vid = getVisitorId();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/visitor_predictions?visitor_id=eq.${encodeURIComponent(vid)}`, {
        method: "DELETE",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": "Bearer " + SUPABASE_ANON_KEY
        }
    });
    if (!res.ok && res.status !== 204) throw new Error("delete votes failed: " + res.status);
}

/* --- Rendu d'une carte match avec zone de vote --- */
function buildCard(f) {
    const card = document.createElement("div");
    card.className = "ratio-4-5-card";

    const played = f.status === "Terminé" &&
        f.home_score !== null && f.home_score !== undefined &&
        f.away_score !== null && f.away_score !== undefined;

    const roundText = f.round_label || (f.matchday ? "J" + f.matchday : "");
    const seasonParts = f.season ? f.season.split("-") : [];
    const seasonShort = seasonParts.length === 2 ? seasonParts[0].slice(-2) + "/" + seasonParts[1].slice(-2) : "";

    const choiceBtnHTML = (val, label, sub) => `
        <button class="pred-choice-btn" data-save-pred="${escapeAttr(f.id)}" data-choice="${val}">
            <span class="pred-choice-val">${label}</span>
            <span class="pred-choice-sub">${escapeHTML(sub)}</span>
        </button>`;

    const pctHTML = (val) => `<span class="pred-choice-pct" data-pct="${val}"><span class="pct-num">--</span><span class="pct-sym">%</span></span>`;

    card.innerHTML = `
      <div class="fx-card-inner" data-variant="global">
        ${f.date ? `<span class="card-date-top">${formatDateDMY(f.date)}</span>` : ""}
        ${roundText ? `<span class="card-round-top">${roundText}</span>` : ""}
        <span class="card-badge-top card-badge-top--epl">🦁 EPL ${seasonShort}</span>
        <div class="fx-arena">
          <div class="fx-team home ${played ? (f.home_score > f.away_score ? "result-win" : (f.home_score < f.away_score ? "result-loss" : "")) : ""}">
            ${logoHTML(f.home_team_id, 76)}
            <span class="fx-team-name">${escapeHTML(f.home_name)}</span>
          </div>
          <div class="fx-scoreboard">
            <div class="fx-score-nums">
              ${played ? `<span class="fx-score-n">${f.home_score}</span><span class="fx-score-sep">:</span><span class="fx-score-n">${f.away_score}</span>` : `<span class="fx-score-n vs-unplayed" style="color:#fff;font-size:3.8rem;">VS</span>`}
            </div>
          </div>
          <div class="fx-team away ${played ? (f.away_score > f.home_score ? "result-win" : (f.away_score < f.home_score ? "result-loss" : "")) : ""}">
            ${logoHTML(f.away_team_id, 76)}
            <span class="fx-team-name">${escapeHTML(f.away_name)}</span>
          </div>
        </div>
        <hr class="card-sep" />
        <div class="prediction-zone">
          <div class="pred-status" data-status>⏳ En attente</div>
          <div class="pred-choices" data-choices>
            ${choiceBtnHTML("1", "1", shortName(f.home_name))}
            ${choiceBtnHTML("N", "N", "Nul")}
            ${choiceBtnHTML("2", "2", shortName(f.away_name))}
            <div class="pred-choice-caption" data-caption>🔒 Répartition dévoilée après ton vote</div>
            ${pctHTML("1")}
            ${pctHTML("N")}
            ${pctHTML("2")}
          </div>
        </div>
        <div class="fx-card-bottom">
          <span class="canvas-watermark">@mrdigifoot</span>
        </div>
      </div>
    `;
    return card;
}

/* Verdict : comparaison du score prédit (médian des votes) avec le résultat réel */
function isPlayed(f) {
    return f.status === "Terminé" && f.home_score != null && f.away_score != null;
}

function shortName(name) {
    const words = String(name || "").split(" ");
    if (words.length <= 2) return name;
    const skip = ["de", "du", "des", "la", "le", "les", "the", "and", "&"];
    const keep = words.filter(w => !skip.includes(w.toLowerCase()));
    return keep.length >= 2 ? keep.slice(0, 2).join(" ") : name;
}

function escapeHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function escapeAttr(s) { return escapeHTML(s); }

/* --- Stats des votes en barres --- */
function renderVoteStats(fixtureCard, votesForFixture) {
    const statsEl = fixtureCard.querySelector("[data-stats]");
    if (!statsEl) return;
    const total = votesForFixture.length;
    if (total === 0) { statsEl.innerHTML = ''; return; }

    const c1 = votesForFixture.filter(v => v.choice === "1").length;
    const cN = votesForFixture.filter(v => v.choice === "N").length;
    const c2 = votesForFixture.filter(v => v.choice === "2").length;
    const p1 = Math.round(c1 / total * 100);
    const pN = Math.round(cN / total * 100);
    const p2 = 100 - p1 - pN;
    const best = Math.max(p1, pN, p2);

    statsEl.innerHTML = `
        <div class="pred-pct-row">
            <div class="pred-pct-col ${best === p1 ? 'is-best' : ''}">
                <span class="pred-pct-val">${p1}%</span>
                <span class="pred-pct-label">1</span>
                <div class="pred-pct-bar" style="height:${Math.max(6, p1)}%"></div>
            </div>
            <div class="pred-pct-col ${best === pN ? 'is-best' : ''}">
                <span class="pred-pct-val">${pN}%</span>
                <span class="pred-pct-label">N</span>
                <div class="pred-pct-bar" style="height:${Math.max(6, pN)}%"></div>
            </div>
            <div class="pred-pct-col ${best === p2 ? 'is-best' : ''}">
                <span class="pred-pct-val">${p2}%</span>
                <span class="pred-pct-label">2</span>
                <div class="pred-pct-bar" style="height:${Math.max(6, p2)}%"></div>
            </div>
        </div>
        <div class="pred-pct-summary">
            <span>${total} votant${total > 1 ? 's' : ''}</span>
        </div>`;
}

/* --- Effet 3D tilt --- */
function enhanceCards3D(root) {
    root.querySelectorAll(".ratio-4-5-card").forEach(card => {
        if (card.dataset.tiltEnhanced) return;
        card.dataset.tiltEnhanced = "1";

        const wrap = document.createElement("div");
        wrap.className = "card-tilt-wrap";
        card.parentNode.insertBefore(wrap, card);
        wrap.appendChild(card);
        card.classList.add("tilt-ready");

        let raf = null;
        const onMove = (e) => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            card.style.setProperty("--x", (px * 100) + "%");
            card.style.setProperty("--y", (py * 100) + "%");
            const rx = (0.5 - py) * 14;
            const ry = (px - 0.5) * 14;
            card.classList.add("is-tilting");
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;
            });
        };
        const onLeave = () => {
            card.classList.remove("is-tilting");
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        };
        card.addEventListener("mousemove", onMove);
        card.addEventListener("mouseleave", onLeave);
    });
}

/* --- Initialisation --- */
async function init() {
    const appContainer = document.getElementById("predictions-app") || document.getElementById("card-grid");
    if (!appContainer) return;

    let data;
    try {
        const res = await fetch("fixtures.json");
        data = await res.json();
    } catch (e) {
        appContainer.innerHTML = `<div class="empty-state">Impossible de charger les matchs.</div>`;
        console.error(e);
        return;
    }

    const fixtures = data.fixtures || [];
    appContainer.innerHTML = "";

    // Sélection éditoriale curée depuis la webapp (curation → push git)
    let selection = null;
    try {
        const sres = await fetch("selection.json");
        if (sres.ok) {
            const s = await sres.json();
            if (s && Array.isArray(s.match_ids) && s.match_ids.length) selection = s;
        }
    } catch (e) { console.error(e); }

    let displayFixtures = [];
    if (selection) {
        const ids = new Set(selection.match_ids.map(String));
        displayFixtures = fixtures.filter(f => ids.has(String(f.id)));
    } else {
        displayFixtures = fixtures;
    }

    if (displayFixtures.length === 0) {
        appContainer.innerHTML = `<div class="empty-state">${selection ? "Aucun match sélectionné cette semaine." : "Aucune sélection publiée pour le moment."}</div>`;
        return;
    }

    // Votes existants
    let votes = [];
    try { votes = await fetchVotes(); } catch (e) { console.error(e); }
    const myVid = getVisitorId();
    const myPreds = {};
    votes.forEach(v => {
        if (v.visitor_id === myVid && v.choice)
            myPreds[v.fixture_id] = { choice: v.choice };
    });

    // Groupement par journée (matchday) — en-têtes + barre de sélection
    const byDay = new Map();
    displayFixtures.forEach(f => {
        const day = f.matchday || 0;
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day).push(f);
    });
    const sortedDays = [...byDay.keys()].sort((a, b) => a - b);

    // Barre de navigation des journées
    const bar = document.createElement("div");
    bar.className = "day-bar";

    const label = document.createElement("div");
    label.className = "bar-label";
    const seasonShort = data.season ? data.season.replace("-", "/") : "";
    label.innerHTML = `<span class="bar-label-season">Saison ${escapeHTML(seasonShort)}</span>`;
    bar.appendChild(label);

    // Chips des journées (J2, J3, ...) — cliquables pour naviguer
    const chipsWrap = document.createElement("div");
    chipsWrap.className = "day-chips-container";
    bar.appendChild(chipsWrap);

    // Mode test (visible uniquement via ?test=1) : bouton pour effacer ses votes
    const isTestMode = new URLSearchParams(location.search).get("test") === "1";
    if (isTestMode) {
        const testBtn = document.createElement("button");
        testBtn.className = "day-chip test-clear-btn";
        testBtn.textContent = "🧹 Effacer mes votes (test)";
        testBtn.title = "Mode test : supprime tes votes dans Supabase";
        testBtn.addEventListener("click", async () => {
            testBtn.disabled = true;
            try {
                await deleteMyVotes();
                toast("Votes effacés ✓");
                Object.keys(myPreds).forEach(k => delete myPreds[k]);
                votes = await fetchVotes();
                paintDay(selectedDay);
            } catch (err) {
                console.error(err);
                toast("Erreur suppression : " + (err.message || ""));
            } finally {
                testBtn.disabled = false;
            }
        });
        bar.appendChild(testBtn);
    }

    appContainer.appendChild(bar);

    // Grille 3 colonnes principale pour les cartes
    const cardsGrid = document.createElement("div");
    cardsGrid.className = "card-grid";
    appContainer.appendChild(cardsGrid);

    const paintDay = (day) => {
        cardsGrid.innerHTML = "";
        const dayFixtures = byDay.get(day) || [];

        dayFixtures.forEach(f => {
            const card = buildCard(f);
            cardsGrid.appendChild(card);

            const votesForFixture = votes.filter(v => v.fixture_id === f.id);
            const myPred = myPreds[f.id] || null;
            const played = isPlayed(f);
            const myChoice = myPred ? myPred.choice : null;
            const actualChoice = played ? (f.home_score > f.away_score ? "1" : f.home_score < f.away_score ? "2" : "N") : null;
            const gotIt = played && myChoice != null && myChoice === actualChoice;

            // 1. Statut
            const statusEl = card.querySelector("[data-status]");
            if (statusEl) {
                if (myChoice != null) {
                    statusEl.textContent = '✅ Pronostiqué';
                    statusEl.className = 'pred-status pred-status--good';
                } else if (played) {
                    statusEl.textContent = '❌ Non pronostiqué';
                    statusEl.className = 'pred-status pred-status--bad';
                } else {
                    statusEl.textContent = '⏳ En attente';
                    statusEl.className = 'pred-status';
                }
            }

            // 2. Boutons 1/N/2 + pourcentages
            const choicesEl = card.querySelector("[data-choices]");
            const total = votesForFixture.length;
            const c1 = votesForFixture.filter(v => v.choice === "1").length;
            const cN = votesForFixture.filter(v => v.choice === "N").length;
            const c2 = votesForFixture.filter(v => v.choice === "2").length;
            const p1 = total ? Math.round(c1 / total * 100) : 0;
            const pN = total ? Math.round(cN / total * 100) : 0;
            const p2 = total ? 100 - p1 - pN : 0;
            const pctMap = { "1": p1, "N": pN, "2": p2 };

            if (choicesEl) {
                // Pourcentages : chiffres si voté (ou match joué), sinon cadenas 🔒
                const showPct = myChoice != null || played;
                choicesEl.querySelectorAll(".pred-choice-pct").forEach(pctEl => {
                    const key = pctEl.getAttribute("data-pct");
                    const numEl = pctEl.querySelector(".pct-num");
                    const symEl = pctEl.querySelector(".pct-sym");
                    if (showPct) {
                        if (numEl) { numEl.textContent = total ? pctMap[key] : '--'; numEl.classList.remove('is-locked'); }
                        if (symEl) symEl.classList.remove('is-locked');
                    } else {
                        if (numEl) { numEl.textContent = '🔒'; numEl.classList.add('is-locked'); }
                        if (symEl) symEl.classList.add('is-locked');
                    }
                });

                // Légende : message « verrouillé » avant vote, répartition après
                const captionEl = card.querySelector("[data-caption]");
                if (captionEl) {
                    if (showPct) {
                        captionEl.textContent = '🗳 Répartition des votes de la communauté';
                        captionEl.classList.remove('is-locked');
                    } else {
                        captionEl.textContent = '🔒 Répartition dévoilée après ton vote';
                        captionEl.classList.add('is-locked');
                    }
                    captionEl.style.display = '';
                }

                // Boutons 1/N/2
                choicesEl.querySelectorAll(".pred-choice-btn").forEach(b => {
                    const c = b.getAttribute("data-choice");
                    if (c === myChoice) b.classList.add("is-mychoice");
                    if (played || myChoice != null) {
                        b.classList.add("is-dim");
                        b.disabled = true;
                        b.removeAttribute("data-save-pred");
                    }
                });
            }

            // 3. Vote → Edge Function sécurisée
            card.querySelectorAll("[data-save-pred]").forEach(saveBtn => {
                saveBtn.addEventListener("click", async () => {
                    const choice = saveBtn.getAttribute("data-choice");
                    if (!choice) return;
                    saveBtn.disabled = true;
                    try {
                        await saveVote(f, choice);
                        toast("Pronostic enregistré ✓");
                        myPreds[f.id] = { choice };
                        votes = await fetchVotes();
                        paintDay(day);
                    } catch (err) {
                        console.error(err);
                        if (err.code === "already_voted") {
                            // On sait qu'on a déjà voté → on bascule la carte en mode "Pronostiqué"
                            toast("Tu as déjà voté pour ce match (1 vote par IP).");
                            myPreds[f.id] = { choice };
                            votes = await fetchVotes();
                            paintDay(day);
                            return;
                        }
                        saveBtn.disabled = false;
                        if (err.code === "Vérification anti-robot échouée") {
                            toast("Vérification anti-robot, réessaie.");
                        } else {
                            toast("Erreur lors de l'envoi, réessaie.");
                        }
                    }
                });
            });
        });

        enhanceCards3D(cardsGrid);
    };

    const activeDayParam = new URLSearchParams(location.search).get("journee");
    const activeDay = activeDayParam ? Number(activeDayParam) : null;
    let selectedDay = activeDay && sortedDays.includes(activeDay) ? activeDay : sortedDays[0];

    // Rendu des chips de journées (navigation)
    const paintChips = () => {
        chipsWrap.innerHTML = "";
        sortedDays.forEach(d => {
            const chip = document.createElement("button");
            chip.className = "day-chip" + (d === selectedDay ? " active" : "");
            chip.textContent = "J" + d;
            chip.title = "Journée " + d;
            chip.addEventListener("click", () => {
                bar.querySelectorAll(".day-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                selectedDay = d;
                paintDay(selectedDay);
            });
            chipsWrap.appendChild(chip);
        });
    };
    paintChips();

    paintDay(selectedDay);
}

document.addEventListener("DOMContentLoaded", init);