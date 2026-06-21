export interface RouletteNumberConfig {
  n: number;
  color: "red" | "black" | "green";
}

export const EUROPEAN_NUMBERS: RouletteNumberConfig[] = [
  { n: 0, color: "green" },
  { n: 32, color: "red" },
  { n: 15, color: "black" },
  { n: 19, color: "red" },
  { n: 4, color: "black" },
  { n: 21, color: "red" },
  { n: 2, color: "black" },
  { n: 25, color: "red" },
  { n: 17, color: "black" },
  { n: 34, color: "red" },
  { n: 6, color: "black" },
  { n: 27, color: "red" },
  { n: 13, color: "black" },
  { n: 36, color: "red" },
  { n: 11, color: "black" },
  { n: 30, color: "red" },
  { n: 8, color: "black" },
  { n: 23, color: "red" },
  { n: 10, color: "black" },
  { n: 5, color: "red" },
  { n: 24, color: "black" },
  { n: 16, color: "red" },
  { n: 33, color: "black" },
  { n: 1, color: "red" },
  { n: 20, color: "black" },
  { n: 14, color: "red" },
  { n: 31, color: "black" },
  { n: 9, color: "red" },
  { n: 22, color: "black" },
  { n: 18, color: "red" },
  { n: 29, color: "black" },
  { n: 7, color: "red" },
  { n: 28, color: "black" },
  { n: 12, color: "red" },
  { n: 35, color: "black" },
  { n: 3, color: "red" },
  { n: 26, color: "black" }
];

export const AMERICAN_NUMBERS: RouletteNumberConfig[] = [
  { n: 0, color: "green" },     // 0
  { n: -1, color: "green" },    // 00
  { n: 28, color: "black" },
  { n: 9, color: "red" },
  { n: 26, color: "black" },
  { n: 30, color: "red" },
  { n: 11, color: "black" },
  { n: 7, color: "red" },
  { n: 20, color: "black" },
  { n: 32, color: "red" },
  { n: 17, color: "black" },
  { n: 5, color: "red" },
  { n: 22, color: "black" },
  { n: 34, color: "red" },
  { n: 15, color: "black" },
  { n: 3, color: "red" },
  { n: 24, color: "black" },
  { n: 36, color: "red" },
  { n: 13, color: "black" },
  { n: 1, color: "red" },
  { n: 0, color: "green" }, // 0 again for wheel loop mapping
  { n: 27, color: "red" },
  { n: 10, color: "black" },
  { n: 25, color: "red" },
  { n: 29, color: "black" },
  { n: 12, color: "red" },
  { n: 8, color: "black" },
  { n: 19, color: "red" },
  { n: 31, color: "black" },
  { n: 18, color: "red" },
  { n: 6, color: "black" },
  { n: 21, color: "red" },
  { n: 33, color: "black" },
  { n: 16, color: "red" },
  { n: 4, color: "black" },
  { n: 23, color: "red" },
  { n: 35, color: "black" },
  { n: 14, color: "red" },
  { n: 2, color: "black" }
];

// Returns true if the cell is a winning bet for the given landed number.
export function isWinningBet(cellId: string, landedNumber: RouletteNumberConfig): boolean {
  const n = landedNumber.n;
  const color = landedNumber.color;

  if (cellId.startsWith("num-")) {
    const targetN = parseInt(cellId.replace("num-", ""), 10);
    return targetN === n;
  }

  // 0 and 00 lose all outside bets
  if (n === 0 || n === -1) return false;

  switch (cellId) {
    case "red": return color === "red";
    case "black": return color === "black";
    case "even": return n % 2 === 0;
    case "odd": return n % 2 === 1;
    case "1-18": return n >= 1 && n <= 18;
    case "19-36": return n >= 19 && n <= 36;
    case "doz-1": return n >= 1 && n <= 12;
    case "doz-2": return n >= 13 && n <= 24;
    case "doz-3": return n >= 25 && n <= 36;
    case "col-1": return n % 3 === 1;
    case "col-2": return n % 3 === 2;
    case "col-3": return n % 3 === 0;
  }
  return false;
}

export interface RouletteVariantConfig {
  straightPayout: number; // typically 36 (35:1)
  dozenColumnPayout: number; // typically 3 (2:1)
  evenMoneyPayout: number; // typically 2 (1:1)
  laPartage?: boolean; // if true, returns half of even-money bets on 0
}

export const EUROPEAN_CONFIG: RouletteVariantConfig = {
  straightPayout: 36,
  dozenColumnPayout: 3,
  evenMoneyPayout: 2
};

export const MINI_CONFIG: RouletteVariantConfig = {
  straightPayout: 12, // 11:1
  dozenColumnPayout: 3, // 2:1 (dozens are 1-4, 5-8, 9-12 in mini?)
  evenMoneyPayout: 2
};

export const LIGHTNING_CONFIG: RouletteVariantConfig = {
  straightPayout: 30, // 29:1
  dozenColumnPayout: 3,
  evenMoneyPayout: 2
};

export const ZERO_FREE_CONFIG: RouletteVariantConfig = {
  straightPayout: 35, // 34:1
  dozenColumnPayout: 3,
  evenMoneyPayout: 2
};

// Calculates total winnings given a bets object and the landed number
export function evaluateRoulettePayouts(
  bets: Record<string, number>,
  landedNumber: RouletteNumberConfig,
  config: RouletteVariantConfig = EUROPEAN_CONFIG,
  multiplierMap?: Record<number, number> // For Lightning: { number: payoutMultiplier } e.g. { 7: 150 }
): { totalWon: number; wonCells: string[] } {
  let totalWon = 0;
  const wonCells: string[] = [];

  for (const [cellId, amount] of Object.entries(bets)) {
    if (isWinningBet(cellId, landedNumber)) {
      wonCells.push(cellId);
      
      if (cellId.startsWith("num-")) {
        // Check for lightning multiplier override
        if (multiplierMap && multiplierMap[landedNumber.n]) {
          totalWon += amount * multiplierMap[landedNumber.n];
        } else {
          totalWon += amount * config.straightPayout;
        }
      } else if (cellId.startsWith("doz-") || cellId.startsWith("col-")) {
        totalWon += amount * config.dozenColumnPayout;
      } else {
        // Even money bets
        totalWon += amount * config.evenMoneyPayout;
      }
    } else {
      // Check La Partage for even money bets when 0 lands
      if (config.laPartage && landedNumber.n === 0) {
        if (["red", "black", "even", "odd", "1-18", "19-36"].includes(cellId)) {
          totalWon += amount * 0.5;
        }
      }
    }
  }

  return { totalWon, wonCells };
}
