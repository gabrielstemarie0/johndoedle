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
// Song questions (since Nov 12, 2026, from q95): the owner wants the basis of the ranking stated in brackets at the end of BOTH the
// plain prompt and the fancy wording: "(Spotify streams)" when the answers are ordered by Spotify streams, or another stated basis
// such as "(most iconic)". See "Song questions" in docs/question-wording.md.
for (const q of bank) {
  if (Number(q.id.slice(1)) <= 94) continue;
  const plain = q.prompt.replace(/\s*\([^)]*\)\s*$/, "");
  if (!/\b(songs?|tracks?|singles?|tunes?|hits?|carols?|anthems?)\b/i.test(plain.replace(/looney tunes|merrie melodies/gi, ""))) continue; // "Looney Tunes" is a cartoon, not a song question
  const tag = (t) => (t.match(/\(([^)]+)\)\s*[.?!]?\s*$/) || [])[1];
  const a = tag(q.prompt), b = tag(fancy[q.id] || "");
  if (!a || !b) { bad(q.id, "a song question must end with a bracket saying what the order is based on, in BOTH the plain prompt and the fancy wording, e.g. (Spotify streams)"); continue; }
  if (a.toLowerCase() !== b.toLowerCase()) bad(q.id, `the bracket differs: plain "(${a})" vs fancy "(${b})"`);
  if (!/spotify streams|most (iconic|influential|impactful|famous)|best known/i.test(a)) bad(q.id, `bracket "(${a})" must say "Spotify streams" or name another basis (most iconic, most influential, most impactful, most famous, best known)`);
}
// Every game day from Nov 13, 2026 must include at least one music question (owner rule, Nov 12): a song, singer, band, rapper,
// instrument, genre, musician, album, composer or Broadway musical. Judged from the plain prompt.
const MUSIC = /\b(songs?|singers?|bands?|musicians?|guitarists?|drummers?|pianists?|albums?|instruments?|rappers?|music|musicals?|artists?|composers?|carols?|anthems?|tunes?)\b/i;
const isMusic = (q) => MUSIC.test(q.prompt.replace(/looney tunes|merrie melodies/gi, ""));
const byId = new Map(bank.map((q) => [q.id, q]));
for (const [day, ids] of Object.entries(schedule)) {
  if (day < "2026-11-13") continue;
  if (!ids.some((id) => byId.get(id) && isMusic(byId.get(id)))) bad(day, "no music question in this day's 7: add one (a song, singer, band, instrument, genre, musician or musical)");
}
// The end-screen roast lines: unique, short, one per day.
const lines = [...POOL, ...Object.values(ROASTS)];
if (new Set(lines.map((l) => l.toLowerCase())).size !== lines.length) bad("roasts", "a roast line appears twice");
for (const l of lines) if (l.length > 120) bad("roasts", `too long (${l.length}): ${l}`);
for (const d of Object.keys(ROASTS)) if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) bad("roasts", `bad date ${d}`);
console.log(`${bank.length} questions, ${Object.keys(schedule).length} scheduled days`);
if (problems.length) { console.error("PROBLEMS:\n" + problems.join("\n")); process.exit(1); }
console.log("all good");
