// The garage: every car you can buy, drawn from behind (third person, like you're the driver looking ahead).
// Prices run from a free starter to an absurdly expensive monster tractor. Art is inline SVG, no image files.

export const CARS = [
  { id: "rusty", name: "Rusty Hatchback", price: 0, level: "alien", pieces: 2, blurb: "Gets you there. Mostly.", shape: "hatch", color: "#a9733c", rust: true },
  { id: "commuter", name: "Commuter", price: 350, level: "alien", pieces: 2, blurb: "Sensible. Dull. Reliable.", shape: "sedan", color: "#4f8fd9" },
  { id: "zippy", name: "Little Zippy", price: 800, level: "alien", pieces: 3, blurb: "Tiny, but it has attitude.", shape: "hatch", color: "#7ccf3a", light: "round" },
  { id: "wagon", name: "Family Wagon", price: 1500, level: "alien", pieces: 3, blurb: "Room for the kids and the dog.", shape: "wagon", color: "#2a9d8f" },
  { id: "pickup", name: "Work Pickup", price: 3000, level: "stranger", pieces: 3, blurb: "Hauls anything. Judges nothing.", shape: "pickup", color: "#c0392b" },
  { id: "coupe", name: "Street Coupe", price: 6500, level: "stranger", pieces: 3, blurb: "Two doors, zero regrets.", shape: "coupe", color: "#f08a24", spoiler: "lip" },
  { id: "muscle", name: "Muscle Machine", price: 14000, level: "stranger", pieces: 4, blurb: "You can hear it from three blocks away.", shape: "muscle", color: "#1f3b73", stripes: "#f4f4f4", exhaust: 2 },
  { id: "rally", name: "Rally Beast", price: 28000, level: "stranger", pieces: 5, blurb: "Mud is just a suggestion.", shape: "rally", color: "#f1f1f1", accent: "#2e6fe0", spoiler: "wing" },
  { id: "luxe", name: "Luxe Sedan", price: 55000, level: "neighbor", pieces: 4, blurb: "Leather seats. Quiet confidence.", shape: "lux", color: "#1c1d23", light: "bar" },
  { id: "sports", name: "Sports Car", price: 110000, level: "neighbor", pieces: 5, blurb: "Low, loud and a little smug.", shape: "sports", color: "#d7263d", spoiler: "wing", exhaust: 2 },
  { id: "super", name: "Supercar", price: 280000, level: "neighbor", pieces: 5, blurb: "Doors that open upward. Obviously.", shape: "super", color: "#ffd23f", spoiler: "wing", exhaust: 2, light: "led" },
  { id: "hyper", name: "Hypercar", price: 1200000, level: "joe", pieces: 5, blurb: "More horsepower than a stable of horses.", shape: "hyper", color: "#7a3cff", spoiler: "bigwing", exhaust: 4, light: "led", neon: "#7df9ff" },
  { id: "rocket", name: "Rocket Car", price: 6500000, level: "joe", pieces: 6, blurb: "Technically a missile with seats.", shape: "rocket", color: "#c9d1dc", accent: "#e8453c" },
  { id: "gold", name: "Golden Phantom", price: 30000000, level: "joe", pieces: 6, blurb: "Solid gold. Do not park in the rain.", shape: "super", color: "#ffcf40", gold: true, spoiler: "wing", exhaust: 4, light: "led" },
  { id: "hover", name: "Hover Car", price: 150000000, level: "johndoe", pieces: 6, blurb: "Roads are for people who can't float.", shape: "hover", color: "#e9fbff", neon: "#38f0ff" },
  { id: "tractor", name: "Big Green Tractor", price: 1000000000, level: "johndoe", pieces: 7, blurb: "Plows through the competition.", shape: "tractor", color: "#2f8f3a", accent: "#f4f4f2" },
  { id: "monster", name: "Midnight Monster Tractor", price: 5000000000, level: "johndoe", pieces: 8, blurb: "No bonus. Own it, then pull off 10 perfect games to move to the next planet.", shape: "monster", color: "#1f2329", accent: "#d9a520" },
];
// Cars are sorted into the five answer levels. Alien holds the cheap starters, John Doe the most expensive cars.
// `pieces` is how many puzzle pieces of that level unlock the car without paying (cheaper cars need fewer).
export const LEVEL_ORDER = ["johndoe", "joe", "neighbor", "stranger", "alien"];
export const carsOfLevel = (level) => CARS.filter((c) => c.level === level);
// Mystery box odds (percent): the pricier the level's cars, the rarer its puzzle pieces.
export const PIECE_ODDS = { alien: 50, stranger: 28, neighbor: 14, joe: 6, johndoe: 2 };
// Winnings bonus (percent) for the equipped car, added at the end of every round. Evenly spaced from +1% to +10,000%.
// The Rusty Hatchback and the prestige Midnight Monster Tractor give none.
const MULT = { commuter: 1, zippy: 2, wagon: 4, pickup: 8, coupe: 17, muscle: 35, rally: 70, luxe: 143, sports: 289, super: 588, hyper: 1194, rocket: 2424, gold: 4924, hover: 10000, tractor: 20000 };
CARS.forEach((c) => { c.mult = MULT[c.id] || 0; });
// What one crash costs in repairs with this car: a steady climb (about +68% per car) from $25 to $100,000.
// If a repair costs more than your cash, your cash goes negative (you're in debt).
// Every car in a tier pays the same repair bill: the price of the cheapest car in that tier (set Nov 12, 2026).
const TIER_REPAIR = { alien: 25, stranger: 199, neighbor: 1581, joe: 7488, johndoe: 35460 };
CARS.forEach((c) => { c.repair = TIER_REPAIR[c.level] || 25; });
export const PRESTIGE_GAMES = 10; // perfect games (10/10 John Doe) with the monster tractor needed to reset to the next planet
export const carById = (id) => CARS.find((c) => c.id === id) || CARS[0];

// "$1,240", "$6.5M", "$1B"
export function money(n) {
  const v = Math.round(Math.abs(n));
  const sign = n < 0 && v > 0 ? "-" : ""; // cash can go negative after an expensive repair
  if (v >= 999.95e6) return `${sign}$${+(v / 1e9).toFixed(1)}B`;
  if (v >= 1e7) return `${sign}$${+(v / 1e6).toFixed(1)}M`;
  if (v >= 1e6) return `${sign}$${+(v / 1e6).toFixed(2)}M`;
  return sign + "$" + v.toLocaleString("en-US");
}

// ---- drawing ----
function mix(hex, to, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex), b = p(to);
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
const dark = (c, t = 0.35) => mix(c, "#000000", t);
const light = (c, t = 0.3) => mix(c, "#ffffff", t);

// Per-shape proportions for the "normal" cars: bx = body half-width, bt/bb = body top/bottom, ct = cabin top,
// cw/cwt = cabin half-width at the bottom/top, lamp = tail light style, ex = exhaust pipes.
const SHAPES = {
  hatch: { bx: 72, bt: 60, bb: 98, ct: 26, cw: 52, cwt: 44, lamp: "round", ex: 1 },
  sedan: { bx: 74, bt: 62, bb: 98, ct: 34, cw: 50, cwt: 38, lamp: "twin", ex: 1 },
  wagon: { bx: 74, bt: 58, bb: 98, ct: 20, cw: 62, cwt: 60, lamp: "tall", ex: 1 },
  coupe: { bx: 78, bt: 66, bb: 98, ct: 42, cw: 50, cwt: 36, lamp: "twin", ex: 2 },
  muscle: { bx: 82, bt: 64, bb: 98, ct: 40, cw: 52, cwt: 36, lamp: "round4", ex: 2 },
  rally: { bx: 76, bt: 58, bb: 96, ct: 28, cw: 52, cwt: 44, lamp: "twin", ex: 1 },
  lux: { bx: 80, bt: 62, bb: 98, ct: 34, cw: 54, cwt: 42, lamp: "bar", ex: 2 },
  sports: { bx: 84, bt: 68, bb: 100, ct: 46, cw: 50, cwt: 34, lamp: "twin", ex: 2 },
  super: { bx: 88, bt: 72, bb: 102, ct: 50, cw: 48, cwt: 32, lamp: "led", ex: 2 },
  hyper: { bx: 90, bt: 74, bb: 103, ct: 54, cw: 44, cwt: 28, lamp: "led", ex: 4 },
};

function wheels(s, dim = false) {
  const wh = 22, ww = 24, y = 110 - wh, lx = 100 - s.bx - 2, rx = 100 + s.bx + 2 - ww;
  const tire = (x) => `<rect x="${x}" y="${y}" width="${ww}" height="${wh}" rx="6" fill="#14161c"/><rect x="${x + 4}" y="${y + 4}" width="${ww - 8}" height="5" rx="2" fill="#2b2f3a"/>`;
  return dim ? "" : tire(lx) + tire(rx);
}

function lamps(s, c, broken) {
  const red = "#ff3b3b", dead = "#4a1818";
  const L = broken >= 1 ? dead : red; // left light dies at damage 2
  const R = broken >= 2 ? dead : red;
  const y = s.bt + 6, x1 = 100 - s.bx + 6, x2 = 100 + s.bx - 6;
  switch (s.lamp) {
    case "round": return `<circle cx="${x1 + 8}" cy="${y + 8}" r="8" fill="${L}"/><circle cx="${x2 - 8}" cy="${y + 8}" r="8" fill="${R}"/>`;
    case "round4": return [0, 1].map((i) => `<circle cx="${x1 + 7 + i * 17}" cy="${y + 8}" r="7" fill="${L}"/><circle cx="${x2 - 7 - i * 17}" cy="${y + 8}" r="7" fill="${R}"/>`).join("");
    case "tall": return `<rect x="${x1 - 2}" y="${y - 12}" width="12" height="38" rx="3" fill="${L}"/><rect x="${x2 - 10}" y="${y - 12}" width="12" height="38" rx="3" fill="${R}"/>`;
    case "bar": return `<rect x="${x1}" y="${y + 2}" width="${100 - x1 - 3}" height="9" rx="3" fill="${L}"/><rect x="103" y="${y + 2}" width="${x2 - 103}" height="9" rx="3" fill="${R}"/>`;
    case "led": return `<rect x="${x1}" y="${y + 3}" width="34" height="5" rx="2" fill="${L}"/><rect x="${x2 - 34}" y="${y + 3}" width="34" height="5" rx="2" fill="${R}"/><rect x="${x1 + 8}" y="${y + 10}" width="22" height="3" rx="1.5" fill="${L}"/><rect x="${x2 - 30}" y="${y + 10}" width="22" height="3" rx="1.5" fill="${R}"/>`;
    default: return `<rect x="${x1}" y="${y}" width="28" height="12" rx="4" fill="${L}"/><rect x="${x2 - 28}" y="${y}" width="28" height="12" rx="4" fill="${R}"/>`;
  }
}

function exhaust(s) {
  const y = s.bb - 3, pipe = (x) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.5" fill="#0b0c10"/><ellipse cx="${x}" cy="${y}" rx="3.2" ry="2" fill="#3a3d48"/>`;
  if (s.ex >= 4) return [-34, -20, 20, 34].map((d) => pipe(100 + d)).join("");
  if (s.ex === 2) return pipe(78) + pipe(122);
  return pipe(122);
}

function spoiler(kind, s, c) {
  const k = dark(c, 0.45);
  if (kind === "lip") return `<rect x="${100 - s.bx + 4}" y="${s.bt - 4}" width="${2 * s.bx - 8}" height="6" rx="2" fill="${k}"/>`;
  if (kind === "wing") return `<rect x="${100 - s.bx + 6}" y="${s.ct + 2}" width="${2 * s.bx - 12}" height="7" rx="2" fill="${k}"/><rect x="${100 - 28}" y="${s.ct + 8}" width="5" height="${s.bt - s.ct - 4}" fill="${k}"/><rect x="${100 + 23}" y="${s.ct + 8}" width="5" height="${s.bt - s.ct - 4}" fill="${k}"/>`;
  if (kind === "bigwing") return `<rect x="${100 - s.bx - 4}" y="${s.ct - 4}" width="${2 * s.bx + 8}" height="9" rx="3" fill="${k}"/><rect x="${100 - s.bx - 6}" y="${s.ct - 14}" width="5" height="24" rx="2" fill="${k}"/><rect x="${100 + s.bx + 1}" y="${s.ct - 14}" width="5" height="24" rx="2" fill="${k}"/><rect x="${100 - 30}" y="${s.ct + 5}" width="5" height="${s.bt - s.ct - 2}" fill="${k}"/><rect x="${100 + 25}" y="${s.ct + 5}" width="5" height="${s.bt - s.ct - 2}" fill="${k}"/>`;
  return "";
}

// A blood splat centred on (x, y): an irregular blob, thin spray streaks and a few drips running down. The shape is drawn from
// the position, so every splat is a little different but always the same for the same spot (the car image is cached).
function splat(x, y, r) {
  r *= 1.2;
  let seed = (Math.round(x * 73 + y * 131 + r * 17) >>> 0) || 7;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const f = (n) => n.toFixed(1);
  const n = 11, pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = r * (0.62 + rnd() * 0.78); pts.push([x + Math.cos(a) * k, y + Math.sin(a) * k * 0.82]); }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = `M${f(mid(pts[n - 1], pts[0])[0])} ${f(mid(pts[n - 1], pts[0])[1])}`;
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`; }
  let sprays = "", drips = "";
  for (let i = 0; i < 6; i++) { const a = rnd() * Math.PI * 2, r0 = r * (1.2 + rnd() * 0.25), r1 = r0 + r * (0.14 + rnd() * 0.18); // short flecks, detached from the blob
    sprays += `M${f(x + Math.cos(a) * r0)} ${f(y + Math.sin(a) * r0 * 0.82)} L${f(x + Math.cos(a) * r1)} ${f(y + Math.sin(a) * r1 * 0.82)}`; }
  for (let i = 0; i < 3; i++) { const dx = (i - 1) * r * 0.5 + (rnd() - 0.5) * r * 0.3, w = r * (0.1 + rnd() * 0.07), len = r * (0.9 + rnd() * 1.4), y0 = y + r * 0.3;
    drips += `M${f(x + dx - w)} ${f(y0)} L${f(x + dx + w)} ${f(y0)} L${f(x + dx + w * 0.45)} ${f(y0 + len)} L${f(x + dx - w * 0.45)} ${f(y0 + len)}Z`; }
  return `<g fill="#a80f1a" stroke="#6e0a11" stroke-width=".7" stroke-linejoin="round"><path d="${drips}"/><path d="${d}Z"/></g>`
    + `<path d="${sprays}" stroke="#a80f1a" stroke-width="${f(r * 0.2)}" stroke-linecap="round" fill="none"/>`
    + `<ellipse cx="${f(x + r * 0.05)}" cy="${f(y + r * 0.08)}" rx="${f(r * 0.5)}" ry="${f(r * 0.36)}" fill="#7d0b14" opacity=".75"/>`
    + `<ellipse cx="${f(x - r * 0.28)}" cy="${f(y - r * 0.3)}" rx="${f(r * 0.3)}" ry="${f(r * 0.13)}" fill="#e0323c" opacity=".8" transform="rotate(-25 ${f(x - r * 0.28)} ${f(y - r * 0.3)})"/>`;
}

// Cracks, scorch marks, blood splats and a dead tail light, getting worse with each crash (damage 1 to 4).
function damageMarks(s, damage) {
  if (damage < 1) return "";
  const cx = 100, wy = s.ct + 6;
  let out = `<g stroke="#ffffff" stroke-opacity=".85" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M${cx - 6} ${wy} L${cx + 2} ${wy + 12} L${cx - 3} ${wy + 20} M${cx + 2} ${wy + 12} L${cx + 16} ${wy + 8}"/></g>` + splat(cx - 14, wy + 8, 12);
  if (damage >= 2) {
    out += splat(cx + 24, s.bt + 22, 10);
    out += `<g stroke="#ffffff" stroke-opacity=".8" stroke-width="1.4" fill="none" stroke-linecap="round"><path d="M${cx - 26} ${wy + 2} L${cx - 14} ${wy + 14} L${cx - 20} ${wy + 22} M${cx + 22} ${wy + 4} L${cx + 12} ${wy + 16}"/></g>`;
    out += `<polygon points="${100 + s.bx - 26},${s.bt + 16} ${100 + s.bx - 4},${s.bt + 12} ${100 + s.bx - 8},${s.bb - 4} ${100 + s.bx - 30},${s.bb - 6}" fill="#000" fill-opacity=".35"/>`;
    out += `<path d="M${100 - s.bx + 14} ${s.bt + 22} l14 6 M${100 - s.bx + 18} ${s.bt + 30} l16 4" stroke="#000" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (damage >= 3) {
    out += splat(cx - 4, s.bb - 18, 11);
    out += `<rect x="${100 - s.bx + 8}" y="${s.bb - 11}" width="${2 * s.bx - 16}" height="9" rx="2" fill="#2b2d33" transform="rotate(3 100 ${s.bb})"/>`;
    out += `<ellipse cx="100" cy="${s.bt + 10}" rx="${s.bx - 18}" ry="9" fill="#000" fill-opacity=".38"/>`;
  }
  if (damage >= 4) out += splat(cx + 4, wy + 14, 16) + `<g stroke="#ffffff" stroke-opacity=".8" stroke-width="1.4" fill="none"><path d="M${cx - 34} ${wy + 8} L${cx - 20} ${wy + 24} M${cx + 30} ${wy + 6} L${cx + 18} ${wy + 24}"/></g><polygon points="${100 - s.bx},${s.bb - 20} ${100 - s.bx + 18},${s.bb - 26} ${100 - s.bx + 14},${s.bb - 2} ${100 - s.bx},${s.bb}" fill="#000" fill-opacity=".4"/>`;
  return out;
}

function normalCar(car, damage) {
  const s = SHAPES[car.shape] || SHAPES.sedan;
  const c = car.color, cx = 100;
  const body = `M${cx - s.bx} ${s.bb} V${s.bt + 8} Q${cx - s.bx} ${s.bt} ${cx - s.bx + 10} ${s.bt} H${cx + s.bx - 10} Q${cx + s.bx} ${s.bt} ${cx + s.bx} ${s.bt + 8} V${s.bb} Z`;
  const cabin = `M${cx - s.cw} ${s.bt + 1} L${cx - s.cwt} ${s.ct + 5} Q${cx - s.cwt + 2} ${s.ct} ${cx - s.cwt + 8} ${s.ct} H${cx + s.cwt - 8} Q${cx + s.cwt - 2} ${s.ct} ${cx + s.cwt} ${s.ct + 5} L${cx + s.cw} ${s.bt + 1} Z`;
  const win = `M${cx - s.cw + 9} ${s.bt - 3} L${cx - s.cwt + 6} ${s.ct + 9} H${cx + s.cwt - 6} L${cx + s.cw - 9} ${s.bt - 3} Z`;
  const fill = car.gold ? "url(#gold)" : c;
  const defs = car.gold ? `<defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".45" stop-color="#ffcf40"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs>` : "";
  const stripes = car.stripes ? `<rect x="${cx - 16}" y="${s.ct + 2}" width="9" height="${s.bb - s.ct - 12}" fill="${car.stripes}" opacity=".95"/><rect x="${cx + 7}" y="${s.ct + 2}" width="9" height="${s.bb - s.ct - 12}" fill="${car.stripes}" opacity=".95"/>` : "";
  const accent = car.accent ? `<rect x="${cx - s.bx}" y="${s.bb - 22}" width="${2 * s.bx}" height="6" fill="${car.accent}"/><rect x="${cx - 18}" y="${s.bt + 12}" width="36" height="16" rx="3" fill="${car.accent}"/>` : "";
  const rust = car.rust ? `<g fill="#6b3f1a" opacity=".7"><circle cx="${cx - 44}" cy="${s.bt + 22}" r="6"/><circle cx="${cx + 38}" cy="${s.bt + 28}" r="4.5"/><circle cx="${cx + 52}" cy="${s.bb - 8}" r="5"/><circle cx="${cx - 30}" cy="${s.bb - 12}" r="3.5"/></g>` : "";
  const neon = car.neon ? `<rect x="${cx - s.bx + 2}" y="${s.bb - 2}" width="${2 * s.bx - 4}" height="3" rx="1.5" fill="${car.neon}"/><ellipse cx="${cx}" cy="110" rx="${s.bx}" ry="5" fill="${car.neon}" opacity=".35"/>` : "";
  const sparkle = car.gold ? `<path d="M${cx + 50} ${s.ct + 8} l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#fff" opacity=".9"/>` : "";
  return `${defs}<ellipse cx="${cx}" cy="110" rx="${s.bx + 8}" ry="6" fill="#000" opacity=".35"/>
    ${wheels(s)}
    <path d="${cabin}" fill="${dark(c, car.gold ? 0.15 : 0.12)}"/>
    <path d="${win}" fill="#9fc9ff" opacity=".85"/>
    ${spoiler(car.spoiler, s, c)}
    <path d="${body}" fill="${fill}"/>
    <path d="M${cx - s.bx + 3} ${s.bt + 4} H${cx + s.bx - 3}" stroke="${light(c, 0.5)}" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
    ${stripes}${accent}${rust}
    <rect x="${cx - s.bx + 4}" y="${s.bb - 10}" width="${2 * s.bx - 8}" height="10" rx="3" fill="${dark(c, 0.55)}"/>
    ${lamps(s, c, damage >= 2 ? 2 : damage >= 1 ? 0 : -1)}
    <rect x="${cx - 14}" y="${s.bt + 16}" width="28" height="12" rx="2" fill="#f4f4ee"/><rect x="${cx - 10}" y="${s.bt + 19}" width="20" height="2" fill="#9aa"/>
    ${exhaust(s)}${neon}${sparkle}${damageMarks(s, damage)}`;
}

function pickup(car, damage) {
  const c = car.color, s = { bx: 76, bt: 56, bb: 98, ct: 24, lamp: "tall", ex: 1 };
  return `<ellipse cx="100" cy="110" rx="84" ry="6" fill="#000" opacity=".35"/>${wheels(s)}
    <path d="M56 56 L64 28 Q66 24 72 24 H128 Q134 24 136 28 L144 56 Z" fill="${dark(c, 0.15)}"/><path d="M64 52 L70 30 H130 L136 52 Z" fill="#9fc9ff" opacity=".85"/>
    <path d="M24 98 V64 Q24 56 32 56 H168 Q176 56 176 64 V98 Z" fill="${c}"/>
    <rect x="30" y="60" width="140" height="5" rx="2" fill="${dark(c, 0.3)}"/><rect x="90" y="72" width="20" height="6" rx="3" fill="${dark(c, 0.5)}"/>
    <rect x="26" y="64" width="12" height="30" rx="3" fill="#ff3b3b"/><rect x="162" y="64" width="12" height="30" rx="3" fill="#ff3b3b"/>
    <rect x="28" y="88" width="144" height="10" rx="3" fill="#2b2d33"/><rect x="84" y="80" width="32" height="8" rx="1" fill="#f4f4ee"/>
    ${exhaust(s)}${damageMarks({ bx: 76, bt: 56, bb: 98, ct: 28 }, damage)}`;
}

function rocket(car, damage) {
  const c = car.color, a = car.accent;
  const flame = (x) => `<path d="M${x - 9} 100 Q${x} 128 ${x + 9} 100 Z" fill="#ff9d2e" opacity=".9"/><path d="M${x - 5} 100 Q${x} 118 ${x + 5} 100 Z" fill="#fff3a8"/>`;
  return `<ellipse cx="100" cy="112" rx="80" ry="6" fill="#000" opacity=".3"/>
    <path d="M26 70 L6 100 H34 Z M174 70 L194 100 H166 Z" fill="${a}"/>
    <path d="M62 98 V50 Q62 22 100 12 Q138 22 138 50 V98 Z" fill="${c}"/>
    <path d="M78 52 Q100 26 122 52 Z" fill="#9fc9ff" opacity=".9"/>
    <rect x="62" y="62" width="76" height="8" fill="${a}"/><rect x="62" y="78" width="76" height="4" fill="${a}" opacity=".7"/>
    <path d="M58 100 H80 L74 112 H64 Z M120 100 H142 L136 112 H126 Z M89 100 H111 L106 114 H94 Z" fill="#2b2d33"/>
    ${flame(69)}${flame(131)}${flame(100)}
    ${damageMarks({ bx: 38, bt: 52, bb: 98, ct: 36 }, damage)}`;
}

function hover(car, damage) {
  const n = car.neon, c = car.color;
  return `<ellipse cx="100" cy="108" rx="84" ry="9" fill="${n}" opacity=".4"/><ellipse cx="100" cy="108" rx="60" ry="5" fill="${n}" opacity=".6"/>
    <path d="M18 92 V74 Q18 62 32 60 L52 56 L66 34 Q70 28 78 28 H122 Q130 28 134 34 L148 56 L168 60 Q182 62 182 74 V92 Q182 98 174 98 H26 Q18 98 18 92 Z" fill="${c}"/>
    <path d="M70 54 L80 36 H120 L130 54 Z" fill="#7be7ff" opacity=".85"/>
    <circle cx="44" cy="86" r="13" fill="#10222a"/><circle cx="44" cy="86" r="8" fill="${n}"/><circle cx="156" cy="86" r="13" fill="#10222a"/><circle cx="156" cy="86" r="8" fill="${n}"/>
    <rect x="62" y="68" width="76" height="6" rx="3" fill="${n}"/><rect x="26" y="96" width="148" height="4" rx="2" fill="${n}" opacity=".9"/>
    ${damageMarks({ bx: 82, bt: 60, bb: 98, ct: 38 }, damage)}`;
}

function tractor(car, damage) {
  const c = car.color, y = car.accent;
  return `<rect x="86" y="14" width="9" height="30" rx="3" fill="#2b2f3a"/><rect x="84" y="10" width="13" height="6" rx="2" fill="#14161c"/>
    <rect x="60" y="24" width="80" height="8" rx="3" fill="${dark(c, 0.3)}"/><rect x="64" y="30" width="72" height="44" rx="6" fill="${c}"/>
    <rect x="72" y="36" width="56" height="30" rx="4" fill="#9fe3ff" opacity=".85"/><rect x="98" y="36" width="4" height="30" fill="${dark(c, 0.3)}"/>
    <rect x="50" y="66" width="100" height="30" rx="6" fill="${c}"/><rect x="50" y="86" width="100" height="6" fill="${y}"/>
    <rect x="22" y="40" width="40" height="70" rx="12" fill="#14161c"/><rect x="138" y="40" width="40" height="70" rx="12" fill="#14161c"/>
    ${[48, 60, 72, 84, 96].map((yy) => `<rect x="24" y="${yy}" width="36" height="4" rx="2" fill="#2b2f3a"/><rect x="140" y="${yy}" width="36" height="4" rx="2" fill="#2b2f3a"/>`).join("")}
    <circle cx="42" cy="75" r="11" fill="${y}"/><circle cx="42" cy="75" r="4" fill="${dark(y, 0.4)}"/><circle cx="158" cy="75" r="11" fill="${y}"/><circle cx="158" cy="75" r="4" fill="${dark(y, 0.4)}"/>
    <rect x="68" y="76" width="9" height="8" rx="2" fill="${damage >= 2 ? "#4a1818" : "#ff3b3b"}"/><rect x="123" y="76" width="9" height="8" rx="2" fill="#ff3b3b"/>
    <rect x="92" y="96" width="16" height="10" rx="2" fill="#2b2f3a"/><circle cx="100" cy="101" r="3" fill="#8f98a6"/>
    ${damageMarks({ bx: 50, bt: 66, bb: 96, ct: 36 }, damage)}`;
}

// Lifted monster tractor from behind: giant gold-rimmed tires, roll bar, twin stacks.
function monster(car, damage) {
  const c = car.color, y = car.accent;
  const tire = (x) => `<rect x="${x}" y="30" width="46" height="92" rx="16" fill="#0d0f13"/>
    ${[40, 52, 64, 76, 88, 100, 112].map((yy) => `<rect x="${x + 3}" y="${yy}" width="40" height="5" rx="2" fill="#2b2f3a"/>`).join("")}
    <circle cx="${x + 23}" cy="76" r="13" fill="${y}"/><circle cx="${x + 23}" cy="76" r="5" fill="${dark(y, 0.45)}"/>`;
  return `<rect x="70" y="4" width="8" height="30" rx="3" fill="${y}"/><rect x="122" y="4" width="8" height="30" rx="3" fill="${y}"/>
    <rect x="68" y="2" width="12" height="5" rx="2" fill="#14161c"/><rect x="120" y="2" width="12" height="5" rx="2" fill="#14161c"/>
    <path d="M66 24 V16 Q66 10 72 10 H128 Q134 10 134 16 V24" stroke="${dark(y, 0.2)}" stroke-width="5" fill="none"/>
    <rect x="64" y="22" width="72" height="40" rx="6" fill="${c}"/><rect x="72" y="28" width="56" height="26" rx="4" fill="#9fe3ff" opacity=".8"/>
    <rect x="98" y="28" width="4" height="26" fill="${dark(c, 0.3)}"/>
    <rect x="46" y="56" width="108" height="30" rx="6" fill="${c}"/><rect x="46" y="76" width="108" height="5" fill="${y}"/>
    <rect x="86" y="86" width="28" height="22" fill="#2b2f3a"/><rect x="70" y="100" width="60" height="6" rx="3" fill="#3a3f4b"/>
    ${tire(4)}${tire(150)}
    <rect x="58" y="62" width="10" height="9" rx="2" fill="${damage >= 2 ? "#4a1818" : "#ff3b3b"}"/><rect x="132" y="62" width="10" height="9" rx="2" fill="#ff3b3b"/>
    ${damageMarks({ bx: 46, bt: 56, bb: 86, ct: 28 }, damage)}`;
}

// The car as an SVG string. damage 0..4 adds cracks, scorch and a dead tail light.
export function carSVG(car, { damage = 0 } = {}) {
  const c = typeof car === "string" ? carById(car) : car;
  const d = Math.max(0, Math.min(4, damage | 0));
  const inner = c.shape === "pickup" ? pickup(c, d) : c.shape === "rocket" ? rocket(c, d) : c.shape === "hover" ? hover(c, d) : c.shape === "tractor" ? tractor(c, d) : c.shape === "monster" ? monster(c, d) : normalCar(c, d);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 128" width="200" height="128">${inner}</svg>`;
}
export const carDataURI = (car, opts) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(carSVG(car, opts));

// ---------- side view (used by the end-of-game repair scene) ----------
// The car faces right. Damage comes in four layers (class d1..d4) so they can be repaired one by one:
// d1 cracked windshield, d2 scorched hood + dead headlight, d3 hanging bumper + smoke, d4 crumpled nose + flat tire.
const SIDE = {
  hatch: { cab: [[56, 50], [66, 26], [138, 26], [172, 50]], lo: 50, hi: 74 },
  sedan: { cab: [[60, 50], [84, 26], [148, 26], [176, 50]], lo: 50, hi: 74 },
  wagon: { cab: [[44, 50], [52, 24], [160, 24], [178, 50]], lo: 50, hi: 74 },
  coupe: { cab: [[72, 50], [104, 28], [150, 28], [186, 50]], lo: 52, hi: 74 },
  muscle: { cab: [[76, 50], [102, 28], [144, 28], [186, 50]], lo: 50, hi: 74 },
  rally: { cab: [[56, 50], [70, 26], [140, 26], [172, 50]], lo: 48, hi: 74 },
  lux: { cab: [[58, 50], [86, 26], [152, 26], [180, 50]], lo: 50, hi: 74 },
  sports: { cab: [[84, 54], [114, 34], [150, 34], [192, 54]], lo: 54, hi: 74 },
  super: { cab: [[90, 56], [118, 38], [152, 38], [196, 56]], lo: 56, hi: 74 },
  hyper: { cab: [[94, 58], [120, 42], [152, 42], [198, 58]], lo: 58, hi: 74 },
  pickup: { cab: [[100, 50], [114, 24], [158, 24], [184, 50]], lo: 50, hi: 74 },
};
const pts = (a) => a.map((p) => p.join(",")).join(" ");

function sideDamage(front, d) {
  // front = x of the nose
  const hood = front - 40;
  const layers = [`<g class="dmg d1"><path d="M${front - 62} 32 L${front - 52} 40 L${front - 58} 46 M${front - 52} 40 L${front - 40} 38" stroke="#fff" stroke-opacity=".9" stroke-width="2" fill="none" stroke-linecap="round"/>${splat(front - 30, 44, 8)}</g>`, `<g class="dmg d2"><ellipse cx="${hood}" cy="52" rx="26" ry="6" fill="#000" fill-opacity=".45"/><circle cx="${front - 6}" cy="58" r="5" fill="#2a1313"/>${splat(front - 14, 56, 7)}</g>`, `<g class="dmg d3"><rect x="${front - 6}" y="66" width="26" height="7" rx="2" fill="#2b2d33" transform="rotate(14 ${front - 6} 66)"/>
    <circle cx="${hood}" cy="40" r="9" fill="#555" fill-opacity=".6"/><circle cx="${hood - 10}" cy="28" r="12" fill="#666" fill-opacity=".5"/><circle cx="${hood - 18}" cy="12" r="14" fill="#777" fill-opacity=".4"/>${splat(hood - 6, 36, 9)}</g>`, `<g class="dmg d4"><polygon points="${front - 18},54 ${front + 4},60 ${front + 2},74 ${front - 22},72" fill="#000" fill-opacity=".5"/><path d="M${front - 30} 56 l12 8 M${front - 26} 66 l14 -4" stroke="#000" stroke-opacity=".5" stroke-width="2"/>${splat(front - 38, 50, 10)}</g>`];
  return layers.slice(0, d).join("");
}

export function carSideSVG(car, { damage = 0 } = {}) {
  const c = typeof car === "string" ? carById(car) : car;
  const d = Math.max(0, Math.min(4, damage | 0));
  const wheel = (x, r = 13) => `<g><circle cx="${x}" cy="76" r="${r}" fill="#14161c"/><circle cx="${x}" cy="76" r="${r * 0.55}" fill="#9aa3b2"/><circle cx="${x}" cy="76" r="${r * 0.18}" fill="#14161c"/></g>`;
  let inner;
  if (c.shape === "rocket") {
    inner = `<path d="M18 64 Q18 46 44 44 H170 Q218 44 226 62 Q218 80 170 80 H44 Q18 80 18 64 Z" fill="${c.color}"/><path d="M18 64 L2 84 L40 78 Z M18 62 L2 42 L40 48 Z" fill="${c.accent}"/>
      <ellipse cx="170" cy="58" rx="22" ry="8" fill="#7be7ff" opacity=".85"/><rect x="60" y="56" width="90" height="6" fill="${c.accent}"/>${wheel(70, 11)}${wheel(176, 11)}${sideDamage(226, d)}`;
  } else if (c.shape === "hover") {
    inner = `<ellipse cx="120" cy="86" rx="92" ry="8" fill="${c.neon}" opacity=".45"/><path d="M14 70 Q14 54 40 52 L84 48 L104 28 H152 L184 48 Q226 52 226 66 Q226 76 214 76 H26 Q14 76 14 70 Z" fill="${c.color}"/>
      <path d="M92 48 L108 32 H148 L172 48 Z" fill="#7be7ff" opacity=".85"/><rect x="26" y="72" width="188" height="4" rx="2" fill="${c.neon}"/><circle cx="60" cy="68" r="7" fill="${c.neon}"/><circle cx="188" cy="68" r="7" fill="${c.neon}"/>${sideDamage(226, d)}`;
  } else if (c.shape === "tractor") {
    inner = `<rect x="60" y="14" width="8" height="30" rx="3" fill="#2b2f3a"/><rect x="58" y="10" width="12" height="6" rx="2" fill="#14161c"/>
      <rect x="96" y="22" width="62" height="34" rx="4" fill="${c.color}"/><rect x="102" y="28" width="22" height="22" rx="2" fill="#9fe3ff" opacity=".85"/><rect x="128" y="28" width="24" height="22" rx="2" fill="#9fe3ff" opacity=".85"/>
      <rect x="92" y="18" width="70" height="6" rx="2" fill="${dark(c.color, 0.3)}"/>
      <path d="M150 44 H214 Q222 44 222 52 V66 H150 Z" fill="${c.color}"/><rect x="150" y="62" width="74" height="6" fill="${c.accent}"/>
      <circle cx="82" cy="62" r="30" fill="#14161c"/><circle cx="82" cy="62" r="18" fill="${c.accent}"/><circle cx="82" cy="62" r="6" fill="${dark(c.accent, 0.4)}"/>
      <circle cx="196" cy="74" r="16" fill="#14161c"/><circle cx="196" cy="74" r="8" fill="${c.accent}"/>${sideDamage(224, d)}`;
  } else if (c.shape === "monster") {
    const big = (x) => `<circle cx="${x}" cy="68" r="27" fill="#0d0f13"/><circle cx="${x}" cy="68" r="21" fill="none" stroke="#2b2f3a" stroke-width="4" stroke-dasharray="5 4"/><circle cx="${x}" cy="68" r="12" fill="${c.accent}"/><circle cx="${x}" cy="68" r="4" fill="${dark(c.accent, 0.45)}"/>`;
    inner = `<rect x="70" y="2" width="7" height="22" rx="3" fill="${c.accent}"/>
      <path d="M96 14 V8 Q96 4 100 4 H150 Q154 4 154 8 V14" stroke="${dark(c.accent, 0.2)}" stroke-width="4" fill="none"/>
      <rect x="94" y="12" width="64" height="26" rx="4" fill="${c.color}"/><rect x="100" y="17" width="22" height="16" rx="2" fill="#9fe3ff" opacity=".85"/><rect x="126" y="17" width="26" height="16" rx="2" fill="#9fe3ff" opacity=".85"/>
      <path d="M40 36 H214 Q224 36 224 46 V52 H40 Z" fill="${c.color}"/><rect x="40" y="48" width="186" height="4" fill="${c.accent}"/>
      <rect x="56" y="52" width="150" height="6" fill="#2b2f3a"/>
      <rect x="216" y="40" width="8" height="6" rx="2" fill="#fff6c8"/>${big(70)}${big(190)}${sideDamage(224, d)}`;
  } else {
    const s = SIDE[c.shape] || SIDE.sedan;
    const body = c.shape === "pickup"
      ? `<rect x="14" y="${s.lo - 6}" width="92" height="${s.hi - s.lo + 8}" rx="4" fill="${dark(c.color, 0.18)}"/>`
      : "";
    const win = s.cab.map(([x, y], i) => (i === 0 ? [x + 8, y - 2] : i === 3 ? [x - 8, y - 2] : [x + (i === 1 ? 6 : -6), y + 5]));
    inner = `${body}<path d="M14 ${s.hi - 2} V${s.lo + 4} Q14 ${s.lo - 2} 28 ${s.lo - 2} H210 Q226 ${s.lo - 2} 228 ${s.lo + 10} V${s.hi - 2} Q228 ${s.hi + 2} 222 ${s.hi + 2} H20 Q14 ${s.hi + 2} 14 ${s.hi - 2} Z" fill="${c.color}"/>
      <polygon points="${pts(s.cab)}" fill="${c.color}"/><polygon points="${pts(win)}" fill="#9fe3ff" opacity=".85"/>
      <rect x="14" y="${s.lo + 12}" width="214" height="3" fill="#000" opacity=".15"/>
      ${c.stripes ? `<rect x="14" y="${s.lo + 4}" width="214" height="5" fill="${c.stripes}"/>` : ""}
      ${c.spoiler ? `<rect x="14" y="${s.lo - 12}" width="22" height="4" rx="1" fill="${dark(c.color, 0.35)}"/><rect x="22" y="${s.lo - 8}" width="3" height="8" fill="${dark(c.color, 0.35)}"/>` : ""}
      <rect x="212" y="${s.lo + 4}" width="12" height="7" rx="2" fill="#fff6c8"/><rect x="14" y="${s.lo + 4}" width="7" height="8" rx="2" fill="#ff3b3b"/>
      ${wheel(62)}${wheel(182)}${sideDamage(228, d)}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 0 240 100" class="side-car" role="img" aria-label="${c.name}, side view"><ellipse cx="120" cy="92" rx="104" ry="5" fill="#000" opacity=".25"/>${inner}</svg>`;
}
