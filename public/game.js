import questions, { BASE_COUNT } from "./lib/bank.js";
import schedule from "./lib/schedule.js";
import fancy from "./lib/fancy.js";
import { rejectReason, REJECT_TEXT } from "./lib/rules.js";
import { planetInfo, planetPct, PLANET_BONUS } from "./lib/planets.js";
import { isValidAnswer, normalize } from "./lib/text.js";
import { LEVELS, IMPOSTER, NOTHING, levelById, levelForRank, judgeLocal } from "./lib/scoring.js";
import { CARS, LEVEL_ORDER, PIECE_ODDS, PRESTIGE_GAMES, carsOfLevel, carById, carSVG, carSideSVG, money } from "./cars.js";
import { createScene } from "./scene.js";

// ---------- settings ----------
const LAUNCH_DAY = "2026-11-02"; // game #1
const SECONDS = 25; // the obstacle on the road reaches your bumper when this runs out
const PER_DAY = 10;
const MAX_DAY = PER_DAY * 100; // a perfect day: every answer a John Doe
const STORE_KEY = "jd:v3";

const $ = (id) => document.getElementById(id);
const views = { intro: $("intro"), play: $("play"), results: $("results") };

// ---------- date + question selection ----------
// The game day rolls over at midnight US Eastern time (EST in winter, EDT in summer), for everyone.
const TZ = "America/New_York";
const ymdET = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const todayET = () => ymdET();
const prevDay = (ds) => { const d = new Date(ds + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
const secondsToMidnightET = () => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const v = (t) => Number(parts.find((p) => p.type === t).value);
  return 86400 - (v("hour") * 3600 + v("minute") * 60 + v("second"));
};
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
// Everyone gets the same 10 questions on a given date. Each cycle walks the whole bank in a
// fresh shuffled order, so questions don't repeat until the bank is used up.
function pickCards(bank, day) {
  // A day written by the nightly question writer uses exactly the questions listed for it.
  const planned = schedule[day];
  if (planned) {
    const picked = planned.map((id) => bank.find((q) => q.id === id)).filter(Boolean);
    if (picked.length === PER_DAY) return picked;
  }
  bank = bank.slice(0, BASE_COUNT); // otherwise rotate through the original questions, so newer ones never reshuffle other days
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
const zeroPieces = () => Object.fromEntries(LEVEL_ORDER.map((l) => [l, 0]));
// hits = unrepaired crashes, boxes = unopened mystery boxes, pieces = loose puzzle pieces per level, progress = pieces put toward each car
const newWallet = () => ({ spent: 0, owned: ["rusty"], car: "rusty", hits: 0, boxes: 0, pieces: zeroPieces(), progress: {}, perfect: 0 });
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.player) {
      s.wallet = { ...newWallet(), ...(s.wallet || {}) };
      s.wallet.pieces = { ...zeroPieces(), ...(s.wallet.pieces || {}) };
      s.wallet.progress = s.wallet.progress || {};
      s.planet = s.planet || 1;
      s.wallet.owned = s.wallet.owned.map((id) => (id === "ufo" ? "tractor" : id)); // the UFO became the tractor
      if (s.wallet.car === "ufo") s.wallet.car = "tractor";
      if (!s.wallet.owned.includes("rusty")) s.wallet.owned.unshift("rusty");
      if (!s.wallet.owned.includes(s.wallet.car)) s.wallet.car = "rusty";
      return s;
    }
  } catch {}
  return { player: uid(), days: {}, streak: { count: 0, best: 0, last: null }, wallet: newWallet(), planet: 1 };
}
const state = loadState();
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} };

const day = todayET();
const gameNo = dayIndex(day) + 1;
// Visit /?reset=today to wipe today's game in this browser (answers, bonus, repair bill) and play it again.
if (new URLSearchParams(location.search).get("reset") === "today") {
  const old = state.days[day];
  if (old) {
    if (old.bill) state.wallet.spent = Math.max(0, state.wallet.spent - old.bill.paid); // give back what repairs cost
    else state.wallet.hits = Math.max(0, (state.wallet.hits || 0) - (old.crashes || 0));
    if (old.perfectCounted) state.wallet.perfect = Math.max(0, (state.wallet.perfect || 0) - 1);
    delete state.days[day];
    if (old.done && state.streak.last === day) { state.streak.last = null; state.streak.count = Math.max(0, state.streak.count - 1); }
    save();
  }
  history.replaceState(null, "", location.pathname);
}
const today = (state.days[day] ||= { answers: [], startedAt: null });
const todaysQs = pickCards(questions, day);
const scene = createScene($("scene"), null); // the driving scene (purely visual)

// Cash: every dollar you've ever earned, minus what you've spent in the shop.
const earnedIn = (d) => (d.answers || []).reduce((n, a) => n + (a.pts || 0), 0);
const cashIn = (d) => earnedIn(d) + (d.bonus || 0) + (d.carBonus || 0) + (d.planetBonus || 0); // a day's answers plus streak, car and planet bonuses
const lifetimeEarned = () => Object.values(state.days).reduce((n, d) => n + cashIn(d), 0);
const balance = () => lifetimeEarned() - state.wallet.spent;
let finaleOn = false; // true while the end-of-game scene plays
let holdWallet = null; // while the end-of-game scene plays, the header keeps showing your cash from before it
const renderWallet = () => { $("wallet").textContent = money(holdWallet !== null ? holdWallet : balance()); if (typeof renderShopCta === "function") renderShopCta(); };

scene.setCar(state.wallet.car);
scene.setDamage(state.wallet.hits || 0);
window.__jd = { scene, state }; // handy for tests and for poking around in the console

// ---------- scoring ----------
async function judge(question, answer) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const res = await fetch("api/answer", { // relative, so it also works at thedailystation.com/johndoedle/
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
  const yesterday = prevDay(day);
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
  scene.setPhase(Math.min(6, Math.round((cur * 6) / (PER_DAY - 1))));
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
  $("prompt").textContent = fancy[todaysQs[cur].id] || todaysQs[cur].prompt; // the fancy wording; the plain one is revealed after you answer
  $("prompt").classList.toggle("long", $("prompt").textContent.length > 70);
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
const shownText = (q) => fancy[q.id] || q.prompt; // the wording the player actually sees
// Something that can't be an answer (not a word, or a word from the question): clear the box, shake the bar, keep the clock running.
function shakeOff(reason) {
  const input = $("answer"), form = $("answer-form");
  input.value = "";
  $("answer-hint").textContent = REJECT_TEXT[reason] || REJECT_TEXT.notword;
  $("answer-hint").hidden = false;
  form.classList.remove("shake");
  void form.offsetWidth; // restart the animation
  form.classList.add("shake");
  input.focus();
}
function trySubmit() {
  if (locked) return;
  const reason = rejectReason($("answer").value, shownText(todaysQs[cur]));
  if (reason) return shakeOff(reason);
  return lockIn();
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

  if (result.rejected) {
    const timeLeft = SECONDS * 1000 - (Date.now() - today.startedAt);
    if (!timedOut && timeLeft > 0) {
      // The server says it isn't a word (or uses a word from the question): shake it off and carry on.
      locked = false;
      scene.resume();
      $("answer").disabled = false;
      $("submit").disabled = false;
      tick = setInterval(frame, 100);
      syncHeaderButtons();
      shakeOff(result.rejected);
      return;
    }
    result = { level: NOTHING.id, pts: NOTHING.pts, label: "", top: [] }; // the clock ran out while it was being checked
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
  if (crashed) {
    scene.resolve(false, { damage: state.wallet.hits });
    scene.say(timedOut ? "TOO SLOW! CRASH!" : "WRONG TURN! CRASH!", true);
  } else {
    scene.resolve(true, { spaces: lvl.spaces });
    scene.say(`SWERVED! +${money(result.pts)}`);
  }
  renderWallet();

  $("answer-form").hidden = true;
  $("running").textContent = `${money(running)} today`;
  $("fb-pts").textContent = fmt(result.pts);
  $("fb-pts").className = `pts lvl-${lvl.id}`;
  $("fb-level").textContent = crashed
    ? `💥 Crash · ${timedOut ? "out of time" : "no cash"}`
    : `${lvl.emoji} ${lvl.name}`;
  $("fb-text").textContent = timedOut
    ? `You ran out of time and hit the obstacle.`
    : result.limited
      ? "Too many requests, so this answer couldn't be scored. You hit the obstacle."
      : result.level === "imposter"
        ? `That doesn't answer "${q.prompt}". You hit the obstacle.`
        : result.level === "johndoe"
          ? `"${result.label}" is the #1 answer. You swerved clear!`
          : `"${result.label}" is ${lvl.note}. You swerved clear.`;
  $("fb-plain").textContent = `In plain English: ${q.prompt}`;
  $("next").textContent = today.answers.length >= PER_DAY ? "See results" : "Next question";
  $("feedback").hidden = false;
  syncHeaderButtons();
  $("next").focus();
}

function finish() {
  clearInterval(tick);
  scene.clearObstacle();
  scene.setHorizon(null);
  let fresh = false, dmg = 0;
  if (!today.done) {
    fresh = true;
    today.done = true;
    const yesterday = prevDay(day);
    const s = state.streak;
    if (s.last !== day) {
      s.count = s.last === yesterday ? s.count + 1 : 1;
      s.best = Math.max(s.best, s.count);
      s.last = day;
    }
    const before = balance(); // your cash from before today's bonus and repairs
    const base = earnedIn(today);
    today.bonus = Math.round((base * ((today.reward && today.reward.pct) || 0)) / 100); // streak bonus
    const car = carById(state.wallet.car);
    today.carPct = car.mult || 0; today.carName = car.name; // the equipped car's multiplier
    today.carBonus = Math.round(((base + today.bonus) * today.carPct) / 100);
    today.planetPct = planetPct(state.planet); // +25% for every planet you've reached
    today.planetBonus = Math.round(((base + today.bonus + today.carBonus) * today.planetPct) / 100);
    // A perfect game (10 of 10 John Does) counts toward the next planet once you own the Midnight Monster Tractor.
    if (state.wallet.owned.includes("monster") && today.answers.length >= PER_DAY && today.answers.every((a) => a.level === "johndoe")) {
      state.wallet.perfect = Math.min(PRESTIGE_GAMES, (state.wallet.perfect || 0) + 1);
      today.perfectCounted = true;
    }
    // The car is repaired automatically and the bill comes out of your cash. If you can't cover it, the garage takes what you have.
    dmg = state.wallet.hits || 0;
    const owed = dmg * REPAIR_COST;
    const paid = Math.min(owed, Math.max(0, balance()));
    state.wallet.spent += paid;
    state.wallet.hits = 0;
    today.bill = { owed, paid, hits: dmg };
    save();
    holdWallet = before;
  }
  updateStreak();
  renderWallet();
  renderResults(fresh, dmg);
  syncRepair();
}


// ---------- end-of-game scene: winnings, then the car's damage, then an automatic repair ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function countTo(el, from, to, ms) {
  return new Promise((res) => {
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = money(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}
function burst(host, emoji, n, spread = 140) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement("span");
    p.className = "fx-bit";
    p.textContent = emoji[i % emoji.length];
    const ang = Math.random() * Math.PI * 2, dist = spread * (0.4 + Math.random() * 0.7);
    p.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(ang) * dist - 30}px`);
    p.style.setProperty("--rot", `${(Math.random() - 0.5) * 540}deg`);
    p.style.left = "50%"; p.style.top = "50%";
    host.append(p);
    setTimeout(() => p.remove(), 1500);
  }
}

// ---------- tool sounds (made with the Web Audio API, no files) ----------
let actx = null;
let muted = false;
try { muted = localStorage.getItem("jd:mute") === "1"; } catch {}
function ensureAudio() {
  try {
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
    if (actx && actx.state === "suspended") actx.resume();
  } catch {}
}
document.addEventListener("pointerdown", ensureAudio);
document.addEventListener("keydown", ensureAudio);
function tone(freq, dur, { type = "sine", vol = 0.2, slide = 0, at = 0 } = {}) {
  if (!actx || muted) return;
  const t = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(actx.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, { vol = 0.2, freq = 2000, q = 1, at = 0, type = "bandpass" } = {}) {
  if (!actx || muted) return;
  const t = actx.currentTime + at, len = Math.max(1, Math.floor(actx.sampleRate * dur));
  const buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(actx.destination);
  src.start(t);
}
const sfx = {
  clank() { tone(1300 + Math.random() * 700, 0.25, { type: "square", vol: 0.07, slide: 0.6 }); tone(2100, 0.18, { type: "triangle", vol: 0.1 }); noise(0.05, { vol: 0.15, freq: 4000 }); },
  bonk() { tone(150, 0.2, { vol: 0.4, slide: 0.35 }); noise(0.06, { vol: 0.2, freq: 500 }); },
  ratchet() { for (let i = 0; i < 6; i++) noise(0.025, { vol: 0.14, freq: 3200, at: i * 0.045 }); },
  drill() { tone(170, 0.45, { type: "sawtooth", vol: 0.09, slide: 1.8 }); tone(175, 0.45, { type: "square", vol: 0.04, slide: 1.8 }); },
  zap() { noise(0.28, { vol: 0.1, freq: 5200, q: 0.4 }); tone(900, 0.2, { type: "sawtooth", vol: 0.04, slide: 0.5 }); },
  poof() { noise(0.4, { vol: 0.28, freq: 700, type: "lowpass" }); tone(240, 0.3, { vol: 0.22, slide: 0.35 }); },
  ding() { tone(1318, 0.5, { vol: 0.2 }); tone(1760, 0.8, { vol: 0.18, at: 0.12 }); },
  tada() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, { type: "triangle", vol: 0.16, at: i * 0.09 })); },
  cash() { tone(1568, 0.1, { type: "square", vol: 0.08 }); tone(2093, 0.4, { type: "square", vol: 0.08, at: 0.09 }); },
};
const FIGHT = [["CLANG!", "clank"], ["BONK!", "bonk"], ["ZZZT!", "zap"], ["TINK!", "clank"], ["WHACK!", "bonk"], ["BRRRR!", "drill"], ["CLUNK!", "bonk"], ["CLICK-CLICK!", "ratchet"]];

// A classic cartoon fight cloud, but the things flying out of it are tools and a mechanic's arms and boots.
function scuffleSVG() {
  const blobs = [[100, 70, 44], [68, 58, 28], [134, 56, 30], [62, 88, 27], [140, 90, 29], [100, 102, 30], [100, 40, 26], [84, 72, 26], [118, 72, 26]];
  const out = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.5}" fill="#8c7357" stroke="#8c7357" stroke-width="4"/>`).join("");
  const fill = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ecd9bd"/>`).join("");
  const swirl = `<g fill="none" stroke="#c9ae8a" stroke-width="3" stroke-linecap="round"><path d="M70 62 q12 -16 28 -4"/><path d="M108 52 q18 -6 24 10"/><path d="M80 94 q14 10 30 2"/><path d="M118 88 q12 -2 16 -14"/><circle cx="100" cy="72" r="13"/></g>`;
  const skin = "#f2c29a", ink = "#5b3d22";
  const arm = (tool) => `<rect x="0" y="-5" width="24" height="10" rx="5" fill="${skin}" stroke="${ink}" stroke-width="1.5"/><rect x="0" y="-5.5" width="9" height="11" rx="3" fill="#e8742a" stroke="${ink}" stroke-width="1.5"/><circle cx="27" cy="0" r="7.5" fill="#fff" stroke="${ink}" stroke-width="1.5"/><text x="28" y="9" font-size="26" text-anchor="middle">${tool}</text>`;
  const boot = `<rect x="0" y="-6" width="16" height="12" rx="3" fill="#3a5ea8" stroke="#223c75" stroke-width="1.5"/><path d="M14 -8 H31 Q38 -8 38 0 Q38 8 31 8 H14 Z" fill="#7a4a24" stroke="#3b2412" stroke-width="2"/>`;
  const hat = `<path d="M0 -13 Q20 -13 20 0 Q20 13 0 13 Z" fill="#ffd23f" stroke="#8a6a00" stroke-width="2"/><rect x="-3" y="-15" width="6" height="30" rx="2" fill="#e0b000" stroke="#8a6a00" stroke-width="1.5"/>`;
  const limbs = [
    [-140, arm("🔧"), 0.0, 0.26], [-48, arm("🔨"), 0.1, 0.3], [18, boot, 0.05, 0.34], [150, arm("🪛"), 0.15, 0.28],
    [102, boot, 0.2, 0.32], [-92, hat, 0.12, 0.36], [196, arm("🪚"), 0.18, 0.27], [60, arm("🔩"), 0.08, 0.31],
  ].map(([a, shape, delay, dur]) => `<g transform="translate(100 70) rotate(${a})"><g class="poke" style="animation-delay:${delay}s;animation-duration:${dur}s"><g transform="translate(52 0)">${shape}</g></g></g>`).join("");
  const stars = `<text class="twinkle" x="14" y="26" font-size="22">⭐</text><text class="twinkle" x="168" y="30" font-size="18" style="animation-delay:.2s">⭐</text><text class="twinkle" x="176" y="124" font-size="20" style="animation-delay:.35s">⭐</text><text class="twinkle" x="6" y="118" font-size="16" style="animation-delay:.1s">✨</text>`;
  return `<svg viewBox="0 0 200 140" aria-hidden="true">${limbs}<g class="cloud">${out}${fill}${swirl}</g>${stars}</svg>`;
}
function comicWord(host, text) {
  const w = document.createElement("span");
  w.className = "bam";
  w.textContent = text;
  w.style.left = `${15 + Math.random() * 70}%`;
  w.style.top = `${Math.random() * 70}%`;
  w.style.setProperty("--r", `${(Math.random() - 0.5) * 30}deg`);
  host.append(w);
  setTimeout(() => w.remove(), 700);
}
async function repairScuffle(host, layers, box, showClean) {
  const sc = document.createElement("div");
  host.classList.add("fighting");
  sc.className = "scuffle in";
  sc.innerHTML = scuffleSVG();
  host.append(sc);
  sfx.poof();
  await sleep(380);
  let n = layers;
  for (let step = 0; step < 12; step++) {
    const [word, sound] = FIGHT[(step * 3 + Math.floor(Math.random() * 3)) % FIGHT.length];
    sfx[sound]();
    comicWord(sc, word);
    if (step % 2 === 1 && n >= 1) { // a bit of the damage disappears inside the cloud
      box.querySelectorAll(`.d${n}`).forEach((g) => { g.style.transition = "opacity .3s"; g.style.opacity = "0"; });
      n--;
    }
    await sleep(240);
  }
  sc.classList.remove("in");
  sc.classList.add("out");
  sfx.poof();
  await sleep(300);
  showClean(); // swap in the repaired car while the cloud blows away
  await sleep(250);
  sc.remove();
  host.classList.remove("fighting");
}

async function playFinale(fresh, dmg) {
  const t = total(), bill = today.bill || { owed: 0, paid: 0, hits: 0 };
  // Everything that adds to today's total, in the order it is applied.
  const steps = [];
  if (today.bonus) steps.push({ text: `🔥 Streak bonus +${(today.reward && today.reward.pct) || 0}%: +${money(today.bonus)}`, add: today.bonus });
  if (today.carBonus) steps.push({ text: `🚗 ${today.carName} +${today.carPct.toLocaleString("en-US")}%: +${money(today.carBonus)}`, add: today.carBonus });
  if (today.planetBonus) steps.push({ text: `🪐 ${planetInfo(state.planet).name} +${today.planetPct}%: +${money(today.planetBonus)}`, add: today.planetBonus });
  if (today.perfectCounted) steps.push({ text: `🏆 Perfect game! ${state.wallet.perfect}/${PRESTIGE_GAMES} toward the next planet`, add: 0 });
  const win = t + steps.reduce((n, x) => n + x.add, 0);
  const pills = $("finale-pills");
  pills.replaceChildren();
  const addPill = (st, show) => { const el = document.createElement("div"); el.className = "finale-line" + (show ? " in" : ""); el.textContent = st.text; pills.append(el); return el; };
  const amt = $("total"), carBox = $("finale-car"), status = $("finale-status"), fx = $("finale-fx");
  const costEl = $("finale-cost"), after = $("after");
  $("finale-sub").textContent = `of ${money(MAX_DAY)} possible`;
  const net = win - bill.paid;
  const car = carById(state.wallet.car);
  const showCar = (damage) => { $("finale-car-svg").innerHTML = carSideSVG(car, { damage }); };
  const costText = `🔧 Repairs: −${money(bill.paid)}${bill.paid < bill.owed ? ` (the garage wrote off ${money(bill.owed - bill.paid)})` : ""}`;

  // Not a fresh finish (reload), or reduced motion: just show where things ended up.
  if (!fresh || reduceMotion()) {
    amt.textContent = money(net);
    $("finale-label").textContent = bill.paid ? "Cash earned today (after repairs)" : "You won";
    steps.forEach((st) => addPill(st, true));
    costEl.hidden = !bill.paid; costEl.textContent = costText;
    carBox.hidden = !bill.owed;
    if (bill.owed) { showCar(0); status.textContent = "✨ Repaired and good as new"; }
    after.classList.remove("pending");
    holdWallet = null; renderWallet(); scene.setDamage(0);
    finaleOn = false; syncHeaderButtons();
    return;
  }

  finaleOn = true; syncHeaderButtons();
  after.classList.add("pending");
  amt.textContent = "$0";
  $("finale-label").textContent = "You won";
  costEl.hidden = true; carBox.hidden = true;
  // 1. the winnings
  $("finale").classList.add("flash");
  await countTo(amt, 0, t, 1500);
  amt.classList.add("pop");
  if (t > 0) { burst(fx, ["🟩", "✨", "💰", "🎉", "🟨"], 26, 150); sfx.tada(); }
  await sleep(500);
  // 2. each bonus in turn: streak, car multiplier, planet
  let running = t;
  for (const st of steps) {
    const el = addPill(st, false);
    void el.offsetWidth; el.classList.add("in");
    await sleep(500);
    if (st.add) { sfx.cash(); await countTo(amt, running, running + st.add, 800); running += st.add; await sleep(350); }
    else { sfx.ding(); burst(fx, ["🏆", "✨", "⭐"], 14, 120); await sleep(700); }
  }
  // 3. the car and its damage
  carBox.hidden = false;
  showCar(Math.min(4, dmg));
  $("finale-car-svg").classList.add("in");
  status.textContent = dmg ? `💥 Your car took ${dmg} hit${dmg > 1 ? "s" : ""}` : "✨ Not a scratch on it";
  scene.setDamage(dmg);
  await sleep(dmg ? 1700 : 1100);
  // 4. automatic repair, then the bill comes out of the total
  if (dmg) {
    status.textContent = "🔧 Repairing…";
    await repairScuffle(carBox, Math.min(4, dmg), $("finale-car-svg"), () => { showCar(0); scene.setDamage(0); });
    status.textContent = "✨ Good as new";
    sfx.ding();
    burst(fx, ["✨", "⭐"], 14, 110);
    await sleep(600);
    sfx.cash();
    costEl.hidden = false; costEl.textContent = costText; costEl.classList.add("in");
    $("finale-label").textContent = "Cash earned today (after repairs)";
    amt.classList.add("down");
    await countTo(amt, win, net, 1200);
    await sleep(500);
  }
  holdWallet = null; renderWallet();
  after.classList.remove("pending");
  finaleOn = false; syncHeaderButtons();
}

// ---------- results ----------
const total = () => earnedIn(today);
const emojiOf = (a) => (a.pts > 0 ? levelById(a.level).emoji : "💥");

function renderResults(fresh = false, dmg = 0) {
  show("results");
  const t = total();
  scene.setPhase(7);
  const crashes = today.crashes || 0;
  $("fuel-note").textContent = `Wallet: ${money(balance())}.${crashes ? ` Crashed ${crashes} time${crashes > 1 ? "s" : ""}.` : " No crashes."}`;
  renderRepairNote();
  $("res-day").textContent = `John Doedle #${gameNo}${state.planet > 1 ? ` · 🪐 ${planetInfo(state.planet).name}` : ""}`;
  $("verdict").textContent =
    t >= MAX_DAY * 0.93 ? "Peak John Doe. Perfectly ordinary."
    : t >= MAX_DAY * 0.71 ? "Very relatable. You'd blend into any crowd."
    : t >= MAX_DAY * 0.43 ? "Pretty average, which is the goal."
    : t >= MAX_DAY * 0.21 ? "A bit quirky. Maybe too quirky."
    : "You march to your own drum. Not great for this game.";
  const list = $("breakdown");
  list.replaceChildren();
  today.answers.forEach((a, i) => {
    const lvl = levelById(a.level);
    const question = todaysQs[i];
    const li = document.createElement("li");
    const top = document.createElement("div");
    top.className = "row-top";
    const q = document.createElement("span");
    q.className = "row-q";
    q.textContent = question.prompt; // the plain-English question
    const p = document.createElement("span");
    p.className = `row-pts lvl-${lvl.id}`;
    p.textContent = a.pts > 0 ? `${lvl.emoji} ${lvl.name} ${fmt(a.pts)}` : `💥 Crash $0`;
    top.append(q, p);
    const you = document.createElement("div");
    you.className = "row-you";
    you.textContent = a.raw ? `You said: ${a.raw}` : "No answer";
    li.append(top, you);
    // The fixed ranking for this question, one level at a time: pick John Doe, Average Joe, Neighbor, Stranger or Alien.
    const det = document.createElement("details");
    det.className = "row-best";
    const sum = document.createElement("summary");
    sum.textContent = "See the answers by level";
    const tabs = document.createElement("div");
    tabs.className = "best-tabs";
    tabs.setAttribute("role", "tablist");
    const chips = document.createElement("ol");
    chips.className = "best-list";
    const note = document.createElement("p");
    note.className = "best-note";
    const all = question.answers.map(([label], i) => ({ label, rank: i + 1, level: levelForRank(i + 1) }));
    const yours = a.label ? normalize(a.label) : null;
    const showLevel = (id) => {
      tabs.querySelectorAll(".best-tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.level === id)));
      chips.replaceChildren();
      for (const r of all.filter((x) => x.level.id === id)) {
        const c = document.createElement("li");
        c.className = `best-chip lvl-${id}`;
        const n = document.createElement("b"); n.textContent = `#${r.rank}`;
        c.append(n, ` ${r.label}`);
        if (yours && normalize(r.label) === yours) c.classList.add("yours");
        chips.append(c);
      }
      const L = levelById(id);
      note.textContent = id === "alien"
        ? `${L.name} (${money(L.pts)}): the answers listed here, plus any other real answer.`
        : `${L.name} (${money(L.pts)}): ${L.note}.`;
    };
    for (const L of LEVELS) {
      const t = document.createElement("button");
      t.type = "button";
      t.className = `best-tab lvl-${L.id}`;
      t.dataset.level = L.id;
      t.setAttribute("role", "tab");
      const lab = document.createElement("span");
      lab.textContent = `${L.emoji} ${L.name}`;
      t.append(lab);
      t.addEventListener("click", () => showLevel(L.id));
      tabs.append(t);
    }
    showLevel(a.pts > 0 && LEVELS.some((l) => l.id === a.level) ? a.level : "johndoe");
    det.append(sum, tabs, chips, note);
    li.append(det);
    list.append(li);
  });
  playFinale(fresh, dmg);
}

// Messaging apps remember a link's preview picture for a long time. Bump this number whenever the preview image changes
// so shared links look new to them and fetch the current picture.
const SHARE_V = 3;
const shareText = () =>
  `John Doedle #${gameNo} ${money(total())} of ${money(MAX_DAY)}\n${today.answers.map(emojiOf).join("")}\n${location.origin}${location.pathname}?v=${SHARE_V}`;

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
  if (ymdET() !== day) return location.reload(); // midnight Eastern passed: a new game is out
  const left = secondsToMidnightET();
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
  $("help-btn").disabled = $("stats-btn").disabled = $("wallet-btn").disabled = timing || finaleOn;
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
  const yesterday = prevDay(day);
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

  // last 14 games as bars (full height = a perfect day)
  const recent = st.games.slice(-14);
  const h = document.createElement("h3"); h.textContent = `Last ${recent.length} game${recent.length > 1 ? "s" : ""}`; box.append(h);
  const chart = document.createElement("div");
  chart.className = "stat-bars";
  chart.setAttribute("role", "img");
  chart.setAttribute("aria-label", `Earnings of your last ${recent.length} games: ${recent.map((g) => "$" + g.total).join(", ")}`);
  for (const g of recent) {
    const col = document.createElement("div"); col.className = "stat-bar";
    const bar = document.createElement("i"); bar.style.height = `${Math.max(3, Math.round((Math.max(0, g.total) / MAX_DAY) * 100))}%`;
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

// ---------- puzzle pieces and mystery boxes ----------
const levelName = (id) => levelById(id).name;
const levelTag = (id) => `${levelById(id).emoji} ${levelName(id)}`;
// A box holds one piece of a random level. The pricier a level's cars, the rarer its pieces (PIECE_ODDS, in percent).
function rollPieceLevel() {
  const total = LEVEL_ORDER.reduce((n, l) => n + PIECE_ODDS[l], 0);
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  let r = (buf[0] / 4294967296) * total;
  for (const l of LEVEL_ORDER) { if ((r -= PIECE_ODDS[l]) < 0) return l; }
  return "alien";
}
function openBox() {
  if (!state.wallet.boxes) return null;
  const lvl = rollPieceLevel();
  state.wallet.boxes--;
  state.wallet.pieces[lvl]++;
  save();
  refreshShopUi();
  return lvl;
}
function usePiece(car) {
  const w = state.wallet;
  if (w.owned.includes(car.id) || !w.pieces[car.level]) return;
  w.pieces[car.level]--;
  w.progress[car.id] = (w.progress[car.id] || 0) + 1;
  let msg = `Piece added to the ${car.name}: ${w.progress[car.id]} of ${car.pieces}.`;
  if (w.progress[car.id] >= car.pieces) {
    w.owned.push(car.id);
    w.car = car.id;
    scene.setCar(car.id);
    msg = `Puzzle complete! The ${car.name} is yours, no cash needed.`;
  }
  save();
  refreshShopUi(msg);
}

// ---------- daily streak reward ----------
// Finish yesterday's game (so you are on a 2+ day run) and today starts with a cash bonus plus a mystery box.
const streakPct = (n) => Math.min(50, n * 5); // 2 days: +10%, then +5% a day up to +50%
function grantDailyReward() {
  if (today.reward || today.done) return;
  const yesterday = prevDay(day);
  const n = state.streak.last === yesterday ? state.streak.count + 1 : 0; // today would be day n of the run
  if (n < 2) return; // a one-day streak doesn't count
  today.reward = { streak: n, pct: streakPct(n), boxId: 1 };
  state.wallet.boxes++;
  save();
}
function renderReward(result = "") {
  const r = today.reward, box = $("reward");
  box.hidden = !r || today.answers.length > 0;
  if (box.hidden) return;
  $("reward-title").textContent = `🔥 ${r.streak}-day streak!`;
  $("reward-pct").textContent = `+${r.pct}%`;
  const left = state.wallet.boxes;
  $("reward-open").hidden = !left;
  $("reward-box-note").textContent = left ? `${left > 1 ? left + " boxes" : "1 box"} to open: each holds a random puzzle piece` : "opened";
  $("reward-result").textContent = result;
}
$("reward-open").addEventListener("click", () => {
  const lvl = openBox();
  if (lvl) renderReward(`You found a ${levelTag(lvl)} puzzle piece! Put it toward any ${levelName(lvl)} car in the shop.`);
});

// ---------- the shop ----------
// Cars are grouped under the answer levels: cheap starters are Aliens, the pricey ones are John Does.
let shopMsg = "";
function refreshShopUi(message) {
  if (message !== undefined) shopMsg = message;
  renderWallet();
  renderShopCta();
  if ($("shop-dialog").open) renderShop(shopMsg);
  renderReward();
}
function renderShop(message = "") {
  shopMsg = message;
  const w = state.wallet;
  $("shop-balance").textContent = money(balance());
  $("shop-msg").textContent = message;
  const bar = $("shop-pieces");
  bar.replaceChildren();
  const pl = document.createElement("p");
  pl.className = "shop-planet";
  pl.textContent = `🪐 ${planetInfo(state.planet).name}${state.planet > 1 ? `: +${planetPct(state.planet)}% on all winnings` : ": the first planet. Each new planet adds +25% to all winnings."}`;
  bar.append(pl);
  const chips = document.createElement("div");
  chips.className = "piece-chips";
  for (const l of LEVEL_ORDER) {
    const c = document.createElement("span");
    c.className = `piece-chip lvl-${l}`;
    c.title = `${w.pieces[l]} loose ${levelName(l)} puzzle piece${w.pieces[l] === 1 ? "" : "s"}. A mystery box gives one ${levelName(l)} piece ${PIECE_ODDS[l]}% of the time.`;
    c.textContent = `🧩 ${levelById(l).emoji} ${w.pieces[l]}`;
    chips.append(c);
  }
  bar.append(chips);
  const box = document.createElement("div");
  box.className = "box-row";
  const label = document.createElement("span");
  label.textContent = w.boxes ? `🎁 ${w.boxes} mystery box${w.boxes > 1 ? "es" : ""} waiting` : "🎁 No mystery boxes. Play 2 days in a row to earn one every day.";
  box.append(label);
  if (w.boxes) {
    const ob = document.createElement("button");
    ob.type = "button"; ob.className = "btn primary shop-btn"; ob.textContent = "Open a box";
    ob.addEventListener("click", () => { const l = openBox(); if (l) refreshShopUi(`Mystery box: a ${levelTag(l)} puzzle piece! Put it toward any ${levelName(l)} car below.`); });
    box.append(ob);
  }
  bar.append(box);

  const list = $("shop-list");
  list.replaceChildren();
  for (const lvl of [...LEVEL_ORDER].reverse()) { // cheapest level (Alien) at the top, the priciest (John Doe) at the bottom
    const L = levelById(lvl);
    const sec = document.createElement("section");
    sec.className = "shop-sec";
    const h = document.createElement("h3");
    h.className = `shop-sec-h lvl-${lvl}`;
    h.textContent = `${L.emoji} ${L.name}`;
    const sub = document.createElement("small");
    sub.textContent = ` ${w.pieces[lvl]} loose piece${w.pieces[lvl] === 1 ? "" : "s"}`;
    h.append(sub);
    const ul = document.createElement("ul");
    ul.className = "shop-list";
    for (const car of carsOfLevel(lvl)) ul.append(carRow(car));
    sec.append(h, ul);
    list.append(sec);
  }
}
function carRow(car) {
  const w = state.wallet;
  const owned = w.owned.includes(car.id);
  const equipped = w.car === car.id;
  const li = document.createElement("li");
  li.className = "shop-item" + (equipped ? " equipped" : "") + (owned ? "" : " locked");
  const pic = document.createElement("div");
  pic.className = "shop-pic";
  pic.innerHTML = carSVG(car).replace('width="200" height="128"', 'width="100%"');
  const info = document.createElement("div");
  info.className = "shop-info";
  const name = document.createElement("div"); name.className = "shop-name"; name.textContent = car.name;
  const blurb = document.createElement("div"); blurb.className = "shop-blurb"; blurb.textContent = car.blurb;
  const price = document.createElement("div"); price.className = "shop-price"; price.textContent = car.price ? money(car.price) : "Free";
  const mult = document.createElement("div");
  mult.className = "shop-mult";
  mult.textContent = car.mult ? `💰 +${car.mult.toLocaleString("en-US")}% on your winnings` : "No winnings bonus";
  info.append(name, blurb, price, mult);
  if (car.id === "monster") {
    const done = w.perfect || 0;
    const pr = document.createElement("div");
    pr.className = "prestige" + (owned ? "" : " locked");
    const lab = document.createElement("div");
    lab.className = "prestige-label";
    lab.textContent = owned ? `🪐 Perfect games: ${done}/${PRESTIGE_GAMES}` : `🔒 Perfect games: 0/${PRESTIGE_GAMES} (own the Monster Tractor to start)`;
    const track = document.createElement("div");
    track.className = "prestige-track";
    const fill = document.createElement("i");
    fill.style.width = `${owned ? (done / PRESTIGE_GAMES) * 100 : 0}%`;
    track.append(fill);
    const how = document.createElement("small");
    how.textContent = "A perfect game is 10 out of 10 John Doe answers. Finish 10 to unlock the planet reset.";
    pr.append(lab, track, how);
    info.append(pr);
  }
  if (!owned) {
    const got = w.progress[car.id] || 0;
    const pz = document.createElement("div");
    pz.className = "shop-puzzle";
    pz.setAttribute("aria-label", `${got} of ${car.pieces} puzzle pieces`);
    pz.textContent = `${"🧩".repeat(got)}${"▫️".repeat(car.pieces - got)} ${got}/${car.pieces}`;
    info.append(pz);
  }
  const acts = document.createElement("div");
  acts.className = "shop-actions";
  const mk = (text, cls, fn, disabled = false) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn shop-btn " + cls; b.textContent = text; b.disabled = disabled;
    if (fn) b.addEventListener("click", fn);
    acts.append(b);
  };
  if (car.id === "monster" && owned && (w.perfect || 0) >= PRESTIGE_GAMES) mk(`🪐 Reset to ${planetInfo((state.planet || 1) + 1).name}`, "primary", resetToNextPlanet);
  if (equipped) mk("Equipped", "", null, true);
  else if (owned) mk("Equip", "", () => equip(car));
  else {
    if (balance() >= car.price) mk(`Buy ${money(car.price)}`, "primary", () => buy(car));
    else mk(`Need ${money(car.price - balance())}`, "", null, true);
    const have = w.pieces[car.level];
    mk(have ? `Use a ${levelName(car.level)} piece` : `No ${levelName(car.level)} pieces`, have ? "piece" : "", have ? () => usePiece(car) : null, !have);
  }
  li.append(pic, info, acts);
  return li;
}
// Prestige: wipe everything except the planet number and start over, one planet further out.
function resetToNextPlanet() {
  if ((state.wallet.perfect || 0) < PRESTIGE_GAMES) return;
  const next = (state.planet || 1) + 1;
  const info = planetInfo(next);
  const ok = window.confirm(`Reset to ${info.name}?\n\nYou go back to day 1 with no money and only the starter car. The only thing you keep is your planet number. Every planet you reach adds +${PLANET_BONUS}% to all your winnings, for good.`);
  if (!ok) return;
  state.days = {};
  state.streak = { count: 0, best: 0, last: null };
  state.wallet = newWallet();
  state.planet = next;
  save();
  location.href = location.pathname;
}
function applyPlanet() {
  $("scene").style.filter = planetInfo(state.planet).filter || "";
}
function equip(car) {
  state.wallet.car = car.id;
  save();
  scene.setCar(car.id);
  refreshShopUi(`${car.name} is now your ride.`);
}
function buy(car) {
  if (state.wallet.owned.includes(car.id) || balance() < car.price) return;
  state.wallet.spent += car.price;
  state.wallet.owned.push(car.id);
  state.wallet.car = car.id;
  save();
  scene.setCar(car.id);
  refreshShopUi(`Bought the ${car.name} for ${money(car.price)}. Nice ride!`);
}
// Big, obvious "go to the shop" buttons on the start and results screens, with a hint about what you can do there.
function renderShopCta() {
  const w = state.wallet, bal = balance();
  const next = CARS.filter((c) => !w.owned.includes(c.id)).sort((a, b) => a.price - b.price)[0];
  const canBuy = next && bal >= next.price;
  const bits = [];
  if (w.boxes) bits.push(`🎁 ${w.boxes} mystery box${w.boxes > 1 ? "es" : ""} to open`);
  if (canBuy) bits.push(`You can afford the ${next.name}!`);
  else if (next) bits.push(`Next car: ${next.name} (${money(next.price)})`);
  const resetReady = w.owned.includes("monster") && (w.perfect || 0) >= PRESTIGE_GAMES;
  if (resetReady) bits.unshift("🪐 Planet reset ready!");
  const hot = canBuy || resetReady || w.boxes > 0 || LEVEL_ORDER.some((l) => w.pieces[l] > 0);
  document.querySelectorAll("[data-shop-cta]").forEach((b) => {
    b.classList.toggle("hot", hot);
    b.querySelector(".shop-cta-s").textContent = `You have ${money(bal)}. ${bits.join(" · ")}`;
  });
  $("shop-dot").hidden = !hot;
}
// Every dialog gets an X in a sticky corner (reachable however far you've scrolled), and a click outside closes it.
document.querySelectorAll("dialog.modal").forEach((d) => {
  const x = document.createElement("button");
  x.type = "button"; x.className = "modal-x"; x.textContent = "×"; x.setAttribute("aria-label", "Close");
  x.addEventListener("click", () => d.close());
  d.querySelector(".modal-body").prepend(x);
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
});
function openShop() { renderShop(); openDialog($("shop-dialog")); }
$("wallet-btn").addEventListener("click", openShop);
document.querySelectorAll("[data-shop-cta]").forEach((b) => b.addEventListener("click", openShop));

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
  const bill = today.bill;
  $("repair-note").textContent = bill && bill.owed
    ? `Repairs: ${bill.hits} hit${bill.hits > 1 ? "s" : ""} × ${money(REPAIR_COST)} = ${money(bill.owed)}, taken from your cash.${bill.paid < bill.owed ? ` You only had ${money(bill.paid)}, so the garage wrote off the rest.` : ""}`
    : "No damage, no repair bill.";
}
function syncRepair() {
  // Only an old unrepaired car (from before repairs became automatic) still needs fixing at the start of a game.
  const hits = state.wallet.hits || 0;
  $("repair-tag").hidden = !hits;
  $("start").textContent = hits ? `Repair car (${money(repairDue())}) and start` : "Start today's game";
  scene.setDamage(hits);
}
$("start").addEventListener("click", () => {
  if (state.wallet.hits) repairCar();
  if (!helpSeen()) openHelp(showCard); // first visit: explain the game, then start
  else showCard();
});
$("share").addEventListener("click", copyShare);
const syncMute = () => { $("mute-btn").textContent = muted ? "🔇" : "🔊"; $("mute-btn").setAttribute("aria-pressed", String(muted)); };
$("mute-btn").addEventListener("click", () => { muted = !muted; try { localStorage.setItem("jd:mute", muted ? "1" : "0"); } catch {} syncMute(); ensureAudio(); });
syncMute();

$("htp-secs").textContent = String(SECONDS);

applyPlanet();
grantDailyReward();
updateStreak();
renderWallet();
renderReward();
syncRepair();
$("intro-day").textContent = `Game #${gameNo} · ${new Date(day + "T00:00:00Z").toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" })}${state.planet > 1 ? ` · 🪐 ${planetInfo(state.planet).name}` : ""}`;
setInterval(countdown, 1000);
countdown();

running = earnedIn(today);
scene.setPhase(today.done ? 7 : Math.min(6, Math.round((today.answers.length * 6) / (PER_DAY - 1))));
if (today.done || today.answers.length >= PER_DAY) finish();
else if (today.answers.length > 0 || today.startedAt) showCard();
else show("intro");
