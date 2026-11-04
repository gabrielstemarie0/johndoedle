// Rate limits, counted in D1. Each judgement costs AI usage, so cap it per network address,
// per player id, and globally. A real player makes about 10 judgements a day.
export const LIMITS = {
  ipHour: 60, // per network address, per hour (shared wifi: a whole household or classroom)
  ipDay: 300, // per network address, per day
  playerDay: 30, // per player id, per day (the id is chosen by the browser, so this alone is easy to dodge)
  globalDay: 3000, // everyone, per day: a hard ceiling on AI spend
};

const pad = (n) => String(n).padStart(2, "0");
const dayOf = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

// Counts this request against every limit. Returns { ok: true } or { ok: false, retryAfter, which }.
export async function checkLimits(db, { ip, player, now = new Date() }) {
  const day = dayOf(now);
  const hour = `${day}T${pad(now.getUTCHours())}`;
  const checks = [
    { which: "ip-hour", key: `ip:${ip}`, bucket: `h:${hour}`, max: LIMITS.ipHour, resets: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1) },
    { which: "ip-day", key: `ip:${ip}`, bucket: `d:${day}`, max: LIMITS.ipDay, resets: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) },
    { which: "player-day", key: `player:${player}`, bucket: `d:${day}`, max: LIMITS.playerDay, resets: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) },
    { which: "global-day", key: "global", bucket: `d:${day}`, max: LIMITS.globalDay, resets: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) },
  ];
  const results = await db.batch(
    checks.map((c) =>
      db
        .prepare(
          "INSERT INTO rate_limits (key, bucket, day, count) VALUES (?, ?, ?, 1) ON CONFLICT(key, bucket) DO UPDATE SET count = count + 1 RETURNING count"
        )
        .bind(c.key, c.bucket, day)
    )
  );
  // Tidy up old counters now and then.
  if (Math.random() < 0.02) {
    const cutoff = dayOf(new Date(now.getTime() - 2 * 86400000));
    await db.prepare("DELETE FROM rate_limits WHERE day < ?").bind(cutoff).run();
  }
  for (let i = 0; i < checks.length; i++) {
    const count = results[i]?.results?.[0]?.count ?? 0;
    if (count > checks[i].max) {
      return { ok: false, which: checks[i].which, retryAfter: Math.max(1, Math.ceil((checks[i].resets - now.getTime()) / 1000)) };
    }
  }
  return { ok: true };
}
