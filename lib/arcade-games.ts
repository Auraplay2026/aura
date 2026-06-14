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
    title: "Neon Surfer",
    provider: "AuraPlay Studios",
    description: "High-speed 3D endless runner. Dodge obstacles, collect powerups, and top the leaderboard.",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop", // Retro neon arcade look
    categories: ["runner", "action"],
    url: "https://html5.gamedistribution.com/23f66a26d7f941f2bb243b9eb22c4f82/", 
    isNew: true
  },
  {
    id: "sugar-cascade",
    title: "Sugar Cascade",
    provider: "AuraPlay Casual",
    description: "A fast-paced match-3 puzzle adventure. Form cascades and trigger explosive candy combos.",
    thumbnail: "https://images.unsplash.com/photo-1575510651918-09e45143ff42?w=800&h=600&fit=crop", // Candy/Sweet look
    categories: ["puzzle"],
    url: "https://html5.gamedistribution.com/1fdfbf6bd1424bf1b51e0ff6697397b9/" 
  },
  {
    id: "zen-archery",
    title: "Zen Archery",
    provider: "AuraPlay Physics",
    description: "Precision-based projectile game. Master gravity and wind to hit moving targets.",
    thumbnail: "https://images.unsplash.com/photo-1511227499330-819586145398?w=800&h=600&fit=crop", // Archery/Target
    categories: ["action", "puzzle"],
    url: "https://html5.gamedistribution.com/7620bcbc7fa648a0bac1491e7ee55dbb/",
    isNew: true
  },
  {
    id: "madalin-stunt-cars-pro",
    title: "Madalin Stunt Cars Pro",
    provider: "AuraPlay Racing",
    description: "High-fidelity 3D drifting & racing simulator. Master the tracks and perform insane stunts.",
    thumbnail: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
    categories: ["action", "racing"] as ArcadeCategoryId[],
    url: "https://html5.gamedistribution.com/62fcfec80e154722950d99ba115f2095/",
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
