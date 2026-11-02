// Server-side judging: D1 for counts, Workers AI for meaning.
import { normalize, isValidQuestion, givesAway } from "../public/lib/text.js";
import { decide, lexVec, topQuestions, IMPOSTER, LEXICAL, DENSE, RARITY_WEIGHT } from "../public/lib/judge.js";

const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";
// Tried in order. (llama-3.1-8b-instruct was retired 2026-05-30; the -fast variants stay active.)
const CHAT_MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fast"];

// The judge. It states the correct answer first, then gives a verdict, then (for YES) how rare the question is.
// Answering in one word with no thinking made it reject some correct questions. Few-shot answers aren't in the deck.
const JUDGE_RULES = `You judge a trivia game. The player is shown an ANSWER and writes a QUESTION they think has that answer.
First write one short sentence saying what the correct answer to the question is. Then a line, exactly one of:
VERDICT: YES - the answer is correct for the question, and the question is specific enough that this answer is the clear, expected one.
VERDICT: WRONG - the answer is not correct for the question.
VERDICT: VAGUE - the answer would be technically true, but the question is too broad, generic or open-ended (many different answers fit), or it is a yes/no question, or it only plays with letters, spelling or length.
If (and only if) the verdict is YES, add a final line RARITY: n, where n says how likely a typical player, shown only this answer, would be to write this question:
1 = the textbook question that a large share of players would write first
2 = a common question that many players would write
3 = a sensible question that some players would think of
4 = an unusual angle that few players would think of
5 = an obscure angle that almost nobody would think of
Be strict: most good questions are 2 or 3. Use 5 only for truly obscure angles.

Examples with the answer "Paris":
Question: What is the capital of France?
The capital of France is Paris, which matches.
VERDICT: YES
RARITY: 1
Question: Which city is home to the Louvre?
The Louvre is in Paris, which matches.
VERDICT: YES
RARITY: 2
Question: Which city's Metro has Chatelet-Les Halles, one of the world's largest underground stations?
That station is in Paris, which matches.
VERDICT: YES
RARITY: 4
Question: Which city hosted the 1900 Summer Olympics, the first Games with women competing?
That was Paris, which matches.
VERDICT: YES
RARITY: 5
Question: What is the capital of Italy?
The capital of Italy is Rome, not Paris.
VERDICT: WRONG
Question: What is a place in Europe?
Many places fit, Paris is only one.
VERDICT: VAGUE
Question: Is Paris in France?
That is a yes/no question.
VERDICT: VAGUE`;

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
    // Does this question really lead to this answer? Resolves to { verdict: "YES" | "WRONG" | "VAGUE", rarity: 1-5 | null },
    // or null if the AI is unavailable.
    async validate(answer, question) {
      const errors = [];
      for (const model of CHAT_MODELS) {
        try {
          const out = await binding.run(model, {
            max_tokens: 140,
            temperature: 0,
            messages: [
              { role: "system", content: JUDGE_RULES },
              { role: "user", content: `Answer: ${answer}\nQuestion: ${question}` },
            ],
          });
          const raw = typeof out === "string" ? out : out?.response ?? out?.result?.response ?? out?.choices?.[0]?.message?.content;
          const text = String(raw ?? "").trim().toUpperCase();
          const m = text.match(/VERDICT:?\s*(YES|WRONG|VAGUE)/);
          const rar = text.match(/RARITY:?\s*([1-5])/);
          if (m) return { verdict: m[1], rarity: m[1] === "YES" && rar ? Number(rar[1]) : null };
          for (const verdict of ["YES", "WRONG", "VAGUE"]) if (text.startsWith(verdict)) return { verdict, rarity: null };
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

export async function judgeQuestion({ db, ai, card, question, player, day, debug = false }) {
  await ensureSeeded(db, ai, card);
  const { results } = await db
    .prepare("SELECT key, text, vec, seedw, prior, count FROM qclusters WHERE card = ? ORDER BY seedw DESC, count DESC LIMIT 300")
    .bind(card.id)
    .all();
  const rows = results.map((r) => ({ ...r, vec: JSON.parse(r.vec) }));

  // A question that names its own answer is trivial; no need to ask the AI.
  if (givesAway(question, card.answer)) {
    return { valid: false, level: IMPOSTER.id, pts: IMPOSTER.pts, matched: false, text: question.trim(), top: topQuestions(rows), reason: "gives_away" };
  }

  const [vec] = await ai.embed([question]);
  let verdict = null, rarity = null;
  const d = await decide(
    rows,
    vec,
    ai.th,
    async () => {
      const r = await ai.validate(card.answer, question);
      verdict = r ? r.verdict : null;
      rarity = r ? r.rarity : null;
      return verdict === "YES";
    },
    () => (verdict === "VAGUE" ? "vague" : "wrong"),
    () => RARITY_WEIGHT[rarity] ?? RARITY_WEIGHT[3] // no estimate: treat as a sensible, middling question
  );

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
            "INSERT INTO qclusters (card, key, text, vec, seedw, prior, count) VALUES (?, ?, ?, ?, 0, ?, 1) ON CONFLICT(card, key) DO UPDATE SET count = count + 1"
          )
          .bind(card.id, normalize(text, 80), text, JSON.stringify(vec), d.prior ?? RARITY_WEIGHT[3])
          .run();
      }
    }
  }
  return { valid: d.valid, level: d.level.id, pts: d.level.pts, matched: !!d.matched, text: d.matched ? d.matched.text : question.trim(), top: d.topTexts, ...(d.valid ? {} : { reason: d.reason }),
    ...(debug ? { debug: { seedSim: d.seedSim == null ? null : Math.round(d.seedSim * 1000) / 1000, llmRarity: rarity, prior: d.prior ?? null } } : {}) };
}

export { isValidQuestion };
