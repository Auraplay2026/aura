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
  // Action & Arcade
  {
    id: "tomb-runner",
    title: "Tomb Runner",
    provider: "GamePix",
    description: "High-speed 3D temple runner. Dodge ancient obstacles, collect gems, slide, jump, and run as far as you can.",
    thumbnail: "https://img.gamepix.com/games/tomb-runner/cover/tomb-runner.png",
    categories: ["runner", "action", "arcade"],
    url: "https://play.gamepix.com/tomb-runner/embed",
    isNew: true,
    orientation: "landscape"
  },
  {
    id: "moto-x3m",
    title: "Moto X3M",
    provider: "GamePix",
    description: "High-octane dirt bike racing. Tackle challenging obstacle courses, perform stunts, and race against the clock.",
    thumbnail: "https://img.gamepix.com/games/moto-x3m/cover/moto-x3m.png",
    categories: ["action", "racing", "arcade"],
    url: "https://play.gamepix.com/moto-x3m/embed",
    isNew: true,
    orientation: "landscape"
  },
  {
    id: "stickman-hook",
    title: "Stickman Hook",
    provider: "GamePix",
    description: "Physics-based swinging arcade game. Tap to hook and make incredible jumps to cross the finish line.",
    thumbnail: "https://img.gamepix.com/games/stickman-hook/cover/stickman-hook.png",
    categories: ["action", "arcade"],
    url: "https://play.gamepix.com/stickman-hook/embed",
    orientation: "landscape"
  },

  // Puzzle & Logic
  {
    id: "cut-the-rope",
    title: "Cut The Rope",
    provider: "ZeptoLab",
    description: "Cut the ropes, feed candy to Om Nom, and collect gold stars in this award-winning physics puzzle game.",
    thumbnail: "https://img.gamepix.com/games/cut-the-rope/cover/cut-the-rope.png",
    categories: ["puzzle"],
    url: "https://play.gamepix.com/cut-the-rope/embed",
    orientation: "portrait"
  },
  {
    id: "candy-rain-7",
    title: "Candy Rain 7",
    provider: "GamePix Casual",
    description: "Form sweet cascades and match colourful jellies and candy combos in this delicious match-3 puzzle adventure.",
    thumbnail: "https://img.gamepix.com/games/candy-rain-7/cover/candy-rain-7.png",
    categories: ["puzzle"],
    url: "https://play.gamepix.com/candy-rain-7/embed",
    orientation: "portrait"
  },
  {
    id: "2048",
    title: "2048",
    provider: "AuraPlay Casual",
    description: "The classic slide-matching puzzle game. Join the numbers to reach the legendary 2048 tile.",
    thumbnail: "https://img.gamepix.com/games/2048/cover/2048.png",
    categories: ["puzzle"],
    url: "https://gabrielecirulli.github.io/2048/",
    orientation: "portrait"
  },
  {
    id: "tentrix",
    title: "TenTrix",
    provider: "AuraPlay Casual",
    description: "Place colorful blocks on the board to form full vertical and horizontal lines in this addictive grid puzzle game.",
    thumbnail: "https://img.gamepix.com/games/tentrix/cover/tentrix.png",
    categories: ["puzzle"],
    url: "https://play.gamepix.com/tentrix/embed",
    orientation: "portrait"
  },

  // Racing & Sports
  {
    id: "slope-racing-3d",
    title: "Slope Racing 3D",
    provider: "GamePix",
    description: "High-speed 3D neon ball race down a steep, tricky slope. Guide the ball safely and avoid red hazards to survive.",
    thumbnail: "https://img.gamepix.com/games/slope-racing-3d/cover/slope-racing-3d.png",
    categories: ["action", "racing"],
    url: "https://play.gamepix.com/slope-racing-3d/embed",
    orientation: "landscape"
  },
  {
    id: "8-ball-billiards-classic",
    title: "8 Ball Billiards",
    provider: "GamePix Sports",
    description: "Premium pool game. Show off your billiard skills against the computer or a friend in classic 8-ball rules.",
    thumbnail: "https://img.gamepix.com/games/8-ball-billiards-classic/cover/8-ball-billiards-classic.png",
    categories: ["sports", "strategy"],
    url: "https://play.gamepix.com/8-ball-billiards-classic/embed",
    isNew: true,
    orientation: "landscape"
  },
  {
    id: "basketball-stars",
    title: "Basketball Stars",
    provider: "GamePix Sports",
    description: "Fast-paced street basketball. Dribble, shoot, and score in intense 1v1 or 2v2 multiplayer matches.",
    thumbnail: "https://img.gamepix.com/games/basketball-stars/cover/basketball-stars.png",
    categories: ["sports", "action"],
    url: "https://play.gamepix.com/basketball-stars/embed",
    isNew: true,
    orientation: "landscape"
  },

  // Strategy & Board
  {
    id: "chess-classic",
    title: "Chess Classic",
    provider: "GamePix Board",
    description: "Play the classic game of kings. Test your strategy against advanced AI or play with a friend.",
    thumbnail: "https://img.gamepix.com/games/chess-classic/cover/chess-classic.png",
    categories: ["strategy", "board"],
    url: "https://play.gamepix.com/chess-classic/embed",
    orientation: "portrait"
  },
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe",
    provider: "GamePix Board",
    description: "The ultimate casual board game. Place three Xs or Os in a row to win against the CPU.",
    thumbnail: "https://img.gamepix.com/games/tic-tac-toe/cover/tic-tac-toe.png",
    categories: ["board", "puzzle"],
    url: "https://play.gamepix.com/tic-tac-toe/embed",
    orientation: "portrait"
  },
  // Top 1% Global Hits
  {
    id: "om-nom-run",
    title: "Om Nom Run",
    provider: "ZeptoLab",
    description: "Join Om Nom on a spectacular running adventure! Dodge obstacles, use power-ups, and complete dynamic missions.",
    thumbnail: "https://img.gamepix.com/games/om-nom-run/cover/om-nom-run.png",
    categories: ["runner", "action", "arcade"],
    url: "https://play.gamepix.com/om-nom-run/embed",
    isNew: true,
    orientation: "portrait"
  },
  {
    id: "color-switch",
    title: "Color Switch",
    provider: "GamePix Arcade",
    description: "The legendary addictive arcade game! Tap to bounce your ball through obstacles matching its color.",
    thumbnail: "https://img.gamepix.com/games/color-switch/cover/color-switch.png",
    categories: ["action", "arcade", "puzzle"],
    url: "https://play.gamepix.com/color-switch/embed",
    isNew: true,
    orientation: "portrait"
  },
  {
    id: "paper-io-2",
    title: "Paper.io 2",
    provider: "Voodoo",
    description: "Conquer as much territory as possible and beat the competition. Draw shapes to claim land, but don't let enemies hit your tail!",
    thumbnail: "https://img.gamepix.com/games/paper-io-2/cover/paper-io-2.png",
    categories: ["action", "strategy", "arcade"],
    url: "https://play.gamepix.com/paper-io-2/embed",
    isNew: true,
    orientation: "landscape"
  },
  {
    id: "hole-io",
    title: "Hole.io",
    provider: "Voodoo",
    description: "Control your black hole, eating everything on your way. The more you eat, the bigger you get! Can you swallow the whole city?",
    thumbnail: "https://img.gamepix.com/games/hole-io/cover/hole-io.png",
    categories: ["action", "arcade"],
    url: "https://play.gamepix.com/hole-io/embed",
    orientation: "landscape"
  },
  {
    id: "shell-shockers",
    title: "Shell Shockers",
    provider: "Blue Wizard",
    description: "The world's premier egg-based multiplayer shooter! Crack your enemies in this intense 3D FPS arena.",
    thumbnail: "https://img.gamepix.com/games/shell-shockers/cover/shell-shockers.png",
    categories: ["action", "arcade"],
    url: "https://play.gamepix.com/shell-shockers/embed",
    isNew: true,
    orientation: "landscape"
  },
  {
    id: "uno-online",
    title: "Uno Online",
    provider: "GamePix Board",
    description: "Play the legendary card game against millions worldwide. Match colors and numbers, and don't forget to shout UNO!",
    thumbnail: "https://img.gamepix.com/games/uno-online/cover/uno-online.png",
    categories: ["board", "strategy"],
    url: "https://play.gamepix.com/uno-online/embed",
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
