// Fills public/lib/schedule.js with upcoming days made from the EXISTING questions (the first 70 in the bank).
// Usage: node scripts/plan-schedule.mjs [days]   (default 14; starts the day after the last scheduled day, or tomorrow US Eastern)
// Each day takes the 10 questions that were used longest ago, so nothing repeats for about a week.
import fs from "node:fs";
import bank, { BASE_COUNT } from "../public/lib/bank.js";
import schedule from "../public/lib/schedule.js";

const PER_DAY = 10, LAUNCH = "2026-11-02";
const base = bank.slice(0, BASE_COUNT);
const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (ds, n) => { const d = new Date(ds + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return ymd(d); };
const dayIndex = (ds) => Math.max(0, Math.round((Date.parse(ds + "T00:00:00Z") - Date.parse(LAUNCH + "T00:00:00Z")) / 86400000));
const etToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// The game's normal rotation (same as pickCards in game.js), used to know what ran recently on unscheduled days.
function mulberry32(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rotation(day) {
  const idx = dayIndex(day), per = Math.max(1, Math.floor(base.length / PER_DAY)), rand = mulberry32(Math.floor(idx / per) + 1);
  const order = base.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const pos = idx % per;
  return order.slice(pos * PER_DAY, pos * PER_DAY + PER_DAY).map((i) => base[i].id);
}
const idsOn = (day) => schedule[day] || rotation(day);

const days = Math.max(1, Number(process.argv[2]) || 14);
const dates = Object.keys(schedule).sort();
let start = dates.length ? addDays(dates[dates.length - 1], 1) : addDays(etToday, 1);
if (start <= etToday) start = addDays(etToday, 1);

const lastUsed = new Map(base.map((q) => [q.id, -999]));
for (let k = 14; k >= 1; k--) for (const id of idsOn(addDays(start, -k))) if (lastUsed.has(id)) lastUsed.set(id, -k);
const rand = mulberry32(dayIndex(start) + 7);
const out = { ...schedule };
for (let n = 0; n < days; n++) {
  const day = addDays(start, n);
  if (out[day]) continue;
  const pool = base.map((q) => ({ id: q.id, last: lastUsed.get(q.id), r: rand() })).sort((a, b) => a.last - b.last || a.r - b.r);
  const pick = pool.slice(0, PER_DAY).map((x) => x.id);
  out[day] = pick;
  for (const id of pick) lastUsed.set(id, n);
}
const body = Object.keys(out).sort().map((d) => `  "${d}": [${out[d].map((i) => `"${i}"`).join(", ")}],`).join("\n");
fs.writeFileSync(new URL("../public/lib/schedule.js", import.meta.url), `// Questions for a specific game day (US Eastern date): "YYYY-MM-DD": ["qNN", ... ten ids].
// Days that are not listed here use the normal rotation through the original 70 questions.
// Fill more days with: node scripts/plan-schedule.mjs [days]
export default {
${body}
};
`);
console.log(`scheduled ${Object.keys(out).length} days, ${start} through ${addDays(start, days - 1)}`);
