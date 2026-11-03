import questions from "./lib/questions.js";
import { isValidAnswer } from "./lib/text.js";
import { LEVELS, IMPOSTER, NOTHING, MAX_SPACES, levelById, judgeLocal } from "./lib/scoring.js";
import { CARS, carById, carSVG, money } from "./cars.js";
import { createScene } from "./scene.js";

// ---------- settings ----------
const LAUNCH_DAY = "2026-11-02"; // game #1
const SECONDS = 25; // the obstacle on the road reaches your bumper when this runs out
const PER_DAY = 7;
const STORE_KEY = "jd:v3";

const $ = (id) => document.getElementById(id);
const views = { intro: $("intro"), play: $("play"), results: $("results") };

// ---------- date + question selection ----------
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
const REPAIR_COST = 25; // dollars per hit
const newWallet = () => ({ spent: 0, owned: ["rusty"], car: "rusty", hits: 0 }); // hits = unrepaired crashes
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.player) {
      s.wallet = { ...newWallet(), ...(s.wallet || {}) };
      if (!s.wallet.owned.includes("rusty")) s.wallet.owned.unshift("rusty");
      if (!s.wallet.owned.includes(s.wallet.car)) s.wallet.car = "rusty";
      return s;
    }
  } catch {}
  return { player: uid(), days: {}, streak: { count: 0, best: 0, last: null }, wallet: newWallet() };
}
const state = loadState();
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} };

const day = todayUTC();
const gameNo = dayIndex(day) + 1;
const today = (state.days[day] ||= { answers: [], startedAt: null });
const todaysQs = pickCards(questions, day);
const scene = createScene($("scene"), $("fuel")); // the driving scene (purely visual)

// Cash: every dollar you've ever earned, minus what you've spent in the shop.
const earnedIn = (d) => (d.answers || []).reduce((n, a) => n + (a.pts || 0), 0);
const lifetimeEarned = () => Object.values(state.days).reduce((n, d) => n + earnedIn(d), 0);
const balance = () => lifetimeEarned() - state.wallet.spent;
const renderWallet = () => { $("wallet").textContent = money(balance()); };

scene.setCar(state.wallet.car);
scene.setDamage(state.wallet.hits || 0);
window.__jd = { scene, state }; // handy for tests and for poking around in the console

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
const fmt = (p) => (p > 0 ? `+${money(p)}` : "$0");
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
  $("running").textContent = `${money(running)} today`;
  $("prompt").textContent = todaysQs[cur].prompt;
  if (!today.startedAt) { today.startedAt = Date.now(); save(); }
  // An obstacle appears on the horizon. It reaches your bumper when the time runs out.
  scene.beginQuestion({ startedAt: today.startedAt, durationMs: SECONDS * 1000, index: cur });
  $("answer").focus();
  clearInterval(tick);
  tick = setInterval(frame, 100);
  frame();
  syncHeaderButtons();
  layoutScene();
}

// Start the road just below the question panel so the obstacle is visible for the whole countdown.
function layoutScene() {
  if (views.play.hidden || !$("feedback").hidden) return; // measure with the question showing; keep that layout during the result
  requestAnimationFrame(() => scene.setHorizon($("play").getBoundingClientRect().bottom + 22));
}
window.addEventListener("resize", layoutScene);

function frame() {
  const left = SECONDS * 1000 - (Date.now() - today.startedAt);
  const secs = Math.max(0, Math.ceil(left / 1000));
  $("timer-text").textContent = secs;
  const bar = $("timer-bar");
  bar.style.transform = `scaleX(${Math.max(0, left) / (SECONDS * 1000)})`;
  bar.classList.toggle("low", secs <= 12 && secs > 6);
  bar.classList.toggle("critical", secs <= 6);
  if (left <= 0) lockIn(true);
}

// Manual submit: a non-answer is rejected (shake) and the timer keeps running.
function trySubmit() {
  if (locked) return;
  if (isValidAnswer($("answer").value)) return lockIn();
  const input = $("answer");
  $("answer-hint").textContent = "That's not an answer. Try again before the obstacle reaches you.";
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
  const raw = !timedOut && isValidAnswer(typed) ? typed : ""; // out of time = you hit the obstacle, whatever you'd typed
  const q = todaysQs[cur];
  $("answer").disabled = true;
  $("submit").disabled = true;
  if (!timedOut) scene.hold(); // the obstacle waits while the answer is being checked

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
      scene.resume();
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

  // Any points at all: you swerve clear. No points (wrong answer or out of time): you hit the obstacle.
  const lvl = levelById(result.level);
  const crashed = result.pts <= 0;
  today.answers.push({ raw, level: result.level, pts: result.pts, label: result.label, top: result.top || [], crash: crashed });
  if (crashed) { today.crashes = (today.crashes || 0) + 1; state.wallet.hits = (state.wallet.hits || 0) + 1; }
  today.startedAt = null;
  running += result.pts;
  save();
  scene.setDistance(spacesDriven());
  if (crashed) {
    scene.resolve(false, { damage: state.wallet.hits });
    scene.say(timedOut ? "TOO SLOW! CRASH!" : "WRONG TURN! CRASH!", true);
  } else {
    scene.resolve(true, { spaces: lvl.spaces });
    scene.say(`SWERVED! +${money(result.pts)}`);
  }
  renderWallet();

  const best = (result.top || [])[0];
  $("answer-form").hidden = true;
  $("running").textContent = `${money(running)} today`;
  $("fb-pts").textContent = fmt(result.pts);
  $("fb-pts").className = `pts lvl-${lvl.id}`;
  $("fb-level").textContent = crashed
    ? `💥 Crash · ${timedOut ? "out of time" : "no cash"}`
    : `${lvl.emoji} ${lvl.name} · +${lvl.spaces} space${lvl.spaces > 1 ? "s" : ""}`;
  $("fb-text").textContent = timedOut
    ? `You ran out of time and hit the obstacle.${best ? ` The popular answer was "${best}".` : ""}`
    : result.limited
      ? "Too many requests, so this answer couldn't be scored. You hit the obstacle."
      : result.level === "imposter"
        ? `That doesn't answer "${q.prompt}". You hit the obstacle.`
        : result.level === "johndoe"
          ? `"${result.label}" is the most popular answer. You swerved clear!`
          : `"${result.label}" is ${lvl.note}. You swerved clear.${best ? ` The most popular was "${best}".` : ""}`;
  $("next").textContent = today.answers.length >= PER_DAY ? "See results" : "Next question";
  $("feedback").hidden = false;
  syncHeaderButtons();
  $("next").focus();
}

function finish() {
  clearInterval(tick);
  scene.clearObstacle();
  scene.setHorizon(null);
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
  renderWallet();
  renderResults();
  syncRepair();
}

// ---------- results ----------
const total = () => earnedIn(today);
const spacesDriven = () => Math.min(MAX_SPACES, today.answers.reduce((n, a) => n + (levelById(a.level).spaces || 0), 0));
const emojiOf = (a) => (a.pts > 0 ? levelById(a.level).emoji : "💥");

function renderResults() {
  show("results");
  const t = total();
  scene.setPhase(7);
  scene.setDistance(spacesDriven());
  const crashes = today.crashes || 0;
  $("fuel-note").textContent = `Wallet: ${money(balance())}. Drove ${spacesDriven()} of ${MAX_SPACES} spaces, ${crashes ? `crashed ${crashes} time${crashes > 1 ? "s" : ""}` : "no crashes"}.`;
  renderRepairNote();
  $("res-day").textContent = `John Doedle #${gameNo}`;
  $("total").textContent = money(t);
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
    p.textContent = a.pts > 0 ? `${lvl.emoji} ${lvl.name} ${fmt(a.pts)}` : `💥 Crash $0`;
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
  `John Doedle #${gameNo} ${money(total())} of $700\n${today.answers.map(emojiOf).join("")}\n${location.origin}${location.pathname}`;

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

// ---------- dialogs: how to play, stats, shop ----------
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
// Don't let the stats/help/shop buttons be used to stall the clock during a timed question.
function syncHeaderButtons() {
  const timing = !views.play.hidden && !locked && $("feedback").hidden;
  $("help-btn").disabled = $("stats-btn").disabled = $("wallet-btn").disabled = timing;
}
$("help-btn").addEventListener("click", () => openHelp());

function computeStats() {
  const games = Object.entries(state.days)
    .filter(([, d]) => d.done && d.answers.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ day: d, total: earnedIn(v), answers: v.answers, crashes: v.crashes || 0 }));
  const scores = games.map((g) => g.total);
  const byLevel = Object.fromEntries([...LEVELS, IMPOSTER, NOTHING].map((l) => [l.id, 0]));
  let answered = 0;
  for (const g of games) for (const a of g.answers) { byLevel[a.level] = (byLevel[a.level] || 0) + 1; answered++; }
  return {
    games,
    played: games.length,
    average: scores.length ? Math.round(scores.reduce((n, s) => n + s, 0) / scores.length) : 0,
    best: scores.length ? Math.max(...scores) : 0,
    crashes: games.reduce((n, g) => n + g.crashes, 0),
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
    p.textContent = "No finished games yet. Play today's questions to start earning.";
    box.append(p);
    return;
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const cur = state.streak.last === day || state.streak.last === yesterday ? state.streak.count : 0;
  const tiles = [["Games", st.played], ["Average", money(st.average)], ["Best", money(st.best)], ["Streak", `${cur} (best ${Math.max(state.streak.best, cur)})`]];
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
  const sum = document.createElement("p");
  sum.className = "modal-note";
  sum.textContent = `Earned ${money(lifetimeEarned())} in total · ${st.crashes} crash${st.crashes === 1 ? "" : "es"} · wallet ${money(balance())}`;
  box.append(sum);

  // last 14 games as bars (full height = a $700 perfect day)
  const recent = st.games.slice(-14);
  const h = document.createElement("h3"); h.textContent = `Last ${recent.length} game${recent.length > 1 ? "s" : ""}`; box.append(h);
  const chart = document.createElement("div");
  chart.className = "stat-bars";
  chart.setAttribute("role", "img");
  chart.setAttribute("aria-label", `Earnings of your last ${recent.length} games: ${recent.map((g) => "$" + g.total).join(", ")}`);
  for (const g of recent) {
    const col = document.createElement("div"); col.className = "stat-bar";
    const bar = document.createElement("i"); bar.style.height = `${Math.max(3, Math.round((Math.max(0, g.total) / 700) * 100))}%`;
    bar.title = `${g.day}: ${money(g.total)}`;
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

// The shop: spend your cash on cars. Starter cars are cheap, the exotic ones are absurdly expensive.
function renderShop(message = "") {
  $("shop-balance").textContent = money(balance());
  $("shop-msg").textContent = message;
  const list = $("shop-list");
  list.replaceChildren();
  for (const car of CARS) {
    const owned = state.wallet.owned.includes(car.id);
    const equipped = state.wallet.car === car.id;
    const li = document.createElement("li");
    li.className = "shop-item" + (equipped ? " equipped" : "") + (owned ? "" : " locked");
    const pic = document.createElement("div");
    pic.className = "shop-pic";
    pic.innerHTML = carSVG(car).replace('width="200" height="128"', 'width="100%"');
    const info = document.createElement("div");
    info.className = "shop-info";
    const name = document.createElement("div"); name.className = "shop-name"; name.textContent = car.name;
    const tier = document.createElement("span"); tier.className = `shop-tier tier-${car.tier.toLowerCase()}`; tier.textContent = car.tier;
    name.append(tier);
    const blurb = document.createElement("div"); blurb.className = "shop-blurb"; blurb.textContent = car.blurb;
    const price = document.createElement("div"); price.className = "shop-price"; price.textContent = car.price ? money(car.price) : "Free";
    info.append(name, blurb, price);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn shop-btn";
    if (equipped) { btn.textContent = "Equipped"; btn.disabled = true; }
    else if (owned) { btn.textContent = "Equip"; btn.addEventListener("click", () => equip(car)); }
    else if (balance() >= car.price) { btn.textContent = "Buy"; btn.classList.add("primary"); btn.addEventListener("click", () => buy(car)); }
    else { btn.textContent = `Need ${money(car.price - balance())}`; btn.disabled = true; }
    li.append(pic, info, btn);
    list.append(li);
  }
}
function equip(car) {
  state.wallet.car = car.id;
  save();
  scene.setCar(car.id);
  renderShop(`${car.name} is now your ride.`);
}
function buy(car) {
  if (state.wallet.owned.includes(car.id) || balance() < car.price) return;
  state.wallet.spent += car.price;
  state.wallet.owned.push(car.id);
  state.wallet.car = car.id;
  save();
  scene.setCar(car.id);
  renderWallet();
  renderShop(`Bought the ${car.name} for ${money(car.price)}. Nice ride!`);
}
$("wallet-btn").addEventListener("click", () => { renderShop(); openDialog($("shop-dialog")); });

// ---------- wire up ----------
$("answer-form").addEventListener("submit", (e) => { e.preventDefault(); trySubmit(); });
$("answer").addEventListener("input", () => {
  $("answer-hint").hidden = true;
  $("answer").removeAttribute("aria-invalid");
});
$("next").addEventListener("click", showCard);
const repairDue = () => (state.wallet.hits || 0) * REPAIR_COST;
// Pay for the repair (only now does money leave your cash). If you can't cover it, the garage takes what you have.
function repairCar() {
  const owed = repairDue();
  const paid = Math.min(owed, Math.max(0, balance()));
  state.wallet.spent += paid;
  state.wallet.hits = 0;
  if (today.done && owed) today.bill = { owed, paid };
  save();
  renderWallet();
  syncRepair();
  if (today.done) renderRepairNote();
}
function renderRepairNote() {
  const n = state.wallet.hits || 0, bill = today.bill;
  $("repair-note").textContent = n
    ? `Repair bill: ${n} hit${n > 1 ? "s" : ""} × ${money(REPAIR_COST)} = ${money(repairDue())}. It comes out of your cash when you press Repair car, and you must repair before you can drive again.`
    : bill && bill.owed
      ? `Repaired: ${money(bill.paid)} paid.${bill.paid < bill.owed ? ` You only had that much, so the garage wrote off the rest.` : ""}`
      : "No damage, no repair bill.";
}
function syncRepair() {
  const hits = state.wallet.hits || 0;
  $("repair-tag").hidden = !hits;
  $("repair").hidden = !hits || !today.done;
  $("repair").textContent = `Repair car (${money(repairDue())})`;
  $("start").textContent = hits ? `Repair car (${money(repairDue())}) and start` : "Start today's game";
  scene.setDamage(hits);
}
$("repair").addEventListener("click", repairCar);
$("start").addEventListener("click", () => {
  if (state.wallet.hits) repairCar();
  if (!helpSeen()) openHelp(showCard); // first visit: explain the game, then start
  else showCard();
});
$("share").addEventListener("click", copyShare);

// intro level list comes from the same table the scoring uses
$("levels").replaceChildren(
  ...[...LEVELS, { ...IMPOSTER, note: "that doesn't answer the question: you crash" }, { ...NOTHING, note: "out of time: you crash" }].map((l) => {
    const li = document.createElement("li");
    li.className = `lvl-${l.id}`;
    const name = document.createElement("span");
    name.textContent = `${l.emoji} ${l.name} `;
    const note = document.createElement("small");
    note.textContent = `(${l.note})`;
    name.append(note);
    const pts = document.createElement("b");
    pts.textContent = l.pts ? money(l.pts) : "$0";
    li.append(name, pts);
    return li;
  })
);

updateStreak();
renderWallet();
syncRepair();
$("intro-day").textContent = `Game #${gameNo} · ${new Date(day + "T00:00:00Z").toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" })}`;
setInterval(countdown, 1000);
countdown();

running = earnedIn(today);
scene.setDistance(spacesDriven());
scene.setPhase(today.done ? 7 : Math.min(today.answers.length, 6));
if (today.done || today.answers.length >= PER_DAY) finish();
else if (today.answers.length > 0 || today.startedAt) showCard();
else show("intro");
