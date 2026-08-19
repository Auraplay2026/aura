const fs = require('fs');
const path = require('path');

const USERNAMES = [
    "CryptoWhale", "Anon_77", "VIP_Diamond", "LuckBox", "SatoshiFan",
    "MumbaiKing", "DelhiBull", "GoaHighRoller", "GoldDigger", "ApexPredator",
    "RajaBetting", "JackpotGuru", "SlotWizard", "CrorepathiPro", "TokenLord",
    "DeltaWhale", "AlphaVIP", "GigaChancer", "Ruler777", "HighStakeHustler"
];

const CLOUD_GAMES = [
  "Cyberpunk 2077", "Elden Ring", "Black Myth: Wukong", 
  "Spider-Man 2", "Grand Theft Auto V", "Red Dead Redemption 2", 
  "Hogwarts Legacy", "Baldur's Gate 3", "Forza Horizon 5", 
  "Civilization VI"
];

const CASINO_GAMES = [
  "Crash", "Limbo", "Plinko", "Mines", "Dice", "Keno", 
  "Chicken Game", "Sweet Bonanza", "Gates of Olympus", "Crazy Time"
];

const DATA_DIR = path.join(__dirname, "..", "data");
const FILE_PATH = path.join(DATA_DIR, "hype_bets.json");

function generateFeedItem() {
  const username = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
  const isRental = Math.random() > 0.5;

  if (isRental) {
    const game = CLOUD_GAMES[Math.floor(Math.random() * CLOUD_GAMES.length)];
    const rates = [199, 299, 399, 499, 599, 799]; // Premium High Rates
    const hourly_rate = rates[Math.floor(Math.random() * rates.length)];
    const duration = Math.floor(Math.random() * 8) + 1; // 1 to 8 hours
    const total_cost = hourly_rate * duration;

    let color = "text-slate-500";
    if (duration > 6) {
      color = "text-neon-purple animate-pulse";
    } else if (duration > 3) {
      color = "text-amber-400";
    } else {
      color = "text-emerald-400";
    }

    return {
      user: username,
      bet: `${duration} hrs`,
      mult: `₹${hourly_rate}/hr`,
      win: `₹${total_cost.toLocaleString()}`,
      raw_bet: hourly_rate,
      raw_payout: total_cost,
      raw_mult: Number(duration),
      game: game,
      color: color,
      type: "rental"
    };
  } else {
    const game = CASINO_GAMES[Math.floor(Math.random() * CASINO_GAMES.length)];
    const amount = Math.floor(Math.random() * 49900) + 100; // Custom Wager Amount
    const won = Math.random() < 0.45;
    const multiplier = won ? parseFloat((Math.random() * 15 + 1.2).toFixed(2)) : 0.0;
    const payout = won ? Math.round(amount * multiplier) : 0;

    let color = "text-slate-500";
    if (multiplier > 10.0) {
      color = "text-neon-purple animate-pulse";
    } else if (multiplier > 3.0) {
      color = "text-amber-400";
    } else if (multiplier > 0.0) {
      color = "text-emerald-400";
    }

    return {
      user: username,
      bet: `₹${amount.toLocaleString()}`,
      mult: `${multiplier}x`,
      win: `₹${payout.toLocaleString()}`,
      raw_bet: amount,
      raw_payout: payout,
      raw_mult: Number(multiplier),
      game: game,
      color: color,
      type: "bet"
    };
  }
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  console.log("Starting Dual-Mode activity generator (1 minute interval)...");
  
  let total_rented_hours = 14802;
  let max_duration = 24;
  let active_streams = 842;
  
  let bets = [];
  // Seed with 15 initial random items
  for (let i = 0; i < 15; i++) {
    bets.push(generateFeedItem());
  }
  
  const payload = {
    bets: bets,
    stats: {
      totalWagered: `₹${total_rented_hours}M`,
      maxWin: `₹${max_duration}M`,
      activePlayers: `${active_streams}`
    }
  };
  const tempInitialPath = `${FILE_PATH}.tmp`;
  fs.writeFileSync(tempInitialPath, JSON.stringify(payload, null, 2));
  fs.renameSync(tempInitialPath, FILE_PATH);

  const SYSTEM_CONFIG_PATH = path.join(__dirname, "..", "data", "system_config.json");
  
  function runLoop() {
    const newItem = generateFeedItem();
    bets.unshift(newItem);
    bets = bets.slice(0, 15);
    
    if (newItem.type === 'rental') {
      total_rented_hours += newItem.raw_mult;
    } else {
      total_rented_hours += Math.round(newItem.raw_bet / 1000);
    }
    
    if (newItem.type === 'rental' && newItem.raw_mult > max_duration) {
      max_duration = newItem.raw_mult;
    } else if (newItem.type === 'bet' && newItem.raw_mult > max_duration) {
      max_duration = Math.round(newItem.raw_mult);
    }
    
    active_streams = Math.floor(Math.random() * (895 - 810 + 1)) + 810;
    
    const updatePayload = {
      bets: bets,
      stats: {
        totalWagered: `₹${total_rented_hours}M`,
        maxWin: `₹${max_duration}M`,
        activePlayers: `${active_streams}`
      }
    };
    
    try {
      const tempPath = `${FILE_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(updatePayload, null, 2));
      fs.renameSync(tempPath, FILE_PATH);
      console.log(`Generated item for ${newItem.user}: type=${newItem.type} game=${newItem.game} wager=${newItem.bet} payout=${newItem.win}`);
    } catch (e) {
      console.error(`Error writing to file: ${e}`);
    }
    
    // Read next interval from system config
    let nextInterval = 30000; // default to 30 seconds
    try {
      if (fs.existsSync(SYSTEM_CONFIG_PATH)) {
        const sysConfig = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_PATH, 'utf-8'));
        if (typeof sysConfig.strategyFrequency === 'number') {
          nextInterval = sysConfig.strategyFrequency * 1000;
        }
      }
    } catch (err) {
      console.error("Failed to read system_config.json for strategyFrequency:", err);
    }
    
    setTimeout(runLoop, nextInterval);
  }

  // Start the loop with initial strategyFrequency
  let initialInterval = 30000;
  try {
    if (fs.existsSync(SYSTEM_CONFIG_PATH)) {
      const sysConfig = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_PATH, 'utf-8'));
      if (typeof sysConfig.strategyFrequency === 'number') {
        initialInterval = sysConfig.strategyFrequency * 1000;
      }
    }
  } catch (e) {}
  
  console.log(`Starting dynamic activity generator (initial interval: ${initialInterval}ms)...`);
  setTimeout(runLoop, initialInterval);
}

main();
