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
    url: "https://play.gamepix.com/tomb-runner/embed", 
    isNew: true
  },
  {
    id: "sugar-cascade",
    title: "Candy Rain 8",
    provider: "AuraPlay Casual",
    description: "Form sweet cascades and match colourful jellies and candy combos in this delicious match-3 puzzle adventure.",
    thumbnail: "/games/candy_rain.png",
    categories: ["puzzle"],
    url: "https://play.gamepix.com/candy-rain-7/embed" 
  },
  {
    id: "zen-archery",
    title: "Archery World Tour",
    provider: "AuraPlay Physics",
    description: "Master wind and gravity. Aim with high precision to clear balloons and moving targets around the globe.",
    thumbnail: "/games/archery_world_tour.png",
    categories: ["action", "puzzle"],
    url: "https://play.gamepix.com/archery-world-tour/embed",
    isNew: true
  },
  {
    id: "madalin-stunt-cars-pro",
    title: "Two Stunt Supercars",
    provider: "AuraPlay Racing",
    description: "Perform insane drifts, jumps, and stunts in luxury supercars. Run open-world maps in single or multiplayer sandbox modes.",
    thumbnail: "/games/two_stunt_supercars.png",
    categories: ["action", "racing"] as ArcadeCategoryId[],
    url: "https://play.gamepix.com/madalin-stunt-cars-2/embed",
    isNew: true
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
