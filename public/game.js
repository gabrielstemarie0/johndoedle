import questions from "./lib/questions.js";
import { isValidAnswer } from "./lib/text.js";
import { LEVELS, IMPOSTER, NOTHING, MAX_SPACES, levelById, judgeLocal } from "./lib/scoring.js";
import { createScene } from "./scene.js";

// ---------- settings ----------
const LAUNCH_DAY = "2026-11-02"; // game #1
const SECONDS = 25; // a short answer, so a short clock
const PER_DAY = 7;
const STORE_KEY = "jd:v3";

const $ = (id) => document.getElementById(id);
const views = { intro: $("intro"), play: $("play"), results: $("results") };

// ---------- date + card selection ----------
const todayUTC = () => new Date().toISOString().slice(0, 10);
const dayIndex = (day) =>
  Math.max(0, Math.round((Date.parse(day + "T00:00:00Z") - Date.parse(LAUNCH_DAY + "T00:00:00Z")) / 86400000));
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Everyone gets the same 7 questions on a given date. Each cycle walks the whole bank in a
// fresh shuffled order, so questions don't repeat until the bank is used up.
function pickCards(bank, day) {
  const idx = dayIndex(day);
  const daysPerCycle = Math.max(1, Math.floor(bank.length / PER_DAY));
  const rand = mulberry32(Math.floor(idx / daysPerCycle) + 1);
  const order = bank.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const pos = idx % daysPerCycle;
  return order.slice(pos * PER_DAY, pos * PER_DAY + PER_DAY).map((i) => bank[i]);
}

// ---------- saved state ----------
function uid() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.player) return s;
  } catch {}
  return { player: uid(), days: {}, streak: { count: 0, best: 0, last: null } };
}
const state = loadState();
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} };

const day = todayUTC();
const gameNo = dayIndex(day) + 1;
const today = (state.days[day] ||= { answers: [], startedAt: null });
const todaysQs = pickCards(questions, day);
const scene = createScene($("scene"), $("fuel")); // the driving scene and gas gauge (purely visual)

// ---------- scoring ----------
async function judge(question, answer) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const res = await fetch("/api/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ player: state.player, day, q: question.id, answer }),
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (res.ok) return await res.json();
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      return { rateLimited: true, which: body.which || "", retryAfter: Number(body.retryAfter) || 60 };
    }
  } catch {} // no backend or it's down: score offline against the seed answers
  return judgeLocal(question, answer);
}

// ---------- UI helpers ----------
const show = (name) => { for (const [k, el] of Object.entries(views)) el.hidden = k !== name; };
const fmt = (p) => (p > 0 ? `+${p}` : p < 0 ? `−${-p}` : "0");
function updateStreak() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const { count, last } = state.streak;
  $("streak").textContent = last === day || last === yesterday ? count : 0;
}

// ---------- playing ----------
let tick = null, cur = 0, running = 0, locked = false;

function showCard() {
  cur = today.answers.length;
  if (cur >= PER_DAY) return finish();
  locked = false;
  show("play");
  scene.setPhase(Math.min(cur, 6));
  $("feedback").hidden = true;
  $("judging").hidden = true;
  $("answer-form").hidden = false;
  $("answer").value = "";
  $("answer").disabled = false;
  $("submit").disabled = false;
  $("answer").removeAttribute("aria-invalid");
  $("answer-hint").hidden = true;
  $("qnum").textContent = `Question ${cur + 1} of ${PER_DAY}`;
  $("running").textContent = `${running} pts`;
  $("prompt").textContent = todaysQs[cur].prompt;
  if (!today.startedAt) { today.startedAt = Date.now(); save(); }
  $("answer").focus();
  clearInterval(tick);
  tick = setInterval(frame, 100);
  frame();
  syncHeaderButtons();
}

function frame() {
  const left = SECONDS * 1000 - (Date.now() - today.startedAt);
  const secs = Math.max(0, Math.ceil(left / 1000));
  $("timer-text").textContent = secs;
  const bar = $("timer-bar");
  bar.style.transform = `scaleX(${Math.max(0, left) / (SECONDS * 1000)})`;
  bar.classList.toggle("low", secs <= 20 && secs > 10);
  bar.classList.toggle("critical", secs <= 10);
  if (left <= 0) lockIn(true);
}

// Manual submit: a non-answer is rejected (shake) and the timer keeps running.
function trySubmit() {
  if (locked) return;
  if (isValidAnswer($("answer").value)) return lockIn();
  const input = $("answer");
  $("answer-hint").textContent = "That's not an answer. Try again before time runs out.";
  $("answer-hint").hidden = false;
  input.setAttribute("aria-invalid", "true");
  input.classList.remove("shake");
  void input.offsetWidth; // restart the animation
  input.classList.add("shake");
  input.focus();
}

async function lockIn(timedOut = false) {
  if (locked) return;
  locked = true;
  clearInterval(tick);
  const typed = $("answer").value.trim();
  const raw = isValidAnswer(typed) ? typed : ""; // on timeout, a non-answer counts as blank
  const q = todaysQs[cur];
  $("answer").disabled = true;
  $("submit").disabled = true;

  let result = { level: NOTHING.id, pts: NOTHING.pts, label: "", top: [] };
  if (raw) {
    $("judging").hidden = false;
    result = await judge(q, raw);
    $("judging").hidden = true;
  }

  if (result.rateLimited) {
    const timeLeft = SECONDS * 1000 - (Date.now() - today.startedAt);
    if (!timedOut && timeLeft > 0) {
      // Too many requests: let them try again while the clock is still running.
      locked = false;
      $("answer").disabled = false;
      $("submit").disabled = false;
      const daily = result.which.endsWith("-day");
      const wait = result.retryAfter >= 90 ? `${Math.ceil(result.retryAfter / 60)} minutes` : `${result.retryAfter} seconds`;
      $("answer-hint").textContent = daily
        ? "You've reached today's limit for answers. Come back tomorrow."
        : `Too many answers right now. Wait about ${wait} and try again.`;
      $("answer-hint").hidden = false;
      $("answer").focus();
      tick = setInterval(frame, 100);
      syncHeaderButtons();
      return;
    }
    result = { level: NOTHING.id, pts: NOTHING.pts, label: "", top: [], limited: true };
  }
  today.answers.push({ raw, level: result.level, pts: result.pts, label: result.label, top: result.top || [] });
  today.startedAt = null;
  running += result.pts;
  save();
  scene.setFuel(Math.max(0, running) / 7, { gained: result.pts }); // a perfect 700 fills the tank
  scene.setDistance(spacesDriven()); // the car drives 5 spaces for a John Doe, down to 1 for an Alien
  scene.react(result.level);

  const lvl = levelById(result.level);
  const best = (result.top || [])[0];
  $("answer-form").hidden = true;
  $("running").textContent = `${running} pts`;
  $("fb-pts").textContent = fmt(result.pts);
  $("fb-pts").className = `pts lvl-${lvl.id}`;
  $("fb-level").textContent = `${lvl.emoji} ${lvl.name} · ${lvl.spaces ? `+${lvl.spaces} space${lvl.spaces > 1 ? "s" : ""}` : "no movement"}`;
  $("fb-text").textContent = !raw
    ? `Time's up, nothing entered.${best ? ` The popular answer was "${best}".` : ""}`
    : result.limited
      ? "Too many requests, so this answer couldn't be scored."
      : result.level === "imposter"
        ? `That doesn't answer "${q.prompt}".`
        : result.level === "johndoe"
          ? `"${result.label}" is the most popular answer!`
          : `"${result.label}" is ${lvl.note}.${best ? ` The most popular was "${best}".` : ""}`;
  $("next").textContent = today.answers.length >= PER_DAY ? "See results" : "Next question";
  $("feedback").hidden = false;
  syncHeaderButtons();
  $("next").focus();
}

function finish() {
  clearInterval(tick);
  if (!today.done) {
    today.done = true;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const s = state.streak;
    if (s.last !== day) {
      s.count = s.last === yesterday ? s.count + 1 : 1;
      s.best = Math.max(s.best, s.count);
      s.last = day;
    }
    save();
  }
  updateStreak();
  renderResults();
}

// ---------- results ----------
const total = () => today.answers.reduce((n, a) => n + a.pts, 0);
const spacesDriven = () => Math.min(MAX_SPACES, today.answers.reduce((n, a) => n + (levelById(a.level).spaces || 0), 0));

function renderResults() {
  show("results");
  const t = total();
  scene.setPhase(7);
  scene.setFuel(Math.max(0, t) / 7, { animate: false });
  scene.setDistance(spacesDriven(), { animate: false });
  const tank = Math.round(Math.max(0, t) / 7);
  $("fuel-note").textContent = `Drove ${spacesDriven()} of ${MAX_SPACES} spaces and filled ${tank}% of the tank. ${
    tank >= 80 ? "You could drive forever." : tank >= 50 ? "Plenty left for the ride home." : tank >= 25 ? "Enough to limp to the next station." : "Running on fumes."
  }`;
  $("res-day").textContent = `John Doedle #${gameNo}`;
  $("total").textContent = t;
  $("verdict").textContent =
    t >= 650 ? "Peak John Doe. Perfectly ordinary."
    : t >= 500 ? "Very relatable. You'd blend into any crowd."
    : t >= 300 ? "Pretty average, which is the goal."
    : t >= 150 ? "A bit quirky. Maybe too quirky."
    : "You march to your own drum. Not great for this game.";
  const list = $("breakdown");
  list.replaceChildren();
  today.answers.forEach((a, i) => {
    const lvl = levelById(a.level);
    const li = document.createElement("li");
    const top = document.createElement("div");
    top.className = "row-top";
    const q = document.createElement("span");
    q.className = "row-q";
    q.textContent = todaysQs[i].prompt;
    const p = document.createElement("span");
    p.className = `row-pts lvl-${lvl.id}`;
    p.textContent = `${lvl.emoji} ${lvl.name} ${fmt(a.pts)}`;
    top.append(q, p);
    const you = document.createElement("div");
    you.className = "row-you";
    you.textContent = a.raw ? `You said: ${a.raw}` : "No answer";
    li.append(top, you);
    if (a.top && a.top.length) {
      const common = document.createElement("div");
      common.className = "row-top3";
      common.textContent = `Most popular: ${a.top.join(", ")}`;
      li.append(common);
    }
    list.append(li);
  });
}

const shareText = () =>
  `John Doedle #${gameNo} ${total()}/700\n${today.answers.map((a) => levelById(a.level).emoji).join("")}\n${location.origin}${location.pathname}`;

async function copyShare() {
  const text = shareText();
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    ta.remove();
  }
  $("copied").hidden = false;
  setTimeout(() => ($("copied").hidden = true), 2000);
}

function countdown() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const left = Math.max(0, Math.floor((next - now) / 1000));
  if (left === 0) return location.reload();
  const p = (n) => String(n).padStart(2, "0");
  $("countdown").textContent = `${p(Math.floor(left / 3600))}:${p(Math.floor((left % 3600) / 60))}:${p(left % 60)}`;
}

// ---------- help + stats dialogs ----------
const helpSeen = () => { try { return localStorage.getItem("jd:help") === "1"; } catch { return true; } };
function openDialog(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
let afterHelp = null;
function openHelp(then = null) {
  afterHelp = then;
  $("help-ok").textContent = then ? "Let's drive" : "Got it";
  openDialog($("help-dialog"));
}
$("help-dialog").addEventListener("close", () => {
  try { localStorage.setItem("jd:help", "1"); } catch {}
  const next = afterHelp; afterHelp = null;
  if (next) next();
});
// Don't let the stats/help buttons be used to stall the clock during a timed question.
function syncHeaderButtons() {
  const timing = !views.play.hidden && !locked && $("feedback").hidden;
  $("help-btn").disabled = $("stats-btn").disabled = timing;
}
$("help-btn").addEventListener("click", () => openHelp());

function computeStats() {
  const games = Object.entries(state.days)
    .filter(([, d]) => d.done && d.answers.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ day: d, total: v.answers.reduce((n, a) => n + a.pts, 0), answers: v.answers }));
  const scores = games.map((g) => g.total);
  const byLevel = Object.fromEntries([...LEVELS, IMPOSTER, NOTHING].map((l) => [l.id, 0]));
  let answered = 0;
  for (const g of games) for (const a of g.answers) { byLevel[a.level] = (byLevel[a.level] || 0) + 1; answered++; }
  return {
    games,
    played: games.length,
    average: scores.length ? Math.round(scores.reduce((n, s) => n + s, 0) / scores.length) : 0,
    best: scores.length ? Math.max(...scores) : 0,
    byLevel,
    answered,
  };
}

function renderStats() {
  const st = computeStats();
  const box = $("stats-content");
  box.replaceChildren();
  if (!st.played) {
    const p = document.createElement("p");
    p.className = "stats-empty";
    p.textContent = "No finished games yet. Play today's questions to start filling the tank.";
    box.append(p);
    return;
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const cur = state.streak.last === day || state.streak.last === yesterday ? state.streak.count : 0;
  const tiles = [["Games", st.played], ["Average", st.average], ["Best", st.best], ["Streak", `${cur} (best ${Math.max(state.streak.best, cur)})`]];
  const grid = document.createElement("div");
  grid.className = "stat-tiles";
  for (const [label, value] of tiles) {
    const t = document.createElement("div");
    t.className = "stat-tile";
    const v = document.createElement("b"); v.textContent = value;
    const l = document.createElement("span"); l.textContent = label;
    t.append(v, l);
    grid.append(t);
  }
  box.append(grid);

  // last 14 games as bars (full height = a 700 point perfect run)
  const recent = st.games.slice(-14);
  const h = document.createElement("h3"); h.textContent = `Last ${recent.length} game${recent.length > 1 ? "s" : ""}`; box.append(h);
  const chart = document.createElement("div");
  chart.className = "stat-bars";
  chart.setAttribute("role", "img");
  chart.setAttribute("aria-label", `Scores of your last ${recent.length} games: ${recent.map((g) => g.total).join(", ")}`);
  for (const g of recent) {
    const col = document.createElement("div"); col.className = "stat-bar";
    const bar = document.createElement("i"); bar.style.height = `${Math.max(3, Math.round((Math.max(0, g.total) / 700) * 100))}%`;
    bar.title = `${g.day}: ${g.total}`;
    const val = document.createElement("small"); val.textContent = g.total;
    col.append(bar, val);
    chart.append(col);
  }
  box.append(chart);

  const h2 = document.createElement("h3"); h2.textContent = "Your answers"; box.append(h2);
  const dist = document.createElement("ul"); dist.className = "stat-dist";
  for (const l of [...LEVELS, IMPOSTER, NOTHING]) {
    const n = st.byLevel[l.id] || 0;
    const li = document.createElement("li");
    const name = document.createElement("span"); name.textContent = `${l.emoji} ${l.name}`; name.className = `lvl-${l.id}`;
    const track = document.createElement("div"); track.className = "stat-track";
    const fill = document.createElement("i"); fill.style.width = `${st.answered ? Math.round((n / st.answered) * 100) : 0}%`; fill.className = `bg-${l.id}`;
    track.append(fill);
    const count = document.createElement("em"); count.textContent = n;
    li.append(name, track, count);
    dist.append(li);
  }
  box.append(dist);
}
$("stats-btn").addEventListener("click", () => { renderStats(); openDialog($("stats-dialog")); });

// ---------- wire up ----------
$("answer-form").addEventListener("submit", (e) => { e.preventDefault(); trySubmit(); });
$("answer").addEventListener("input", () => {
  $("answer-hint").hidden = true;
  $("answer").removeAttribute("aria-invalid");
});
$("next").addEventListener("click", showCard);
$("start").addEventListener("click", () => {
  if (!helpSeen()) openHelp(showCard); // first visit: explain the game, then start
  else showCard();
});
$("share").addEventListener("click", copyShare);

// intro level list comes from the same table the scoring uses
$("levels").replaceChildren(
  ...[...LEVELS, IMPOSTER, NOTHING].map((l) => {
    const li = document.createElement("li");
    li.className = `lvl-${l.id}`;
    const name = document.createElement("span");
    name.textContent = `${l.emoji} ${l.name} `;
    const note = document.createElement("small");
    note.textContent = `(${l.note})`;
    name.append(note);
    const pts = document.createElement("b");
    pts.textContent = fmt(l.pts);
    li.append(name, pts);
    return li;
  })
);

updateStreak();
$("intro-day").textContent = `Game #${gameNo} · ${new Date(day + "T00:00:00Z").toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" })}`;
setInterval(countdown, 1000);
countdown();

running = today.answers.reduce((n, a) => n + a.pts, 0);
scene.setFuel(Math.max(0, running) / 7, { animate: false });
scene.setDistance(spacesDriven(), { animate: false });
scene.setPhase(today.done ? 7 : Math.min(today.answers.length, 6));
if (today.answers.length) scene.react(today.answers.at(-1).level, { quiet: true });
if (today.done || today.answers.length >= PER_DAY) finish();
else if (today.answers.length > 0 || today.startedAt) showCard();
else show("intro");
