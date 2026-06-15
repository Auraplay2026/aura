export type ArcadeCategoryId = "runner" | "puzzle" | "action" | "racing";

export interface ArcadeGame {
  id: string;
  title: string;
  provider: string;
  description: string;
  thumbnail: string;
  categories: ArcadeCategoryId[];
  url: string;
  isNew?: boolean;
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: "neon-surfer",
    title: "Tomb Runner",
    provider: "AuraPlay Studios",
    description: "High-speed 3D temple runner. Dodge ancient obstacles, collect gems, slide, jump, and run as far as you can.",
    thumbnail: "/games/tomb_runner.png",
    categories: ["runner", "action"],
    url: "https://www.y8.com/embed/tomb_runner",
    isNew: true
  },
  {
    id: "sugar-cascade",
    title: "Candy Rain 8",
    provider: "AuraPlay Casual",
    description: "Form sweet cascades and match colourful jellies and candy combos in this delicious match-3 puzzle adventure.",
    thumbnail: "/games/candy_rain.png",
    categories: ["puzzle"],
    url: "https://www.y8.com/embed/candy_rain_6"
  },
  {
    id: "slope-racing-3d",
    title: "Slope Racing 3D",
    provider: "AuraPlay Speed",
    description: "High-speed 3D neon ball race down a steep, tricky slope. Guide the ball safely and avoid red hazards to survive.",
    thumbnail: "https://img.gamepix.com/games/slope-racing-3d/cover/slope-racing-3d.png",
    categories: ["action", "racing"],
    url: "https://www.y8.com/embed/slope",
    isNew: true
  },
  {
    id: "cut-the-rope",
    title: "Cut The Rope",
    provider: "ZeptoLab",
    description: "Cut the ropes, feed candy to Om Nom, and collect gold stars in this award-winning physics puzzle game.",
    thumbnail: "https://img.gamepix.com/games/cut-the-rope/cover/cut-the-rope.png",
    categories: ["puzzle"],
    url: "https://www.y8.com/embed/cut_the_rope_2"
  },
  {
    id: "tentrix",
    title: "TenTrix",
    provider: "AuraPlay Casual",
    description: "Place colorful blocks on the board to form full vertical and horizontal lines in this addictive grid puzzle game.",
    thumbnail: "https://img.gamepix.com/games/tentrix/cover/tentrix.png",
    categories: ["puzzle"],
    url: "https://www.y8.com/embed/tentrix"
  },
  {
    id: "hextris",
    title: "Hextris",
    provider: "AuraPlay Arcade",
    description: "Fast-paced hexagonal block puzzle. Rotate the hexagon and match colors to clear lines before they reach the top.",
    thumbnail: "https://img.gamepix.com/games/hextris/cover/hextris.png",
    categories: ["puzzle", "action"],
    url: "https://www.y8.com/embed/hextris",
    isNew: true
  },
  {
    id: "2048",
    title: "2048",
    provider: "AuraPlay Casual",
    description: "The classic slide-matching puzzle game. Join the numbers to reach the legendary 2048 tile.",
    thumbnail: "https://img.gamepix.com/games/2048/cover/2048.png",
    categories: ["puzzle"],
    url: "https://www.y8.com/embed/2048"
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
