// Checks every question in the bank (and the day schedule). Run: node scripts/check-questions.mjs
// Exits with an error if anything is wrong. Used by the nightly question writer before it publishes.
import bank from "../public/lib/bank.js";
import fancy from "../public/lib/fancy.js";
import schedule from "../public/lib/schedule.js";
import { normalize } from "../public/lib/text.js";
import { usesQuestionWord } from "../public/lib/rules.js";

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
for (const [day, list] of Object.entries(schedule)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) bad(day, "schedule date must be YYYY-MM-DD");
  if (list.length !== 10) bad(day, `schedule needs exactly 10 questions (has ${list.length})`);
  if (new Set(list).size !== list.length) bad(day, "schedule repeats a question");
  for (const id of list) if (!ids.has(id)) bad(day, `schedule uses unknown question ${id}`);
}
console.log(`${bank.length} questions, ${Object.keys(schedule).length} scheduled days`);
if (problems.length) { console.error("PROBLEMS:\n" + problems.join("\n")); process.exit(1); }
console.log("all good");
