-- Run once:  npx wrangler d1 execute johndoedle --remote --file=schema.sql
-- (If you created the earlier version of this game's tables, drop them first.)
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS submissions;

-- One row per distinct question asked for a card. Seed questions get seedw > 0.
CREATE TABLE IF NOT EXISTS qclusters (
  card  TEXT NOT NULL,
  key   TEXT NOT NULL,
  text  TEXT NOT NULL,
  vec   TEXT NOT NULL,           -- JSON: AI embedding (or word list in fallback mode)
  seedw REAL NOT NULL DEFAULT 0,
  prior REAL NOT NULL DEFAULT 0,  -- AI's starting rarity weight for questions players made
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (card, key)
);
-- One row per player per card per day, so retrying can't double count.
CREATE TABLE IF NOT EXISTS plays (
  day    TEXT NOT NULL,
  player TEXT NOT NULL,
  card   TEXT NOT NULL,
  PRIMARY KEY (day, player, card)
);

-- Request counters for rate limiting (per IP, per player, global; per hour and per day).
CREATE TABLE IF NOT EXISTS rate_limits (
  key    TEXT NOT NULL,
  bucket TEXT NOT NULL,
  day    TEXT NOT NULL,
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, bucket)
);

-- Existing database (made before `prior` existed):
--   ALTER TABLE qclusters ADD COLUMN prior REAL NOT NULL DEFAULT 0;
--   UPDATE qclusters SET prior = 14 WHERE seedw = 0 AND prior = 0;
