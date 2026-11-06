// Where a day's score ranks among players. Until plenty of people have played, the real scores are blended with a
// made-up "typical player" distribution (the prior), so the first few players don't all see "you beat 100%".
export const BUCKETS = 12;
export const PRIOR_N = 40; // the typical-player distribution counts as this many pretend players

// How likely each answer is for a typical player: [points, chance]. Estimated, not measured.
const PER_ANSWER = [[100, 0.15], [85, 0.23], [60, 0.2], [30, 0.16], [10, 0.13], [0, 0.13]];

// Probability of every possible day total for `perDay` answers (adds the answers up one at a time).
export function priorDistribution(perDay) {
  let dist = new Map([[0, 1]]);
  for (let i = 0; i < perDay; i++) {
    const next = new Map();
    for (const [sum, p] of dist) for (const [pts, q] of PER_ANSWER) next.set(sum + pts, (next.get(sum + pts) || 0) + p * q);
    dist = next;
  }
  return dist;
}

const bucketOf = (score, max) => Math.min(BUCKETS - 1, Math.floor((score / (max + 1)) * BUCKETS));

// counts: { score: howManyPlayers } from the server. Returns the bar heights and the share of players you beat.
export function standing(score, counts, perDay) {
  const max = perDay * 100;
  const prior = priorDistribution(perDay);
  const bars = new Array(BUCKETS).fill(0);
  let below = 0, tied = 0, total = PRIOR_N, n = 0;
  for (const [s, p] of prior) {
    const w = p * PRIOR_N;
    bars[bucketOf(s, max)] += w;
    if (s < score) below += w; else if (s === score) tied += w;
  }
  for (const [s, c] of Object.entries(counts || {})) {
    const v = Number(s);
    bars[bucketOf(v, max)] += c;
    total += c; n += c;
    if (v < score) below += c; else if (v === score) tied += c;
  }
  // you are one of the real players, so don't count yourself as someone you beat
  const others = Math.max(1, total - 1);
  const pct = Math.max(0, Math.min(100, Math.round(((below + Math.max(0, tied - 1) * 0.5) / others) * 100)));
  return { bars, pct, players: n, max, position: bucketOf(score, max) };
}
