export type ArcadeCategoryId = "runner" | "puzzle" | "action" | "racing" | "sports" | "board" | "strategy" | "arcade";

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
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: "2048",
    title: "2048 Original",
    provider: "Gabriele Cirulli",
    description: "The classic open-source slide-matching puzzle game. Join the numbers to reach the legendary 2048 tile.",
    thumbnail: "https://images.unsplash.com/photo-1614036634955-ae5e90f9b9eb?w=400&q=80",
    categories: ["puzzle", "strategy"],
    url: "https://gabrielecirulli.github.io/2048/",
    orientation: "portrait"
  },
  {
    id: "hextris",
    title: "Hextris",
    provider: "Open Source",
    description: "Fast-paced hexagonal block puzzle. Rotate the hexagon and match colors to clear lines before they reach the top.",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
    categories: ["puzzle", "action", "arcade"],
    url: "https://hextris.github.io/hextris/",
    orientation: "portrait"
  },
  {
    id: "flappy-bird",
    title: "Flappy Bird (HTML5)",
    provider: "Nebezb",
    description: "The legendary tap-to-fly runner. Navigate through the pipes without crashing in this pixel-perfect open source clone.",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80",
    categories: ["runner", "action", "arcade"],
    url: "https://nebezb.com/floppybird/",
    isNew: true,
    orientation: "portrait"
  },
  {
    id: "react-tetris",
    title: "React Tetris",
    provider: "Chvin",
    description: "A premium, beautifully designed modern Tetris implementation built purely in React and HTML5.",
    thumbnail: "https://images.unsplash.com/photo-1610464875043-982c7a02db16?w=400&q=80",
    categories: ["puzzle", "arcade"],
    url: "https://chvin.github.io/react-tetris/",
    isNew: true,
    orientation: "portrait"
  },
  {
    id: "pacman",
    title: "Pac-Man HTML5",
    provider: "Platzh1rsch",
    description: "The ultimate arcade classic. Eat the dots, avoid the ghosts, and grab the power pellets!",
    thumbnail: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&q=80",
    categories: ["action", "arcade"],
    url: "https://pacman.platzh1rsch.ch/",
    isNew: true,
    orientation: "landscape"
  },
  {
    id: "clumsy-bird",
    title: "Clumsy Bird",
    provider: "Ellison Leao",
    description: "A fun MelonJS physics runner. Help the clumsy bird fly as far as possible without hitting the tree trunks.",
    thumbnail: "https://images.unsplash.com/photo-1520114092801-44755a5b5dc4?w=400&q=80",
    categories: ["runner", "action"],
    url: "https://ellisonleao.github.io/clumsy-bird/",
    orientation: "landscape"
  },
  {
    id: "breakout",
    title: "Breakout JS",
    provider: "Enclave Games",
    description: "Classic brick-breaking action! Bounce the ball off your paddle and destroy all the blocks.",
    thumbnail: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&q=80",
    categories: ["arcade", "action"],
    url: "http://breakout.enclavegames.com/",
    orientation: "portrait"
  },
  {
    id: "alien-invasion",
    title: "Alien Invasion",
    provider: "Cykod",
    description: "Defend Earth in this retro 2D space shooter. Move your ship and blast the alien swarm out of the sky.",
    thumbnail: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&q=80",
    categories: ["action", "arcade"],
    url: "https://cykod.github.io/AlienInvasion/",
    orientation: "portrait"
  },
  {
    id: "hexgl",
    title: "HexGL Racing",
    provider: "BKCore",
    description: "Incredible high-speed 3D futuristic racing game built in HTML5 and WebGL. Push your reflexes to the limit!",
    thumbnail: "https://images.unsplash.com/photo-1547941126-3d5322b218b0?w=400&q=80",
    categories: ["racing", "action"],
    url: "https://hexgl.bkcore.com/play/",
    isNew: true,
    orientation: "landscape"
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
