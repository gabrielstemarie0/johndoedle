# John Doedle

A daily game of 7 questions. Each question asks for something in fancy vocabulary (a pizza topping becomes "a savory garnish strewn atop a baked, saucy disc of cheesy dough"; `public/lib/fancy.js`) and you type the
answer **most people would give**. The more popular your answer, the more points you earn
and the further your car drives. Plain HTML/JS front end plus one Cloudflare Worker, with D1 for answer counts and
No build step.

```
public/                           the static game (served as Workers assets)
  index.html, styles.css, game.js   the page and game flow
  scene.js                        the third-person driving scene (canvas), the obstacle timer
  cars.js                         the car catalog and shop prices, and each car drawn from behind as SVG
  lib/questions.js, questions2.js the question banks (bank.js joins them): ranked answers with popularity weights
  lib/scoring.js                  levels, ranking, answer matching (shared by browser and server)
  lib/text.js                     normalising, typo tolerance, "is this a real answer"
src/worker.js                     routes POST /api/answer; everything else is served from public/
src/answer-server.js              D1 counts; accepts only listed answers
src/ratelimit.js                  per-IP / per-player / global request limits
schema.sql, wrangler.toml         D1 tables, bindings (DB, AI, ASSETS) and Worker config
```

## STANDING RULE: never disturb player progress (set by the owner, Nov 9, 2026)

Any update, by anyone or any scheduled task, must leave player engagement untouched:
- A player who already played today keeps that day's score, answers and result. Never reset, replay or rescore a finished day.
- A player's streak, cash balance (including debt) and owned cars/pieces/boxes must be identical before and after an update.
- Do not change saved-state keys or formats (localStorage state, `daily_scores`, `plays`) in a way that loses or alters them. Any change needs a migration that preserves values.
- Do not change today's already-scheduled questions or their answers or ranks mid-day (it would alter a game in progress).
- If a change WOULD alter a streak, a dollar value, or owned cars (for example a new economy rule), STOP and tell the owner first. Only proceed after they approve.

## How a round plays
You see the road from behind your car (third person, as if you were the driver). When a question starts, an
**farm animal** appears on the horizon (a bigger one each question: chicken, turkey, goat, sheep, pig, horse, cow). **Its distance is the timer**: it reaches your bumper when the 25 seconds are up,
and a red strip along your lane makes that easy to read. In the last second the animal looks scared; if it reaches you, the car turns red from the front backwards (seven levels, one per crash; 7 is the whole car) and the end-of-game scene cleans it off.
- **Score any dollars** and the car **swerves around** the obstacle with no damage. The harder you scored, the harder you
  boost (and the more nitro).
- **Run out of time** and you **crash** (an answer that isn't on the question's list never scores or crashes: it just shakes off and you keep trying): the car takes damage that
  stays for the rest of the day (cracked rear window, a dead tail light, smoke, a hanging bumper) and you earn $0. An
  unsubmitted answer doesn't count when time runs out.
- Crashes cost a repair bill that depends on the tier of the car you drive: every car in a tier pays the price of the cheapest
  car in it ($25 for the starter tier, then $199, $1,581, $7,488 and $35,460 for the top tier); the prices are in `public/cars.js` and shown on every shop card. When the last question is answered,
  an end-of-game scene plays on its own: your winnings (plus any streak bonus) count up, a side view of your car shows its
  damage, a cartoon scuffle cloud of cleaning supplies and gloved arms (with squeegee, spray and scrub sounds, mute button on
  the card) cleans the red off and repairs the car, and crashes × the repair price comes off your total. If the bill is bigger than your cash, **your cash goes
  negative** (you're in debt, shown as a negative amount) and your next winnings pay it off first. The results screen appears
  once the scene ends. Reloading skips the scene.

**Debt and collateral.** The first time your cash goes negative, a pop-up warns you: pay it off within a week or your car
is taken as collateral. The week starts the day you go below $0 (and resets if you climb back above $0). If you are still
below $0 when it ends, your most valuable car is sold (never the starter Rusty Hatchback, and it doesn't matter which car
you are driving, so switching to the starter car doesn't dodge it): your balance goes back to exactly $0, a "Thank you for
your donation! We are now equal. 😊" pop-up appears, and you keep playing in the car you were driving, or the most valuable
one you have left if the car taken was the one you were driving.
The warning pop-up only shows once, ever; the end screen always shows how many days are left.

## Scoring
Each question has ONE fixed ranking, set by the order I wrote its answers (`public/lib/bank.js` turns it into a strict
1, 2, 3... order with no ties). Player answers are still counted, but they never move an answer up or down, so the
John Doe for a question is always the same answer. An answer's **rank** sets its level:

| Level | Cash | Rank |
|---|---|---|
| 🟩 John Doe | 100 | #1 (only one answer) |
| 🟨 Average Joe | 85 | #2 to #4 (3 answers) |
| 🟧 Neighbor | 60 | #5 to #9 (5 answers) |
| 🟪 Stranger | 30 | #10 to #19 (10 answers) |
| 👽 Alien | 10 | every other answer on the list (#20 and down) |
| ⬛ Nothing | 0 | timed out with nothing real typed |

The amounts are Krillion's points (10/30/60/85/100, as listed by fan sites; check krillion.io if exact figures matter),
flipped so the most common answer is best, and counted in **dollars**. A perfect day is $700. 

Because tiers are by rank, a question needs at least 20 ranked answers for every level to be reachable (each of the
70 questions has 38 to 55). An answer that isn't on a question's list is never ranked, however many players give it,
so friends can't make up a "popular" answer: an unlisted answer is simply not accepted. Blank, symbol-only and one-character answers can't be
submitted (the field shakes and the timer keeps running).

## How an answer is scored (`/api/answer`)
Only answers on a question's list are accepted, so the only way to score nothing is to run out of time.
1. The browser first rejects things that can't be an answer (symbols, gibberish with no vowels, a clue word from the question) and
   anything that isn't on the question's list: the box clears, the bar shakes, a small label says why, and the clock keeps running.
2. The answer is normalised (case, punctuation, plurals) and matched against the question's answers and aliases. Typos are
   forgiven: 1 edit for answers of 4-7 letters, 2 for 8+, none for 3 or fewer.
3. The server repeats the same check (an unlisted answer returns `{"rejected":"notlisted"}`), finds the answer's fixed rank and
   level, and counts it once per player per question per day (`plays` table). No AI is used to judge answers any more.

Because nothing outside the list is accepted, **every question's answer list needs to be thorough**: all the common answers,
alternative names and spellings (as aliases).

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

**Car bonuses.** The equipped car adds a bonus to each round's total: Commuter +1%, Little Zippy +2%, Family Wagon +4%,
Work Pickup +8%, Street Coupe +17%, Muscle Machine +35%, Rally Beast +70%, Luxe Sedan +143%, Sports Car +289%, Supercar +588%,
Hypercar +1,194%, Rocket Car +2,424%, Golden Phantom +4,924%, Hover Car +10,000%. The Rusty Hatchback and the Big Green Tractor
give none. At the end of a round the order is: your answers, streak bonus, car bonus, planet bonus, then repairs.

**Planets.** The tractor is the prestige car. Once you own it, every perfect game (7/7 John Doe) fills a 10-game bar in the
shop. At 10/10 games a Reset button appears: it sends you back to day 1 with no money and only the starter car, on the next planet
(Mars, the Moon, Venus...). The planet number is the only thing kept. Each planet gives a new look to the road and +25% on all
winnings, permanently. Prices, bonuses and planets are in `public/cars.js` and `public/lib/planets.js`.

**Where you ranked.** After the repair, the end-of-game car fades into a see-through graph of the day's scores, and a line slides
across to where your score falls ("You beat 72% of players today"), with a whoosh sound. Each player's day total (answers only,
before car, streak and planet bonuses) is stored once in the `daily_scores` table through `POST /api/score`; the first score a
player sends for a day is the one kept. Until many people play, the real scores are blended with an estimated "typical player"
distribution (`public/lib/standing.js`), and the screen says so.

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
- **Link previews**: Open Graph and Twitter tags in `public/index.html` plus `public/og-image-v4.png` (1200x630, a staged
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
Based on the US Eastern date (the day rolls over at midnight in New York, EST or EDT). Everyone gets the same 7. The original 70 questions were used once over the first days (Nov 2-8, 2026); from Nov 9 every day has 7 brand-new
questions written the night before (`public/lib/schedule.js`, `daily-questions.js`, checked by `node scripts/check-questions.mjs`), so nothing repeats. To add a question, add it to `public/lib/questions2.js` (compact `build("q57", "Name a ...", "answer|alias,answer,...")`, most popular first; or append to `questions.js` as `[answer, weight, [aliases]]`) with the next id (`q57`, ...): a prompt such as
"Name a ..." and at least 40 answers as `[answer, weight, [aliases]]`, listed from most to least popular (the most
popular is 100; the weights only set the order). Fewer than 20 answers means the Stranger tier can't be filled.
Game #1 is `LAUNCH_DAY` in `public/game.js`.

## Known limits
- Popularity comes from the weights I wrote until enough players have answered; they are educated guesses.
- Rate limits slow scripted abuse but don't stop a determined attacker with many IP addresses; add Cloudflare
  Turnstile then.
- Streaks and progress live in the player's browser (`localStorage`).

**The category word is always allowed (Nov 13, 2026).** The "what is it" word of the plain prompt is not a clue, so an answer may
include it: for *Name a type of soup* you can type "chicken noodle soup" and it counts as "chicken noodle"; for *Name a US state*,
"Washington state" counts as "Washington". The words of the question (soup, state, Taylor Swift, Greek god) are trimmed off either
end of what you type before it is matched against the list, but never down to nothing ("soup" alone is still not an answer). Clue
words in the wording that are not the category (the "tomato" in "name something red like a tomato") stay blocked. The code is
`categoryHeads` and `promptWords` in `public/lib/text.js`, used by `buildIndex`/`resolveKey` in `public/lib/scoring.js` (browser and
Worker share it) and by `rejectReason` in `public/lib/rules.js`. List authors do not need to add "... soup" aliases.
