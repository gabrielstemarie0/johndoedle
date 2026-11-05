// Each reset sends you to a new planet: a new look for the road and +25% on all your winnings, for good.
export const PLANET_BONUS = 25; // percent per planet beyond the first
const LIST = [
  { name: "Earth", filter: "" },
  { name: "Mars", filter: "sepia(.55) saturate(2.4) hue-rotate(-18deg) contrast(1.05)" },
  { name: "the Moon", filter: "grayscale(.92) contrast(1.08) brightness(.96)" },
  { name: "Venus", filter: "sepia(.9) saturate(2.2) hue-rotate(12deg) brightness(1.08)" },
  { name: "Neptune", filter: "hue-rotate(150deg) saturate(1.5)" },
  { name: "Pluto", filter: "hue-rotate(250deg) saturate(.9) brightness(.92)" },
  { name: "Jupiter", filter: "sepia(.7) saturate(1.6) hue-rotate(-40deg)" },
  { name: "Saturn", filter: "sepia(.5) saturate(1.8) hue-rotate(20deg) brightness(1.05)" },
];
export function planetInfo(n) {
  const i = Math.max(1, n | 0);
  if (i <= LIST.length) return { n: i, ...LIST[i - 1] };
  return { n: i, name: `Planet ${i}`, filter: `hue-rotate(${(i * 61) % 360}deg) saturate(1.4)` };
}
export const planetPct = (n) => Math.max(0, (n | 0) - 1) * PLANET_BONUS;
