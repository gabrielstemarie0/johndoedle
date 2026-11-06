// John Doedle: static game (public/) plus one API route.
//   POST /api/score   { player, day, score } -> the day's score counts, for the "you beat X%" chart
//   POST /api/answer  { player, day, q, answer }
//     -> { valid, level, pts, label, top: [most popular answers] }
import questions from "../public/lib/bank.js";
import { isValidAnswer } from "../public/lib/text.js";
import { scoreAnswer, makeAI } from "./answer-server.js";
import fancy from "../public/lib/fancy.js";
import { rejectReason } from "../public/lib/rules.js";
import { checkLimits } from "./ratelimit.js";
import { recordScore } from "./scores.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// John Doedle is a Daily Station original: it's played at thedailystation.com/johndoedle/,
// which forwards requests here with an x-daily-station header. Anyone opening this
// Worker's own address is sent there instead.
const HOME = "https://thedailystation.com/johndoedle";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const viaStation = request.headers.get("x-daily-station") === "1";
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!viaStation && !isLocal) {
      return Response.redirect(HOME + url.pathname + url.search, 301);
    }
    if (url.pathname === "/api/answer") {
      if (request.method !== "POST") return reply({ error: "POST only" }, 405, { allow: "POST" });
      return handleAnswer(request, env);
    }
    if (url.pathname === "/api/score") {
      if (request.method !== "POST") return reply({ error: "POST only" }, 405, { allow: "POST" });
      return handleScore(request, env);
    }
    // everything else is the static game. "no-cache" makes browsers check for a newer copy every time (cheap, 304),
    // so an update can never leave someone running an old game.js with new helper files.
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set("cache-control", "no-cache");
    return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
  },
};

async function handleAnswer(request, env) {
  if (!env.DB) return reply({ error: "no database" }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return reply({ error: "bad json" }, 400);
  }
  const { player, day, q, answer } = body || {};
  const question = questions.find((x) => x.id === q);
  if (!question) return reply({ error: "unknown question" }, 400);
  if (typeof player !== "string" || player.length < 8 || player.length > 64) return reply({ error: "bad player" }, 400);
  if (typeof day !== "string" || !DAY.test(day) || Math.abs(Date.parse(day + "T00:00:00Z") - Date.now()) / 86400000 >= 2)
    return reply({ error: "bad day" }, 400);
  if (typeof answer !== "string" || answer.length > 60 || !isValidAnswer(answer)) return reply({ error: "not an answer" }, 400);

  // Cap AI usage per network address, per player id and globally.
  try {
    // Via The Daily Station, the player's own address arrives in x-station-client-ip
    const ip = request.headers.get("x-station-client-ip") || request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = await checkLimits(env.DB, { ip, player });
    if (!limit.ok) {
      console.warn("rate limited:", limit.which);
      return reply({ error: "rate limited", which: limit.which, retryAfter: limit.retryAfter }, 429, { "retry-after": String(limit.retryAfter) });
    }
  } catch (e) {
    console.error("rate limit check failed", e && e.message); // fail open: a broken counter shouldn't stop the game
  }

  try {
    const bad = rejectReason(answer, fancy[question.id] || question.prompt); // not a word, or uses a word from the question
    if (bad) return reply({ rejected: bad });
    return reply(await scoreAnswer({ db: env.DB, ai: makeAI(env.AI), question, answer: answer.trim(), player, day }));
  } catch (e) {
    console.error("score failed", e && e.message);
    return reply({ error: "score failed" }, 502);
  }
}

// POST /api/score { player, day, score } -> { n, counts: { score: players }, score }
async function handleScore(request, env) {
  let body;
  try { body = await request.json(); } catch { return reply({ error: "bad json" }, 400); }
  const { player, day, score } = body || {};
  if (typeof player !== "string" || player.length < 8 || player.length > 64) return reply({ error: "bad player" }, 400);
  if (player.startsWith("sim-")) return reply({ error: "bad player" }, 400); // "sim-" ids are the nightly sample players
  if (typeof day !== "string" || !DAY.test(day) || Math.abs(Date.parse(day + "T00:00:00Z") - Date.now()) / 86400000 >= 2) return reply({ error: "bad day" }, 400);
  if (!Number.isInteger(score) || score < 0 || score > 1000) return reply({ error: "bad score" }, 400);
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = await checkLimits(env.DB, { ip, player });
    if (!limit.ok) return reply({ error: "rate limited", which: limit.which, retryAfter: limit.retryAfter }, 429, { "retry-after": String(limit.retryAfter) });
  } catch (e) { console.error("rate limit check failed", e && e.message); }
  try {
    return reply(await recordScore(env.DB, { day, player, score }));
  } catch (e) {
    console.error("score board failed", e && e.message);
    return reply({ error: "score board failed" }, 502);
  }
}

function reply(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}
