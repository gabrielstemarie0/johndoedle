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
   word in the wording may appear in any listed answer (the game rejects answers using a word from the question).

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
