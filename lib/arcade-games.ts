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
  // ── 3D RACING & ACTION ──
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

  // ── PUZZLE & STRATEGY ──
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
    title: "Hextris",
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
    title: "Solitaire Klondike",
    provider: "Open Solitaire",
    description: "Smooth drag-and-drop Klondike Solitaire with Draw-1 and Draw-3 game modes.",
    thumbnail: "/games/blackjack_pro_cover.png",
    categories: ["board", "strategy"],
    url: "https://worldofsolitaire.com/",
    orientation: "landscape",
    rating: 4.8
  },
  {
    id: "penalty-shootout",
    title: "Penalty Shootout 3D",
    provider: "AURA Sports",
    description: "Swipe-to-curve soccer penalty kicks against an adaptive goalkeeper AI.",
    thumbnail: "/games/penalty_thumbnail.png",
    categories: ["sports", "action", "3d"],
    url: "/arcade/game/penalty-shootout",
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
    url: "/arcade/game/cricket-smash",
    isNew: true,
    orientation: "portrait",
    rating: 4.9
  },
  {
    id: "space-miner",
    title: "Space Miner Blast",
    provider: "AURA Originals",
    description: "Intergalactic asteroid blaster with laser upgrades and crystal bounties.",
    thumbnail: "/games/space_miner_cover.png",
    categories: ["arcade", "action", "3d"],
    url: "/arcade/game/space-miner",
    isNew: true,
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
