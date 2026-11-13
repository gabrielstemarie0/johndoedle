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

// Edit distance, used to forgive typos.
export function distance(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length];
}

// How many typos we forgive depends on word length.
export function allowedTypos(len) {
  if (len <= 3) return 0;
  if (len <= 7) return 1;
  return 2;
}

// A "non-answer" is blank, symbols only, a single character, or one repeated character ("aaaa").
// Unusual-but-real answers are fine; they just score low.
export function isValidAnswer(input) {
  const k = normalize(input).replace(/ /g, "");
  return k.length >= 2 && !/^(.)\1*$/.test(k);
}
