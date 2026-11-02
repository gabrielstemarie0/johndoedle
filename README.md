# John Doedle

A daily game of 7 questions. Each question asks for something ("Name a popular pizza topping") and you type the
answer **most people would give**. The more popular your answer, the more points you earn, the more gas you get
and the further your car drives. Plain HTML/JS front end plus one Cloudflare Worker, with D1 for answer counts and
Workers AI for checking unfamiliar answers. No build step.

```
public/                           the static game (served as Workers assets)
  index.html, styles.css, game.js   the page and game flow
  scene.js                        the full-screen driving scene and gas gauge, drawn with SVG/CSS
  lib/questions.js                the question bank: ranked answers with popularity weights
  lib/scoring.js                  levels, popularity maths, answer matching (shared by browser and server)
  lib/text.js                     normalising, typo tolerance, "is this a real answer"
src/worker.js                     routes POST /api/answer; everything else is served from public/
src/answer-server.js              D1 counts + Workers AI checks
src/ratelimit.js                  per-IP / per-player / global request limits
schema.sql, wrangler.toml         D1 tables, bindings (DB, AI, ASSETS) and Worker config
```

## Scoring
Each answer's popularity is compared with the question's most popular answer (popularity = the weights in
`questions.js` blended with real players' answers; live data takes over as more people play, weight `n / (n + 100)`).

| Level | Points | Spaces | Rule (share / top share) |
|---|---|---|---|
| 🟩 John Doe | 100 | 5 | 70% or more: the top answer |
| 🟨 Average Joe | 85 | 4 | 40% to under 70% |
| 🟧 Neighbor | 60 | 3 | over 20% to under 40% |
| 🟪 Stranger | 30 | 2 | known, but 20% or less |
| 👽 Alien | 10 | 1 | a valid answer nobody else gives |
| ❌ Imposter | 0 | 0 | the answer doesn't fit the question |
| ⬛ Nothing | 0 | 0 | timed out with nothing real typed |

Points are Krillion's (10/30/60/85/100, as listed by fan sites; check krillion.io if exact figures matter), flipped so
the most common answer is best. A perfect run is 700 points. **Spaces** are how far the car drives after each answer,
like Krillion's dive depth: 5 for a John Doe down to 1 for an Alien, so seven John Does reach the 35-space finish
line. Gas is points: 700 fills the tank.

An answer only counts as "known" if it is on the seed list or at least 3 players have given it, so friends can't
make up a "popular" answer. Blank, symbol-only and one-character answers can't be submitted (the field shakes and the
timer keeps running).

## How an answer is scored (`/api/answer`)
1. The answer is normalised (case, punctuation, plurals) and matched against the question's known answers and aliases.
   Typos are forgiven: 1 edit for answers of 4-7 letters, 2 for 8+, none for 3 or fewer. Known answers never touch the AI.
2. If it isn't known, a chat model (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, falling back to
   `llama-3.1-8b-instruct-fast`) says whether it is a real answer to the question and gives it a short canonical name,
   so "extra cheese" and "cheese" merge. Not valid = Imposter (0). Valid but new = Alien (10).
3. Valid answers are counted once per player per question per day (`plays` table). If the AI is down, the answer is
   accepted but not counted.

Without an AI binding (local dev) unfamiliar answers are accepted as written. If the API is unreachable the browser
scores offline against the seed answers only.

## Rate limits (`src/ratelimit.js`)
Every `/api/answer` call is counted in the `rate_limits` D1 table:

| Limit | Default |
|---|---|
| per network address, per hour | 60 |
| per network address, per day | 300 |
| per player id, per day | 30 |
| everyone, per day | 3000 |

A real player makes 7 calls a day. When a limit is hit the API returns `429` with `Retry-After`, and the page shows a
message and lets the player try again while time remains. Counters reset each UTC hour/day. Change the numbers in `LIMITS`.

## Player features
- **How to play** dialog (the `?` button). It opens automatically the first time someone presses Start. The header
  buttons are disabled while a question is being timed, so they can't be used to stall the clock.
- **Stats** dialog (the chart button): games played, average, best, streak, a bar chart of the last 14 games and how
  often the player got each level. Computed from this browser's saved games only.
- **Link previews**: Open Graph and Twitter tags in `public/index.html` plus `public/og-image.png` (1200x630). The tag
  URLs are absolute, so update them if you add a custom domain.
- The scene is decorative (hidden from screen readers; the gas gauge is a labelled meter) and goes still when the
  device asks for reduced motion.

## Deploy (Cloudflare Workers + GitHub)
This is a **Workers** project (not Pages). `wrangler.toml` describes everything, including the bindings.
1. Create the database and tables:
   ```
   npx wrangler d1 create johndoedle          # copy the database_id into wrangler.toml
   npx wrangler d1 execute johndoedle --remote --file=schema.sql
   ```
2. Cloudflare dashboard -> Workers & Pages -> Create -> Workers -> Import a repository, pick this repo.
   Leave the build command empty. The deploy command is `npx wrangler deploy`. The Worker name in
   `wrangler.toml` (`johndoedle`) must match the project name.
3. Every push to `main` redeploys. If one ever doesn't, check Settings -> Builds for a "disconnected from your Git
   account" banner and use Manage to re-grant the Cloudflare GitHub app access.

Local test: `npx wrangler d1 execute johndoedle --local --file=schema.sql`, then `npx wrangler dev --local`.

## Daily questions
Based on the UTC date. Everyone gets the same 7. The bank is shuffled in cycles, so 35 questions give 5 days with no
repeats. To add a question, append to `public/lib/questions.js` with the next id (`q36`, ...): a prompt such as
"Name a ..." and about 10-14 answers as `[answer, weight, [aliases]]`, where the most popular answer is 100. Give each
question answers across the whole range (a few common, some middling, some rare) so every level is reachable.
Game #1 is `LAUNCH_DAY` in `public/game.js`.

## Known limits
- Popularity comes from the weights I wrote until enough players have answered; they are educated guesses.
- Rate limits slow scripted abuse but don't stop a determined attacker with many IP addresses; add Cloudflare
  Turnstile then.
- Streaks and progress live in the player's browser (`localStorage`).
