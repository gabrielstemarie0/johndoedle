// Daily score board: each player's total for the day, so the end screen can show where they rank.
export async function recordScore(db, { day, player, score }) {
  // first submission wins: replaying or reloading can't change a score
  await db.prepare("INSERT OR IGNORE INTO daily_scores (day, player, score) VALUES (?, ?, ?)").bind(day, player, score).run();
  const { results } = await db.prepare("SELECT score, COUNT(*) AS n FROM daily_scores WHERE day = ? GROUP BY score").bind(day).all();
  const counts = {};
  let n = 0;
  for (const r of results) { counts[r.score] = r.n; n += r.n; }
  const mine = await db.prepare("SELECT score FROM daily_scores WHERE day = ? AND player = ?").bind(day, player).first();
  return { n, counts, score: mine ? mine.score : score };
}
