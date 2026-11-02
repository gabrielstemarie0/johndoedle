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
