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
  // ── 3D RACING & ACTION (DISTINCT ENGINES) ──
  {
    id: "neon-racer",
    title: "Neon Horizon 3D Turbo",
    provider: "AURA WebGL",
    description: "High-speed 3D synthwave highway racer. Dodge traffic, collect nitro boosts, and test your top speed.",
    thumbnail: "/games/two_stunt_supercars.png",
    categories: ["racing", "3d", "action"],
    url: "/arcade-engines/neon-racer/index.html",
    isNew: true,
    orientation: "portrait",
    rating: 4.9
  },
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
  },
  {
    id: "pacman",
    title: "Pac-Man HTML5",
    provider: "Platzh1rsch",
    description: "The ultimate arcade classic. Eat the dots, avoid the ghosts, and grab glowing power pellets.",
    thumbnail: "/games/pacman.png",
    categories: ["action", "arcade"],
    url: "https://pacman.platzh1rsch.ch/",
    orientation: "landscape",
    rating: 4.9
  },
  {
    id: "clumsy-bird",
    title: "Clumsy Bird MelonJS",
    provider: "Ellison Leao",
    description: "MelonJS physics runner. Help the clumsy bird fly through the enchanted forest obstacles.",
    thumbnail: "/games/clumsy-bird.png",
    categories: ["runner", "action"],
    url: "https://ellisonleao.github.io/clumsy-bird/",
    orientation: "landscape",
    rating: 4.5
  },

  // ── GRANDMASTER STRATEGY & CARDS ──
  {
    id: "chess-web",
    title: "Chess Master AI",
    provider: "Stockfish / Lichess",
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
    provider: "World of Solitaire",
    description: "Smooth drag-and-drop Klondike Solitaire with Draw-1 and Draw-3 game modes.",
    thumbnail: "/games/blackjack_pro_cover.png",
    categories: ["board", "strategy"],
    url: "https://worldofsolitaire.com/",
    orientation: "landscape",
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
