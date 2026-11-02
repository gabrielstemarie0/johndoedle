# John Doedle

A daily game of 7 cards. Each card shows an **answer** (say, "Pepperoni"). You write the **nichest question**
that has that answer, in 60 seconds. The rarer your question, the more points. Plain HTML/JS front end plus one
Cloudflare Worker (static assets + `/api/judge`), with D1 for counts and Workers AI for judging. No build step.

```
public/                           the static game (served as Workers assets)
  index.html, styles.css, game.js   the page
  lib/cards.js                    the deck: answer + seed questions with popularity weights
  lib/judge.js                    levels, popularity maths, similarity (shared by browser and server)
  lib/text.js                     text helpers and the "is this a real question" check
src/worker.js                     routes POST /api/judge; everything else is served from public/
src/judge-server.js               D1 + Workers AI judging
src/ratelimit.js                  per-IP / per-player / global request limits
schema.sql, wrangler.toml         D1 tables, bindings (DB, AI, ASSETS) and Worker config
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
0. A question that contains the answer ("What is a thing that is Gold?") is rejected straight away, with no AI call.
   The page shakes it off before submitting, and the server enforces it too.
1. The question is embedded with Workers AI (`@cf/baai/bge-base-en-v1.5`) and compared with the card's known
   questions. If it is close to one (0.80 similarity), it is treated as the same question and scored by that
   question's rarity.
2. Unless it is a near-exact copy of a seed question (0.95), a chat model (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, falling back to
   `llama-3.1-8b-instruct-fast`) returns one word: YES (a new question, so Alien), WRONG (the answer doesn't fit), or
   VAGUE (the answer fits but so do many others, or it's a yes/no or letter-game question). The prompt and examples
   are `JUDGE_RULES` in `src/judge-server.js`.
3. Valid questions are counted once per player per card per day (`plays` table).

The similarity cutoff in `public/lib/judge.js` (`DENSE`, 0.80) was measured on the live judge: paraphrases of a
question scored 0.83-0.99 and different valid questions 0.58-0.70. Re-check it if you change the embedding model.
Without an AI binding the server uses plain word overlap, and the browser falls back to word
overlap against the seed questions when the API is unreachable. That works for local testing, but it
will mark many genuinely new questions as Imposter.

## Deploy (Cloudflare Workers + GitHub)
This is a **Workers** project (not Pages). `wrangler.toml` describes everything, including the bindings.
1. Create the database and tables (already done for the `johndoedle` database in the config):
   ```
   npx wrangler d1 create johndoedle          # copy the database_id into wrangler.toml
   npx wrangler d1 execute johndoedle --remote --file=schema.sql
   ```
2. Cloudflare dashboard -> Workers & Pages -> Create -> Workers -> Import a repository, pick this repo.
   Leave the build command empty. The deploy command is `npx wrangler deploy`. The Worker name in
   `wrangler.toml` (`johndoedle`) must match the project name.
3. Every push to `main` redeploys. The site is at `https://johndoedle.<your-subdomain>.workers.dev`.

Local test: `npx wrangler d1 execute johndoedle --local --file=schema.sql`, then `npx wrangler dev --local`.
(Workers AI always calls your real account even locally; to use word-matching only, run with a copy of
`wrangler.toml` that has no `[ai]` section.)

## Daily cards
Based on the UTC date. Everyone gets the same 7. The deck is shuffled in cycles, so 135 cards give 19 days with
no repeats. To add a card, append to `public/lib/cards.js` with the next id (`a136`, ...): the answer plus about five
questions using the weight ladder 100, 55, 30, 14, 6 (obvious down to deep cut), so every card has a question in
each scoring band. Game #1 is `LAUNCH_DAY` in `public/game.js`.

## Rate limits (`src/ratelimit.js`)
Every `/api/judge` call that costs AI usage is counted in the `rate_limits` D1 table:

| Limit | Default |
|---|---|
| per network address, per hour | 60 |
| per network address, per day | 300 |
| per player id, per day | 30 |
| everyone, per day | 3000 |

A real player makes about 7 calls a day. When a limit is hit the API returns `429` with `Retry-After`, and the page
shows a message and lets the player try again while time remains (it does not fall back to the offline judge).
Counters reset each UTC hour/day. Change the numbers in `LIMITS`. If the counter itself fails the game keeps
working (it "fails open"). The player id is chosen by the browser, so the per-address and global limits are the
real protection. Add Cloudflare Turnstile if you ever see scripted abuse.

## Known limits
- The AI judge can be fooled or be wrong. Expect to tune the thresholds and prompt.
- Rate limits slow scripted abuse but don't stop a determined attacker with many IP addresses; add Turnstile then.
- Question vectors are stored as JSON in D1 and the 300 most relevant are loaded per judgement. That's fine for
  a hobby-scale game; move to Vectorize if it grows.
- Streaks and progress live in the player's browser (`localStorage`).
