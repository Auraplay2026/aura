export interface TutorialData {
  id: string;
  title: string;
  description: string;
  steps: string[];
}

export const GAME_TUTORIALS: Record<string, TutorialData> = {
  crash: {
    id: "crash",
    title: "How to play Crash",
    description: "Time your exit before the multiplier crashes.",
    steps: [
      "1. Enter your wager in ₹ before the round begins.",
      "2. Watch the multiplier exponentially rise over time.",
      "3. Hit 'Cash Out' to lock in your profits before the rocket crashes."
    ]
  },
  dice: {
    id: "dice",
    title: "How to play Dice",
    description: "Predict the outcome of a 100-point roll.",
    steps: [
      "1. Set your wager in ₹.",
      "2. Adjust the slider to pick your target win chance.",
      "3. Roll under or over the target number to multiply your money."
    ]
  },
  mines: {
    id: "mines",
    title: "How to play Mines",
    description: "Clear the board without hitting a hidden explosive.",
    steps: [
      "1. Place your initial ₹ bet and select the number of mines.",
      "2. Click the tiles to uncover gems and increase your multiplier.",
      "3. Cash out at any time, but if you hit a mine, your bet is lost."
    ]
  },
  blackjack: {
    id: "blackjack",
    title: "How to play Blackjack",
    description: "Beat the dealer by getting closer to 21.",
    steps: [
      "1. Place your ₹ chips on the table.",
      "2. Choose to Hit (take another card) or Stand (keep your hand).",
      "3. If your hand totals 21 or beats the dealer without busting, you win."
    ]
  },
  slots: {
    id: "slots",
    title: "How to play Slots",
    description: "Spin the reels to match premium symbols.",
    steps: [
      "1. Adjust your ₹ bet per spin using the controls below.",
      "2. Press Spin to tumble the reels and land matching symbols.",
      "3. Chain together combos and scatters to trigger massive multipliers."
    ]
  },
  arcade: {
    id: "arcade",
    title: "How to play Arcade Hub",
    description: "Use your keyboard to play premium 3D titles.",
    steps: [
      "1. Click 'Insert Coin' to pay the ₹ entry fee and unlock the engine.",
      "2. Once unlocked, click directly on the game screen to focus your mouse.",
      "3. Use W, A, S, D and your mouse to fully control the simulator."
    ]
  }
};

export function getTutorialForGame(categories: string[]): TutorialData {
  if (categories.includes("crash")) return GAME_TUTORIALS["crash"];
  if (categories.includes("originals")) {
     // A generic fallback for originals, though we can map specifically later
     return GAME_TUTORIALS["dice"];
  }
  if (categories.includes("table") || categories.includes("poker")) return GAME_TUTORIALS["blackjack"];
  if (categories.includes("racing") || categories.includes("sports") || categories.includes("adventure")) return GAME_TUTORIALS["arcade"];
  
  // Default to slots
  return GAME_TUTORIALS["slots"];
}
