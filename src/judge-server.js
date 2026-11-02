// Server-side judging: D1 for counts, Workers AI for meaning.
import { normalize, isValidQuestion } from "../public/lib/text.js";
import { decide, lexVec, LEXICAL, DENSE } from "../public/lib/judge.js";

const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";
// Tried in order. (llama-3.1-8b-instruct was retired 2026-05-30; the -fast variants stay active.)
const CHAT_MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fast"];

// Wraps Workers AI. With no AI binding (local dev) it falls back to word overlap.
export function makeAI(binding) {
  if (!binding) {
    return { mode: "lexical", th: LEXICAL, embed: async (texts) => texts.map(lexVec), validate: async () => null };
  }
  return {
    mode: "dense",
    th: DENSE,
    async embed(texts) {
      const out = await binding.run(EMBED_MODEL, { text: texts });
      return out.data;
    },
    // Does this question really lead to this answer? true / false, or null if the AI is unavailable.
    async validate(answer, question) {
      const errors = [];
      for (const model of CHAT_MODELS) {
        try {
          const out = await binding.run(model, {
            max_tokens: 4,
            temperature: 0,
            messages: [
              { role: "system", content: "You judge a trivia game. Reply with only YES or NO." },
              {
                role: "user",
                content: `Question: ${question}\nProposed answer: ${answer}\nIs "${answer}" a correct and natural answer to this question? Reply YES or NO.`,
              },
            ],
          });
          const raw = typeof out === "string" ? out : out?.response ?? out?.result?.response ?? out?.choices?.[0]?.message?.content;
          const text = String(raw ?? "").trim().toUpperCase();
          if (text.startsWith("YES")) return true;
          if (text.startsWith("NO")) return false;
          errors.push(`${model}: unexpected reply`);
        } catch (e) {
          errors.push(`${model}: ${String((e && e.message) || e).slice(0, 120)}`);
        }
      }
      console.error("validate failed:", errors.join(" | "));
      return null;
    },
  };
}

async function ensureSeeded(db, ai, card) {
  const have = await db.prepare("SELECT COUNT(*) AS n FROM qclusters WHERE card = ? AND seedw > 0").bind(card.id).first();
  if (have && have.n > 0) return;
  const vecs = await ai.embed(card.questions.map(([text]) => text));
  await db.batch(
    card.questions.map(([text, w], i) =>
      db
        .prepare("INSERT OR IGNORE INTO qclusters (card, key, text, vec, seedw, count) VALUES (?, ?, ?, ?, ?, 0)")
        .bind(card.id, normalize(text, 80), text, JSON.stringify(vecs[i]), w)
    )
  );
}

export async function judgeQuestion({ db, ai, card, question, player, day }) {
  await ensureSeeded(db, ai, card);
  const { results } = await db
    .prepare("SELECT key, text, vec, seedw, count FROM qclusters WHERE card = ? ORDER BY seedw DESC, count DESC LIMIT 300")
    .bind(card.id)
    .all();
  const rows = results.map((r) => ({ ...r, vec: JSON.parse(r.vec) }));

  const [vec] = await ai.embed([question]);
  const d = await decide(rows, vec, ai.th, () => ai.validate(card.answer, question));

  if (d.valid) {
    // Count each player's question once per card per day.
    const first = await db
      .prepare("INSERT OR IGNORE INTO plays (day, player, card) VALUES (?, ?, ?)")
      .bind(day, player, card.id)
      .run();
    if (first.meta.changes) {
      if (d.matched) {
        await db.prepare("UPDATE qclusters SET count = count + 1 WHERE card = ? AND key = ?").bind(card.id, d.matched.key).run();
      } else {
        const text = question.trim().replace(/\s+/g, " ").slice(0, 140);
        await db
          .prepare(
            "INSERT INTO qclusters (card, key, text, vec, seedw, count) VALUES (?, ?, ?, ?, 0, 1) ON CONFLICT(card, key) DO UPDATE SET count = count + 1"
          )
          .bind(card.id, normalize(text, 80), text, JSON.stringify(vec))
          .run();
      }
    }
  }
  return { valid: d.valid, level: d.level.id, pts: d.level.pts, matched: !!d.matched, text: d.matched ? d.matched.text : question.trim(), top: d.topTexts };
}

export { isValidQuestion };
