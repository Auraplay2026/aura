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
    thumbnail: "/games/2048.png",
    categories: ["puzzle", "strategy"],
    url: "https://gabrielecirulli.github.io/2048/",
    orientation: "portrait"
  },
  {
    id: "hextris",
    title: "Hextris",
    provider: "Open Source",
    description: "Fast-paced hexagonal block puzzle. Rotate the hexagon and match colors to clear lines before they reach the top.",
    thumbnail: "/games/hextris.png",
    categories: ["puzzle", "action", "arcade"],
    url: "https://hextris.github.io/hextris/",
    orientation: "portrait"
  },
  {
    id: "flappy-bird",
    title: "Flappy Bird (HTML5)",
    provider: "Nebezb",
    description: "The legendary tap-to-fly runner. Navigate through the pipes without crashing in this pixel-perfect open source clone.",
    thumbnail: "/games/flappy-bird.png",
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
    thumbnail: "/games/tetris.png",
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
    thumbnail: "/games/pacman.png",
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
    thumbnail: "/games/clumsy-bird.png",
    categories: ["runner", "action"],
    url: "https://ellisonleao.github.io/clumsy-bird/",
    orientation: "landscape"
  },
  {
    id: "breakout",
    title: "Breakout JS",
    provider: "Enclave Games",
    description: "Classic brick-breaking action! Bounce the ball off your paddle and destroy all the blocks.",
    thumbnail: "/games/breakout.png",
    categories: ["arcade", "action"],
    url: "http://breakout.enclavegames.com/",
    orientation: "portrait"
  },
  {
    id: "alien-invasion",
    title: "Alien Invasion",
    provider: "Cykod",
    description: "Defend Earth in this retro 2D space shooter. Move your ship and blast the alien swarm out of the sky.",
    thumbnail: "/games/alien-invasion.png",
    categories: ["action", "arcade"],
    url: "https://cykod.github.io/AlienInvasion/",
    orientation: "portrait"
  },
  {
    id: "hexgl",
    title: "HexGL Racing",
    provider: "BKCore",
    description: "Incredible high-speed 3D futuristic racing game built in HTML5 and WebGL. Push your reflexes to the limit!",
    thumbnail: "/games/hexgl.png",
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
