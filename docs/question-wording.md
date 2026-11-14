# How to write the fancy wording (read this before writing any question)

## STANDING RULE: never disturb player progress (set by the owner, Nov 9, 2026)

Any update, by anyone or any scheduled task, must leave player engagement untouched:
- A player who already played today keeps that day's score, answers and result. Never reset, replay or rescore a finished day.
- A player's streak, cash balance (including debt) and owned cars/pieces/boxes must be identical before and after an update.
- Do not change saved-state keys or formats (localStorage state, `daily_scores`, `plays`) in a way that loses or alters them. Any change needs a migration that preserves values.
- Do not change today's already-scheduled questions or their answers or ranks mid-day (it would alter a game in progress).
- If a change WOULD alter a streak, a dollar value, or owned cars (for example a new economy rule), STOP and tell the owner first. Only proceed after they approve.


Every question has a plain prompt ("Name an NBA player") and a **fancy wording** that players actually see. The fancy wording
is the game: the player must **decode** it. If someone can read it and instantly know the category, it has failed.

## The rule

**Describe the category without naming it.** A player should need a few seconds of thinking, not zero. Medium difficulty:
an average adult gets it within about 5-10 seconds, with no niche knowledge.

## How to disguise a category

1. **Never use the category noun or its obvious relatives** (there is no banned-word list: judge each wording against these rules). For "NBA player" that means no *basketball, hoops, court, league,
   NBA, player, team, dunk*. For "US president" no *president, White House, Oval Office, election*. For "country in Asia" no
   *Asia, continent names, famous capitals*.
2. **No proper nouns that name the field** (Beijing, Tokyo, Springfield, Hollywood...). They hand over the answer.
3. **Describe it from an indirect angle** instead: what it does, what it looks like, what it is made of, where you meet it, what
   people do with it, what it replaced, or how it feels. Use a synonym ladder: swap each key word for a rarer description
   (a ball -> "a sphere", a sport -> "a contest", a singer -> "a vocalist", a movie -> "a motion picture").
4. **Keep it solvable, and don't lean toward the #1 answer.** A clever disguise, not a riddle that needs trivia. The plain question is shown after answering.
5. **Mechanical rules (the checker enforces these):** starts with Name / Cite / Identify / Specify, max 120 characters, and no
   word in the wording may appear in any listed answer (the game rejects answers using a clue word from the question). The category word of
   the plain prompt ("soup" in *Name a type of soup*) is exempt at play time: players may type "chicken noodle soup", and the game trims
   "soup" off before matching, so never add "... soup" aliases.

## Carry the qualifier: place, nationality, franchise (owner rule, Nov 14, 2026)

If the plain prompt limits the answers to a place or a people, the fancy wording must carry a **coded hint of that limit**, otherwise a
player cannot tell which set of answers is meant. Examples of qualifiers: **US / United States / American**, Europe, Asia, Africa,
a country, a state, a city. "Name a US state capital" became "a town housing a governor's mansion and the lawmakers' dome", which fits
any country, so players could not know it meant America.

- Say it with an indirect clue, not the word itself: "in the land of fifty stars", "under the stars and stripes", "across the American
  heartland" (the "American" word is fine in a wording when it is not an answer word), "west of the Urals", "the continent home to the
  Sahara and the Nile".
- The checker enforces this for the US: a plain prompt that contains "US", "U.S.", "USA", "United States", "America" or "American" fails
  unless the wording contains a US hint (America/American, United States, U.S., USA, fifty, stars and stripes, Uncle Sam, stateside,
  Yankee, star-spangled, bald eagle, Capitol Hill). For every other place, judge it yourself against this rule.
- Self-test: read ONLY the wording and ask "which country or region would I assume?" If the answer is "any", add a hint.

## Every day needs a music question (owner rule, Nov 12, 2026)

Each set of 7 must include **at least one music question**: a song (ranked by Spotify streams, see below), a singer, band, rapper,
guitarist or other musician, an instrument, a genre, an album, a composer or a Broadway musical. The checker fails any day from
Nov 13, 2026 on that has none. Nov 13 got q113 (guitarist) and Nov 14 got q114 (Broadway musical) in place of the car-model and
boat questions (q103, q112); those two are unused leftovers that a later night may schedule.

## Song questions: always say what the order is based on (owner rule, Nov 12, 2026)

Any question that asks for a song, track, single, tune, hit, carol or anthem **must state its ranking basis in brackets at the end of
BOTH the plain prompt and the fancy wording**, with the same text in both:

- **Default: order the answers by Spotify streams.** Rank the songs by their all-time Spotify stream counts (look them up each night,
  for example kworb.net's Spotify "streams" pages, Spotify's own "popular" lists or a web search; do not rank from memory) and end
  both texts with **(Spotify streams)**. Example plain prompt: `Name a Beatles song (Spotify streams)`; the fancy wording ends with the
  same `(Spotify streams)` and must still fit in 120 characters.
- **Or choose another basis on purpose** (for example "most iconic" or "most impactful" for a band whose biggest songs on Spotify are
  not the ones everyone thinks of), and then say so in the brackets instead: `(most iconic)`, `(most influential)`,
  `(most impactful)`, `(most famous)` or `(best known)`. Never leave the basis unstated.
- The checker (`scripts/check-questions.mjs`) fails any song question after q94 that is missing the bracket, has different brackets, or
  names no accepted basis. The bracket words are ignored by the "do not repeat the plain prompt's words" check.
- Why: q94 (Name a Beatles song, Nov 12) put "Hey Jude" first on gut feel about impact, but it is not the Beatles' most-streamed song on
  Spotify ("Here Comes the Sun" is). The ranking must be defensible, and the player must know which ranking is meant.

## Self-test before you save

Read ONLY the fancy wording. Ask: "Which category did I just say out loud?" If a word in it names the field, the sport, the
media or the answer type, rewrite it. Then ask: would a smart player still get it? If not, make it a little clearer.

## Examples

| Plain | Too obvious (don't) | Better |
|---|---|---|
| Name an NBA player | a professional basketball star who has played in the sport's top American league | a towering athlete famed for lofting an orange sphere through a suspended ring of netting |
| Name a US president | a former occupant of the White House's highest elected office | a past leader who swore an oath on the Capitol steps and then ran the republic |
| Name a country in Asia | a sovereign nation on the world's largest continent, home to Beijing and Tokyo | a sovereign nation within the largest of Earth's great landmasses |
| Name a type of cheese | a variety of dairy curd product that is aged, melted or crumbled | a pungent or creamy product of pressed, ripened milk curds (fine as it is: no key word is named) |

## Lessons from the owner (newest first). Add every new piece of feedback here.

- **2026-11-14, Name a US state capital (q108):** the wording "a town housing a governor's mansion and the lawmakers' dome" never
  signalled the United States, so players could not tell which capitals were meant. Whenever the plain prompt names a place or a
  people (US, Europe, Africa, a city...), the wording must carry a coded hint of it. See "Carry the qualifier" above.

- **2026-11-12, Name a Beatles song (q94):** the #1 answer ("Hey Jude") was chosen by impact, not by Spotify streams, and nothing told
  the player which ranking applied. From now on every song question orders its answers by Spotify streams and says **(Spotify
  streams)** in brackets beside the question, or it names another basis in the brackets. See "Song questions" above.

- **2026-11-09, Name a type of vehicle, second try:** "a conveyance that travels" was too simple. Neutral does not mean trivial:
  keep the wording free of hints toward the #1 answer (no "passengers", "cargo", "wheels"), but still disguise the category with
  an indirect description so the player has to think.

- **2026-11-09, Name a Taylor Swift song (Nov 10):** "an earworm by the star whose multi-era world tour broke every box-office
  record" gave the player no way to know it was about Taylor Swift. When the answers all belong to ONE specific person, brand or
  franchise, the wording must carry a **well-known fact that points to them without being too obvious** (not their name, and not
  a vague "famous star"). Test: would most people who know that person think of them from the clue alone?
- **2026-11-09, Name a type of dinosaur (Nov 11):** "prehistoric", "giant", "reptile" and "bones in stone" are each an easy hint
  to dinosaurs, and together they hand it over. **One era or anatomy word that maps straight to the answer set is already a
  giveaway; never stack them.** Use an indirect angle instead (for example a famous film or a cultural fact).
- **2026-11-09, Name a type of vehicle (Nov 11):** "passengers or cargo" points straight at the most common answer (car), so
  everyone says car. **Check the likely #1 answer: the wording must not push toward it.** Don't list uses or examples; keep a
  broad topic's wording short and neutral, like "a conveyance that travels".

- **2026-11-09, Name an NBA player:** the wording said "professional basketball star ... top American league", so the category
  was obvious and nothing was coded. Never name the sport or the field; describe the thing indirectly.


## Answer lists must be thorough (since Nov 9, 2026)

The game now accepts ONLY answers on a question's list (plus aliases and small typos). Anything else just shakes off. So a
missing answer is a frustrated player. For every question include every common answer, nicknames, abbreviations and alternate
spellings as aliases (for example "ac/dc|acdc"), and aim for well over 38 answers (50-60 where the topic allows).
