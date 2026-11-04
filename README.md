# John Doedle

A daily game of 10 questions. Each question asks for something in fancy vocabulary (a pizza topping becomes "a savory garnish strewn atop a baked, saucy disc of cheesy dough"; `public/lib/fancy.js`) and you type the
answer **most people would give**. The more popular your answer, the more points you earn
and the further your car drives. Plain HTML/JS front end plus one Cloudflare Worker, with D1 for answer counts and
Workers AI for checking unfamiliar answers. No build step.

```
public/                           the static game (served as Workers assets)
  index.html, styles.css, game.js   the page and game flow
  scene.js                        the third-person driving scene (canvas), the obstacle timer
  cars.js                         the car catalog and shop prices, and each car drawn from behind as SVG
  lib/questions.js, questions2.js the question banks (bank.js joins them): ranked answers with popularity weights
  lib/scoring.js                  levels, ranking, answer matching (shared by browser and server)
  lib/text.js                     normalising, typo tolerance, "is this a real answer"
src/worker.js                     routes POST /api/answer; everything else is served from public/
src/answer-server.js              D1 counts + Workers AI checks
src/ratelimit.js                  per-IP / per-player / global request limits
schema.sql, wrangler.toml         D1 tables, bindings (DB, AI, ASSETS) and Worker config
```

## How a round plays
You see the road from behind your car (third person, as if you were the driver). When a question starts, an
**obstacle** appears on the horizon. **Its distance is the timer**: it reaches your bumper when the 25 seconds are up,
and a hazard sign plus a red strip along your lane make that easy to read.
- **Score any dollars** and the car **swerves around** the obstacle with no damage. The harder you scored, the harder you
  boost (and the more nitro).
- **Score nothing** (an answer that doesn't fit) or **run out of time** and you **crash**: the car takes damage that
  stays for the rest of the day (cracked rear window, a dead tail light, smoke, a hanging bumper) and you earn $0. An
  unsubmitted answer doesn't count when time runs out.
- Crashes cost $25 each. When the last question is answered, an end-of-game scene plays on its own: your winnings (plus any
  streak bonus) count up with a flourish, a side view of your car shows its damage, a cartoon scuffle cloud full of tools and a mechanic's arms and boots (with tool sounds, mute button on the card) repairs the car, and
  crashes × $25 comes off your total. If you have less cash than the bill, the garage takes what you have and writes off the
  rest, so you never get stuck. The results screen appears once the scene ends. Reloading skips the scene.

## Scoring
Each question has ONE fixed ranking, set by the order I wrote its answers (`public/lib/bank.js` turns it into a strict
1, 2, 3... order with no ties). Player answers are still counted, but they never move an answer up or down, so the
John Doe for a question is always the same answer. An answer's **rank** sets its level:

| Level | Cash | Rank |
|---|---|---|
| 🟩 John Doe | 100 | #1 (only one answer) |
| 🟨 Average Joe | 85 | #2 to #6 (5 answers) |
| 🟧 Neighbor | 60 | #7 to #16 (10 answers) |
| 🟪 Stranger | 30 | #17 to #36 (20 answers) |
| 👽 Alien | 10 | any other real answer |
| ❌ Imposter | 0 | the answer doesn't fit the question |
| ⬛ Nothing | 0 | timed out with nothing real typed |

The amounts are Krillion's points (10/30/60/85/100, as listed by fan sites; check krillion.io if exact figures matter),
flipped so the most common answer is best, and counted in **dollars**. A perfect day is $1,000. 

Because tiers are by rank, a question needs at least 37 ranked answers for every level to be reachable (each of the
70 questions has 38 to 55). An answer that isn't on a question's list is never ranked, however many players give it,
so friends can't make up a "popular" answer: a real unlisted answer is an Alien. Blank, symbol-only and one-character answers can't be
submitted (the field shakes and the timer keeps running).

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

A real player makes 10 calls a day. When a limit is hit the API returns `429` with `Retry-After`, and the page shows a
message and lets the player try again while time remains. Counters reset each UTC hour/day. Change the numbers in `LIMITS`.

## Cash, the car shop and puzzle pieces
Every dollar you earn adds to your **cash**, day after day. Spend it in the **Shop** (the yellow button in the header, plus a
big button on the start and results screens). Cars are sorted under the answer levels: cheap starters are Aliens and the
absurd ones are John Does. Each car also needs a number of **puzzle pieces** to unlock it without paying:

| Level | Car | Price | Pieces |
|---|---|---|---|
| 🟩 John Doe | Hover Car | $150M | 6 |
| 🟩 John Doe | Big Green Tractor | $1B | 7 |
| 🟨 Average Joe | Hypercar | $1.20M | 5 |
| 🟨 Average Joe | Rocket Car | $6.50M | 6 |
| 🟨 Average Joe | Golden Phantom | $30M | 6 |
| 🟧 Neighbor | Luxe Sedan | $55,000 | 4 |
| 🟧 Neighbor | Sports Car | $110,000 | 5 |
| 🟧 Neighbor | Supercar | $280,000 | 5 |
| 🟪 Stranger | Work Pickup | $3,000 | 3 |
| 🟪 Stranger | Street Coupe | $6,500 | 3 |
| 🟪 Stranger | Muscle Machine | $14,000 | 4 |
| 🟪 Stranger | Rally Beast | $28,000 | 5 |
| 👽 Alien | Rusty Hatchback (starter) | Free | 2 |
| 👽 Alien | Commuter | $350 | 2 |
| 👽 Alien | Little Zippy | $800 | 3 |
| 👽 Alien | Family Wagon | $1,500 | 3 |

**Streak rewards.** Finish a game and come back the next day (a one-day streak doesn't count) and the day starts with two
rewards: a **cash bonus** on that day's earnings (+10% on day 2, +5% more each day, up to +50%) and a **mystery box**. A box
holds one puzzle piece of a random *level*, not of a particular car; put it toward any car of that level in the shop. The
pricier a level's cars, the rarer its pieces: Alien 50%, Stranger 28%, Neighbor 14%, Average Joe 6%, John Doe 2%. Miss a day
and the streak (and the bonus) resets.

Cash is derived from every game saved in this browser (lifetime earnings minus what you've spent), so it can't
double count. It lives in `localStorage` only: it doesn't follow you to another device or browser, and anyone who
edits their own browser storage can give themselves money. That's fine for a casual game, but it means there is no
real economy to protect. Prices live in `public/cars.js`.

## Player features
- **How to play** dialog (the `?` button). It opens automatically the first time someone presses Start. The header
  buttons (including the shop) are disabled while a question is being timed, so they can't be used to stall the clock.
- **Stats** dialog (the chart button): games played, average, best, streak, a bar chart of the last 14 games and how
  often the player got each level, plus lifetime earnings and crashes. Computed from this browser's saved games only.
- **Link previews**: Open Graph and Twitter tags in `public/index.html` plus `public/og-image.png` (1200x630, a staged
  screenshot of the game). The tag URLs are absolute, so update them if you add a custom domain.
- The scene is hidden from screen readers (the numeric countdown and the result text carry the same
  information). With reduced motion the road stops scrolling and there is no shake, smoke or boost; the obstacle
  still approaches, because it is the timer.

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
Based on the UTC date. Everyone gets the same 10. The bank is shuffled in cycles, so 70 questions give 7 days with no
repeats. To add a question, add it to `public/lib/questions2.js` (compact `build("q57", "Name a ...", "answer|alias,answer,...")`, most popular first; or append to `questions.js` as `[answer, weight, [aliases]]`) with the next id (`q57`, ...): a prompt such as
"Name a ..." and at least 40 answers as `[answer, weight, [aliases]]`, listed from most to least popular (the most
popular is 100; the weights only set the order). Fewer than 37 answers means the Stranger tier can't be filled.
Game #1 is `LAUNCH_DAY` in `public/game.js`.

## Known limits
- Popularity comes from the weights I wrote until enough players have answered; they are educated guesses.
- Rate limits slow scripted abuse but don't stop a determined attacker with many IP addresses; add Cloudflare
  Turnstile then.
- Streaks and progress live in the player's browser (`localStorage`).
