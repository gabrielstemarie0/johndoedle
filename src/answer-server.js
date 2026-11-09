// Server-side scoring: D1 holds the answer counts. Only answers on a question's list are accepted (no AI judging).
import { normalize } from "../public/lib/text.js";
import { buildIndex, resolveKey, levelFor, topLabels } from "../public/lib/scoring.js";

// Tried in order. (llama-3.1-8b-instruct was retired 2026-05-30; the -fast variants stay active.)
const CHAT_MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fast"];

// Keep the seed rows in D1 in step with the question bank (new answers, changed weights). Cheap when nothing changed.
async function ensureSeeded(db, question) {
  const want = question.answers.length;
  const wantSum = question.answers.reduce((n, a) => n + a[1], 0);
  const have = await db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(seedw), 0) AS s FROM answer_counts WHERE qid = ? AND seedw > 0").bind(question.id).first();
  if (have && have.n === want && Math.abs(have.s - wantSum) < 0.01) return;
  await db.batch(
    question.answers.map(([label, w]) =>
      db
        .prepare(
          "INSERT INTO answer_counts (qid, key, label, seedw, count) VALUES (?, ?, ?, ?, 0) ON CONFLICT(qid, key) DO UPDATE SET label = excluded.label, seedw = excluded.seedw"
        )
        .bind(question.id, normalize(label), label, w)
    )
  );
}

export async function scoreAnswer({ db, question, answer, player, day }) {
  await ensureSeeded(db, question);
  const { results } = await db
    .prepare("SELECT key, label, seedw, count FROM answer_counts WHERE qid = ? AND seedw > 0 ORDER BY seedw DESC LIMIT 400")
    .bind(question.id)
    .all();
  const rows = results;
  const index = buildIndex(question, rows);
  const key = resolveKey(index, answer);
  if (key === null) return { rejected: "notlisted" }; // not one of the answers: the player just tries again

  const known = rows.find((r) => r.key === key);
  const lvl = levelFor(rows, key);
  const label = known ? known.label : answer.trim();

  // Count each player's answer once per question per day.
  const first = await db.prepare("INSERT OR IGNORE INTO plays (day, player, card) VALUES (?, ?, ?)").bind(day, player, question.id).run();
  if (first.meta.changes) {
    await db
      .prepare("INSERT INTO answer_counts (qid, key, label, seedw, count) VALUES (?, ?, ?, 0, 1) ON CONFLICT(qid, key) DO UPDATE SET count = count + 1")
      .bind(question.id, key, label)
      .run();
  }
  return { valid: true, level: lvl.id, pts: lvl.pts, label, top: topLabels(rows) };
}
