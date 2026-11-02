// The daily question bank. Each question has ranked answers: [answer, weight, [aliases]].
// Weight is how popular the answer is (the most popular is 100). Typos and plurals are forgiven, so only
// list genuinely different spellings or names as aliases. Give every question answers across the whole range
// (a few very common, some common, some rare) so every level is reachable.
export default [
 {
  "id": "q01",
  "prompt": "Name a popular pizza topping",
  "answers": [
   [
    "pepperoni",
    100
   ],
   [
    "mushrooms",
    65
   ],
   [
    "sausage",
    50
   ],
   [
    "cheese",
    45,
    [
     "extra cheese"
    ]
   ],
   [
    "onions",
    42
   ],
   [
    "bacon",
    35
   ],
   [
    "olives",
    32,
    [
     "black olives"
    ]
   ],
   [
    "peppers",
    30,
    [
     "green peppers",
     "bell peppers"
    ]
   ],
   [
    "pineapple",
    38
   ],
   [
    "ham",
    28
   ],
   [
    "jalapenos",
    12
   ],
   [
    "spinach",
    8
   ],
   [
    "chicken",
    8
   ]
  ]
 },
 {
  "id": "q02",
  "prompt": "Name something that is red",
  "answers": [
   [
    "apple",
    60
   ],
   [
    "blood",
    35
   ],
   [
    "fire truck",
    30,
    [
     "firetruck"
    ]
   ],
   [
    "strawberry",
    35
   ],
   [
    "tomato",
    32
   ],
   [
    "rose",
    30
   ],
   [
    "stop sign",
    28
   ],
   [
    "ladybug",
    20,
    [
     "ladybird"
    ]
   ],
   [
    "cherry",
    20
   ],
   [
    "heart",
    22
   ],
   [
    "lipstick",
    10
   ],
   [
    "fire",
    15
   ]
  ]
 },
 {
  "id": "q03",
  "prompt": "Name a sandwich filling",
  "answers": [
   [
    "ham",
    70
   ],
   [
    "cheese",
    75
   ],
   [
    "turkey",
    55
   ],
   [
    "tuna",
    40
   ],
   [
    "peanut butter",
    45
   ],
   [
    "jelly",
    30,
    [
     "jam"
    ]
   ],
   [
    "bacon",
    38
   ],
   [
    "lettuce",
    25
   ],
   [
    "tomato",
    28
   ],
   [
    "egg",
    22,
    [
     "egg salad"
    ]
   ],
   [
    "chicken",
    30
   ],
   [
    "salami",
    12
   ]
  ]
 },
 {
  "id": "q04",
  "prompt": "Name a common household pet",
  "answers": [
   [
    "dog",
    100
   ],
   [
    "cat",
    95
   ],
   [
    "fish",
    40,
    [
     "goldfish"
    ]
   ],
   [
    "hamster",
    30
   ],
   [
    "rabbit",
    28,
    [
     "bunny"
    ]
   ],
   [
    "bird",
    25,
    [
     "parrot",
     "budgie"
    ]
   ],
   [
    "guinea pig",
    18
   ],
   [
    "turtle",
    15,
    [
     "tortoise"
    ]
   ],
   [
    "snake",
    10
   ],
   [
    "lizard",
    8
   ]
  ]
 },
 {
  "id": "q05",
  "prompt": "Name a Disney movie",
  "answers": [
   [
    "frozen",
    70
   ],
   [
    "lion king",
    65
   ],
   [
    "moana",
    40
   ],
   [
    "aladdin",
    42
   ],
   [
    "cinderella",
    38
   ],
   [
    "the little mermaid",
    40,
    [
     "little mermaid"
    ]
   ],
   [
    "beauty and the beast",
    36
   ],
   [
    "toy story",
    30
   ],
   [
    "snow white",
    28
   ],
   [
    "bambi",
    20
   ],
   [
    "mulan",
    22
   ],
   [
    "tangled",
    25
   ],
   [
    "finding nemo",
    25
   ],
   [
    "dumbo",
    12
   ]
  ]
 },
 {
  "id": "q06",
  "prompt": "Name something you do first thing in the morning",
  "answers": [
   [
    "brush teeth",
    75,
    [
     "brush my teeth",
     "brushing teeth"
    ]
   ],
   [
    "wake up",
    40
   ],
   [
    "make coffee",
    45,
    [
     "drink coffee",
     "coffee"
    ]
   ],
   [
    "shower",
    50,
    [
     "take a shower",
     "have a shower"
    ]
   ],
   [
    "use the bathroom",
    40,
    [
     "go to the bathroom",
     "pee",
     "toilet"
    ]
   ],
   [
    "check phone",
    45,
    [
     "look at phone",
     "check my phone"
    ]
   ],
   [
    "eat breakfast",
    35,
    [
     "breakfast"
    ]
   ],
   [
    "stretch",
    20
   ],
   [
    "get dressed",
    25
   ],
   [
    "make bed",
    15,
    [
     "make the bed"
    ]
   ],
   [
    "yawn",
    8
   ]
  ]
 },
 {
  "id": "q07",
  "prompt": "Name a country in Europe",
  "answers": [
   [
    "france",
    80
   ],
   [
    "germany",
    75
   ],
   [
    "italy",
    70
   ],
   [
    "spain",
    65
   ],
   [
    "united kingdom",
    50,
    [
     "uk",
     "england",
     "britain",
     "great britain"
    ]
   ],
   [
    "greece",
    35
   ],
   [
    "sweden",
    25
   ],
   [
    "norway",
    22
   ],
   [
    "portugal",
    25
   ],
   [
    "poland",
    22
   ],
   [
    "ireland",
    30
   ],
   [
    "netherlands",
    25,
    [
     "holland"
    ]
   ],
   [
    "switzerland",
    20
   ],
   [
    "belgium",
    14
   ]
  ]
 },
 {
  "id": "q08",
  "prompt": "Name a fast food restaurant",
  "answers": [
   [
    "mcdonalds",
    100,
    [
     "mcdonald's",
     "macdonalds",
     "maccas"
    ]
   ],
   [
    "burger king",
    70
   ],
   [
    "wendys",
    50,
    [
     "wendy's"
    ]
   ],
   [
    "kfc",
    55,
    [
     "kentucky fried chicken"
    ]
   ],
   [
    "taco bell",
    50
   ],
   [
    "subway",
    50
   ],
   [
    "chick fil a",
    35,
    [
     "chickfila"
    ]
   ],
   [
    "pizza hut",
    30
   ],
   [
    "dominos",
    25,
    [
     "domino's"
    ]
   ],
   [
    "popeyes",
    15
   ],
   [
    "five guys",
    15
   ],
   [
    "in n out",
    10,
    [
     "in-n-out"
    ]
   ],
   [
    "arbys",
    10,
    [
     "arby's"
    ]
   ]
  ]
 },
 {
  "id": "q09",
  "prompt": "Name a breakfast food",
  "answers": [
   [
    "cereal",
    60
   ],
   [
    "eggs",
    70,
    [
     "egg",
     "scrambled eggs"
    ]
   ],
   [
    "bacon",
    60
   ],
   [
    "pancakes",
    58,
    [
     "pancake"
    ]
   ],
   [
    "toast",
    50
   ],
   [
    "waffles",
    40,
    [
     "waffle"
    ]
   ],
   [
    "oatmeal",
    32,
    [
     "porridge",
     "oats"
    ]
   ],
   [
    "bagel",
    28
   ],
   [
    "yogurt",
    25,
    [
     "yoghurt"
    ]
   ],
   [
    "sausage",
    25
   ],
   [
    "fruit",
    18
   ],
   [
    "muffin",
    12
   ],
   [
    "croissant",
    10
   ]
  ]
 },
 {
  "id": "q10",
  "prompt": "Name a type of weather",
  "answers": [
   [
    "rain",
    90
   ],
   [
    "snow",
    75
   ],
   [
    "sunny",
    70,
    [
     "sun",
     "sunshine"
    ]
   ],
   [
    "windy",
    50,
    [
     "wind"
    ]
   ],
   [
    "cloudy",
    50,
    [
     "clouds",
     "cloud"
    ]
   ],
   [
    "storm",
    40,
    [
     "thunderstorm",
     "stormy"
    ]
   ],
   [
    "fog",
    30,
    [
     "foggy"
    ]
   ],
   [
    "hail",
    25
   ],
   [
    "hurricane",
    15
   ],
   [
    "tornado",
    15
   ],
   [
    "sleet",
    8
   ],
   [
    "drizzle",
    8
   ]
  ]
 },
 {
  "id": "q11",
  "prompt": "Name a board game",
  "answers": [
   [
    "monopoly",
    100
   ],
   [
    "scrabble",
    60
   ],
   [
    "chess",
    58
   ],
   [
    "clue",
    45,
    [
     "cluedo"
    ]
   ],
   [
    "risk",
    35
   ],
   [
    "checkers",
    30,
    [
     "draughts"
    ]
   ],
   [
    "uno",
    20
   ],
   [
    "battleship",
    30
   ],
   [
    "sorry",
    22
   ],
   [
    "trouble",
    8
   ],
   [
    "jenga",
    25
   ],
   [
    "catan",
    20,
    [
     "settlers of catan"
    ]
   ],
   [
    "connect four",
    20,
    [
     "connect 4"
    ]
   ],
   [
    "life",
    25,
    [
     "game of life"
    ]
   ]
  ]
 },
 {
  "id": "q12",
  "prompt": "Name a superhero",
  "answers": [
   [
    "superman",
    85
   ],
   [
    "batman",
    95
   ],
   [
    "spiderman",
    85,
    [
     "spider man",
     "spider-man"
    ]
   ],
   [
    "iron man",
    50,
    [
     "ironman"
    ]
   ],
   [
    "wonder woman",
    42
   ],
   [
    "hulk",
    40,
    [
     "the hulk"
    ]
   ],
   [
    "thor",
    30
   ],
   [
    "captain america",
    38
   ],
   [
    "flash",
    20,
    [
     "the flash"
    ]
   ],
   [
    "black panther",
    22
   ],
   [
    "aquaman",
    18
   ],
   [
    "wolverine",
    14
   ],
   [
    "deadpool",
    12
   ]
  ]
 },
 {
  "id": "q13",
  "prompt": "Name a US state",
  "answers": [
   [
    "california",
    80
   ],
   [
    "texas",
    75
   ],
   [
    "florida",
    70
   ],
   [
    "new york",
    70
   ],
   [
    "alaska",
    30
   ],
   [
    "hawaii",
    32
   ],
   [
    "ohio",
    25
   ],
   [
    "nevada",
    20
   ],
   [
    "arizona",
    20
   ],
   [
    "georgia",
    18
   ],
   [
    "washington",
    18
   ],
   [
    "michigan",
    15
   ],
   [
    "colorado",
    18
   ]
  ]
 },
 {
  "id": "q14",
  "prompt": "Name something you find in a kitchen",
  "answers": [
   [
    "fridge",
    70,
    [
     "refrigerator"
    ]
   ],
   [
    "oven",
    60
   ],
   [
    "sink",
    58
   ],
   [
    "stove",
    55
   ],
   [
    "microwave",
    50
   ],
   [
    "knife",
    40,
    [
     "knives"
    ]
   ],
   [
    "table",
    20
   ],
   [
    "plate",
    30,
    [
     "plates"
    ]
   ],
   [
    "spoon",
    25
   ],
   [
    "toaster",
    25
   ],
   [
    "kettle",
    20
   ],
   [
    "dishwasher",
    25
   ],
   [
    "pan",
    25,
    [
     "pans",
     "frying pan"
    ]
   ],
   [
    "pot",
    25,
    [
     "pots"
    ]
   ],
   [
    "whisk",
    10
   ],
   [
    "colander",
    8,
    [
     "strainer"
    ]
   ]
  ]
 },
 {
  "id": "q15",
  "prompt": "Name a musical instrument",
  "answers": [
   [
    "piano",
    90
   ],
   [
    "guitar",
    95
   ],
   [
    "drums",
    70,
    [
     "drum"
    ]
   ],
   [
    "violin",
    55
   ],
   [
    "flute",
    40
   ],
   [
    "trumpet",
    38
   ],
   [
    "saxophone",
    30,
    [
     "sax"
    ]
   ],
   [
    "cello",
    20
   ],
   [
    "clarinet",
    22
   ],
   [
    "harp",
    15
   ],
   [
    "trombone",
    18
   ],
   [
    "bass",
    12
   ],
   [
    "ukulele",
    12
   ],
   [
    "harmonica",
    10
   ]
  ]
 },
 {
  "id": "q16",
  "prompt": "Name a sport played with a ball",
  "answers": [
   [
    "football",
    75,
    [
     "soccer"
    ]
   ],
   [
    "basketball",
    80
   ],
   [
    "baseball",
    60
   ],
   [
    "tennis",
    55
   ],
   [
    "golf",
    45
   ],
   [
    "volleyball",
    40
   ],
   [
    "rugby",
    30
   ],
   [
    "cricket",
    30
   ],
   [
    "hockey",
    15
   ],
   [
    "netball",
    12
   ],
   [
    "handball",
    10
   ],
   [
    "softball",
    18
   ],
   [
    "badminton",
    5
   ],
   [
    "pool",
    12,
    [
     "billiards"
    ]
   ]
  ]
 },
 {
  "id": "q17",
  "prompt": "Name a type of tree",
  "answers": [
   [
    "oak",
    90
   ],
   [
    "pine",
    70
   ],
   [
    "maple",
    55
   ],
   [
    "birch",
    35
   ],
   [
    "willow",
    30,
    [
     "weeping willow"
    ]
   ],
   [
    "palm",
    35,
    [
     "palm tree"
    ]
   ],
   [
    "apple",
    28,
    [
     "apple tree"
    ]
   ],
   [
    "elm",
    20
   ],
   [
    "cedar",
    22
   ],
   [
    "redwood",
    15
   ],
   [
    "cherry",
    18
   ],
   [
    "fir",
    15
   ],
   [
    "spruce",
    15
   ],
   [
    "beech",
    10
   ]
  ]
 },
 {
  "id": "q18",
  "prompt": "Name something people lose",
  "answers": [
   [
    "keys",
    80,
    [
     "car keys"
    ]
   ],
   [
    "phone",
    55
   ],
   [
    "wallet",
    50
   ],
   [
    "socks",
    35,
    [
     "sock"
    ]
   ],
   [
    "glasses",
    30,
    [
     "sunglasses"
    ]
   ],
   [
    "weight",
    25
   ],
   [
    "umbrella",
    12
   ],
   [
    "remote",
    20,
    [
     "tv remote"
    ]
   ],
   [
    "hair",
    20
   ],
   [
    "temper",
    14
   ],
   [
    "game",
    14
   ],
   [
    "money",
    30
   ],
   [
    "pen",
    15,
    [
     "pens"
    ]
   ],
   [
    "their mind",
    8,
    [
     "mind"
    ]
   ]
  ]
 },
 {
  "id": "q19",
  "prompt": "Name a flower",
  "answers": [
   [
    "rose",
    100,
    [
     "roses"
    ]
   ],
   [
    "tulip",
    55
   ],
   [
    "daisy",
    50
   ],
   [
    "sunflower",
    50
   ],
   [
    "lily",
    42
   ],
   [
    "orchid",
    30
   ],
   [
    "daffodil",
    30
   ],
   [
    "carnation",
    18
   ],
   [
    "violet",
    15
   ],
   [
    "poppy",
    20
   ],
   [
    "lavender",
    20
   ],
   [
    "marigold",
    12
   ],
   [
    "lotus",
    12
   ],
   [
    "peony",
    12
   ]
  ]
 },
 {
  "id": "q20",
  "prompt": "Name a car brand",
  "answers": [
   [
    "ford",
    80
   ],
   [
    "toyota",
    80
   ],
   [
    "honda",
    60
   ],
   [
    "chevrolet",
    50,
    [
     "chevy"
    ]
   ],
   [
    "bmw",
    55
   ],
   [
    "mercedes",
    55,
    [
     "mercedes benz",
     "mercedes-benz"
    ]
   ],
   [
    "audi",
    42
   ],
   [
    "tesla",
    45
   ],
   [
    "volkswagen",
    40,
    [
     "vw"
    ]
   ],
   [
    "nissan",
    35
   ],
   [
    "hyundai",
    25
   ],
   [
    "kia",
    20
   ],
   [
    "jeep",
    18
   ],
   [
    "porsche",
    22
   ],
   [
    "ferrari",
    30
   ],
   [
    "volvo",
    14
   ]
  ]
 },
 {
  "id": "q21",
  "prompt": "Name a social media app",
  "answers": [
   [
    "instagram",
    85
   ],
   [
    "facebook",
    85
   ],
   [
    "tiktok",
    75
   ],
   [
    "twitter",
    55,
    [
     "x"
    ]
   ],
   [
    "snapchat",
    60
   ],
   [
    "youtube",
    35
   ],
   [
    "pinterest",
    25
   ],
   [
    "linkedin",
    22
   ],
   [
    "reddit",
    25
   ],
   [
    "whatsapp",
    25
   ],
   [
    "threads",
    10
   ],
   [
    "discord",
    18
   ],
   [
    "tumblr",
    8
   ],
   [
    "bluesky",
    6
   ]
  ]
 },
 {
  "id": "q22",
  "prompt": "Name a cartoon character",
  "answers": [
   [
    "mickey mouse",
    90
   ],
   [
    "bugs bunny",
    55
   ],
   [
    "spongebob",
    70,
    [
     "spongebob squarepants",
     "sponge bob"
    ]
   ],
   [
    "donald duck",
    45
   ],
   [
    "scooby doo",
    50,
    [
     "scooby-doo",
     "scooby"
    ]
   ],
   [
    "tom",
    20,
    [
     "tom and jerry"
    ]
   ],
   [
    "homer simpson",
    40,
    [
     "homer"
    ]
   ],
   [
    "daffy duck",
    25
   ],
   [
    "goofy",
    30
   ],
   [
    "popeye",
    14
   ],
   [
    "winnie the pooh",
    25,
    [
     "pooh"
    ]
   ],
   [
    "pikachu",
    20
   ],
   [
    "snoopy",
    18
   ],
   [
    "fred flintstone",
    10,
    [
     "fred"
    ]
   ]
  ]
 },
 {
  "id": "q23",
  "prompt": "Name a vegetable",
  "answers": [
   [
    "carrot",
    80,
    [
     "carrots"
    ]
   ],
   [
    "broccoli",
    70
   ],
   [
    "potato",
    55
   ],
   [
    "tomato",
    40
   ],
   [
    "lettuce",
    35
   ],
   [
    "onion",
    40
   ],
   [
    "spinach",
    35
   ],
   [
    "corn",
    38
   ],
   [
    "cucumber",
    25
   ],
   [
    "peas",
    28,
    [
     "pea"
    ]
   ],
   [
    "celery",
    20
   ],
   [
    "cauliflower",
    22
   ],
   [
    "cabbage",
    20
   ],
   [
    "pepper",
    22
   ],
   [
    "zucchini",
    15,
    [
     "courgette"
    ]
   ]
  ]
 },
 {
  "id": "q24",
  "prompt": "Name something you find at the beach",
  "answers": [
   [
    "sand",
    100
   ],
   [
    "shells",
    55,
    [
     "seashell",
     "seashells",
     "shell"
    ]
   ],
   [
    "waves",
    40,
    [
     "wave"
    ]
   ],
   [
    "water",
    40,
    [
     "sea",
     "ocean"
    ]
   ],
   [
    "umbrella",
    35,
    [
     "beach umbrella"
    ]
   ],
   [
    "towel",
    30,
    [
     "towels"
    ]
   ],
   [
    "crab",
    28,
    [
     "crabs"
    ]
   ],
   [
    "seagull",
    25,
    [
     "seagulls",
     "gull"
    ]
   ],
   [
    "surfboard",
    18
   ],
   [
    "sunscreen",
    20,
    [
     "sun cream",
     "suncream"
    ]
   ],
   [
    "bucket",
    15
   ],
   [
    "lifeguard",
    14
   ],
   [
    "seaweed",
    14
   ],
   [
    "sunbed",
    5,
    [
     "sun lounger"
    ]
   ]
  ]
 },
 {
  "id": "q25",
  "prompt": "Name a type of pasta",
  "answers": [
   [
    "spaghetti",
    100
   ],
   [
    "penne",
    55
   ],
   [
    "macaroni",
    50
   ],
   [
    "lasagna",
    50,
    [
     "lasagne"
    ]
   ],
   [
    "fettuccine",
    42,
    [
     "fettuccini",
     "fettucine"
    ]
   ],
   [
    "linguine",
    20
   ],
   [
    "ravioli",
    35
   ],
   [
    "tortellini",
    25
   ],
   [
    "rigatoni",
    22
   ],
   [
    "farfalle",
    15,
    [
     "bow tie",
     "bowtie"
    ]
   ],
   [
    "fusilli",
    20
   ],
   [
    "orzo",
    8
   ],
   [
    "angel hair",
    15,
    [
     "capellini"
    ]
   ]
  ]
 },
 {
  "id": "q26",
  "prompt": "Name something you take on vacation",
  "answers": [
   [
    "suitcase",
    50,
    [
     "luggage",
     "bags",
     "bag"
    ]
   ],
   [
    "clothes",
    60
   ],
   [
    "sunscreen",
    45,
    [
     "suncream",
     "sun cream"
    ]
   ],
   [
    "phone",
    50
   ],
   [
    "camera",
    40
   ],
   [
    "passport",
    50
   ],
   [
    "swimsuit",
    35,
    [
     "swimwear",
     "bathing suit",
     "swimming costume",
     "bikini"
    ]
   ],
   [
    "sunglasses",
    35
   ],
   [
    "toothbrush",
    30
   ],
   [
    "charger",
    20
   ],
   [
    "book",
    18
   ],
   [
    "towel",
    15
   ],
   [
    "money",
    20
   ],
   [
    "hat",
    12
   ]
  ]
 },
 {
  "id": "q27",
  "prompt": "Name a famous landmark",
  "answers": [
   [
    "eiffel tower",
    100
   ],
   [
    "statue of liberty",
    75
   ],
   [
    "big ben",
    50
   ],
   [
    "great wall of china",
    50,
    [
     "great wall"
    ]
   ],
   [
    "pyramids",
    50,
    [
     "pyramid",
     "great pyramid"
    ]
   ],
   [
    "colosseum",
    42,
    [
     "coliseum"
    ]
   ],
   [
    "taj mahal",
    40
   ],
   [
    "golden gate bridge",
    35,
    [
     "golden gate"
    ]
   ],
   [
    "mount rushmore",
    22
   ],
   [
    "stonehenge",
    25
   ],
   [
    "leaning tower of pisa",
    30,
    [
     "tower of pisa"
    ]
   ],
   [
    "empire state building",
    28
   ],
   [
    "sydney opera house",
    20
   ],
   [
    "machu picchu",
    18
   ]
  ]
 },
 {
  "id": "q28",
  "prompt": "Name an ice cream flavor",
  "answers": [
   [
    "vanilla",
    100
   ],
   [
    "chocolate",
    95
   ],
   [
    "strawberry",
    65
   ],
   [
    "mint chocolate chip",
    35,
    [
     "mint chip",
     "mint choc chip"
    ]
   ],
   [
    "cookie dough",
    30
   ],
   [
    "rocky road",
    25
   ],
   [
    "cookies and cream",
    32,
    [
     "cookies n cream",
     "cookie and cream"
    ]
   ],
   [
    "butter pecan",
    15
   ],
   [
    "pistachio",
    18
   ],
   [
    "coffee",
    14
   ],
   [
    "caramel",
    18
   ],
   [
    "neapolitan",
    8
   ],
   [
    "rum raisin",
    5
   ]
  ]
 },
 {
  "id": "q29",
  "prompt": "Name a farm animal",
  "answers": [
   [
    "cow",
    100
   ],
   [
    "pig",
    90
   ],
   [
    "chicken",
    85
   ],
   [
    "sheep",
    75
   ],
   [
    "horse",
    70
   ],
   [
    "goat",
    50
   ],
   [
    "duck",
    40
   ],
   [
    "turkey",
    28
   ],
   [
    "donkey",
    26
   ],
   [
    "rooster",
    18,
    [
     "cockerel"
    ]
   ],
   [
    "llama",
    8
   ],
   [
    "goose",
    12
   ],
   [
    "rabbit",
    8
   ]
  ]
 },
 {
  "id": "q30",
  "prompt": "Name a holiday people celebrate",
  "answers": [
   [
    "christmas",
    100
   ],
   [
    "halloween",
    65
   ],
   [
    "easter",
    60
   ],
   [
    "thanksgiving",
    55
   ],
   [
    "new years",
    50,
    [
     "new year",
     "new years eve",
     "new year's"
    ]
   ],
   [
    "fourth of july",
    30,
    [
     "4th of july",
     "independence day"
    ]
   ],
   [
    "valentines day",
    40,
    [
     "valentine's day",
     "valentines"
    ]
   ],
   [
    "birthday",
    25
   ],
   [
    "hanukkah",
    18
   ],
   [
    "diwali",
    14
   ],
   [
    "st patricks day",
    14,
    [
     "st patrick's day",
     "saint patricks day"
    ]
   ],
   [
    "mothers day",
    12,
    [
     "mother's day"
    ]
   ],
   [
    "labor day",
    8
   ]
  ]
 },
 {
  "id": "q31",
  "prompt": "Name a school subject",
  "answers": [
   [
    "math",
    100,
    [
     "maths",
     "mathematics"
    ]
   ],
   [
    "english",
    80
   ],
   [
    "science",
    75
   ],
   [
    "history",
    70
   ],
   [
    "geography",
    45
   ],
   [
    "art",
    50
   ],
   [
    "pe",
    40,
    [
     "gym",
     "physical education"
    ]
   ],
   [
    "music",
    38
   ],
   [
    "biology",
    25
   ],
   [
    "chemistry",
    25
   ],
   [
    "physics",
    22
   ],
   [
    "spanish",
    18
   ],
   [
    "french",
    14
   ],
   [
    "computer science",
    12,
    [
     "ict",
     "computing"
    ]
   ]
  ]
 },
 {
  "id": "q32",
  "prompt": "Name something you wear on your feet",
  "answers": [
   [
    "shoes",
    100,
    [
     "shoe"
    ]
   ],
   [
    "socks",
    95,
    [
     "sock"
    ]
   ],
   [
    "sneakers",
    55,
    [
     "trainers",
     "sneaker"
    ]
   ],
   [
    "boots",
    50,
    [
     "boot"
    ]
   ],
   [
    "sandals",
    42,
    [
     "sandal"
    ]
   ],
   [
    "slippers",
    38,
    [
     "slipper"
    ]
   ],
   [
    "flip flops",
    32,
    [
     "flip-flops",
     "flipflops"
    ]
   ],
   [
    "heels",
    30,
    [
     "high heels"
    ]
   ],
   [
    "cleats",
    8,
    [
     "football boots"
    ]
   ],
   [
    "crocs",
    12
   ],
   [
    "stockings",
    6,
    [
     "tights"
    ]
   ]
  ]
 },
 {
  "id": "q33",
  "prompt": "Name a type of bird",
  "answers": [
   [
    "eagle",
    60
   ],
   [
    "robin",
    55
   ],
   [
    "sparrow",
    42
   ],
   [
    "owl",
    60
   ],
   [
    "crow",
    45
   ],
   [
    "parrot",
    40
   ],
   [
    "pigeon",
    35
   ],
   [
    "seagull",
    30,
    [
     "gull"
    ]
   ],
   [
    "duck",
    30
   ],
   [
    "penguin",
    40
   ],
   [
    "hawk",
    28
   ],
   [
    "blue jay",
    20,
    [
     "bluejay"
    ]
   ],
   [
    "cardinal",
    22
   ],
   [
    "hummingbird",
    30
   ],
   [
    "flamingo",
    18
   ],
   [
    "swan",
    18
   ],
   [
    "ostrich",
    8
   ],
   [
    "peacock",
    10
   ]
  ]
 },
 {
  "id": "q34",
  "prompt": "Name a hot drink",
  "answers": [
   [
    "coffee",
    100
   ],
   [
    "tea",
    90
   ],
   [
    "hot chocolate",
    65,
    [
     "hot cocoa",
     "cocoa"
    ]
   ],
   [
    "latte",
    30
   ],
   [
    "cappuccino",
    25
   ],
   [
    "espresso",
    20
   ],
   [
    "chai",
    12
   ],
   [
    "hot toddy",
    6
   ],
   [
    "mocha",
    10
   ],
   [
    "herbal tea",
    12
   ],
   [
    "milk",
    8,
    [
     "hot milk",
     "warm milk"
    ]
   ],
   [
    "apple cider",
    6
   ]
  ]
 },
 {
  "id": "q35",
  "prompt": "Name a Harry Potter character",
  "answers": [
   [
    "harry potter",
    90,
    [
     "harry"
    ]
   ],
   [
    "hermione granger",
    80,
    [
     "hermione"
    ]
   ],
   [
    "ron weasley",
    70,
    [
     "ron"
    ]
   ],
   [
    "dumbledore",
    65,
    [
     "albus dumbledore"
    ]
   ],
   [
    "voldemort",
    60,
    [
     "lord voldemort"
    ]
   ],
   [
    "snape",
    50,
    [
     "severus snape"
    ]
   ],
   [
    "hagrid",
    45,
    [
     "rubeus hagrid"
    ]
   ],
   [
    "draco malfoy",
    35,
    [
     "draco"
    ]
   ],
   [
    "sirius black",
    25,
    [
     "sirius"
    ]
   ],
   [
    "neville longbottom",
    18,
    [
     "neville"
    ]
   ],
   [
    "luna lovegood",
    20,
    [
     "luna"
    ]
   ],
   [
    "dobby",
    18
   ],
   [
    "mcgonagall",
    15,
    [
     "professor mcgonagall"
    ]
   ]
  ]
 }
];
