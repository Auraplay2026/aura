export type ArcadeCategoryId = "runner" | "puzzle" | "action";

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
    url: "https://html5.gamedistribution.com/b97d2e38c9da4e10b271d4cb80ca2078/", // Subway Surfers clone equivalent
    isNew: true
  },
  {
    id: "sugar-cascade",
    title: "Sugar Cascade",
    provider: "AuraPlay Casual",
    description: "A fast-paced match-3 puzzle adventure. Form cascades and trigger explosive candy combos.",
    thumbnail: "https://images.unsplash.com/photo-1575510651918-09e45143ff42?w=800&h=600&fit=crop", // Candy/Sweet look
    categories: ["puzzle"],
    url: "https://html5.gamedistribution.com/0088df6ee0ce420faad0a3b2b8005663/" // Match 3 equivalent
  },
  {
    id: "zen-archery",
    title: "Zen Archery",
    provider: "AuraPlay Physics",
    description: "Precision-based projectile game. Master gravity and wind to hit moving targets.",
    thumbnail: "https://images.unsplash.com/photo-1511227499330-819586145398?w=800&h=600&fit=crop", // Archery/Target
    categories: ["action", "puzzle"],
    url: "https://html5.gamedistribution.com/d5a9d60edec84b3ca961b7f9eb3f22da/", // Archery clone
    isNew: true
  }
];

export const getArcadeGamesByCategory = (categoryId: ArcadeCategoryId) => {
  return ARCADE_GAMES.filter(game => game.categories.includes(categoryId));
};

export const getArcadeGameById = (id: string) => {
  return ARCADE_GAMES.find(game => game.id === id);
};
