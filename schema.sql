-- Run once:  npx wrangler d1 execute johndoedle --remote --file=schema.sql

-- Answers for each question: seed answers (seedw > 0) plus the answers players have given.
CREATE TABLE IF NOT EXISTS answer_counts (
  qid    TEXT NOT NULL,
  key    TEXT NOT NULL,   -- normalised answer
  label  TEXT NOT NULL,   -- how to show it
  seedw  REAL NOT NULL DEFAULT 0,
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (qid, key)
);

-- One row per player per question per day, so retrying can't double count.
CREATE TABLE IF NOT EXISTS plays (
  day    TEXT NOT NULL,
  player TEXT NOT NULL,
  card   TEXT NOT NULL,   -- the question id (named "card" from an earlier version of the game)
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

-- One row per player per day: the day's answer total (before car, streak and planet bonuses), used for "you beat X% of players".
CREATE TABLE IF NOT EXISTS daily_scores (
  day    TEXT NOT NULL,
  player TEXT NOT NULL,
  score  INTEGER NOT NULL,
  PRIMARY KEY (day, player)
);
CREATE INDEX IF NOT EXISTS daily_scores_day ON daily_scores (day);
