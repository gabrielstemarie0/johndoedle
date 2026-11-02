// Scoring logic for John Doedle. Used by the Cloudflare Function (real judging)
// and by the browser as an offline fallback (word-overlap only, seed questions only).
import { normalize } from "./text.js";

// ---------- levels ----------
// Krillion's points, with John Doe names: the rarer the question, the more points.
// Judged against the most-asked question for the answer.
export const LEVELS = [
  { id: "alien", name: "Alien", pts: 100, emoji: "👽", note: "almost nobody asks that" },
  { id: "stranger", name: "Stranger", pts: 85, emoji: "🟪", note: "a deep cut" },
  { id: "neighbor", name: "Neighbor", pts: 60, emoji: "🟧", note: "a rare question" },
  { id: "joe", name: "Regular Joe", pts: 30, emoji: "🟨", note: "a fairly common question" },
  { id: "johndoe", name: "John Doe", pts: 10, emoji: "🟩", note: "everyone asks that one" },
];
// Like Krillion, a question the game doesn't accept scores nothing.
export const IMPOSTER = { id: "imposter", name: "Imposter", pts: 0, emoji: "❌", note: "that question doesn't lead to this answer" };
export const NOTHING = { id: "nothing", name: "Nothing", pts: 0, emoji: "⬛", note: "no question entered" };
export const levelById = (id) => [...LEVELS, IMPOSTER, NOTHING].find((l) => l.id === id) || NOTHING;

export function levelForRatio(r) {
  if (r >= 0.5) return LEVELS[4];
  if (r >= 0.25) return LEVELS[3];
  if (r >= 0.1) return LEVELS[2];
  if (r >= 0.02) return LEVELS[1];
  return LEVELS[0];
}

export const LIVE_HALF = 100; // after ~100 live questions on a card, seed and live data weigh equally

// rows: [{ key, text, seedw, count, vec }]
export function computeShares(rows) {
  const seedTotal = rows.reduce((n, r) => n + (r.seedw || 0), 0) || 1;
  const liveTotal = rows.reduce((n, r) => n + (r.count || 0), 0);
  const lambda = liveTotal / (liveTotal + LIVE_HALF);
  const share = new Map();
  let top = 1e-9;
  for (const r of rows) {
    const s = (1 - lambda) * ((r.seedw || 0) / seedTotal) + lambda * (liveTotal ? (r.count || 0) / liveTotal : 0);
    share.set(r.key, s);
    if (s > top) top = s;
  }
  return { share, top };
}

// ---------- similarity ----------
const STOP = new Set(
  "what which who whom whose where when why how is are was were be been do does did the a an of in on at to for from by with and or that this these those it its you your name tell thing something one popular common famous most".split(" ")
);

// Word-overlap "embedding": a sorted list of content words.
export function lexVec(text) {
  const words = normalize(text, 300).split(" ").filter((w) => w && !STOP.has(w));
  return [...new Set(words)].sort();
}

// Works on dense number vectors (AI embeddings) or word lists (fallback).
export function cosine(a, b) {
  if (!a.length || !b.length) return 0;
  if (typeof a[0] === "string") {
    const set = new Set(b);
    let hit = 0;
    for (const w of a) if (set.has(w)) hit++;
    return hit / Math.sqrt(a.length * b.length);
  }
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na * nb) || 1);
}

export const LEXICAL = { same: 0.6, validNear: 0.3 };
export const DENSE = { same: 0.88, validNear: 0.78 }; // starting points, tune with real data

// ---------- the decision ----------
// th: thresholds. aiValid: async () => true | false | null, only called when the
// question isn't already close to a known good question.
export async function decide(rows, vec, th, aiValid) {
  let best = null, bestSim = -1, seedBest = -1;
  for (const r of rows) {
    const s = cosine(vec, r.vec);
    if (s > bestSim) { best = r; bestSim = s; }
    if (r.seedw > 0 && s > seedBest) seedBest = s;
  }
  const valid = seedBest >= th.validNear || (await aiValid?.()) === true;
  const { share, top } = computeShares(rows);
  const topTexts = [...rows].sort((a, b) => share.get(b.key) - share.get(a.key)).slice(0, 3).map((r) => r.text);
  if (!valid) return { valid: false, level: IMPOSTER, matched: null, topTexts };
  const matched = bestSim >= th.same ? best : null;
  const ratio = matched ? (share.get(matched.key) || 0) / top : 0;
  return { valid: true, level: levelForRatio(ratio), matched, topTexts };
}

// ---------- offline fallback (browser) ----------
export function seedRows(card) {
  return card.questions.map(([text, seedw]) => ({ key: normalize(text, 80), text, seedw, count: 0, vec: lexVec(text) }));
}
export async function judgeLocal(card, question) {
  const d = await decide(seedRows(card), lexVec(question), LEXICAL, null);
  return { valid: d.valid, level: d.level.id, pts: d.level.pts, matched: !!d.matched, text: d.matched ? d.matched.text : question, top: d.topTexts };
}
