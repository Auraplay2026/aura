const fs = require('fs');
const path = require('path');

const providers = [
  "Pragmatic Play", "Evolution Gaming", "Hacksaw Gaming", "Play'n GO", "NoLimit City",
  "Push Gaming", "Relax Gaming", "NetEnt", "Red Tiger", "Big Time Gaming",
  "Blueprint", "Yggdrasil", "Quickspin", "Thunderkick", "ELK Studios"
];

const prefixes = ["Mega", "Super", "Ultra", "Epic", "Golden", "Lucky", "Wild", "Crazy", "Royal", "Magic", "Crystal", "Neon", "Cyber", "Mystic", "Cosmic", "Dragon", "Tiger", "Pharaoh", "Vegas"];
const suffixes = ["Ways", "Megaways", "Jackpot", "Deluxe", "Gold", "Spin", "Rush", "Quest", "Bonanza", "Party", "Legends", "Gods", "Heroes", "Dreams", "Riches", "Empire"];
const themes = ["Fruits", "Gems", "Diamonds", "7s", "Stars", "Joker", "Egypt", "Rome", "Aztec", "Olympus", "Pirates", "Vikings", "Ninja", "Samurai", "Aliens", "Zombies"];

const games = [];

for (let i = 1; i <= 5000; i++) {
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const theme = themes[Math.floor(Math.random() * themes.length)];
  const suffix = Math.random() > 0.5 ? " " + suffixes[Math.floor(Math.random() * suffixes.length)] : "";
  
  const title = `${prefix} ${theme}${suffix}`;
  const rtp = 92 + (Math.random() * 6); // 92.0% - 98.0%
  const players = Math.floor(Math.random() * 15000) + 50;

  // Use a unique, seeded Picsum image for EVERY game so they are 100% unique
  const image = `https://picsum.photos/seed/auracasino_${i}/500/500`;

  games.push({
    id: `ext-${i}`,
    title,
    provider,
    image,
    categories: ["slots", "external"],
    rtp: parseFloat(rtp.toFixed(2)),
    players,
    isExternal: true
  });
}

fs.writeFileSync(path.join(__dirname, '../lib/generatedGames.json'), JSON.stringify(games, null, 2));
console.log(`Generated ${games.length} unique external games.`);
