// Scoring for John Doedle: the more people give the same answer, the more points it earns.
// Used by the Cloudflare Worker (real scoring) and by the browser as an offline fallback.
import { normalize, distance, allowedTypos } from "./text.js";

// ---------- levels ----------
// Krillion's points, flipped: the most common answer earns the most. `spaces` is how far the car drives
// for the answer (like Krillion's dive depth); seven John Does would be 35 spaces, the finish line.
export const LEVELS = [
  { id: "johndoe", name: "John Doe", pts: 100, spaces: 5, emoji: "🟩", note: "the most popular answer" },
  { id: "joe", name: "Average Joe", pts: 85, spaces: 4, emoji: "🟨", note: "a very common answer" },
  { id: "neighbor", name: "Neighbor", pts: 60, spaces: 3, emoji: "🟧", note: "a fairly common answer" },
  { id: "stranger", name: "Stranger", pts: 30, spaces: 2, emoji: "🟪", note: "a rare answer" },
  { id: "alien", name: "Alien", pts: 10, spaces: 1, emoji: "👽", note: "nobody else says that" },
];
export const IMPOSTER = { id: "imposter", name: "Imposter", pts: 0, spaces: 0, emoji: "❌", note: "that doesn't answer the question" };
export const NOTHING = { id: "nothing", name: "Nothing", pts: 0, spaces: 0, emoji: "⬛", note: "no answer entered" };
export const MAX_SPACES = 35; // 7 questions x 5 spaces
export const levelById = (id) => [...LEVELS, IMPOSTER, NOTHING].find((l) => l.id === id) || NOTHING;

// ratio = this answer's popularity divided by the most popular answer's popularity.
export function levelForRatio(r) {
  if (r >= 0.7) return LEVELS[0];
  if (r >= 0.4) return LEVELS[1];
  if (r > 0.2) return LEVELS[2];
  if (r > 0) return LEVELS[3];
  return LEVELS[4]; // nobody else says it
}

export const LIVE_HALF = 100; // after ~100 live answers to a question, seed and live data count equally
export const MIN_LIVE = 3; // a player-only answer counts as "known" once 3 players have given it

// rows: [{ key, label, seedw, count }]. Returns each known answer's popularity share.
export function computeShares(rows) {
  const seedTotal = rows.reduce((n, r) => n + (r.seedw || 0), 0) || 1;
  const liveTotal = rows.reduce((n, r) => n + (r.count || 0), 0);
  const lambda = liveTotal / (liveTotal + LIVE_HALF);
  const share = new Map();
  let top = 1e-9;
  for (const r of rows) {
    const known = r.seedw > 0 || r.count >= MIN_LIVE;
    const s = known ? (1 - lambda) * ((r.seedw || 0) / seedTotal) + lambda * (liveTotal ? (r.count || 0) / liveTotal : 0) : 0;
    share.set(r.key, s);
    if (s > top) top = s;
  }
  return { share, top };
}

export function levelFor(rows, key) {
  const { share, top } = computeShares(rows);
  return levelForRatio((share.get(key) || 0) / top);
}

export function topLabels(rows, n = 3) {
  const { share } = computeShares(rows);
  return [...rows]
    .filter((r) => share.get(r.key) > 0)
    .sort((a, b) => share.get(b.key) - share.get(a.key))
    .slice(0, n)
    .map((r) => r.label);
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
  const lvl = key ? levelFor(rows, key) : LEVELS[4]; // can't check unknown answers offline
  const row = rows.find((r) => r.key === key);
  return { valid: true, level: lvl.id, pts: lvl.pts, label: row ? row.label : String(raw).trim(), top: topLabels(rows) };
}
