import cards from "./lib/cards.js";
import { isValidQuestion, givesAway } from "./lib/text.js";
import { LEVELS, IMPOSTER, NOTHING, levelById, judgeLocal } from "./lib/judge.js";

// ---------- settings ----------
const LAUNCH_DAY = "2026-11-02"; // game #1
const SECONDS = 60; // typing a question takes longer than a one-word answer
const PER_DAY = 7;
const STORE_KEY = "jd:v2";

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
// Everyone gets the same 7 cards on a given date. Each cycle walks the whole deck in a
// fresh shuffled order, so cards don't repeat until the deck is used up.
function pickCards(deck, day) {
  const idx = dayIndex(day);
  const daysPerCycle = Math.max(1, Math.floor(deck.length / PER_DAY));
  const rand = mulberry32(Math.floor(idx / daysPerCycle) + 1);
  const order = deck.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const pos = idx % daysPerCycle;
  return order.slice(pos * PER_DAY, pos * PER_DAY + PER_DAY).map((i) => deck[i]);
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
const todaysCards = pickCards(cards, day);

// ---------- judging ----------
async function judge(card, question) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const res = await fetch("/api/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ player: state.player, day, card: card.id, question }),
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (res.ok) return await res.json();
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      return { rateLimited: true, which: body.which || "", retryAfter: Number(body.retryAfter) || 60 };
    }
  } catch {} // no backend or it's down: judge offline against the seed questions
  return judgeLocal(card, question);
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
  $("feedback").hidden = true;
  $("judging").hidden = true;
  $("answer-form").hidden = false;
  $("answer").value = "";
  $("answer").disabled = false;
  $("submit").disabled = false;
  $("answer").removeAttribute("aria-invalid");
  $("answer-hint").hidden = true;
  $("qnum").textContent = `Card ${cur + 1} of ${PER_DAY}`;
  $("running").textContent = `${running} pts`;
  $("prompt").textContent = todaysCards[cur].answer;
  if (!today.startedAt) { today.startedAt = Date.now(); save(); }
  $("answer").focus();
  clearInterval(tick);
  tick = setInterval(frame, 100);
  frame();
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

// Manual submit: a non-question is rejected (shake) and the timer keeps running.
function trySubmit() {
  if (locked) return;
  const typed = $("answer").value;
  const giveaway = isValidQuestion(typed) && givesAway(typed, todaysCards[cur].answer);
  if (isValidQuestion(typed) && !giveaway) return lockIn();
  const input = $("answer");
  $("answer-hint").textContent = giveaway
    ? "Your question can't contain the answer. Try again before time runs out."
    : "That's not a question. Try again before time runs out.";
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
  const raw = isValidQuestion(typed) ? typed : ""; // on timeout, a non-question counts as blank
  const card = todaysCards[cur];
  $("answer").disabled = true;
  $("submit").disabled = true;

  let result = { level: NOTHING.id, pts: NOTHING.pts, matched: false, text: "", top: [] };
  if (raw) {
    $("judging").hidden = false;
    result = await judge(card, raw);
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
        ? "You've reached today's limit for questions. Come back tomorrow."
        : `Too many questions right now. Wait about ${wait} and try again.`;
      $("answer-hint").hidden = false;
      $("answer").focus();
      tick = setInterval(frame, 100);
      return;
    }
    result = { level: NOTHING.id, pts: NOTHING.pts, matched: false, text: "", top: [], limited: true };
  }
  today.answers.push({ raw, level: result.level, pts: result.pts, text: result.text, top: result.top || [] });
  today.startedAt = null;
  running += result.pts;
  save();

  const lvl = levelById(result.level);
  $("answer-form").hidden = true;
  $("running").textContent = `${running} pts`;
  $("fb-pts").textContent = fmt(result.pts);
  $("fb-pts").className = `pts lvl-${lvl.id}`;
  $("fb-level").textContent = `${lvl.emoji} ${lvl.name}`;
  $("fb-text").textContent = !raw
    ? "Time's up, nothing entered."
    : result.limited
      ? "Too many requests, so this question couldn't be judged."
    : result.level === "imposter"
      ? result.reason === "gives_away"
        ? "Your question contained the answer."
        : result.reason === "vague"
          ? `Too vague: lots of answers fit that question, not just "${card.answer}".`
          : `That question doesn't lead to "${card.answer}".`
      : result.matched
        ? `Same as a known question: "${result.text}"`
        : "Nobody has asked that one before.";
  $("next").textContent = today.answers.length >= PER_DAY ? "See results" : "Next card";
  $("feedback").hidden = false;
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

function renderResults() {
  show("results");
  const t = total();
  $("res-day").textContent = `John Doedle #${gameNo}`;
  $("total").textContent = t;
  $("verdict").textContent =
    t >= 550 ? "Absolutely out of this world."
    : t >= 400 ? "Deep cuts all around."
    : t >= 250 ? "A nicely off-beat mind."
    : t >= 100 ? "Staying in the shallows."
    : "Pure John Doe. Think weirder.";
  const list = $("breakdown");
  list.replaceChildren();
  today.answers.forEach((a, i) => {
    const lvl = levelById(a.level);
    const li = document.createElement("li");
    const top = document.createElement("div");
    top.className = "row-top";
    const q = document.createElement("span");
    q.className = "row-q";
    q.textContent = todaysCards[i].answer;
    const p = document.createElement("span");
    p.className = `row-pts lvl-${lvl.id}`;
    p.textContent = `${lvl.emoji} ${lvl.name} ${fmt(a.pts)}`;
    top.append(q, p);
    const you = document.createElement("div");
    you.className = "row-you";
    you.textContent = a.raw ? `You asked: ${a.raw}` : "No question";
    li.append(top, you);
    if (a.top && a.top[0]) {
      const common = document.createElement("div");
      common.className = "row-top3";
      common.textContent = `Most asked: ${a.top[0]}`;
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

// ---------- wire up ----------
$("answer-form").addEventListener("submit", (e) => { e.preventDefault(); trySubmit(); });
$("answer").addEventListener("input", () => {
  $("answer-hint").hidden = true;
  $("answer").removeAttribute("aria-invalid");
});
$("next").addEventListener("click", showCard);
$("start").addEventListener("click", showCard);
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
if (today.done || today.answers.length >= PER_DAY) finish();
else if (today.answers.length > 0 || today.startedAt) showCard();
else show("intro");
