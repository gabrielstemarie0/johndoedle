// Text helpers shared by the browser and the Cloudflare Worker.

export function normalize(input, max = 40) {
  let s = String(input ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(a|an|the) /, "");
  // crude singularising so "pickles" and "pickle" match
  s = s
    .split(" ")
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .join(" ");
  return s.slice(0, max);
}

// The "what is it" word of a question, taken from the plain prompt: "Name a type of soup" -> ["soup"], "Name a Taylor Swift song" ->
// ["song"], "Name a Greek god or goddess" -> ["god", "goddess"]. Answers may include it ("chicken noodle soup", "Washington state"):
// it is the category, not a clue. The modifiers (Taylor Swift, Greek, NBA) are NOT included, so they stay blocked if shown.
export function categoryHeads(prompt) {
  let s = String(prompt || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^(name|cite|identify|specify|enumerate)\s+(an?|the|some)?\s*/, "").replace(/^(type|kind|sort|variety|style|piece|pair)\s+of\s+/, "");
  s = s.split(/\s(?:in|from|by|that|who|whose|with|for|on|at|where|when|which|people|played|found|you\S*)\s/)[0];
  const heads = new Set();
  for (const part of s.split(/\s(?:or|and)\s/)) {
    const w = part.trim().split(" ").pop() || "";
    const n = normalize(w);
    if (n.length >= 3 && !["something", "anything", "thing", "one"].includes(n)) heads.add(n);
  }
  return [...heads];
}

// Every content word of the plain prompt ("greek", "god", "goddess" for "Name a Greek god or goddess"). Used only for trimming them off the
// ends of an answer ("Greek god Zeus" counts as "Zeus"); the clue rule never exempts these, only the category word above.
const PROMPT_STOP = new Set("name cite identify specify enumerate an the that this these those you your with from for and or are was were has have not its their there what which who whose where when type kind sort variety style piece pair something anything famous popular common one thing things some any".split(" "));
export function promptWords(prompt) {
  const s = String(prompt || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9' ]+/g, " ");
  return [...new Set(s.split(/\s+/).map((w) => normalize(w)).filter((w) => w.length >= 3 && !PROMPT_STOP.has(w)))];
}

// Edit distance, used to forgive typos. Two neighbouring letters swapped ("algiera" for "algeria") count as ONE mistake.
export function distance(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 4;
  const d = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
// "mississipi" and "morroco" differ from the real thing mostly in doubled letters, so compare a form with repeats collapsed too.
export const collapseRepeats = (w) => w.replace(/(.)\1+/g, "$1");
export const typoDistance = (a, b) => Math.min(distance(a, b), distance(collapseRepeats(a), collapseRepeats(b)));

// How many mistakes are forgiven automatically (and the answer counts), by length of what was typed.
export function allowedTypos(len) {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2; // from 7 letters (it was 8): "morroco" for "morocco"
}
// How far a near miss can be and still get a "Did you mean...?" offer (the player has to tap it).
export function suggestTypos(len) {
  if (len <= 3) return 0;
  if (len <= 4) return 1;
  if (len <= 6) return 2;
  return 3;
}

export function isValidAnswer(input) {
  const k = normalize(input).replace(/ /g, "");
  return k.length >= 2 && !/^(.)\1*$/.test(k);
}
