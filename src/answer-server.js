// Server-side scoring: D1 holds the answer counts; Workers AI checks answers we haven't seen before.
import { normalize } from "../public/lib/text.js";
import { IMPOSTER, buildIndex, resolveKey, levelFor, topLabels } from "../public/lib/scoring.js";

// Tried in order. (llama-3.1-8b-instruct was retired 2026-05-30; the -fast variants stay active.)
const CHAT_MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fast"];

const CHECK_RULES = `You help run a game. The game asks a question like "Name a popular pizza topping" and the player types an answer. Players score by giving the answer most people would give.
You get the QUESTION and the player's ANSWER. Reply with exactly two lines:
VALID: YES or NO. YES if the answer is a real, sensible answer to the question (even an unusual one). NO for gibberish, jokes that don't answer, and things that don't fit the question.
CANONICAL: if VALID is YES, the answer's common short name: lowercase, singular, no adjectives or extra words, so that different ways of saying it match (for example "extra cheese" -> "cheese", "Pepperoni slices" -> "pepperoni", "the Eiffel Tower in Paris" -> "eiffel tower"). If VALID is NO, write NONE.

Examples with the question "Name a popular pizza topping":
ANSWER: pepperoni slices
VALID: YES
CANONICAL: pepperoni
ANSWER: pickled beets
VALID: YES
CANONICAL: pickled beets
ANSWER: my dog
VALID: NO
CANONICAL: NONE
ANSWER: asdfgh
VALID: NO
CANONICAL: NONE`;

// Wraps Workers AI. With no AI binding (local dev) every unfamiliar answer is accepted as written.
export function makeAI(binding) {
  if (!binding) return { check: async () => ({ valid: true, canonical: null }) };
  return {
    // -> { valid: true | false, canonical: string | null }, or null if the AI is unavailable
    async check(question, answer) {
      const errors = [];
      for (const model of CHAT_MODELS) {
        try {
          const out = await binding.run(model, {
            max_tokens: 40,
            temperature: 0,
            messages: [
              { role: "system", content: CHECK_RULES },
              { role: "user", content: `QUESTION: ${question}\nANSWER: ${answer}` },
            ],
          });
          const raw = typeof out === "string" ? out : out?.response ?? out?.result?.response ?? out?.choices?.[0]?.message?.content;
          const text = String(raw ?? "");
          const v = text.match(/VALID:?\s*(YES|NO)/i);
          if (v) {
            const c = text.match(/CANONICAL:?\s*([^\n\r]+)/i);
            const canonical = c && !/^none\b/i.test(c[1].trim()) ? c[1].trim().replace(/^["']|["']$/g, "").slice(0, 40) : null;
            return { valid: v[1].toUpperCase() === "YES", canonical };
          }
          errors.push(`${model}: unexpected reply`);
        } catch (e) {
          errors.push(`${model}: ${String((e && e.message) || e).slice(0, 120)}`);
        }
      }
      console.error("check failed:", errors.join(" | "));
      return null;
    },
  };
}

async function ensureSeeded(db, question) {
  const have = await db.prepare("SELECT COUNT(*) AS n FROM answer_counts WHERE qid = ? AND seedw > 0").bind(question.id).first();
  if (have && have.n > 0) return;
  await db.batch(
    question.answers.map(([label, w]) =>
      db
        .prepare("INSERT OR IGNORE INTO answer_counts (qid, key, label, seedw, count) VALUES (?, ?, ?, ?, 0)")
        .bind(question.id, normalize(label), label, w)
    )
  );
}

export async function scoreAnswer({ db, ai, question, answer, player, day }) {
  await ensureSeeded(db, question);
  const { results } = await db
    .prepare("SELECT key, label, seedw, count FROM answer_counts WHERE qid = ? ORDER BY seedw DESC, count DESC LIMIT 400")
    .bind(question.id)
    .all();
  const rows = results;
  const index = buildIndex(question, rows);

  let key = resolveKey(index, answer);
  let label = null;
  let countIt = true;
  if (key === null) {
    // Not a known answer: ask the AI whether it fits, and what to call it so variants merge.
    const check = await ai.check(question.prompt, answer);
    if (check && check.valid === false) {
      return { valid: false, level: IMPOSTER.id, pts: IMPOSTER.pts, label: answer.trim(), top: topLabels(rows) };
    }
    if (!check) countIt = false; // AI down: give the benefit of the doubt but don't pollute the counts
    const canonical = normalize((check && check.canonical) || answer);
    key = resolveKey(index, canonical) ?? canonical;
    label = (check && check.canonical) || answer.trim();
  }

  const known = rows.find((r) => r.key === key);
  const lvl = levelFor(rows, key);
  label = known ? known.label : label;

  if (countIt) {
    // Count each player's answer once per question per day.
    const first = await db.prepare("INSERT OR IGNORE INTO plays (day, player, card) VALUES (?, ?, ?)").bind(day, player, question.id).run();
    if (first.meta.changes) {
      await db
        .prepare(
          "INSERT INTO answer_counts (qid, key, label, seedw, count) VALUES (?, ?, ?, 0, 1) ON CONFLICT(qid, key) DO UPDATE SET count = count + 1"
        )
        .bind(question.id, key, label)
        .run();
    }
  }
  return { valid: true, level: lvl.id, pts: lvl.pts, label, top: topLabels(rows) };
}
