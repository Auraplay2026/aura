const fs = require('fs');
const https = require('https');
const path = require('path');

const games = [
  { id: "fps-1", url: "https://images.crazygames.com/games/krunker-io/cover-1588265007077.png" },
  { id: "fps-2", url: "https://images.crazygames.com/games/venge-io/cover-1601625902047.png" },
  { id: "fps-3", url: "https://images.crazygames.com/1v1-lol_16x9/20240905105216/1v1-lol-cover" },
  { id: "fps-4", url: "https://images.crazygames.com/shellshockersio/cover-1588843265743.png" },
  { id: "fps-5", url: "https://images.crazygames.com/games/smash-karts/cover-1621503932857.png" },
  { id: "driving-1", url: "https://images.crazygames.com/games/slow-roads/cover-1681729486581.png" },
  { id: "driving-2", url: "https://images.crazygames.com/games/madalin-stunt-cars-2/cover-1583232822473.png" },
  { id: "driving-3", url: "https://images.crazygames.com/games/dashcraft-io/cover-1644315264878.png" },
  { id: "action-1", url: "https://images.crazygames.com/games/hole-io/cover-1583231174668.png" },
  { id: "action-2", url: "https://images.crazygames.com/games/paper-io-2/cover-1583231498114.png" },
  { id: "action-3", url: "https://images.crazygames.com/games/slither-io/cover-1583233860537.png" },
  { id: "action-4", url: "https://images.crazygames.com/games/agario/cover-1583233852084.png" },
  { id: "puzzle-1", url: "https://images.crazygames.com/games/2048/cover-1583231011881.png" },
  { id: "puzzle-2", url: "https://images.crazygames.com/games/flappy-bird/cover-1583231641014.png" },
  { id: "funny-1", url: "https://images.crazygames.com/games/qwop/cover-1583232360580.png" },
  { id: "funny-2", url: "https://images.crazygames.com/games/doge-miner-2/cover-1583232049102.png" },
  { id: "boring-1", url: "https://images.crazygames.com/games/cookie-clicker/cover-1583231626573.png" }
];

const dir = path.join(__dirname, 'public', 'games');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (const game of games) {
    const dest = path.join(dir, `${game.id}.png`);
    console.log(`Downloading ${game.url} to ${dest}...`);
    
    try {
      const response = await fetch(game.url + '?auto=format,compress&q=75&cs=strip', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.crazygames.com/',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to download ${game.id}: ${response.statusText}`);
        continue;
      }
      
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(buffer));
      console.log(`Successfully saved ${game.id}.png`);
    } catch (e) {
      console.error(`Error downloading ${game.id}:`, e);
    }
  }
}

download();
