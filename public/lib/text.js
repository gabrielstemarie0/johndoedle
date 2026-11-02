// Text helpers shared by the browser and the Cloudflare Function.

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

// True if the question names its own answer ("What is a thing that is Gold?"), which makes it trivial.
export function givesAway(question, answer) {
  const a = normalize(answer, 100);
  const q = ` ${normalize(question, 300)} `;
  // normalize() only strips a trailing "s", so "tomatoes" becomes "tomatoe"; accept that too.
  return a.length > 0 && (q.includes(` ${a} `) || q.includes(` ${a}e `));
}

// A "non-question" is too short to be a question, symbols only, or one repeated
// character. Needs at least two words and six letters/digits.
export function isValidQuestion(input) {
  const text = String(input ?? "").trim();
  const words = normalize(text, 200).split(" ").filter(Boolean);
  const squashed = words.join("");
  return text.length <= 140 && words.length >= 2 && squashed.length >= 6 && !/^(.)\1*$/.test(squashed);
}
