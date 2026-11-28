# How to write the fancy wording (read this before writing any question)

## ANSWER ORDER: THE MOST COMMON ANSWER IS #1 (owner rule, Nov 17, 2026: read this twice, never break it)

The order of an answer list is **how often typical players would type each answer**, most common first. It is NOT: the best answer, the
newest, the most impressive, the one that fits the era word in the wording, or my taste. Rank #1 gets $100, so a wrong #1 shortchanges
every player. The q133 mistake (Mahomes #1, while 13 of 13 real players typed Brady) must never be repeated.

Do this for EVERY question, every night, before writing the list:

1. **First-guess test.** Imagine 100 random players, including teenagers, reading only the wording. Write down the ONE answer most of
   them would type first. That is #1. Write down the next nine they would type; those are #2-#10. Do this before looking at anything else.
2. **The famous name wins.** For people, brands, places and titles, the answer with the widest everyday fame stays #1 even if it is older
   or retired (Tom Brady, Tiger Woods, Beethoven, Freddie Mercury, Edison, Messi). Current or trending names go right behind it, not in
   front of it. An era word in the wording ("modern", "today's", "legendary") changes WHICH names are plausible, never who is the most
   famous. When torn between an older universal name and a newer trending one, the universal name goes first.
3. **Use real data, not memory.** Before ranking a people/brand list, run `SELECT qid, label, count FROM answer_counts WHERE count > 0
   ORDER BY qid, count DESC` (D1 tool) for earlier questions of the same kind and see what real players actually typed first; also check
   `misses` for what they typed that was not on a list. Real answers beat my assumptions. For songs use Spotify streams (below).
4. **Check #1 against the question's wording one last time.** Ask: "would the most typed answer to THIS exact wording be my #1?" If a
   different name is obviously what most people would say, swap them.
5. **Say it in the report.** For every question, the nightly report must list the #1 and a one-line reason ("most famous overall",
   "most streamed", "what 13 of 13 players typed on a similar question"). If the reason is "it is current/trending", that is the red flag:
   re-check rule 2.

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

## People and artists: say which kind of answer you want, inside the wording (owner rule, Nov 15, 2026)

**1. No brackets. Say it in the wording itself.** Any question about people or artists (a singer, vocalist, band, rapper, musician,
guitarist, composer, actor, athlete, player, golfer, quarterback, painter, scientist, inventor, comedian, director, author, chef,
president...) must make clear **which kind of answer is wanted**, using a word or phrase inside the fancy wording, subtly, without
giving the #1 away: "legendary", "all-time greats", "from the old masters to today's stars", "in the modern era", "chart-topping",
"old-school", "current", "bygone". Brackets are NOT used for this: the only thing allowed in brackets anywhere is **(Spotify streams)**
on a song question (see below). The checker enforces both from q122 on. Example from the owner: the Nov 15 country singer question
(Johnny Cash, Dolly Parton... on top) should have said something like "a legendary twang-master" or "a chart-topping star of today" in
the wording, or been ranked by current popularity.

**2. Think about who plays, but the most common answer still goes first.** The typical player is **younger** and follows **recent**
names, so after the universally famous #1 (see the answer-order rule at the top: the name most players type first stays #1, even if older
or retired), put the current stars that young players know right behind it, and let them fill the rest of the first 19 ahead of obscure
legends. For country: Johnny Cash or Dolly Parton may be the most typed #1 on a "legendary" list, while Morgan Wallen and Luke Combs
belong near the top of a "today's stars" list. Do not change the whole style of a list. The phrase in the wording tells the player which
list it is, but it never turns a newer name into the #1 just because it is newer.

## Typos are handled by the game; the nightly misses report (Nov 16, 2026)

- **Do not add misspellings as aliases.** The game accepts swapped letters, one mistake (4+ letters) and two mistakes (7+ letters), as long
  as one listed answer is clearly the closest ("morroco" counts as Morocco). Add aliases only for genuinely different names, nicknames,
  abbreviations or spellings ("bb king", "mcintosh|macintosh").
- **Misses report.** Every answer a player types that is not on the list is counted in the D1 table `misses (day, qid, answer, count)`.
  Each night, after the sample players, run (Cloudflare D1 tool, database e5eedb67-193f-401f-82e4-f17ad0602d90):
  `SELECT qid, answer, SUM(count) AS n FROM misses WHERE day = '<today ET, the day still in progress>' GROUP BY qid, answer HAVING n >= 2
  ORDER BY n DESC LIMIT 60`. For each row decide: a real answer the list was missing, a spelling the game should have accepted, or noise.
  Questions never repeat, so do not edit played questions. Instead list the notable misses in the nightly report, add a short lesson
  here when a pattern shows (for example "country singers: lists lacked X"), and write more thorough lists. Never delete misses rows.

## Partial answers and one-word names (owner rule, Nov 16, 2026)

- **"Be more specific".** If a player types only the first part of a listed answer ("Phil" for "Phil Mickelson", "grilled" for "grilled
  cheese"), the game shows "🔎 Be more specific: that's only part of an answer", shakes it off and keeps the clock running. It does not
  count. This is automatic for every question (`isPartial` in `public/lib/scoring.js`); nothing to write.
- **Add the one-word form as an alias when everyone really uses it alone.** A nickname or mononym that is specific on its own must be an
  alias so it counts: `tiger woods|tiger`, `shaquille o'neal|shaq`, `lebron james|lebron`, `beyonce`, `slash`. Ordinary first names
  (Phil, Jack, John, Tom) are NOT aliases: they stay "be more specific".
- **For people, also add the distinctive last name as an alias** (`phil mickelson|mickelson`, `rory mcilroy|mcilroy`) when no other
  answer in the list shares it; a surname alone is specific enough for most people.

## Gotcha: reordering an answer list after it has been tested (Nov 15, 2026)

The Worker stores each question's ranking in D1 (`answer_counts.seedw`) the first time the question is used, and only re-seeds when the
number of answers or their total weight changes. **Reordering answers keeps both the same, so the old order stays in the database**
(the nightly live test seeds it). If you ever reorder a question that was already tested or played, run
`DELETE FROM answer_counts WHERE qid IN (...)` for it, but only while its day has not started (a day in progress holds real players'
counts), then re-run the live test. Never edit the order of a question whose day is under way.

## Every day needs a music question (owner rule, Nov 12, 2026)

Each set of 7 must include **at least one music question**: a song (ranked by Spotify streams, see below), a singer, band, rapper,
guitarist or other musician, an instrument, a genre, an album, a composer or a Broadway musical. The checker fails any day from
Nov 13, 2026 on that has none. Nov 13 got q113 (guitarist) and Nov 14 got q114 (Broadway musical) in place of the car-model and
boat questions (q103, q112); those two are unused leftovers that a later night may schedule.

## Song questions: always say what the order is based on (owner rules, Nov 12 and Nov 15, 2026)

Any question that asks for a song, track, single, tune, hit, carol or anthem must make its ranking basis clear:

- **Default: order the answers by Spotify streams.** Rank the songs by their all-time Spotify stream counts (look them up each night,
  for example kworb.net's Spotify "streams" pages, Spotify's own "popular" lists or a web search; do not rank from memory) and end
  BOTH the plain prompt and the fancy wording with **(Spotify streams)**. Example plain prompt: `Name a Beatles song (Spotify
  streams)`; the wording ends with the same `(Spotify streams)` and must still fit in 120 characters. **This is the only bracket the
  game uses.**
- **Or rank on another basis on purpose** (for example the most iconic songs of a band whose biggest Spotify songs are not the ones
  everyone thinks of). Then there is no bracket: the wording itself says what the ranking is ("the most iconic...", "a timeless
  hit...", "a chart-topping smash of today...").
- The checker (`scripts/check-questions.mjs`) fails any song question after q94 that is half-bracketed (bracket in only one of the two
  texts) or, without the Spotify bracket, has no basis word in the wording; and it fails any other bracket anywhere from q95 on.
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

- **2026-11-27 real data (3-7 players per question):** matched: kangaroo 7 of 8, corn 6 of 7, jeans 4 of 5. Off: Adele q199 "Hello" 3, my streams-#1
  "Someone Like You" 1 (a third question in a row where players type the most iconic recent hit, not the most streamed one); Marvel villain q202 had
  Doctor Doom and Loki once each and my #1 Thanos 0; cartoon duo q205 "Batman and Robin" 3, my #1 Tom and Jerry 0 (players include live-action and
  comic duos, so for a "duo/couple/pair" question accept and rank famous pairs of any medium); baseball q201 had one answer (Ken Griffey Jr.). Misses:
  "pant" (5, the category word in the singular), "dress"/"skirt" (2 each, not pants), "joker" (2, a DC villain), "21" and "18" (Adele ALBUM
  titles typed as songs), "lion" and "steve": all noise.
- **2026-11-26 real data (Thanksgiving, very few players, 1-6 per question):** matched: Big Mac 6 of 6, Romeo and Juliet 4 of 5, Disney World 2 of 4,
  Vesuvius tied with Mount St. Helens (2 each, my #1 Vesuvius). Scattered (no first guess to compare): comedian (5 different names, one each),
  fictional cat (Cheshire Cat, Tigger, Tom: my #1 Garfield 0). Coldplay q192: "Wonderwall" (3) and "Don't Look Back in Anger" (2) were typed, which are
  OASIS songs: for a band question the wording must separate the band from other British bands (name a fact only that band has). Not enough data to
  conclude anything else.
- **2026-11-25 real data (another rough day: 4 of 7 first guesses off):** (1) **Famous street (q189): ZERO listed answers were typed.** Players typed
  "paris", "eiffel tower", "new york city", "nyc": the wording "a legendary thoroughfare worldwide that visitors snap photos of" read as a sightseeing
  question. Never use "worldwide", "visitors" or "photos" for a street/place list; say what a street is made of ("lined with ..."). (2) **Kitchen appliance
  (q186):** blender 3 and mixer 3, my #1 refrigerator 0: "plugs in or hums in a home chef's workspace" pointed to countertop gadgets. (3) **Wrestler
  (q187):** John Cena 3, my #1 Hulk Hogan 0: with "to today's roster" in the wording the mostly young players type the CURRENT star first (same as the DJ
  question q143). So when the wording says "today's", rank the current star #1; when it says "classic" or "legendary", rank the all-time name #1. This
  refines the Nov 17 rule: the era phrase in the wording does change who players type first. (4) Ties: Drake q185 One Dance 3 = God's Plan 3; beach
  q191 had 6 different beaches typed once each, so no #1 could be confirmed. Matched: cake chocolate 3 of 7, bear Winnie the Pooh 6 of 7.
- **2026-11-24 real data (a rough day: 4 of 7 first guesses off):** (1) **Famous poet (q182):** most players typed musicians (Mozart 4, Michael Jackson 3,
  Eminem, Jay-Z, Kanye, Taylor Swift 2 each) and only 1 typed a poet: the wording "a celebrated verse-writer, from the classic masters of the mic" is
  gone wrong: "masters", "voices" and "verse" read as songwriters. For writers say what they WRITE ON ("lines inked on pages", "stanzas and sonnets") and never
  borrow music words. (2) **Salty snack brand (q183):** Lay's 6, Doritos 1 (my #1): in a plain "brand of chips" question, Lay's is what players type first;
  check real data from similar brand questions before ranking Doritos. (3) **Billie Eilish (q178):** "bad guy" 6 vs my Spotify-streams #1 "Birds of a Feather"
  1: iconic beats most-streamed again, so for a song question prefer the bracket plus a wording hint when a newer track tops the streams. (4) **Famous ship
  (q184):** Mayflower 5, Titanic 4 (my #1): a US audience types the Pilgrim ship almost as often as Titanic, so a close call. Matched: glazed donut 4 of 6,
  dragon 4 of 9, skiing 7 of 10. Misses: "donut" (8, the category word) plus the musicians above.
- **2026-11-23 real data (Name a video game console, q174):** Xbox was typed 9 times and my #1 PlayStation 3 (12 players): the wording said "a plug-in-and-play
  box with joypads", and "box" steered players straight to Xbox. This is the q131 lesson again: a hint word in the wording ("box", "farm", "of today")
  moves the first guess, so test the first guess on the exact wording and, when the wording carries a word that echoes one answer, rank that answer first.
  The other six matched: Shape of You 6 of 9, Caesar 9 of 12, Hawaii 7 of 12, Sesame Street 5 of 7, Cinderella 4 of 9, ketchup 11 of 11.
  Misses were noise: "salad" (4, the category word) and "elmo" (2, a character, not a show).
- **2026-11-22 real data (best day so far, 5-9 players per question):** every most-typed answer matched my #1: Bohemian Rhapsody 4 of 5, chocolate
  chip 8 of 8, Sherlock Holmes 6 of 8, Niagara Falls 8 of 8, green tea 4 of 8, Empire State Building 4 of 6, Cinderella 2 of 5 (castle, a close
  call). The misses were the category word typed on its own ("castle" 4, "tea" 3, "cookie" 2) and noise ("plane"): nothing missing from the lists.
  What worked: stating the kind of answer in the wording and ranking the universally famous name first.
- **2026-11-21 real data (small samples, 4-9 players per question):** song question q157 (Michael Jackson, ranked by Spotify streams): "Thriller" was
  typed 3 times, "Billie Jean" (my #1, most streamed) 2 times: players type the most ICONIC song first, not the most streamed, so the Spotify rule
  deliberately costs a little here; the bracket in the wording is what tells them. q160 (Disney Channel): Jessie 2, my #1 Hannah Montana 0 of 4;
  with a tiny sample keep the answer that is famous across ages. The other five matched: apple 4 of 5, poker 5 of 6, karate 4 of 6, Scooby-Doo 2 of 5
  (tie-ish), Michigan 4 of 5. The only miss was "kickin it" (2), a Disney XD show, not Disney Channel.
- **2026-11-20 real data (Name a famous museum, q156):** The Met was typed 5 times and my #1 Louvre 3 (the Louvre is the most visited, but the
  players are mostly American and the wording carried no place). For a question with no stated country, the first guess of a mostly US audience
  wins: ask "what do Americans type first?", not "what is globally biggest". Also a tie: bird of prey (q154) eagle 4, hawk 4 (my #1 eagle). The other
  five matched: Coachella 6 of 8, Mona Lisa 7 of 9, Sahara 7 of 8, Gordon Ramsay 9 of 9, Rome 7 of 9. Misses: "desert" (4) and "italy" (2) were
  generic words, not answers.
- **2026-11-19 real data (Name a famous DJ, q143):** the most typed answer was John Summit (6 of 12) and my #1 David Guetta got 0, while
  Calvin Harris, Diplo and Marshmello got 2 each. The wording said "a headliner of today who makes festival crowds jump", and "of today" steered
  players to current names: for a trending field (DJs, YouTubers, rappers) the typed first answer follows the wording's era word, so test the
  first guess on the exact wording and put the current names first when the wording says "of today". The other 6 matched: sushi roll California
  roll (7 of 15), SpongeBob (11 of 17), Serena Williams (9 of 18), Gucci (10 of 14), Toronto (17 of 19), Naruto (9 of 14). Misses were generic
  words ("sushi", "canada", "anime", "tuna") or noise; "spicy tuna" is a real short form of "spicy tuna roll" worth an alias next time.
- **2026-11-18 real data (first full misses report):** the most-typed answer matched my #1 on all 7 questions (K-pop BTS 6 of 7, Netflix Stranger Things
  8 of 14, Mexican dish tacos 4 of 10, YouTuber MrBeast 11 of 12, Minecraft mob creeper 3 of 8, university Harvard 9 of 11; cat breed Siamese 2 of 3 is a
  tiny sample). Misses were mostly noise: "cat", "steve" and "dream" are not on-topic. "breaking bad" (6) was a real show but not a Netflix
  original: for streaming-service questions, say in the wording which kind of title is wanted or accept the big non-original hits.
- **2026-11-17 real data, Name a baby animal (q131) and Name a Christmas movie (q134):** my #1 was "puppy" but the most-typed answer was
  "calf" (7 of 17; puppy 1), because the wording said "a youngster of the wild or the farm" and that phrase steered players to farm
  animals. Run the first-guess test on the EXACT wording players read, not on the plain prompt: a hint word like "farm", "wild",
  "autumn", "streaming" or "celebrations" changes what people type first, so the #1 must be what THIS wording produces. Also
  q134: Elf (6) edged Home Alone (5), a near tie, so a close #1/#2 is worth a second look. Matching #1: rock vocalist (Mercury 5 of 7),
  sandwich (BLT 5 of 16), inventor (Edison 7 of 11), river (Nile 13 of 17), quarterback (Brady 18 of 19, while my #1 was Mahomes).
- **2026-11-18, misses logging:** the browser rejects not-listed answers itself, so the server never saw them and the `misses` table
  stayed empty. Fixed: the browser now reports each one (`/api/miss`, no player id). The misses report works from Nov 18 on.

- **2026-11-17, Name an NFL quarterback (q133), real data:** I put Patrick Mahomes #1 ("modern era", young players, recency), but 13 of 13
  real players typed Tom Brady first, so all of them got Average Joe instead of John Doe. Recency must not push the all-time face of a
  field out of #1: for a person list, the name an average player thinks of FIRST stays on top even when the wording says "modern" or
  "today" (Brady, Messi, Federer, Tiger Woods, Beethoven); put the current stars right behind it. Same day, the checks on the golfer
  (Tiger 14 of 16), composer (Beethoven 7 of 17), rock vocalist (Mercury 3 of 5) and inventor (Edison 4 of 7) all had the right #1.
  When in doubt, look at `answer_counts` for earlier people questions (`SELECT label, count FROM answer_counts WHERE qid = '...'`) to
  calibrate before choosing a #1.

- **2026-11-15, brackets:** the owner does not want brackets for anything except "(Spotify streams)". Put the clarification inside the
  wording itself, subtly, rather than in brackets.

- **2026-11-15, Name a country music singer (q115):** the top answers were all old legends, chosen from my own sense of fame, with no
  data and no hint in the question. Players skew young and know newer names; the question also gave no clue it wanted "og" artists.
  Fix: say the kind of answer wanted inside the wording (no brackets) for every people/artist question, and rank for the real audience.
  See "People and artists" above.

- **2026-11-14, Name a US state capital (q108):** the wording "a town housing a governor's mansion and the lawmakers' dome" never
  signalled the United States, so players could not tell which capitals were meant. Whenever the plain prompt names a place or a
  people (US, Europe, Africa, a city...), the wording must carry a coded hint of it. See "Carry the qualifier" above.

- **2026-11-12, Name a Beatles song (q94):** the #1 answer ("Hey Jude") was chosen by impact, not by Spotify streams, and nothing told
  the player which ranking applied. From now on every song question orders its answers by Spotify streams and says **(Spotify
  streams)** in brackets beside the question, or it says its basis inside the wording. See "Song questions" above.

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
