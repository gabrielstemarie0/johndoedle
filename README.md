# John Doedle

A daily game of 7 cards. Each card shows an **answer** (say, "Pepperoni"). You write the **nichest question**
that has that answer, in 40 seconds. The rarer your question, the more points. Plain HTML/JS front end plus one
Cloudflare Pages Function, with D1 for counts and Workers AI for judging. No build step.

```
index.html, styles.css, game.js   the game
lib/cards.js                      the deck: answer + seed questions with popularity weights
lib/judge.js                      levels, popularity maths, similarity (shared by browser and server)
lib/judge-server.js               D1 + Workers AI judging
lib/text.js                       text helpers and the "is this a real question" check
functions/api/judge.js            POST /api/judge
schema.sql, wrangler.toml         D1 tables and the DB and AI bindings
```

## Scoring
Every question is compared with the card's most-asked question (popularity = seed weights blended with
real player counts; live data takes over as more people play, weight `n / (n + 100)`).

| Level | Points | Rule (share / top share) |
|---|---|---|
| 👽 Alien | 100 | under 2%, or a valid question nobody has asked yet |
| 🟪 Stranger | 85 | 2% to under 10% |
| 🟧 Neighbor | 60 | 10% to under 25% |
| 🟨 Regular Joe | 30 | 25% to under 50% |
| 🟩 John Doe | 10 | 50% or more: the obvious question everyone asks |
| ❌ Imposter | 0 | the question doesn't lead to the answer |
| ⬛ Nothing | 0 | timed out with nothing real typed |

Points and the number of tiers follow Krillion (values as listed by fan sites; check krillion.io if exact
figures matter). A perfect run is 700 and nothing goes negative. Blank, symbol-only and one-word input can't be
submitted; the field shakes and the timer keeps running.

## How a question is judged (`/api/judge`)
1. The question is embedded with Workers AI (`@cf/baai/bge-base-en-v1.5`) and compared with the card's known
   questions. If it is close to one, it is treated as the same question and scored by that question's rarity.
2. If it is not close to a seed question, a small model (`@cf/meta/llama-3.1-8b-instruct`) is asked whether
   the answer is a correct response. NO means Imposter; YES means a new question, so Alien.
3. Valid questions are counted once per player per card per day (`plays` table).

The similarity thresholds in `lib/judge.js` (`DENSE`) are starting points; adjust them after you've seen real
questions. Without an AI binding the server uses plain word overlap, and the browser falls back to word
overlap against the seed questions when the API is unreachable. That works for local testing, but it
will mark many genuinely new questions as Imposter.

## Deploy (Cloudflare + GitHub)
1. Move this folder into its own GitHub repo (it should be the repo root).
2. Create the database and tables:
   ```
   npx wrangler d1 create johndoedle          # copy the database_id it prints
   npx wrangler d1 execute johndoedle --remote --file=schema.sql
   ```
3. Paste that `database_id` into `wrangler.toml` and commit it. The `DB` (D1) and `AI` (Workers AI) bindings
   are declared in that file, so Pages reads them from there. There is nothing to add on the dashboard's
   Bindings page, which is read-only when a `wrangler.toml` is present.
4. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> connect the GitHub repo.
   Framework preset: None, build command: empty, output directory: `/`.
5. Optional: add a custom domain.

## Daily cards
Based on the UTC date. Everyone gets the same 7. The deck is shuffled in cycles, so 35 cards give 5 days with
no repeats. To add a card, append to `lib/cards.js` with the next id (`a36`, ...): the answer plus about five
questions using the weight ladder 100, 55, 30, 14, 6 (obvious down to deep cut), so every card has a question in
each scoring band. Game #1 is
`LAUNCH_DAY` in `game.js`.

## Known limits
- The AI judge can be fooled or be wrong. Expect to tune the thresholds and prompt.
- Counts trust the server's judge, but players can still be spammed by scripted requests. Add Turnstile or
  rate limiting if it takes off.
- Question vectors are stored as JSON in D1 and the 300 most relevant are loaded per judgement. That's fine for
  a hobby-scale game; move to Vectorize if it grows.
- Streaks and progress live in the player's browser (`localStorage`).
