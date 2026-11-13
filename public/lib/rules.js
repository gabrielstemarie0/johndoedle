// Rules about what can be typed, shared by the browser and the Worker.
import { normalize, isValidAnswer, categoryHeads } from "./text.js";

// Little words that don't count when comparing an answer to the question.
const STOP = new Set(("a an the of and or in on at to for with by from as is are be that this these those it its one name cite identify enumerate specify " +
  "something someone commonly customarily often frequently typically usually which whose who what where when while upon than then such into over under " +
  "before after between about per each any some not you your their they them there s").split(" "));

const words = (s) =>
  String(s || "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/).filter(Boolean)
    .map((w) => normalize(w))
    .filter((w) => w && !STOP.has(w));

export const questionWords = (text) => new Set(words(text));

// true if the answer uses any real word that appears in the question text the player was shown
// The category word of the plain prompt ("soup" in "Name a type of soup") is allowed even if the wording shows it: it is the kind of
// thing being asked for, not a clue. Pass the plain prompt as the third argument to get that exemption.
export function usesQuestionWord(answer, questionText, plainPrompt) {
  const q = questionWords(questionText);
  if (plainPrompt) for (const h of categoryHeads(plainPrompt)) q.delete(normalize(h));
  return words(answer).some((w) => q.has(w));
}

// Quick local check for things that can't be a word at all: odd symbols, one repeated letter, no vowels in a long run of letters.
export function looksLikeWord(input) {
  const s = String(input ?? "").trim();
  if (!isValidAnswer(s)) return false;
  if (!/^[\p{L}\p{N}\s'’.\-&!,:+/*$#]+$/u.test(s)) return false; // e.g. "hamedr]" is not allowed, but "AC/DC" and "A$AP Rocky" are
  for (const w of s.toLowerCase().split(/[\s\-.,:+&!]+/)) {
    if (/^[a-z]{5,}$/.test(w) && !/[aeiouy]/.test(w)) return false; // "qwrtp" (short ones like "TMNT" or "RHCP" are fine)
  }
  return true;
}

export const REJECT_TEXT = {
  notword: "🚫 Not a word",
  inquestion: "🚫 Can't use a word from the question",
  notlisted: "🚫 Not one of the answers",
};
// Returns "notword", "inquestion" or null.
export function rejectReason(input, questionText, plainPrompt) {
  if (!looksLikeWord(input)) return "notword";
  if (usesQuestionWord(input, questionText, plainPrompt)) return "inquestion";
  return null;
}
