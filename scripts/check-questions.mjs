// Checks every question in the bank (and the day schedule). Run: node scripts/check-questions.mjs
// Exits with an error if anything is wrong. Used by the nightly question writer before it publishes.
import bank, { BASE_COUNT } from "../public/lib/bank.js";
import fancy from "../public/lib/fancy.js";
import schedule from "../public/lib/schedule.js";
import { normalize } from "../public/lib/text.js";
import { usesQuestionWord } from "../public/lib/rules.js";
import { ROASTS, POOL } from "../public/lib/roasts.js";

const problems = [];
const bad = (id, msg) => problems.push(`${id}: ${msg}`);
const ids = new Set();
const prompts = new Set();
for (const q of bank) {
  if (ids.has(q.id)) bad(q.id, "duplicate id");
  ids.add(q.id);
  if (!/^Name /.test(q.prompt)) bad(q.id, `plain prompt should start with "Name ": ${q.prompt}`);
  if (prompts.has(q.prompt.toLowerCase())) bad(q.id, "duplicate plain prompt");
  prompts.add(q.prompt.toLowerCase());
  const f = fancy[q.id];
  if (!f) bad(q.id, "no fancy wording in fancy.js");
  else {
    if (f.length > 120) bad(q.id, `fancy wording too long (${f.length}, max 120)`);
    if (f.toLowerCase().includes(q.prompt.toLowerCase().replace(/^name an? /, ""))) bad(q.id, "fancy wording just repeats the plain one");
  }
  if (q.answers.length < 38) bad(q.id, `only ${q.answers.length} answers (need 38+)`);
  const seen = new Map();
  for (const [label, , aliases = []] of q.answers) {
    for (const n of [label, ...aliases]) {
      const k = normalize(n);
      if (!k) bad(q.id, `empty answer "${n}"`);
      else if (seen.has(k) && seen.get(k) !== label) bad(q.id, `"${n}" belongs to both "${seen.get(k)}" and "${label}"`);
      else seen.set(k, label);
      if (f && usesQuestionWord(n, f)) bad(q.id, `answer "${n}" uses a word from the question`);
    }
  }
  const labels = new Set(q.answers.map((a) => normalize(a[0])));
  if (labels.size !== q.answers.length) bad(q.id, "repeated answer label");
}
// New questions (after the original 70) must not be too similar to any other question: no near-duplicate topics.
const top = (q) => new Set(q.answers.slice(0, 15).map((a) => normalize(a[0])));
for (let i = 70; i < bank.length; i++) {
  const a = top(bank[i]);
  for (let j = 0; j < bank.length; j++) {
    if (j === i) continue;
    const shared = [...top(bank[j])].filter((x) => a.has(x));
    if (shared.length >= 7) bad(bank[i].id, `too similar to ${bank[j].id} ("${bank[j].prompt}"): top answers overlap (${shared.slice(0, 5).join(", ")}...). Pick a different topic`);
  }
}
for (const [day, list] of Object.entries(schedule)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) bad(day, "schedule date must be YYYY-MM-DD");
  if (list.length !== 7) bad(day, `schedule needs exactly 7 questions (has ${list.length})`);
  if (new Set(list).size !== list.length) bad(day, "schedule repeats a question");
  for (const id of list) if (!ids.has(id)) bad(day, `schedule uses unknown question ${id}`);
}
// No question may be scheduled twice, ever.
const used = new Map();
for (const day of Object.keys(schedule).sort()) for (const id of schedule[day]) { if (used.has(id)) bad(day, `${id} was already used on ${used.get(id)}`); used.set(id, day); }
// From Nov 9, 2026 on, a day may only use questions written after the original 70 (those were all used up in the first 7 days).
const oldIds = new Set(bank.slice(0, BASE_COUNT).map((q) => q.id));
for (const [day, list] of Object.entries(schedule)) if (day >= "2026-11-09") for (const id of list) if (oldIds.has(id)) bad(day, `${id} is one of the original 70 questions, already used. Use a new question`);
// Fancy wording must disguise the category (see docs/question-wording.md). For questions after q91 the checker only catches the
// mechanical slip of repeating a content word from the plain prompt; everything else is judged against the guide, not a word list.
const PLAIN_STOP = new Set(["name", "a", "an", "the", "of", "that", "is", "in", "famous", "popular", "common", "type", "kind", "something", "you"]);
for (const q of bank) {
  if (Number(q.id.slice(1)) <= 91) continue;
  const f = (fancy[q.id] || "").toLowerCase();
  const plain = q.prompt.replace(/\s*\([^)]*\)\s*$/, ""); // the bracket note at the end is not part of the category
  for (const w of plain.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)) {
    if (w && !PLAIN_STOP.has(w) && new RegExp(`\\b${w}s?\\b`).test(f)) bad(q.id, `fancy wording names the category word "${w}" from the plain prompt; disguise it`);
  }
}
// Song questions (from q95): either ranked by Spotify streams, in which case BOTH the plain prompt and the wording end with
// "(Spotify streams)", or ranked on another basis, in which case there is no bracket and the wording itself says so (most famous, iconic,
// legendary, today's...). See "Song questions" in docs/question-wording.md.
for (const q of bank) {
  if (Number(q.id.slice(1)) <= 94) continue;
  const plain = q.prompt.replace(/\s*\([^)]*\)\s*$/, "");
  if (!/\b(songs?|tracks?|singles?|tunes?|hits?|carols?|anthems?)\b/i.test(plain.replace(/looney tunes|merrie melodies/gi, ""))) continue;
  const f = fancy[q.id] || "", tag = (t) => /\(Spotify streams\)\s*[.?!]?\s*$/i.test(t);
  if (tag(q.prompt) !== tag(f)) { bad(q.id, "a song question ranked by Spotify streams needs \"(Spotify streams)\" at the end of BOTH the plain prompt and the wording"); continue; }
  if (!tag(q.prompt) && !/\b(famous|famed|iconic|legend\w*|greatest|all-time|classic\w*|timeless|modern|current\w*|today|chart-topping|recent|latest|beloved|best-known|influential|biggest)\b/i.test(f)) bad(q.id, "a song question not ranked by Spotify streams must say in its wording what it is ranked by (famous, iconic, legendary, today's...); or end both texts with (Spotify streams)");
}
// A question limited to the US must say so in its wording (owner rule, Nov 14, 2026; from q109 on). See "Carry the qualifier" in
// docs/question-wording.md. Other places and peoples are judged against the guide, not by a word list.
const US_PLAIN = /\b(US|U\.S\.|USA|United States|America|American)\b/;
const US_HINT = /\b(america|american|americans|united states|u\.s\.?|usa|fifty|stars and stripes|uncle sam|stateside|yankee|star-spangled|bald eagle|capitol hill)\b/i;
for (const q of bank) {
  if (Number(q.id.slice(1)) <= 108) continue;
  if (US_PLAIN.test(q.prompt) && !US_HINT.test(fancy[q.id] || "")) bad(q.id, `the plain prompt is limited to the US ("${q.prompt}") but the wording gives no hint of it: add a coded US clue`);
}
// Brackets (owner rule, Nov 15, 2026): the ONLY bracket allowed in a plain prompt or a wording (from q95 on) is "(Spotify streams)", which
// clarifies that a song question is ranked by Spotify streams. Everything else is said inside the wording itself.
for (const q of bank) {
  if (Number(q.id.slice(1)) <= 94) continue;
  for (const [what, text] of [["plain prompt", q.prompt], ["wording", fancy[q.id] || ""]]) {
    for (const m of text.matchAll(/\(([^)]*)\)/g)) if (m[1].toLowerCase() !== "spotify streams") bad(q.id, `${what} has a bracket "(${m[1]})": only "(Spotify streams)" may go in brackets; say anything else in the wording itself`);
  }
}
// Questions about people or artists (from q122): the WORDING must itself say which kind of answer is wanted (an era or standing: legendary,
// all-time, old school, modern, today's, current, chart-topping...) without giving the #1 away. See "People and artists" in the guide.
const PEOPLE = /\b(singers?|vocalists?|bands?|musicians?|guitarists?|drummers?|pianists?|composers?|rappers?|artists?|actors?|actresses|players?|athletes?|golfers?|quarterbacks?|painters?|scientists?|inventors?|comedians?|directors?|authors?|writers?|chefs?|presidents?)\b/i;
const ERA = /\b(legend\w*|all-time|greatest|historic\w*|vintage|classic\w*|golden|bygone|timeless|modern|contemporary|current\w*|today|present-day|chart-topping|recent|latest|rising|up-and-coming|old-school|old days|trending|centuries|decades|old masters)\b/i;
for (const q of bank) {
  if (Number(q.id.slice(1)) < 122) continue;
  const plain = q.prompt.replace(/\s*\([^)]*\)\s*$/, "");
  if (!PEOPLE.test(plain) || /\b(songs?|tracks?|singles?|tunes?|hits?)\b/i.test(plain)) continue; // songs follow the Spotify rule above
  if (!ERA.test(fancy[q.id] || "")) bad(q.id, "a question about people or artists must say in its wording which kind of answer is wanted (legendary, all-time, old school, modern, today's, current, chart-topping...), subtly, without a bracket");
}
// The end-screen roast lines: unique, short, one per day.
const lines = [...POOL, ...Object.values(ROASTS)];
if (new Set(lines.map((l) => l.toLowerCase())).size !== lines.length) bad("roasts", "a roast line appears twice");
for (const l of lines) if (l.length > 120) bad("roasts", `too long (${l.length}): ${l}`);
for (const d of Object.keys(ROASTS)) if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) bad("roasts", `bad date ${d}`);
console.log(`${bank.length} questions, ${Object.keys(schedule).length} scheduled days`);
if (problems.length) { console.error("PROBLEMS:\n" + problems.join("\n")); process.exit(1); }
console.log("all good");
