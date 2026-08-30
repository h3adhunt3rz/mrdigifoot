/* =========================================================
   MRDIGIFOOT · Prédictions EPL — page statique GitHub Pages
   Carte → vote → Supabase (REST) → stats communautaires
   ========================================================= */

"use strict";

const SUPABASE_URL = "https://ijvsnxpzvxithsyqoluw.supabase.co";
const SUPABASE_ANON_KEY =
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

/* --- Supabase : enregistrement / mise à jour d'un vote (choix 1 / N / 2) --- */
async function saveVote(f, choice) {
    const vid = getVisitorId();
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
        visitor_id: vid
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/visitor_predictions?on_conflict=fixture_id,visitor_id`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": "Bearer " + SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("save vote failed: " + res.status);
}

/* --- Rendu d'une carte match avec zone de vote --- */
function buildCard(f) {
    const card = document.createElement("div");
    card.className = "ratio-4-5-card";

    const played = f.status === "Terminé" &&
        f.home_score !== null && f.home_score !== undefined &&
        f.away_score !== null && f.away_score !== undefined;

    const scoreHTML = played
        ? `<span class="fx-score-n">${f.home_score}</span><span class="fx-score-sep">:</span><span class="fx-score-n">${f.away_score}</span>`
        : `<span class="fx-score-n vs-unplayed" style="color:#fff;">VS</span>`;

    const statusHTML = played
        ? `<span class="card-result-badge">Résultat final</span>`
        : (f.status === "En cours" ? `<span class="card-result-badge card-result-badge--live">● En cours</span>` : "");

    const choiceBtnHTML = (val, label, sub, dim) => `
        <button class="pred-choice-btn ${dim ? "is-dim" : ""}" ${dim ? "disabled" : ""} ${dim ? "" : `data-save-pred="${escapeAttr(f.id)}" data-choice="${val}"`}>
            <span class="pred-choice-val">${label}</span>
            <span class="pred-choice-sub">${escapeHTML(sub)}</span>
        </button>`;

    const voteZoneHTML = played
        ? `<div class="vote-zone" data-fixture="${escapeAttr(f.id)}" data-played="1">
            <div class="pred-choices pred-choices--filled">
                ${choiceBtnHTML("1", "1", shortName(f.home_name), true)}
                ${choiceBtnHTML("N", "N", "Nul", true)}
                ${choiceBtnHTML("2", "2", shortName(f.away_name), true)}
            </div>
            <div class="pred-status-text pred-status-text--muted">Pronostics clos</div>
          </div>`
        : `<div class="vote-zone" data-fixture="${escapeAttr(f.id)}">
            <div class="pred-choices">
                ${choiceBtnHTML("1", "1", shortName(f.home_name))}
                ${choiceBtnHTML("N", "N", "Nul")}
                ${choiceBtnHTML("2", "2", shortName(f.away_name))}
            </div>
          </div>`;

    card.innerHTML = `
      <div class="fx-card-inner" data-variant="global">
        <div class="card-top-bar">
          <span class="card-date-top">${f.date ? formatDateDMY(f.date) : ""}</span>
          <span class="card-badge-top">🦁 EPL ${f.season ? f.season.slice(0, 4) + "/" + f.season.slice(5) : ""}</span>
          <span class="card-round-top">${roundLabel(f)}</span>
        </div>
        ${statusHTML}
        <div class="fx-arena">
          <div class="fx-team home ${played ? (f.home_score > f.away_score ? "result-win" : (f.home_score < f.away_score ? "result-loss" : "")) : ""}">
            ${logoHTML(f.home_team_id, 76)}
            <span class="fx-team-name">${escapeHTML(f.home_name)}</span>
          </div>
          <div class="fx-scoreboard">
            <div class="fx-score-nums">
              ${scoreHTML}
            </div>
          </div>
          <div class="fx-team away ${played ? (f.away_score > f.home_score ? "result-win" : (f.away_score < f.home_score ? "result-loss" : "")) : ""}">
            ${logoHTML(f.away_team_id, 76)}
            <span class="fx-team-name">${escapeHTML(f.away_name)}</span>
          </div>
        </div>
        <hr class="card-sep" />
        <div class="fx-prediction-verdict" data-verdict></div>
        ${voteZoneHTML}
        <div class="vote-stats" data-stats></div>
        <div class="vote-count" data-count></div>
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

function computeVerdict(card, f, votesForFixture) {
    const verdict = card.querySelector("[data-verdict]");
    if (!verdict) return;

    const total = votesForFixture.length;
    if (total === 0) { verdict.innerHTML = ""; return; }

    const c1 = votesForFixture.filter(v => v.choice === "1").length;
    const cN = votesForFixture.filter(v => v.choice === "N").length;
    const c2 = votesForFixture.filter(v => v.choice === "2").length;
    const bestChoice = c1 >= cN && c1 >= c2 ? "1" : c2 >= cN && c2 >= c1 ? "2" : "N";
    const bestCount = Math.max(c1, cN, c2);

    const played = isPlayed(f);
    if (!played) {
        const lbl = bestChoice === "1" ? shortName(f.home_name) : bestChoice === "2" ? shortName(f.away_name) : "Nul";
        verdict.innerHTML = `<span class="verdict-chip verdict-chip--pending">Public : ${escapeHTML(lbl)} (${bestCount} voix)</span>`;
        return;
    }

    const actual = f.home_score > f.away_score ? "1" : f.home_score < f.away_score ? "2" : "N";
    const ok = bestChoice === actual;
    const lbl = bestChoice === "1" ? shortName(f.home_name) : bestChoice === "2" ? shortName(f.away_name) : "Nul";
    verdict.innerHTML = `<span class="verdict-chip ${ok ? "verdict-chip--good" : "verdict-chip--bad"}">${ok ? "✔" : "✘"} ${escapeHTML(lbl)} ${ok ? "majorité juste" : "majorité fausse"}</span>`;
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
function renderVoteStats(fixtureCard, votesForFixture, myPred) {
    const statsEl = fixtureCard.querySelector("[data-stats]");
    const countEl = fixtureCard.querySelector("[data-count]");
    const total = votesForFixture.length;
    if (total === 0) {
        statsEl.classList.remove("visible");
        countEl.textContent = "";
        return;
    }

    // Répartition des choix 1 / N / 2
    const c1 = votesForFixture.filter(v => v.choice === "1").length;
    const cN = votesForFixture.filter(v => v.choice === "N").length;
    const c2 = votesForFixture.filter(v => v.choice === "2").length;
    const pHome = Math.round((c1 / total) * 100);
    const pDraw = Math.round((cN / total) * 100);
    const pAway = 100 - pHome - pDraw;

    // Choix le plus voté (mode)
    const counts = { "1": c1, "N": cN, "2": c2 };
    let topChoice = "1", topN = -1;
    Object.keys(counts).forEach(k => { if (counts[k] > topN) { topN = counts[k]; topChoice = k; } });
    const homeName = escapeHTML(shortName(votesForFixture[0].home_name || ""));
    const awayName = escapeHTML(shortName(votesForFixture[0].away_name || ""));
    const topLabel = topChoice === "1" ? homeName : topChoice === "2" ? awayName : "Nul";

    statsEl.innerHTML = `
        <div class="vote-stat-row"><span>${homeName}</span>
            <div class="vote-stat-bar"><div class="vote-stat-fill vote-stat-fill--home" style="width:${pHome}%"></div></div>
            <span class="vote-stat-pct">${pHome}%</span></div>
        <div class="vote-stat-row"><span>Nul</span>
            <div class="vote-stat-bar"><div class="vote-stat-fill vote-stat-fill--draw" style="width:${pDraw}%"></div></div>
            <span class="vote-stat-pct">${pDraw}%</span></div>
        <div class="vote-stat-row"><span>Ext.</span>
            <div class="vote-stat-bar"><div class="vote-stat-fill vote-stat-fill--away" style="width:${pAway}%"></div></div>
            <span class="vote-stat-pct">${pAway}%</span></div>
    `;
    statsEl.classList.add("visible");
    countEl.textContent = total + (total > 1 ? " votes" : " vote") + " · " + topLabel + " le + voté";
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

    const chipsContainer = document.createElement("div");
    chipsContainer.className = "day-chips-container";
    bar.appendChild(chipsContainer);

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
            renderVoteStats(card, votesForFixture, myPreds[f.id] || null);
            computeVerdict(card, f, votesForFixture);

            // Mon choix déjà enregistré → surligner le bouton + afficher succès/échec
            const myPred = myPreds[f.id];
            if (myPred) {
                const actual = isPlayed(f) ? (f.home_score > f.away_score ? "1" : f.home_score < f.away_score ? "2" : "N") : null;
                const got = actual && myPred.choice === actual;
                const lbl = myPred.choice === "1" ? shortName(f.home_name) : myPred.choice === "2" ? shortName(f.away_name) : "Nul";
                card.querySelectorAll(".pred-choice-btn").forEach(b => {
                    if (b.getAttribute("data-choice") === myPred.choice) b.classList.add("is-mychoice");
                });
                const zone = card.querySelector(".vote-zone");
                const line = document.createElement("div");
                line.className = "pred-myline";
                line.innerHTML = `Mon choix : <b>${escapeHTML(lbl)}</b>${isPlayed(f) ? (got ? ` <span class="pred-verdict-badge good"><span class="pred-verdict-symbol">✔</span> Succès</span>` : ` <span class="pred-verdict-badge bad"><span class="pred-verdict-symbol">✘</span> Échec</span>`) : ""}`;
                if (zone) zone.appendChild(line);
                if (isPlayed(f)) card.querySelectorAll("[data-save-pred]").forEach(b => b.remove());
            }

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
                        saveBtn.disabled = false;
                        toast("Erreur lors de l'envoi, réessaie.");
                    }
                });
            });
        });

        enhanceCards3D(cardsGrid);
    };

    const activeDayParam = new URLSearchParams(location.search).get("journee");
    const activeDay = activeDayParam ? Number(activeDayParam) : null;
    const selectedDay = activeDay && sortedDays.includes(activeDay) ? activeDay : sortedDays[0];

    sortedDays.forEach(day => {
        const chip = document.createElement("button");
        chip.className = "day-chip" + (selectedDay === day ? " active" : "");
        chip.textContent = "J" + day;
        chip.title = "Journée " + day;
        chip.dataset.day = day;
        chip.addEventListener("click", () => {
            chipsContainer.querySelectorAll(".day-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            paintDay(day);
        });
        chipsContainer.appendChild(chip);
    });

    paintDay(selectedDay);
}

document.addEventListener("DOMContentLoaded", init);