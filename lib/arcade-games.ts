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
  // ── 3D RACING & SIMULATION (THREE.JS WEBGL ENGINES) ──
  {
    id: "drift-city-3d",
    title: "Drift Horizon 3D: Cyber City",
    provider: "AURA WebGL 3D",
    description: "High-performance Three.js 3D physics drifting simulator through a neon-lit cyberpunk metropolis. Real skidmarks, slipstream boost, and drift multipliers.",
    thumbnail: "/games/two_stunt_supercars.png",
    categories: ["racing", "3d", "action"],
    url: "/arcade-engines/drift-city-3d/index.html",
    isNew: true,
    orientation: "landscape",
    rating: 4.9
  },
  {
    id: "asteroid-3d",
    title: "Asteroid Zero-G 3D Fighter",
    provider: "AURA WebGL 3D",
    description: "Deep space 3D starship combat simulator. Navigate through dense asteroid belts, dogfight alien interceptors, and blast threats with dual plasma lasers.",
    thumbnail: "/games/space_miner_cover.png",
    categories: ["action", "3d", "arcade"],
    url: "/arcade-engines/asteroid-3d/index.html",
    isNew: true,
    orientation: "landscape",
    rating: 4.9
  },
  {
    id: "cyber-runner-3d",
    title: "Cyber Katana: Neo Tokyo 3D",
    provider: "AURA WebGL 3D",
    description: "Ultra-fast 3D cyberpunk rooftop parkour runner. Execute wall runs, double jumps, energy katana strikes, and collect hyper-speed energy orbs.",
    thumbnail: "/games/action_thumbnail_1780932122747.png",
    categories: ["runner", "3d", "action"],
    url: "/arcade-engines/cyber-runner-3d/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.9
  },
  {
    id: "billiards-3d",
    title: "3D Neon Billiards Pro",
    provider: "AURA Physics 3D",
    description: "Authentic 3D physics 8-ball pool table with cue angle adjustments, ball-to-ball elastic collisions, cushion banks, and illuminated neon pockets.",
    thumbnail: "/games/neon_billiards_cover.png",
    categories: ["sports", "3d", "physics", "board"],
    url: "/arcade-engines/billiards-3d/index.html",
    isNew: true,
    orientation: "landscape",
    rating: 4.9
  },
  {
    id: "bowling-3d",
    title: "Strike 3D Cyber Bowling",
    provider: "AURA Physics 3D",
    description: "Realistic 10-pin cyber bowling alley with polished lane reflections, spin curve trajectory, dynamic pin collision physics, and instant strike replays.",
    thumbnail: "/games/hilo_thumbnail.png",
    categories: ["sports", "3d", "physics", "arcade"],
    url: "/arcade-engines/bowling-3d/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "neon-racer",
    title: "Neon Horizon Turbo",
    provider: "AURA Arcade",
    description: "High-speed 3D synthwave highway racer. Dodge traffic, collect nitro boosts, and test your top speed against the clock.",
    thumbnail: "/games/racing_thumbnail_1780932108929.png",
    categories: ["racing", "3d", "action"],
    url: "/arcade-engines/neon-racer/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.8
  },

  // ── BLOCK & STACKING PHYSICS ──
  {
    id: "tower-stack",
    title: "Tower Stack 3D",
    provider: "AURA Physics",
    description: "Isometric 3D block stacking game with precision slice physics and harmonic color spectrums.",
    thumbnail: "/games/housegames_towers-H9BawlL5-.png",
    categories: ["physics", "3d", "arcade"],
    url: "/arcade-engines/tower-stack/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "tetris-pro",
    title: "React Tetris Elite",
    provider: "Chvin / AURA",
    description: "Classic 10x20 tetromino matrix with ghost piece, hard drop, line clear animations, and level speedup.",
    thumbnail: "/games/tetris.png",
    categories: ["puzzle", "arcade"],
    url: "/arcade-engines/tetris-pro/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.9
  },

  // ── TIMING & SWIPE REFLEX ──
  {
    id: "knife-hit",
    title: "Knife Hit Master",
    provider: "AURA Arcade",
    description: "Target blade throwing timing against rotating wooden logs with deflection physics and boss stages.",
    thumbnail: "/games/orig_cover_mines.png",
    categories: ["arcade", "physics"],
    url: "/arcade-engines/knife-hit/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.8
  },
  {
    id: "fruit-slicer",
    title: "Fruit Katana Slicer",
    provider: "AURA Swipe",
    description: "Fast-paced finger swipe fruit slashing with juicy combo splashes, parabolic physics, and bomb hazards.",
    thumbnail: "/games/pragmatic_vs20fruitswx.jpg",
    categories: ["action", "arcade"],
    url: "/arcade-engines/fruit-slicer/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.9
  },

  // ── PUZZLES & COLOR STRATEGY ──
  {
    id: "2048-neon",
    title: "2048 Neon Original",
    provider: "Gabriele Cirulli",
    description: "The classic sliding number puzzle with smooth merge animations and high score tracking.",
    thumbnail: "/games/2048.png",
    categories: ["puzzle", "strategy"],
    url: "/arcade-engines/2048-neon/index.html",
    orientation: "portrait",
    rating: 4.9
  },
  {
    id: "hextris-core",
    title: "Hextris Rotator",
    provider: "Open Source",
    description: "Fast-paced hexagonal block puzzle. Rotate the core and match 3 colors to clear perimeter lines.",
    thumbnail: "/games/hextris.png",
    categories: ["puzzle", "action", "arcade"],
    url: "/arcade-engines/hextris-core/index.html",
    orientation: "portrait",
    rating: 4.8
  },

  // ── RETRO ARCADE CLASSICS ──
  {
    id: "flappy-bird",
    title: "Flappy Bird Pro",
    provider: "Nebezb / AURA",
    description: "The legendary tap-to-fly runner with smooth physics gravity, pipe gaps, and score medals.",
    thumbnail: "/games/flappy-bird.png",
    categories: ["runner", "action", "arcade"],
    url: "/arcade-engines/flappy-bird/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.7
  },
  {
    id: "breakout-ultra",
    title: "Breakout Ultra JS",
    provider: "Enclave Games",
    description: "Classic brick-breaking action! Deflect the power ball with paddle angle spin and shatter rainbow blocks.",
    thumbnail: "/games/breakout.png",
    categories: ["arcade", "action"],
    url: "/arcade-engines/breakout-ultra/index.html",
    orientation: "portrait",
    rating: 4.7
  },
  {
    id: "space-invaders",
    title: "Alien Space Invaders",
    provider: "Cykod / AURA",
    description: "Retro 2D bullet-hell space shooter. Command your laser starship and blast the alien swarms.",
    thumbnail: "/games/alien-invasion.png",
    categories: ["action", "arcade"],
    url: "/arcade-engines/space-invaders/index.html",
    orientation: "portrait",
    rating: 4.8
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
