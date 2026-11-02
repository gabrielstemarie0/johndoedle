// John Doedle: static game (public/) plus one API route.
//   POST /api/judge  { player, day, card, question }
//     -> { valid, level, pts, matched, text, top: [most common questions for this answer] }
import cards from "../public/lib/cards.js";
import { isValidQuestion } from "../public/lib/text.js";
import { judgeQuestion, makeAI } from "./judge-server.js";
import { checkLimits } from "./ratelimit.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/judge") {
      if (request.method !== "POST") return reply({ error: "POST only" }, 405, { allow: "POST" });
      return handleJudge(request, env);
    }
    return env.ASSETS.fetch(request); // everything else is the static game
  },
};

async function handleJudge(request, env) {
  if (!env.DB) return reply({ error: "no database" }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return reply({ error: "bad json" }, 400);
  }
  const { player, day, card: cardId, question } = body || {};
  const card = cards.find((c) => c.id === cardId);
  if (!card) return reply({ error: "unknown card" }, 400);
  if (typeof player !== "string" || player.length < 8 || player.length > 64) return reply({ error: "bad player" }, 400);
  if (typeof day !== "string" || !DAY.test(day) || Math.abs(Date.parse(day + "T00:00:00Z") - Date.now()) / 86400000 >= 2)
    return reply({ error: "bad day" }, 400);
  if (typeof question !== "string" || !isValidQuestion(question)) return reply({ error: "not a question" }, 400);

  // Cap AI usage per network address, per player id and globally.
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = await checkLimits(env.DB, { ip, player });
    if (!limit.ok) {
      console.warn("rate limited:", limit.which);
      return reply({ error: "rate limited", which: limit.which, retryAfter: limit.retryAfter }, 429, { "retry-after": String(limit.retryAfter) });
    }
  } catch (e) {
    console.error("rate limit check failed", e && e.message); // fail open: a broken counter shouldn't stop the game
  }

  try {
    return reply(await judgeQuestion({ db: env.DB, ai: makeAI(env.AI), card, question, player, day, debug: body.debug === true }));
  } catch (e) {
    console.error("judge failed", e && e.message);
    return reply({ error: "judge failed" }, 502);
  }
}

function reply(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}
