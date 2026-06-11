const fs = require('fs');
const path = require('path');

const NUM_GAMES = 5000;

const PROVIDERS = [
  "Pragmatic Play", "Evolution", "Hacksaw Gaming", "NoLimit City", 
  "Push Gaming", "Play'n GO", "NetEnt", "Red Tiger", "Relax Gaming", 
  "Spribe", "SoftSwiss", "Aura Studios"
];

const CATEGORIES = {
  slots: ["slots"],
  live: ["live", "shows"],
  table: ["live", "table"],
  blackjack: ["live", "table", "blackjack"],
  roulette: ["live", "table", "roulette"],
  baccarat: ["live", "table", "baccarat"],
  crash: ["crash"],
  poker: ["poker", "table"]
};

const THEMES = ["Megaways", "1000", "Xtreme", "Gold", "Deluxe", "Pro", "VIP", "Lightning", "Speed", "Classic"];
const NOUNS = ["Dog", "Cat", "Zeus", "Hades", "Dragon", "Princess", "Sugar", "Fruit", "Candy", "Gem", "Book", "Dead", "Fishing", "Cash", "Coin", "Money", "Wolf", "Tiger", "Ape"];
const ACTIONS = ["Rush", "House", "Bonanza", "Time", "Party", "Drop", "Pop", "Quest", "Storm", "Strike"];

const IMAGES = {
  slots: [
    "/games/pragmatic_vs20sugarrushx.jpg", 
    "/games/pragmatic_vs20starlightx.jpg", 
    "/games/pragmatic_vswaysmadame.jpg", 
    "/games/pragmatic_vswaysdogs.jpg",
    "/games/slot_cover_sweet.png",
    "/games/slot_cover_olympus.png",
    "/games/slot_cover_book.png",
    "/games/softswiss_GemhallaXtreme-3ffHDvSVA.jpeg"
  ],
  live: [
    "/games/evo_lightning-storm-EuSGqjpLa.jpeg",
    "/games/evo_crazy-pachinko-IZFn5hYjG.jpeg",
    "/games/evo_funky-time-cxwqMBoVg.jpeg",
    "/games/live_cover_crazy.png"
  ],
  table: [
    "/games/evo_roobet-baccarat-A-h7jSd7C.jpeg",
    "/games/evo_speed-roulette-8a6GEiAUC.jpeg"
  ],
  crash: [
    "/games/spribe_aviator-7zuT5hj-B.jpeg",
    "/games/softswiss_Aviamasters2-OPwO5jn6K.jpeg"
  ]
};

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTitle(type) {
  if (type === 'slots') {
    return `${randomElement(NOUNS)} ${randomElement(ACTIONS)} ${Math.random() > 0.5 ? randomElement(THEMES) : ''}`.trim();
  } else if (type === 'crash') {
    return `${randomElement(["Space", "Aero", "Sky", "Rocket", "Jet"])} ${randomElement(["Crash", "Rider", "Fly", "X"])}`;
  } else {
    return `${randomElement(["Speed", "VIP", "Lightning", "Aura"])} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  }
}

const games = [];

for (let i = 0; i < NUM_GAMES; i++) {
  // Determine game type distribution
  const rand = Math.random();
  let type = "slots";
  if (rand > 0.8) type = "live";
  if (rand > 0.85) type = "blackjack";
  if (rand > 0.90) type = "roulette";
  if (rand > 0.95) type = "crash";

  const categories = CATEGORIES[type] || ["slots"];
  
  // Pick image array based on category
  let imageArr = IMAGES.slots;
  if (categories.includes("live")) imageArr = IMAGES.live;
  if (categories.includes("table")) imageArr = IMAGES.table;
  if (categories.includes("crash")) imageArr = IMAGES.crash;

  games.push({
    id: `gen-${type}-${i}`,
    title: generateTitle(type),
    provider: randomElement(PROVIDERS),
    image: randomElement(imageArr),
    categories: categories,
    isNew: Math.random() > 0.8,
    rtp: parseFloat((92 + Math.random() * 7).toFixed(2)),
    players: Math.floor(Math.random() * 50000)
  });
}

// Ensure uniqueness in titles if possible
const uniqueGames = [];
const titles = new Set();
for (const g of games) {
  let title = g.title;
  let count = 1;
  while (titles.has(title)) {
    title = `${g.title} ${count++}`;
  }
  titles.add(title);
  g.title = title;
  uniqueGames.push(g);
}

fs.writeFileSync(
  path.join(__dirname, '../lib/generatedGames.json'),
  JSON.stringify(uniqueGames, null, 2)
);

console.log(`Generated ${uniqueGames.length} games to lib/generatedGames.json`);
