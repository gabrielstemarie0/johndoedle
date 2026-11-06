// Simulates players finishing a game day, so "you beat X% of players" has a real sample to compare against.
// Usage: node scripts/simulate-players.mjs YYYY-MM-DD [players=20]
// Prints one SQL statement (INSERT OR IGNORE, so running it twice adds nothing) for the daily_scores table.
// Each simulated player answers 7 questions; every answer lands on a level with the odds below, tilted by that
// player's own skill, so some players are strong and some are weak. Scores are plain day totals (0-700).
const PER_DAY = 7;
const date = process.argv[2];
const count = Number(process.argv[3]) || 20;
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) { console.error("usage: node scripts/simulate-players.mjs YYYY-MM-DD [players]"); process.exit(1); }

// [points, base chance, how much a higher skill raises the chance]
const LEVELS = [[100, 0.15, 1.2], [85, 0.23, 0.8], [60, 0.2, 0.3], [30, 0.16, -0.3], [10, 0.13, -0.7], [0, 0.13, -0.9]];

function mulberry32(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32([...date].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

const tag = date.replace(/-/g, "");
const rows = [];
for (let i = 1; i <= count; i++) {
  const skill = normal() * 0.6;
  const weights = LEVELS.map(([, p, k]) => p * Math.exp(skill * k));
  const total = weights.reduce((a, b) => a + b, 0);
  let score = 0;
  for (let q = 0; q < PER_DAY; q++) {
    let r = rand() * total, pick = 0;
    for (; pick < weights.length - 1; pick++) { r -= weights[pick]; if (r < 0) break; }
    score += LEVELS[pick][0];
  }
  rows.push(`('${date}','sim-${tag}-${String(i).padStart(2, "0")}',${score})`);
}
const scores = rows.map((r) => Number(r.match(/,(\d+)\)$/)[1])).sort((a, b) => a - b);
console.error(`-- ${count} simulated players for ${date}: min ${scores[0]}, median ${scores[Math.floor(count / 2)]}, max ${scores[count - 1]}, mean ${Math.round(scores.reduce((a, b) => a + b, 0) / count)}`);
console.log(`INSERT OR IGNORE INTO daily_scores (day, player, score) VALUES ${rows.join(", ")};`);
