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

/* --- Supabase : enregistrement / mise à jour d'un vote --- */
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

    const voteZoneHTML = played
        ? `<div class="vote-zone" data-fixture="${escapeAttr(f.id)}" data-played="1"></div>`
        : `<div class="vote-zone" data-fixture="${escapeAttr(f.id)}">
            <button class="vote-btn" data-choice="home" title="Victoire ${escapeAttr(f.home_name)}">${escapeHTML(shortName(f.home_name))}</button>
            <button class="vote-btn" data-choice="draw" title="Match nul">Nul</button>
            <button class="vote-btn" data-choice="away" title="Victoire ${escapeAttr(f.away_name)}">${escapeHTML(shortName(f.away_name))}</button>
          </div>`;

    card.innerHTML = `
      <div class="fx-card-inner" data-variant="global">
        ${f.date ? `<span class="card-date-top">${formatDateDMY(f.date)}</span>` : ""}
        <span class="card-round-top">${roundLabel(f)}</span>
        <span class="card-badge-top">🦁 EPL ${f.season ? f.season.slice(0, 4) + "/" + f.season.slice(5) : ""}</span>
        ${statusHTML}
        <div class="fx-arena">
          <div class="fx-team home ${played ? "result-win" : ""} ${played && f.home_score < f.away_score ? "result-loss" : ""}">
            ${logoHTML(f.home_team_id, 80)}
            <span class="fx-team-name">${escapeHTML(f.home_name)}</span>
          </div>
          <div class="fx-scoreboard">
            <div class="fx-score-nums">
              ${scoreHTML}
            </div>
          </div>
          <div class="fx-team away ${played ? "result-win" : ""} ${played && f.away_score < f.home_score ? "result-loss" : ""}">
            ${logoHTML(f.away_team_id, 80)}
            <span class="fx-team-name">${escapeHTML(f.away_name)}</span>
          </div>
        </div>
        <hr class="card-sep" />
        <div class="fx-prediction-verdict" data-verdict></div>
        <div class="fx-card-bottom">
          <span class="canvas-watermark">@mrdigifoot</span>
        </div>
      </div>
      ${voteZoneHTML}
      <div class="vote-stats" data-stats></div>
      <div class="vote-count" data-count></div>
    `;
    return card;
}

/* Verdict : comparaison du choix majoritaire avec le résultat réel */
function computeVerdict(card, f, votesForFixture) {
    const verdict = card.querySelector("[data-verdict]");
    if (!verdict) return;

    const total = votesForFixture.length;
    if (total === 0) { verdict.innerHTML = ""; return; }

    const c = ch => votesForFixture.filter(v => v.choice === ch).length;
    const counts = { home: c("home"), draw: c("draw"), away: c("away") };
    const majority = counts.home >= counts.draw && counts.home >= counts.away ? "home"
                   : counts.away >= counts.draw && counts.away >= counts.home ? "away" : "draw";

    const majorityLabel = majority === "home" ? f.home_name : majority === "away" ? f.away_name : "Nul";
    const majorityPct = Math.round((counts[majority] / total) * 100);

    const played = f.status === "Terminé" && f.home_score != null && f.away_score != null;
    if (!played) {
        verdict.innerHTML = `<span class="verdict-chip verdict-chip--pending">Le public mise sur ${escapeHTML(shortName(majorityLabel))} (${majorityPct}%)</span>`;
        return;
    }

    const actual = f.home_score > f.away_score ? "home" : f.home_score < f.away_score ? "away" : "draw";
    const correct = majority === actual;
    const actualLabel = actual === "home" ? f.home_name : actual === "away" ? f.away_name : "Nul";

    verdict.innerHTML = correct
        ? `<span class="verdict-chip verdict-chip--good">✅ Majorité correcte : ${escapeHTML(shortName(majorityLabel))} (${majorityPct}%) → résultat ${escapeHTML(shortName(actualLabel))}</span>`
        : `<span class="verdict-chip verdict-chip--bad">❌ Majorité fausse : ${escapeHTML(shortName(majorityLabel))} (${majorityPct}%) → réel ${escapeHTML(shortName(actualLabel))}</span>`;
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
function renderVoteStats(fixtureCard, votesForFixture, myChoice) {
    const statsEl = fixtureCard.querySelector("[data-stats]");
    const countEl = fixtureCard.querySelector("[data-count]");
    const total = votesForFixture.length;
    if (total === 0) {
        statsEl.classList.remove("visible");
        countEl.textContent = "";
        return;
    }
    const count = c => votesForFixture.filter(v => v.choice === c).length;
    const pHome = Math.round((count("home") / total) * 100);
    const pDraw = Math.round((count("draw") / total) * 100);
    const pAway = 100 - pHome - pDraw;

    statsEl.innerHTML = `
        <div class="vote-stat-row"><span>${escapeHTML(shortName(votesForFixture.length ? votesForFixture[0].home_name : ""))}</span>
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
    countEl.textContent = total + (total > 1 ? " votes" : " vote");

    const prevBtn = fixtureCard.querySelector(".vote-btn.selected");
    if (prevBtn) prevBtn.classList.remove("selected");
    const btn = fixtureCard.querySelector(`.vote-btn[data-choice="${myChoice}"]`);
    if (btn) btn.classList.add("selected");
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
    const grid = document.getElementById("card-grid");
    const badge = document.getElementById("season-badge");

    let data;
    try {
        const res = await fetch("fixtures.json");
        data = await res.json();
    } catch (e) {
        grid.innerHTML = `<div class="empty-state">Impossible de charger les matchs.</div>`;
        console.error(e);
        return;
    }

    const fixtures = data.fixtures || [];
    grid.innerHTML = "";
    if (fixtures.length === 0) {
        grid.innerHTML = `<div class="empty-state">Aucun match à venir.</div>`;
        return;
    }
    if (badge) badge.textContent = "Saison " + data.season;

    // Votes existants
    let votes = [];
    try { votes = await fetchVotes(); } catch (e) { console.error(e); }
    const myVid = getVisitorId();
    const myChoices = {};
    votes.forEach(v => { if (v.visitor_id === myVid) myChoices[v.fixture_id] = v.choice; });

    // Groupement par journée (matchday) — en-têtes + barre de sélection
    const byDay = new Map();
    fixtures.forEach(f => {
        const day = f.matchday || 0;
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day).push(f);
    });
    const sortedDays = [...byDay.keys()].sort((a, b) => a - b);

    // Barre de navigation des journées
    const bar = document.createElement("div");
    bar.className = "day-bar";
    grid.appendChild(bar);

    const content = document.createElement("div");
    content.className = "card-grid";
    grid.appendChild(content);

    const paintDay = (day) => {
        content.innerHTML = "";
        const dayFixtures = byDay.get(day);

        const section = document.createElement("div");
        section.className = "day-section";
        content.appendChild(section);

        const header = document.createElement("div");
        header.className = "day-header";
        header.innerHTML = `<span class="day-header-tag">Journée ${day}</span><span class="day-header-count">${dayFixtures.length} match${dayFixtures.length > 1 ? "s" : ""}</span>`;
        section.appendChild(header);

        const inner = document.createElement("div");
        inner.className = "card-grid day-grid";
        section.appendChild(inner);

        dayFixtures.forEach(f => {
            const card = buildCard(f);
            inner.appendChild(card);

            const votesForFixture = votes.filter(v => v.fixture_id === f.id);
            renderVoteStats(card, votesForFixture, myChoices[f.id] || "");
            computeVerdict(card, f, votesForFixture);

            card.querySelectorAll(".vote-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const choice = btn.dataset.choice;
                    btn.disabled = true;
                    try {
                        await saveVote(f, choice);
                        toast("Vote enregistré ✓");
                        const refresh = await fetchVotes();
                        const fresh = refresh.filter(v => v.fixture_id === f.id);
                        renderVoteStats(card, fresh, choice);
                        computeVerdict(card, f, fresh);
                    } catch (err) {
                        console.error(err);
                        btn.disabled = false;
                        toast("Erreur lors du vote, réessaie.");
                    }
                });
            });
        });
    };

    const activeDay = new URLSearchParams(location.search).get("journee") ?
        Number(new URLSearchParams(location.search).get("journee")) : null;
    const selectedDay = activeDay && sortedDays.includes(activeDay) ? activeDay : sortedDays[0];

    sortedDays.forEach(day => {
        const chip = document.createElement("button");
        chip.className = "day-chip" + (selectedDay === day ? " active" : "");
        chip.textContent = "J" + day;
        chip.title = "Journée " + day;
        chip.addEventListener("click", () => {
            bar.querySelectorAll(".day-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            paintDay(day);
        });
        bar.appendChild(chip);
    });

    paintDay(selectedDay);
    enhanceCards3D(grid);
}

document.addEventListener("DOMContentLoaded", init);