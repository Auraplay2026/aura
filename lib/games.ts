export type CategoryId = "fps" | "driving" | "retro" | "sports" | "action" | "puzzle" | "funny" | "boring" | "originals" | "slots" | "live" | "shows" | "table" | "crash" | "poker" | "esports" | "racing" | "adventure" | "casual" | "classic" | "roulette" | "blackjack" | "baccarat" | "aaa" | "3d" | "open-world";


export interface Game {
  id: string;
  title: string;
  provider: string;
  image: string;
  categories: CategoryId[];
  isNew?: boolean;
  hourlyRate?: number; // hourly renting rate in ₹ (only for cloud games)
  rtp?: number; // RTP for casino/betting games
  players?: number; // active streams/players
}

export const GAMES: Game[] = [
  // ==========================================
  // CASINO & BETTING GAMES - ORIGINALS
  // ==========================================
  { id: "orig-1", title: "Crash", provider: "Originals", image: "/games/housegames_crash-aBwlW8Ez2.jpeg", categories: ["originals", "crash"], rtp: 99.0, players: 4123 },
  { id: "orig-2", title: "Limbo", provider: "Originals", image: "/games/housegames_limbo-ukEog2zpr.jpeg", categories: ["originals"], rtp: 99.0, players: 1205 },
  { id: "orig-3", title: "Plinko", provider: "Originals", image: "/games/orig_cover_plinko.png", categories: ["originals", "casual"], rtp: 99.0, players: 8400 },
  { id: "orig-4", title: "Mines", provider: "Originals", image: "/games/orig_cover_mines.png", categories: ["originals", "puzzle"], rtp: 99.0, players: 5200 },
  { id: "orig-5", title: "Dice", provider: "Originals", image: "/games/housegames_dice.jpg", categories: ["originals", "table"], rtp: 99.0, players: 11000 },
  { id: "orig-6", title: "Keno", provider: "Originals", image: "/games/housegames_keno-D5M2Md5Ke.jpeg", categories: ["originals", "casual"], rtp: 99.0, players: 2100 },
  { id: "orig-7", title: "Tower", provider: "Originals", image: "/games/housegames_towers-H9BawlL5-.png", categories: ["originals"], rtp: 99.0, players: 15400 },
  { id: "orig-8", title: "Blackjack", provider: "Originals", image: "/games/housegames_blackjack-H4SSRgE2t.jpeg", categories: ["originals", "table", "blackjack"], rtp: 99.5, players: 18500 },
  { id: "orig-9", title: "Coinflip", provider: "Originals", image: "/games/housegames_coinflip.jpg", categories: ["originals"], rtp: 99.0, players: 8400 },
  { id: "orig-10", title: "Wheel", provider: "Originals", image: "/games/housegames_slide-lDqMEzMQA.png", categories: ["originals"], rtp: 99.0, players: 6300 },
  { id: "orig-11", title: "Roulette", provider: "Originals", image: "/games/housegames_roulette-M5fn8z7Db.png", categories: ["originals", "table", "roulette"], rtp: 97.3, players: 12500 },
  { id: "orig-12", title: "TradeX", provider: "Originals", image: "/games/trade_thumbnail.png", categories: ["originals", "casual"], rtp: 99.0, players: 18500, isNew: true },
  { id: "orig-13", title: "HiLo", provider: "Originals", image: "/games/hilo_thumbnail.png", categories: ["originals", "table"], rtp: 99.0, players: 22100, isNew: true },
  { id: "orig-14", title: "Penalty Shootout", provider: "Originals", image: "/games/penalty_thumbnail.png", categories: ["originals", "sports"], rtp: 99.0, players: 15400, isNew: true },

  // --- PREMIUM CRASH ---
  { id: "crash-1", title: "Aviator", provider: "Spribe", image: "/games/spribe_aviator-7zuT5hj-B.jpeg", categories: ["crash"], players: 50000 },
  { id: "crash-2", title: "Aviamasters 2", provider: "SoftSwiss", image: "/games/softswiss_Aviamasters2-OPwO5jn6K.jpeg", categories: ["crash"], players: 29000 },
  { id: "crash-3", title: "Crazy Coin Flip", provider: "Evolution", image: "/games/evo_crazy-coin-flip--5TY4F43O.jpeg", categories: ["crash", "live"], players: 14000 },

  // --- PREMIUM SLOTS ---
  { id: "slot-1", title: "Sweet Bonanza", provider: "Pragmatic Play", image: "/games/slot_cover_sweet.png", categories: ["slots"], players: 12000 },
  { id: "slot-2", title: "Gates of Olympus", provider: "Pragmatic Play", image: "/games/slot_cover_olympus.png", categories: ["slots"], players: 45000 },
  { id: "slot-3", title: "Book of Dead", provider: "Play'n GO", image: "/games/slot_cover_book.png", categories: ["slots", "adventure"], players: 38000 },
  { id: "slot-4", title: "The Dog House", provider: "Pragmatic Play", image: "/games/pragmatic_vs20bgdoghouse-qobvkHq9o.jpeg", categories: ["slots", "funny"], players: 18000 },
  { id: "slot-5", title: "Sugar Rush 1000", provider: "Pragmatic Play", image: "/games/pragmatic_vs20sugarrushx.jpg", categories: ["slots"], players: 16500 },
  { id: "slot-6", title: "Starlight Princess 1000", provider: "Pragmatic Play", image: "/games/pragmatic_vs20starlightx.jpg", categories: ["slots"], players: 21000 },
  { id: "slot-7", title: "Sweet Bonanza 1000", provider: "Pragmatic Play", image: "/games/pragmatic_vs20swbon2500-bKETWU2kP.jpeg", categories: ["slots"], players: 28500 },
  { id: "slot-8", title: "Zeus vs Hades: Gods of War", provider: "Pragmatic Play", image: "/games/pragmatic_vs15zeushadseq-0TXaIHREb.jpeg", categories: ["slots"], players: 19400 },
  { id: "slot-9", title: "Madame Destiny Megaways", provider: "Pragmatic Play", image: "/games/pragmatic_vswaysmadame.jpg", categories: ["slots"], players: 14200 },
  { id: "slot-10", title: "The Dog House Megaways", provider: "Pragmatic Play", image: "/games/pragmatic_vswaysdogs.jpg", categories: ["slots"], players: 17800 },
  { id: "slot-11", title: "Gemhalla Xtreme", provider: "SoftSwiss", image: "/games/softswiss_GemhallaXtreme-3ffHDvSVA.jpeg", categories: ["slots"], players: 8900 },
  { id: "slot-12", title: "Fishing Time Deluxe", provider: "SoftSwiss", image: "/games/softswiss_FishingTime-4LyfmZIPg.jpeg", categories: ["slots"], players: 6300 },
  { id: "slot-13", title: "5 Lions Megaways", provider: "Pragmatic Play", image: "/games/pragmatic_vswayslions.jpg", categories: ["slots"], players: 11200 },
  { id: "slot-14", title: "Great Rhino Megaways", provider: "Pragmatic Play", image: "/games/pragmatic_vswaysrhino.jpg", categories: ["slots"], players: 9800 },
  { id: "slot-15", title: "Fruit Party", provider: "Pragmatic Play", image: "/games/pragmatic_vs20fruitswx.jpg", categories: ["slots"], players: 15400 },
  { id: "slot-16", title: "Wild Beach Party", provider: "Pragmatic Play", image: "/games/pragmatic_vs20mparty.jpg", categories: ["slots"], players: 13200 },
  { id: "slot-17", title: "Clash of Gods: Anubis vs Hades", provider: "SoftSwiss", image: "/games/softswiss_ClashofGodsAnubisvsHades-peROQ0IjU.jpeg", categories: ["slots"], isNew: true, players: 25000 },
  { id: "slot-18", title: "Hot Heist", provider: "TrueLab", image: "/games/truelab_HotHeist-JcqRnDFiy.jpeg", categories: ["slots"], isNew: true, players: 8400 },
  { id: "slot-19", title: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", image: "/games/hacksaw_1067-tLa7Rl6FW.jpeg", categories: ["slots"], players: 41000 },

  // --- PREMIUM LIVE SHOWS ---
  { id: "live-1", title: "Crazy Time", provider: "Evolution", image: "/games/live_cover_crazy.png", categories: ["live", "shows"], players: 25000 },
  { id: "live-2", title: "Lightning Storm Live", provider: "Evolution", image: "/games/evo_lightning-storm-EuSGqjpLa.jpeg", categories: ["live", "shows"], players: 34000 },
  { id: "live-3", title: "Crazy Pachinko Live", provider: "Evolution", image: "/games/evo_crazy-pachinko-IZFn5hYjG.jpeg", categories: ["live", "shows"], players: 22000 },
  { id: "live-4", title: "Funky Time Disco", provider: "Evolution", image: "/games/evo_funky-time-cxwqMBoVg.jpeg", categories: ["live", "shows"], players: 18500 },
  { id: "live-5", title: "Monopoly Big Baller", provider: "Evolution", image: "/games/evo_monopoly-big-baller-FK1HI3SZx.jpeg", categories: ["live", "shows"], players: 15400 },
  { id: "live-6", title: "Balloon Race Game", provider: "Evolution", image: "/games/evo_balloon-race-gpXXccaD0.jpeg", categories: ["live", "shows", "crash"], players: 9600 },
  { id: "live-7", title: "Dream Catcher Wheel", provider: "Evolution", image: "/games/evo_dream-catcher-TLMUmSOj7.jpeg", categories: ["live", "shows"], players: 11200 },

  // --- PREMIUM TABLE GAMES ---
  { id: "table-1", title: "Lightning Roulette", provider: "Evolution", image: "/games/live_cover_roulette.png", categories: ["live", "table", "roulette"], players: 32000 },
  { id: "table-2", title: "Infinite Blackjack", provider: "Evolution", image: "/games/live_cover_blackjack.png", categories: ["live", "table", "blackjack"], players: 15000 },
  { id: "table-3", title: "Speed Baccarat", provider: "Pragmatic Play Live", image: "/games/evo_roobet-baccarat-A-h7jSd7C.jpeg", categories: ["live", "table", "baccarat"], players: 9500 },
  { id: "roulette-1", title: "Immersive Roulette", provider: "Evolution", image: "/games/live_cover_roulette.png", categories: ["live", "table", "roulette"], players: 25400 },
  { id: "roulette-2", title: "Speed Roulette Live", provider: "Evolution", image: "/games/evo_speed-roulette-8a6GEiAUC.jpeg", categories: ["live", "table", "roulette"], players: 19800 },
  { id: "roulette-3", title: "XXXtreme Lightning Roulette", provider: "Evolution", image: "/games/evo_xxxtreme-lightning-roulette-s2M5fQi64.jpeg", categories: ["live", "table", "roulette"], players: 31200 },
  { id: "roulette-4", title: "Aura Premium Roulette", provider: "Evolution", image: "/games/evo_roobet-roulette-OdaKlJb02.jpeg", categories: ["live", "table", "roulette"], players: 14200 },
  { id: "blackjack-1", title: "Free Bet Blackjack", provider: "Evolution", image: "/games/evo_roobet-free-bet-blackjack-lAfMYP-eP.jpeg", categories: ["live", "table", "blackjack"], players: 18500 },
  { id: "blackjack-2", title: "Aura VIP Blackjack", provider: "Evolution", image: "/games/evo_roobet-blackjack-2-F_Ol2P30v.jpeg", categories: ["live", "table", "blackjack"], players: 11000 },
  { id: "blackjack-3", title: "VIP Diamond Blackjack", provider: "Evolution", image: "/games/evo_roobet-vip-blackjack-efA1PJT4p.jpeg", categories: ["live", "table", "blackjack"], players: 8500 },
  { id: "blackjack-4", title: "Salon Privé Blackjack", provider: "Evolution", image: "/games/evo_roobet-salon-prive-blackjack-mPa0l_FJl.jpeg", categories: ["live", "table", "blackjack"], players: 6400 },
  { id: "poker-1", title: "Texas Hold'em Bonus", provider: "Evolution", image: "/games/evo_blackjack-vip-19-eUcYAImJF.jpeg", categories: ["live", "poker", "table"], players: 6000 },
  { id: "poker-3", title: "Triple Card Poker", provider: "Evolution", image: "/games/evo_blackjack-vip-h-ki4ceE6V_.jpeg", categories: ["live", "table", "poker"], players: 7400 },
  { id: "poker-4", title: "Gold Bar Poker Deluxe", provider: "Evolution", image: "/games/evo_golden-baron-N07G4x_uW.jpeg", categories: ["live", "table", "poker"], players: 9600 },

  // --- AAA CLOUD RENTALS (Premium High Price Tier) ---
  { id: "aaa-1", title: "Cyberpunk 2077", provider: "CD Projekt Red", image: "/games/roobetlabs_vault-tron-deadly-race-BOHwFqEYb.jpeg", categories: ["aaa", "open-world", "3d"], isNew: true, hourlyRate: 399, players: 4500 },
  { id: "aaa-2", title: "Elden Ring", provider: "FromSoftware", image: "/games/gamingcorps_NorthVsGiant-TsvdHyYnO.jpeg", categories: ["aaa", "action", "3d"], isNew: true, hourlyRate: 499, players: 6800 },
  { id: "aaa-3", title: "Black Myth: Wukong", provider: "Game Science", image: "/games/gamingcorps_AztecRitual-hiQjxsUxE.jpeg", categories: ["aaa", "action", "3d"], isNew: true, hourlyRate: 799, players: 9200 },
  { id: "aaa-4", title: "Spider-Man 2", provider: "Insomniac Games", image: "/games/roobetlabs_vault-games-star-ace-F6KJT3N51.jpeg", categories: ["aaa", "action", "open-world"], isNew: true, hourlyRate: 499, players: 3100 },
  { id: "aaa-6", title: "Need for Speed Unbound", provider: "EA Games", image: "/games/evo_race-track-3-R_1h--SOL.jpeg", categories: ["aaa", "driving", "racing"], isNew: true, hourlyRate: 599, players: 8400 },

  // --- RPG & ACTION ADVENTURES (Cloud Gaming) ---
  { id: "action-1", title: "Grand Theft Auto V", provider: "Rockstar Games", image: "/games/hub88_zcl3u_cctvgame-rushhour-MOhk4Ud4l.jpeg", categories: ["action", "open-world", "3d"], hourlyRate: 299, players: 28500 },
  { id: "action-2", title: "Red Dead Redemption 2", provider: "Rockstar Games", image: "/games/hacksaw_1267.jpg", categories: ["action", "open-world"], hourlyRate: 499, players: 12500 },
  { id: "action-3", title: "Hogwarts Legacy", provider: "Avalanche Software", image: "/games/gamingcorps_TombofWishes-OMaG9ydZh.jpeg", categories: ["action", "adventure"], hourlyRate: 399, players: 19500 },
  { id: "action-4", title: "Baldur's Gate 3", provider: "Larian Studios", image: "/games/hacksaw_1400.jpg", categories: ["action", "puzzle"], hourlyRate: 499, players: 15500 },
  { id: "action-5", title: "Marvel's Spider-Man Remastered", provider: "Insomniac Games", image: "/games/roobetlabs_vault-games-star-ace-F6KJT3N51.jpeg", categories: ["action", "open-world"], hourlyRate: 399, players: 14500 },

  // --- FPS & SHOOTERS (Cloud Gaming) ---
  { id: "fps-1", title: "Call of Duty: Warzone", provider: "Activision", image: "/games/krunker_1780932718197.png", categories: ["fps", "action"], hourlyRate: 299, players: 32000 },
  { id: "fps-2", title: "Counter-Strike 2", provider: "Valve", image: "/games/venge_1780932731548.png", categories: ["fps", "action"], hourlyRate: 199, players: 45000 },
  { id: "fps-3", title: "Valorant", provider: "Riot Games", image: "/games/shellshockers_1780932759256.png", categories: ["fps", "action"], hourlyRate: 199, players: 21000 },
  { id: "fps-4", title: "Apex Legends", provider: "Respawn Entertainment", image: "/games/smashkarts_1780932771384.png", categories: ["fps", "action"], hourlyRate: 299, players: 15500 },
  { id: "fps-6", title: "Call of Duty: Black Ops 6", provider: "Activision", image: "/games/krunker_1780932718197.png", categories: ["fps", "action"], isNew: true, hourlyRate: 499, players: 29000 },

  // --- RACING & SIMULATORS (Cloud Gaming) ---
  { id: "driving-1", title: "Forza Horizon 5", provider: "Playground Games", image: "/games/hub88_zcl3u_cctvgame-snowrun-kYjfIl3W1.jpeg", categories: ["driving", "racing"], hourlyRate: 299, players: 9200 },
  { id: "driving-2", title: "Assetto Corsa Competizione", provider: "Kunos Simulazioni", image: "/games/evo_race-track-3-R_1h--SOL.jpeg", categories: ["driving", "racing"], hourlyRate: 199, players: 6200 },
  { id: "driving-3", title: "F1 24", provider: "Codemasters", image: "/games/evo_race-track-FHDPlAfRM.jpeg", categories: ["driving", "racing"], hourlyRate: 399, players: 3100 },
  { id: "driving-5", title: "Forza Motorsport", provider: "Turn 10 Studios", image: "/games/evo_race-track-FHDPlAfRM.jpeg", categories: ["driving", "racing"], isNew: true, hourlyRate: 399, players: 11000 },

  // --- STRATEGY & CO-OP (Cloud Gaming) ---
  { id: "puzzle-1", title: "Civilization VI", provider: "Firaxis Games", image: "/games/roobetlabs_trex-arcade-bomb-defuse-5X6Y9LtAg.jpeg", categories: ["puzzle"], hourlyRate: 199, players: 8400 },
  { id: "puzzle-2", title: "It Takes Two", provider: "Hazelight Studios", image: "/games/roobetlabs_vault-games-swing-king-xJl-rNRnO.jpeg", categories: ["puzzle", "funny"], hourlyRate: 299, players: 11000 },

  // --- COZY & CHILL (Cloud Gaming) ---
  { id: "boring-1", title: "Stardew Valley", provider: "ConcernedApe", image: "/games/hub88_hyh_cooked-DHUjfSTnh.jpeg", categories: ["boring", "casual"], hourlyRate: 99, players: 98000 },
  
  // --- CLOUD RENTAL ENGAGING GAMES ---
  { id: "aaa-5", title: "Cyber Strike", provider: "Aura Studios", image: "/games/action_thumbnail_1780932122747.png", categories: ["aaa", "action", "3d"], isNew: true, hourlyRate: 599, players: 8300 },
  { id: "fps-5", title: "Tactical Force", provider: "Aura Games", image: "/games/fps_thumbnail_1780932097997.png", categories: ["fps", "action"], hourlyRate: 349, players: 11200 },
  { id: "driving-4", title: "Hyper Racer", provider: "Aura Racing", image: "/games/racing_thumbnail_1780932108929.png", categories: ["driving", "racing"], hourlyRate: 249, players: 7400 },
  { id: "puzzle-3", title: "Mind Solver", provider: "Originals", image: "/games/puzzle_thumbnail_1780932148588.png", categories: ["puzzle"], rtp: 99.0, players: 4300 },
  { id: "casual-1", title: "Wacky World", provider: "Originals", image: "/games/funny_thumbnail_1780932135777.png", categories: ["casual", "funny"], rtp: 98.8, players: 26000 }
];

export const getGamesByCategory = (categoryId: CategoryId) => {
  return GAMES.filter(game => game.categories.includes(categoryId));
};

export const getPopularGames = (limit: number = 10) => {
  return [...GAMES].sort((a, b) => (b.players || 0) - (a.players || 0)).slice(0, limit);
};
