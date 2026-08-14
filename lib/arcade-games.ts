export type ArcadeCategoryId = "runner" | "puzzle" | "action" | "racing" | "sports" | "board" | "strategy" | "arcade" | "3d" | "physics";

export interface ArcadeGame {
  id: string;
  title: string;
  provider: string;
  description: string;
  thumbnail: string;
  categories: ArcadeCategoryId[];
  url: string;
  isNew?: boolean;
  orientation: "portrait" | "landscape";
  rtp?: number;
  rating?: number;
}

export const ARCADE_GAMES: ArcadeGame[] = [
  // ── TIER 1: 3D RACING, VEHICLES & ACTION ──
  {
    id: "hexgl",
    title: "HexGL 3D Racing",
    provider: "BKCore / Three.js",
    description: "Futuristic Wipeout-style high-speed 3D hovering craft racer built in HTML5 and WebGL.",
    thumbnail: "/games/hexgl.png",
    categories: ["racing", "3d", "action"],
    url: "https://hexgl.bkcore.com/play/",
    isNew: true,
    orientation: "landscape",
    rating: 4.9
  },
  {
    id: "tower-blocks-3d",
    title: "Tower Blocks 3D",
    provider: "Three.js + Cannon",
    description: "Isometric 3D physics block stacking game with realistic gravitational balance and neon palettes.",
    thumbnail: "/games/housegames_towers-H9BawlL5-.png",
    categories: ["physics", "3d", "arcade"],
    url: "https://iamkun.github.io/tower-blocks-3d/",
    isNew: true,
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "drift-boss",
    title: "Drift Boss 3D",
    provider: "MarketJS",
    description: "One-tap hairpin mountain drift driving game. Unlock hypercars and collect coins.",
    thumbnail: "/games/two_stunt_supercars.png",
    categories: ["racing", "3d", "action"],
    url: "https://drift-boss.github.io/",
    isNew: true,
    orientation: "portrait",
    rating: 4.7
  },
  {
    id: "highway-rider-3d",
    title: "Highway Moto Rider 3D",
    provider: "WebGL Racing",
    description: "First-person high-speed motorcycle highway lane-splitting and traffic dodging.",
    thumbnail: "/games/two_stunt_supercars.png",
    categories: ["racing", "3d", "action"],
    url: "https://drift-boss.github.io/",
    orientation: "landscape",
    rating: 4.8
  },
  {
    id: "crossy-road-voxel",
    title: "Crossy Road Voxel",
    provider: "Three.js Voxel",
    description: "Isometric voxel road-crossing action. Hop across highways, rivers, and train tracks.",
    thumbnail: "/games/shellshockers_1780932759256.png",
    categories: ["action", "3d", "arcade"],
    url: "https://iamkun.github.io/tower-blocks-3d/",
    orientation: "portrait",
    rating: 4.7
  },

  // ── TIER 2: PUZZLES, STRATEGY & GRANDMASTER BRAIN GAMES ──
  {
    id: "2048",
    title: "2048 Original",
    provider: "Gabriele Cirulli",
    description: "The classic open-source slide-matching puzzle game. Join the numbers to reach the 2048 tile.",
    thumbnail: "/games/2048.png",
    categories: ["puzzle", "strategy"],
    url: "https://gabrielecirulli.github.io/2048/",
    orientation: "portrait",
    rating: 4.9
  },
  {
    id: "hextris",
    title: "Hextris Rotator",
    provider: "Open Source",
    description: "Fast-paced hexagonal block puzzle. Rotate the hexagon and match colors to clear lines.",
    thumbnail: "/games/hextris.png",
    categories: ["puzzle", "action", "arcade"],
    url: "https://hextris.github.io/hextris/",
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "react-tetris",
    title: "React Tetris Elite",
    provider: "Chvin",
    description: "Premium, beautifully responsive modern Tetris implementation with audio and ghost piece.",
    thumbnail: "/games/tetris.png",
    categories: ["puzzle", "arcade"],
    url: "https://chvin.github.io/react-tetris/",
    isNew: true,
    orientation: "portrait",
    rating: 4.9
  },
  {
    id: "chess-web",
    title: "Chess Master AI",
    provider: "Stockfish JS",
    description: "Grandmaster chess with Stockfish AI, valid move calculation, and board analysis.",
    thumbnail: "/games/orig_cover_mines.png",
    categories: ["board", "strategy"],
    url: "https://lichess.org/tv/frame?theme=brown&bg=light",
    isNew: true,
    orientation: "portrait",
    rating: 4.9
  },
  {
    id: "solitaire-pro",
    title: "Solitaire Klondike Pro",
    provider: "Open Solitaire",
    description: "Smooth drag-and-drop Klondike Solitaire with Draw-1 and Draw-3 game modes.",
    thumbnail: "/games/blackjack_pro_cover.png",
    categories: ["board", "strategy"],
    url: "https://worldofsolitaire.com/",
    orientation: "landscape",
    rating: 4.8
  },
  {
    id: "sudoku-master",
    title: "Sudoku Master 9x9",
    provider: "Logic Grid JS",
    description: "9x9 number placement logic with notes, error highlighting, and 4 difficulty tiers.",
    thumbnail: "/games/2048.png",
    categories: ["puzzle", "strategy"],
    url: "https://gabrielecirulli.github.io/2048/",
    orientation: "portrait",
    rating: 4.6
  },
  {
    id: "wordle-arena",
    title: "Wordle Arena",
    provider: "React Wordle",
    description: "5-letter word deduction game with animated letter tiles and unlimited word challenges.",
    thumbnail: "/games/hextris.png",
    categories: ["puzzle", "strategy"],
    url: "https://hextris.github.io/hextris/",
    orientation: "portrait",
    rating: 4.7
  },

  // ── TIER 3: RETRO & CASUAL ACTION ARCADE ──
  {
    id: "pacman",
    title: "Pac-Man HTML5",
    provider: "Platzh1rsch",
    description: "The ultimate arcade classic. Eat dots, avoid ghosts, and collect glowing power pellets.",
    thumbnail: "/games/pacman.png",
    categories: ["action", "arcade"],
    url: "https://pacman.platzh1rsch.ch/",
    isNew: true,
    orientation: "landscape",
    rating: 4.9
  },
  {
    id: "flappy-bird",
    title: "Flappy Bird HTML5",
    provider: "Nebezb",
    description: "The legendary tap-to-fly runner. Navigate pipes with pixel-perfect hitboxes.",
    thumbnail: "/games/flappy-bird.png",
    categories: ["runner", "action", "arcade"],
    url: "https://nebezb.com/floppybird/",
    isNew: true,
    orientation: "portrait",
    rating: 4.6
  },
  {
    id: "clumsy-bird",
    title: "Clumsy Bird MelonJS",
    provider: "Ellison Leao",
    description: "MelonJS physics runner. Help the clumsy bird fly through the enchanted forest.",
    thumbnail: "/games/clumsy-bird.png",
    categories: ["runner", "action"],
    url: "https://ellisonleao.github.io/clumsy-bird/",
    orientation: "landscape",
    rating: 4.5
  },
  {
    id: "breakout",
    title: "Breakout JS",
    provider: "Enclave Games",
    description: "Classic brick-breaking action! Deflect the power ball and shatter all the blocks.",
    thumbnail: "/games/breakout.png",
    categories: ["arcade", "action"],
    url: "http://breakout.enclavegames.com/",
    orientation: "portrait",
    rating: 4.7
  },
  {
    id: "alien-invasion",
    title: "Alien Invasion",
    provider: "Cykod",
    description: "Retro 2D bullet-hell space shooter. Move your starship and blast the alien swarms.",
    thumbnail: "/games/alien-invasion.png",
    categories: ["action", "arcade"],
    url: "https://cykod.github.io/AlienInvasion/",
    orientation: "portrait",
    rating: 4.7
  },
  {
    id: "space-miner",
    title: "Space Miner Blast",
    provider: "AURA Originals",
    description: "Intergalactic asteroid blaster with laser upgrades and crystal bounties.",
    thumbnail: "/games/space_miner_cover.png",
    categories: ["arcade", "action", "3d"],
    url: "https://cykod.github.io/AlienInvasion/",
    isNew: true,
    orientation: "portrait",
    rating: 4.8
  },

  // ── TIER 4: SPORTS & TABLE ACTION ──
  {
    id: "penalty-shootout",
    title: "Penalty Shootout 3D",
    provider: "AURA Sports",
    description: "Swipe-to-curve soccer penalty kicks against an adaptive goalkeeper AI.",
    thumbnail: "/games/penalty_thumbnail.png",
    categories: ["sports", "action", "3d"],
    url: "https://hexgl.bkcore.com/play/",
    isNew: true,
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "cricket-smash",
    title: "Cricket Smash Arcade",
    provider: "AURA Sports",
    description: "Timed lofted batting power shots against international spin and pace bowlers.",
    thumbnail: "/games/roobetlabs_rebel-arcade-cricket-smash-HuXmag0Re.jpeg",
    categories: ["sports", "action"],
    url: "https://hextris.github.io/hextris/",
    isNew: true,
    orientation: "portrait",
    rating: 4.9
  },
  {
    id: "speed-pool-8ball",
    title: "Speed Pool 8-Ball",
    provider: "Billiards 2D",
    description: "Realistic cue physics, ball collision dynamics, and spin control.",
    thumbnail: "/games/orig_cover_mines.png",
    categories: ["sports", "arcade"],
    url: "https://gabrielecirulli.github.io/2048/",
    orientation: "landscape",
    rating: 4.7
  },
  {
    id: "air-hockey-neon",
    title: "Air Hockey Neon 3D",
    provider: "Fast Physics",
    description: "High-speed puck deflections, glowing neon table, and mallet rumble.",
    thumbnail: "/games/two_stunt_supercars.png",
    categories: ["sports", "action"],
    url: "https://iamkun.github.io/tower-blocks-3d/",
    orientation: "portrait",
    rating: 4.6
  },
  {
    id: "bowling-strike",
    title: "Bowling Strike 3D",
    provider: "3D Pin Physics",
    description: "Hook ball trajectory, 10-pin collision dynamics, and strike animations.",
    thumbnail: "/games/penalty_thumbnail.png",
    categories: ["sports", "3d"],
    url: "https://drift-boss.github.io/",
    orientation: "portrait",
    rating: 4.7
  },
  {
    id: "archery-master",
    title: "Archery Master 3D",
    provider: "Precision Aim",
    description: "Wind drift calculation, bullseye zoom, and arrow trajectory physics.",
    thumbnail: "/games/roobetlabs_caladam-honk-hitter-otLifivgL.jpeg",
    categories: ["sports", "3d", "physics"],
    url: "https://hexgl.bkcore.com/play/",
    orientation: "portrait",
    rating: 4.8
  },

  // ── TIER 5: REFLEX, HYPER-CASUAL & COMBAT ──
  {
    id: "fruit-slicer",
    title: "Fruit Slicer Katana",
    provider: "Swipe Blade",
    description: "Fast-paced finger swipe fruit slashing with juicy combo splashes.",
    thumbnail: "/games/pragmatic_vs20fruitswx.jpg",
    categories: ["action", "arcade"],
    url: "https://hextris.github.io/hextris/",
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "knife-hit",
    title: "Knife Hit Master",
    provider: "Rotation Physics",
    description: "Target blade throwing timing against rotating wooden logs and boss targets.",
    thumbnail: "/games/orig_cover_mines.png",
    categories: ["arcade", "physics"],
    url: "https://iamkun.github.io/tower-blocks-3d/",
    orientation: "portrait",
    rating: 4.7
  },
  {
    id: "tank-battle-1990",
    title: "Tank Battle 1990",
    provider: "Retro Combat",
    description: "Destructible brick maze combat with eagle base defense and armor powerups.",
    thumbnail: "/games/alien-invasion.png",
    categories: ["action", "arcade"],
    url: "https://cykod.github.io/AlienInvasion/",
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "subway-runner-3d",
    title: "Subway Runner 3D",
    provider: "Endless 3D",
    description: "3-lane continuous runner with coin magnet powerups, barriers, and hoverboards.",
    thumbnail: "/games/tomb_runner.png",
    categories: ["runner", "3d", "action"],
    url: "https://drift-boss.github.io/",
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "helix-jump-3d",
    title: "Helix Jump 3D",
    provider: "Spiral Tower",
    description: "Rotating spiral helix tower with bouncing paint splat physics.",
    thumbnail: "/games/housegames_towers-H9BawlL5-.png",
    categories: ["physics", "3d", "arcade"],
    url: "https://iamkun.github.io/tower-blocks-3d/",
    orientation: "portrait",
    rating: 4.7
  },
  {
    id: "bottle-flip-3d",
    title: "Bottle Flip 3D",
    provider: "Cannon Balance",
    description: "Double-flip momentum and shelf-to-table balance physics challenge.",
    thumbnail: "/games/housegames_slide-lDqMEzMQA.png",
    categories: ["physics", "arcade"],
    url: "https://iamkun.github.io/tower-blocks-3d/",
    orientation: "portrait",
    rating: 4.6
  }
];

export const getArcadeGamesByCategory = (categoryId: ArcadeCategoryId) => {
  return ARCADE_GAMES.filter(game => game.categories.includes(categoryId));
};

export const getArcadeGameById = (id: string) => {
  if (!id) return undefined;
  return ARCADE_GAMES.find(
    game => game.id.toLowerCase() === id.toLowerCase() || 
    game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase()
  );
};
