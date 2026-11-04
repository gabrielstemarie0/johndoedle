// Scoring for John Doedle: the more people give the same answer, the more points it earns.
// Used by the Cloudflare Worker (real scoring) and by the browser as an offline fallback.
import { normalize, distance, allowedTypos } from "./text.js";

// ---------- levels ----------
// Krillion's points, flipped: the most common answer earns the most. `spaces` is how far the car drives
// for the answer (like Krillion's dive depth); seven John Does would be 35 spaces, the finish line.
// Levels are by RANK among a question's answers: 1 John Doe, 5 Average Joes, 10 Neighbors, 20 Strangers,
// and every other real answer is an Alien.
export const LEVELS = [
  { id: "johndoe", name: "John Doe", pts: 100, spaces: 5, emoji: "🟩", note: "the #1 answer", ranks: 1 },
  { id: "joe", name: "Average Joe", pts: 85, spaces: 4, emoji: "🟨", note: "a top 6 answer", ranks: 5 },
  { id: "neighbor", name: "Neighbor", pts: 60, spaces: 3, emoji: "🟧", note: "a top 16 answer", ranks: 10 },
  { id: "stranger", name: "Stranger", pts: 30, spaces: 2, emoji: "🟪", note: "a top 36 answer", ranks: 20 },
  { id: "alien", name: "Alien", pts: 10, spaces: 1, emoji: "👽", note: "any other real answer", ranks: Infinity },
];
export const IMPOSTER = { id: "imposter", name: "Imposter", pts: 0, spaces: 0, emoji: "💥", note: "that doesn't answer the question" };
export const NOTHING = { id: "nothing", name: "Nothing", pts: 0, spaces: 0, emoji: "💥", note: "no answer entered" };
export const MAX_SPACES = 35; // 7 questions x 5 spaces
export const levelById = (id) => [...LEVELS, IMPOSTER, NOTHING].find((l) => l.id === id) || NOTHING;

// Which level an answer earns, from its rank (1 = most popular).
export function levelForRank(rank) {
  let upTo = 0;
  for (const l of LEVELS) {
    upTo += l.ranks;
    if (rank <= upTo) return l;
  }
  return LEVELS[LEVELS.length - 1];
}

export const MIN_LIVE = 3; // (kept for reference) player-made answers no longer change the ranking

// rows: [{ key, label, seedw, count }]. The ranking is FIXED: it comes only from each question's written order
// (seedw). Live player counts are still recorded, but they never move an answer up or down.
export function computeShares(rows) {
  const seedTotal = rows.reduce((n, r) => n + (r.seedw || 0), 0) || 1;
  const share = new Map();
  let top = 1e-9;
  for (const r of rows) {
    const s = (r.seedw || 0) / seedTotal;
    share.set(r.key, s);
    if (s > top) top = s;
  }
  return { share, top };
}

// Known answers, most popular first. Ties go to the higher starting weight, then alphabetical, so the order
// is the same in the browser and on the server.
export function ranked(rows) {
  const { share } = computeShares(rows);
  return rows
    .filter((r) => share.get(r.key) > 0)
    .sort((a, b) => share.get(b.key) - share.get(a.key) || (b.seedw || 0) - (a.seedw || 0) || (a.key < b.key ? -1 : 1));
}

// An unknown answer has no rank: if it is a real answer it is an Alien.
export function levelFor(rows, key) {
  const i = ranked(rows).findIndex((r) => r.key === key);
  return i < 0 ? LEVELS[LEVELS.length - 1] : levelForRank(i + 1);
}

export function topLabels(rows, n = 3) {
  return ranked(rows).slice(0, n).map((r) => r.label);
}

// ---------- matching what the player typed to a known answer ----------
// Every accepted spelling (the answer, its aliases, answers players have given) points at one key.
export function buildIndex(question, rows = []) {
  const alias = new Map();
  for (const [label, , aliases = []] of question.answers) {
    const k = normalize(label);
    alias.set(k, k);
    for (const a of aliases) alias.set(normalize(a), k);
  }
  for (const r of rows) if (!alias.has(r.key)) alias.set(r.key, r.key);
  return alias;
}

// Exact spelling first, then the closest known spelling within a few typos. Returns a key or null.
export function resolveKey(index, raw) {
  const k = normalize(raw);
  if (!k) return null;
  if (index.has(k)) return index.get(k);
  const limit = allowedTypos(k.length);
  if (!limit) return null;
  let best = null, bestD = limit + 1;
  for (const [spelling, key] of index) {
    const d = distance(k, spelling);
    if (d < bestD) { best = key; bestD = d; }
  }
  return best;
}

// ---------- offline fallback (browser, when the API is unreachable) ----------
export function seedRows(question) {
  return question.answers.map(([label, seedw]) => ({ key: normalize(label), label, seedw, count: 0 }));
}
export function judgeLocal(question, raw) {
  const rows = seedRows(question);
  const key = resolveKey(buildIndex(question, rows), raw);
  const lvl = key ? levelFor(rows, key) : LEVELS[LEVELS.length - 1]; // can't check unknown answers offline
  const row = rows.find((r) => r.key === key);
  return { valid: true, level: lvl.id, pts: lvl.pts, label: row ? row.label : String(raw).trim(), top: topLabels(rows) };
}
