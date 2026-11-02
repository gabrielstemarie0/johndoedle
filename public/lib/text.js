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
