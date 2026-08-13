import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';
import { getSystemConfig } from '@/lib/systemConfig';
import { 
  calculateGameOutcome,
  calculateDiceOutcome, 
  calculateLimboOutcome, 
  calculateCoinflipOutcome, 
  calculateKenoOutcome, 
  calculateRouletteOutcome, 
  calculateBlackjackOutcome, 
  calculateWheelOutcome,
  calculatePlinkoOutcome
} from '@/lib/fair-casino-math';
import { generateFairRNGSeed, FairRNG } from '@/lib/fair-rng';
import { 
  evaluateRoulettePayouts, 
  EUROPEAN_NUMBERS, 
  AMERICAN_NUMBERS, 
  EUROPEAN_CONFIG, 
  MINI_CONFIG, 
  LIGHTNING_CONFIG, 
  ZERO_FREE_CONFIG,
  isWinningBet
} from '@/lib/roulette-math';
import fs from 'fs';
import path from 'path';
import { obfuscateFloat } from '@/lib/utils';

async function saveGameSession(tx: any, session: any) {
  const { sessionId, email, gameId, gameTitle, betAmount, commission, gameState, timestamp, ...rest } = session;
  await tx.gameSession.upsert({
    where: { id: sessionId },
    update: {
      gameState,
      data: rest
    },
    create: {
      id: sessionId,
      email,
      gameId,
      gameTitle,
      betAmount,
      commission,
      gameState,
      timestamp,
      data: rest
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, gameTitle, betAmount, targetMultiplier, selectedTarget, bets, sideBets } = body;
    let email = body.email || body.emailOrUsername;

    let sessionUser: string;
    try {
      sessionUser = await verifyUserSession(email);
      if (!email) {
        email = sessionUser;
      }
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    if (!gameId || betAmount === undefined) {
      return NextResponse.json({ error: 'Missing required parameters: gameId, betAmount.' }, { status: 400 });
    }

    const parsedBetAmount = Number(betAmount);
    if (typeof betAmount !== 'number' || isNaN(parsedBetAmount) || !isFinite(parsedBetAmount) || parsedBetAmount <= 0) {
      return NextResponse.json({ error: 'Bet amount must be a valid finite number > 0.' }, { status: 400 });
    }

    if (targetMultiplier !== undefined) {
      const parsedMult = Number(targetMultiplier);
      if (isNaN(parsedMult) || !isFinite(parsedMult) || parsedMult <= 0) {
        return NextResponse.json({ error: 'Target multiplier must be a valid positive finite number.' }, { status: 400 });
      }
    }

    const response = await prisma.$transaction(async (txClient) => {
      // Lock user row by email OR username to prevent race conditions
      const lockedRows: any[] = await txClient.$queryRaw`
        SELECT id FROM "User" 
        WHERE LOWER(email) = LOWER(${email}) OR LOWER(username) = LOWER(${email})
        FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
      }

      const user = await txClient.user.findFirst({
        where: { id: lockedRows[0].id },
        include: { transactions: true }
      });

      if (!user) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
      }

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;

      // Check balance
      // Live fee checking for Live casino categories (3% baseline fee)
      let isLiveCasino = false;
      const cleanTitle = (gameTitle || "").toLowerCase();
      if (gameId.startsWith("live-") || gameId.startsWith("table-") || gameId.startsWith("roulette-") || gameId.startsWith("blackjack-") || gameId.startsWith("poker-") || cleanTitle.includes("live") || cleanTitle.includes("fusion")) {
        isLiveCasino = true;
      }

      let commission = 0;
      if (isLiveCasino && betAmount > 0) {
        const vipLevel = user.vipLevel || 'Bronze';
        let feeRate = 0.03;
        if (vipLevel === 'Silver') feeRate = 0.02;
        else if (vipLevel === 'Gold') feeRate = 0.01;
        else if (vipLevel === 'Platinum') feeRate = 0.005;
        else if (vipLevel === 'Diamond') feeRate = 0.0;
        commission = Math.round(betAmount * feeRate * 100) / 100;
      }

      const totalDeduction = betAmount + commission;

      if (activeBalance < totalDeduction) {
        return NextResponse.json({ error: 'INSUFFICIENT_FUNDS', required: totalDeduction, available: activeBalance }, { status: 400 });
      }

      // Determine game type
      let gameType: "SLOTS" | "CRASH" | "TABLE" | "ORIGINAL" = "ORIGINAL";
      if (gameId.startsWith("slot-")) {
        gameType = "SLOTS";
      } else if (gameId.startsWith("crash-") || gameId === "orig-1" || gameId === "crash" || gameId === "aviator") {
        gameType = "CRASH";
      } else if (gameId.startsWith("table-") || gameId.startsWith("roulette-") || gameId.startsWith("blackjack-") || gameId.startsWith("poker-") || gameId === "orig-8" || gameId === "orig-11") {
        gameType = "TABLE";
      }

      const systemConfig = getSystemConfig();
      const demoWinRate = systemConfig.demoWinRate ?? 80;
      const realWinRate = systemConfig.realWinRate ?? 30;
      const isDemo = accountType === 'demo';

      // ── ADMIN WIN RATE GATE ──────────────────────────────────────────────────
      // The admin-configured win rate is the EXACT authority on outcomes.
      // adminWinChance: 0.0 = always loses, 1.0 = always wins.
      // adminForcesWin=true  → this bet MUST produce a positive payout
      // adminForcesLoss=true → this bet MUST produce zero payout
      // This gives the admin EXACT win rate control, not just a ceiling.
      const adminWinChance = (isDemo ? demoWinRate : realWinRate) / 100;
      const adminOutcomeRoll = Math.random();
      const adminForcesWin  = adminOutcomeRoll < adminWinChance;
      const adminForcesLoss = !adminForcesWin;
      // ────────────────────────────────────────────────────────────────────────

      let outcome = null;
      if (gameId.startsWith("slot-")) {
        outcome = calculateGameOutcome(gameType, targetMultiplier);
        // Admin gate: override slot result to match admin decision
        if (adminForcesLoss && outcome) {
          outcome = { ...outcome, multiplier: 0, isWin: false };
        } else if (adminForcesWin && outcome && outcome.multiplier === 0) {
          outcome = { ...outcome, multiplier: 1.98, isWin: true };
        }
      }

      // Progressive/interactive games: Mines, Tower, Crash/Aviator
      const isInteractive = gameId === "orig-4" || gameId === "orig-7" || gameId === "orig-1" || gameId === "aviator" || gameId.startsWith("crash-");

      if (isInteractive) {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const newBalance = Math.round((activeBalance - totalDeduction) * 100) / 100;

        // Update balance immediately in DB
        const updates: any = { balance: newBalance };
        if (accountType === 'real') {
          updates.realBalance = newBalance;
          const newTotalWagered = (user.totalWagered || 0) + betAmount;
          updates.totalWagered = newTotalWagered;
          
          let resolvedVip = user.vipLevel || 'Bronze';
          if (!user.manualVipLevel || user.manualVipLevel === 'Auto') {
            if (newTotalWagered >= 5000000) resolvedVip = 'Diamond';
            else if (newTotalWagered >= 1000000) resolvedVip = 'Platinum';
            else if (newTotalWagered >= 250000) resolvedVip = 'Gold';
            else if (newTotalWagered >= 50000) resolvedVip = 'Silver';
            else resolvedVip = 'Bronze';
          } else {
            resolvedVip = user.manualVipLevel;
          }
          updates.vipLevel = resolvedVip;
        } else {
          updates.demoBalance = newBalance;
        }

        await updateUser(email, updates, txClient);

        let mineLocations: number[] = [];
        let crashPoint = 0;
        let reachedRow = 0;
        let fairSeed = null;
        let sessionData: any = {};

        if (gameId === "orig-4") { // Mines
          const minesCount = selectedTarget ? Number(selectedTarget) : 3;
          fairSeed = generateFairRNGSeed(`mines-${Date.now()}`);
          const rng = new FairRNG(fairSeed);
          const grid = Array(25 - minesCount).fill(false).concat(Array(minesCount).fill(true));
          let shuffled = rng.shuffle(grid);
          // ── ADMIN MINES GATE ─────────────────────────────────────────────
          // adminForcesLoss → guarantee mine in first half (player busts early)
          // adminForcesWin  → push ALL mines to back half (player can safely
          //                   reveal the entire front half and cash out)
          shuffled = [...shuffled];
          const minePositions: number[] = [];
          shuffled.forEach((v, i) => { if (v) minePositions.push(i); });

          if (adminForcesLoss) {
            // Ensure at least 1 mine is in tiles 0-12 (random, not always tile 0)
            if (!minePositions.some(p => p <= 12)) {
              const swapTarget = Math.floor(rng.next() * 13);
              const mineToSwap = minePositions[0];
              shuffled[swapTarget] = true;
              shuffled[mineToSwap] = false;
            }
          } else if (adminForcesWin) {
            // Push ALL mines into tiles 13-24 so the first half is safe
            for (const mp of minePositions) {
              if (mp <= 12) {
                // Find an open safe slot in 13-24
                for (let t = 13; t < 25; t++) {
                  if (!shuffled[t]) {
                    shuffled[t] = true;
                    shuffled[mp] = false;
                    break;
                  }
                }
              }
            }
          }
          // ─────────────────────────────────────────────────────────────────

          mineLocations = shuffled.reduce((acc: number[], isMine: boolean, idx: number) => {
            if (isMine) acc.push(idx);
            return acc;
          }, []);
          
          sessionData = {
            sessionId,
            email,
            gameId,
            gameTitle: gameTitle || "Mines",
            betAmount,
            commission,
            minesCount,
            mineLocations,
            revealedTiles: [],
            activeMultiplier: 1.0,
            gameState: "playing",
            accountType,
            timestamp: Date.now(),
            seed: fairSeed
          };
        } else if (gameId === "orig-7") { // Tower
          fairSeed = generateFairRNGSeed(`tower-${Date.now()}`);
          const rng = new FairRNG(fairSeed);
          reachedRow = 0;
          if (adminForcesLoss) {
            reachedRow = 0; // bomb on floor 1 — instant bust
          } else if (adminForcesWin) {
            reachedRow = 5; // player can safely climb 5 floors and cash out
          } else {
            // Fair RNG climb (never reached since adminForcesWin covers the else)
            for (let r = 0; r < 9; r++) {
              const isSafe = rng.nextInt(0, 3) >= 1;
              if (!isSafe) break;
              reachedRow = r + 1;
            }
          }

          sessionData = {
            sessionId,
            email,
            gameId,
            gameTitle: gameTitle || "Tower",
            betAmount,
            commission,
            revealedRows: 0,
            activeMultiplier: 1.0,
            reachedRow,
            gameState: "playing",
            accountType,
            timestamp: Date.now(),
            seed: fairSeed
          };
        } else { // Crash or Aviator
          fairSeed = generateFairRNGSeed(`crash-${Date.now()}`);
          const rng = new FairRNG(fairSeed);
          if (adminForcesLoss) {
            // Instant bust — crashes before any cashout possible
            crashPoint = 1.00;
          } else if (adminForcesWin) {
            // Very high crash point gives player ample window to cash out
            // Use RNG so it's not always exactly 20.00 (looks organic)
            const uniformRandom = rng.next();
            crashPoint = Math.round((15 + uniformRandom * 35) * 100) / 100; // 15x–50x
          } else {
            const uniformRandom = rng.next();
            crashPoint = Math.round((0.97 / uniformRandom) * 100) / 100;
            if (crashPoint < 1.01) crashPoint = 1.01;
          }

          sessionData = {
            sessionId,
            email,
            gameId,
            gameTitle: gameTitle || "Crash",
            betAmount,
            commission,
            crashPoint,
            gameState: "playing",
            accountType,
            timestamp: Date.now(),
            seed: fairSeed
          };
        }

        await saveGameSession(txClient, sessionData);

        let crashPointSecure = undefined;
        if (gameId === 'orig-1' || gameId === 'aviator' || gameId.startsWith('crash-')) {
          const finalPoint = crashPoint || (outcome ? outcome.multiplier : 1.0);
          crashPointSecure = obfuscateFloat(finalPoint, sessionId);
        }

        return NextResponse.json({
          success: true,
          isInteractive: true,
          sessionId,
          activeMultiplier: 1.0,
          crashPointSecure,
          newBalance
        }, { status: 200 });
      }

      // Custom game-specific outcome adjustments
      let finalMultiplier = 0;
      let responseMultiplier = 0;
      let targetBinIndex: number | undefined = undefined;
      let fairSeed = null;
      let extraData: any = {};
      let landedNumber: any = undefined;
      let payout: number = 0;
      let wonCells: string[] = [];

      if (gameId === "orig-3" || gameId.includes("plinko")) { // Plinko
        const risk = (selectedTarget || "medium") as "low" | "medium" | "high" | "extreme";
        fairSeed = generateFairRNGSeed(`plinko-${Date.now()}`);
        const fairOutcome = calculatePlinkoOutcome(risk, fairSeed);
        finalMultiplier = fairOutcome.multiplier;
        responseMultiplier = finalMultiplier;
        targetBinIndex = fairOutcome.targetBinIndex;
      } else if (gameId === "orig-5" || gameId.includes("dice")) { // Dice
        const targetVal = targetMultiplier ? Number(targetMultiplier) : 50.0;
        const direction = selectedTarget === 'under' ? 'under' : 'over';
        fairSeed = generateFairRNGSeed(`dice-${Date.now()}`);
        const fairOutcome = calculateDiceOutcome(targetVal, direction, fairSeed);
        finalMultiplier = fairOutcome.multiplier;
        responseMultiplier = finalMultiplier;
      } else if (gameId === "orig-9" || gameId.includes("coin")) { // Coinflip
        const choice = (selectedTarget || 'heads').toLowerCase();
        // CoinflipEngine uses "AURA" and "SKULL"
        const mappedChoice = (choice === "aura" || choice === "heads") ? "heads" : "tails";
        fairSeed = generateFairRNGSeed(`coinflip-${Date.now()}`);
        const fairOutcome = calculateCoinflipOutcome(mappedChoice as 'heads' | 'tails', fairSeed);
        finalMultiplier = fairOutcome.multiplier;
        responseMultiplier = finalMultiplier;
        extraData = { 
          winningSide: fairOutcome.multiplier > 0 
            ? (selectedTarget || "AURA") 
            : ((selectedTarget || "AURA") === "AURA" ? "SKULL" : "AURA")
        };
      } else if (gameId === "orig-2" || gameId.includes("limbo")) { // Limbo
        const targetVal = targetMultiplier ? Number(targetMultiplier) : 2.0;
        fairSeed = generateFairRNGSeed(`limbo-${Date.now()}`);
        const fairOutcome = calculateLimboOutcome(targetVal, fairSeed);
        finalMultiplier = fairOutcome.isWin ? targetVal : 0;
        const rng = new FairRNG(fairSeed);
        const uniformRandom = rng.next();
        const rolledMultiplier = Math.round((0.97 / uniformRandom) * 100) / 100;
        responseMultiplier = rolledMultiplier;
      } else if (gameId === "orig-6" || gameId.includes("keno")) { // Keno
        const selected = Array.isArray(selectedTarget) ? selectedTarget.map(Number) : [1, 2, 3, 4, 5];
        fairSeed = generateFairRNGSeed(`keno-${Date.now()}`);
        const fairOutcome = calculateKenoOutcome(selected, 20, fairSeed);
        finalMultiplier = fairOutcome.multiplier;
        responseMultiplier = finalMultiplier;
      } else if (gameId === "orig-10" || gameId.includes("wheel")) { // Wheel
        fairSeed = generateFairRNGSeed(`wheel-${Date.now()}`);
        const fairOutcome = calculateWheelOutcome(fairSeed);
        finalMultiplier = fairOutcome.multiplier;
        responseMultiplier = finalMultiplier;
      } else if (gameId.startsWith("roulette-") || gameId === "orig-11" || gameId.startsWith("orig-r")) { // Roulette variants
        let numbersList = EUROPEAN_NUMBERS;
        let config = EUROPEAN_CONFIG;

        if (gameId.includes("american") || gameId === "orig-r2") {
          numbersList = AMERICAN_NUMBERS;
        } else if (gameId.includes("french") || gameId === "orig-r3") {
          config = { ...EUROPEAN_CONFIG, laPartage: true };
        } else if (gameId.includes("mini") || gameId === "orig-r4") {
          const MINI_NUMBERS = [
            { n: 0, color: "green" as const },
            { n: 5, color: "red" as const },
            { n: 12, color: "red" as const },
            { n: 3, color: "red" as const },
            { n: 10, color: "black" as const },
            { n: 1, color: "red" as const },
            { n: 8, color: "black" as const },
            { n: 9, color: "red" as const },
            { n: 2, color: "black" as const },
            { n: 7, color: "red" as const },
            { n: 6, color: "black" as const },
            { n: 11, color: "black" as const },
            { n: 4, color: "black" as const }
          ];
          numbersList = MINI_NUMBERS;
          config = MINI_CONFIG;
        } else if (gameId.includes("zero-free") || gameId === "orig-r9") {
          numbersList = EUROPEAN_NUMBERS.filter(n => n.n !== 0);
          config = ZERO_FREE_CONFIG;
        } else if (gameId.includes("lightning") || gameId === "orig-r6") {
          config = LIGHTNING_CONFIG;
        }

        fairSeed = generateFairRNGSeed(`roulette-${Date.now()}`);
        const rng = new FairRNG(fairSeed);

        if (gameId.includes("multiwheel") || gameId === "orig-r5") {
          // Multi-wheel: 4 independent spins
          let candidates = numbersList;
          if (adminForcesLoss) {
            const losingCandidates = numbersList.filter(n => {
              const { totalWon } = evaluateRoulettePayouts(bets || {}, n, config);
              return totalWon === 0;
            });
            if (losingCandidates.length > 0) candidates = losingCandidates;
          } else if (adminForcesWin) {
            const winningCandidates = numbersList.filter(n => {
              const { totalWon } = evaluateRoulettePayouts(bets || {}, n, config);
              return totalWon > 0;
            });
            if (winningCandidates.length > 0) candidates = winningCandidates;
          }

          const spins: any[] = [];
          let totalWinnings = 0;
          for (let w = 0; w < 4; w++) {
            const spinIdx = rng.nextInt(0, candidates.length);
            const landed = candidates[spinIdx];
            spins.push(landed);
            const { totalWon } = evaluateRoulettePayouts(bets || {}, landed, config);
            totalWinnings += totalWon;
          }
          landedNumber = spins[0];
          payout = totalWinnings;
          extraData = { multiWheelSpins: spins, winningNumber: landedNumber };
        } else if (gameId.includes("doubleball") || gameId === "orig-r7") {
          // Double ball: 2 independent balls
          let candidatePairs: [any, any][] = [];
          for (let i = 0; i < numbersList.length; i++) {
            for (let j = 0; j < numbersList.length; j++) {
              candidatePairs.push([numbersList[i], numbersList[j]]);
            }
          }

          let candidates = candidatePairs;
          const evaluateDoubleBallPayout = (landed1: any, landed2: any) => {
            let totalWinnings = 0;
            for (const [cellId, amountVal] of Object.entries(bets || {})) {
              const amount = Number(amountVal);
              const win1 = isWinningBet(cellId, landed1);
              const win2 = isWinningBet(cellId, landed2);
              if (cellId.startsWith("num-")) {
                if (win1 && win2) totalWinnings += amount * 35;
                else if (win1 || win2) totalWinnings += amount * 18;
              } else {
                if (win1 && win2) {
                  if (["red", "black", "even", "odd", "1-18", "19-36"].includes(cellId)) totalWinnings += amount * 3;
                  else if (cellId.startsWith("doz-") || cellId.startsWith("col-")) totalWinnings += amount * 8;
                }
              }
            }
            return totalWinnings;
          };

          if (adminForcesLoss) {
            const losingCandidates = candidatePairs.filter(pair => evaluateDoubleBallPayout(pair[0], pair[1]) === 0);
            if (losingCandidates.length > 0) candidates = losingCandidates;
          } else if (adminForcesWin) {
            const winningCandidates = candidatePairs.filter(pair => evaluateDoubleBallPayout(pair[0], pair[1]) > 0);
            if (winningCandidates.length > 0) candidates = winningCandidates;
          }

          const pairIdx = rng.nextInt(0, candidates.length);
          const chosenPair = candidates[pairIdx];
          const landed1 = chosenPair[0];
          const landed2 = chosenPair[1];

          landedNumber = landed1;
          payout = evaluateDoubleBallPayout(landed1, landed2);
          extraData = { ball2: landed2, winningNumber: landedNumber };
        } else if (gameId.includes("lightning") || gameId === "orig-r6") {
          // Lightning: random lightning numbers struck with multipliers
          const numStrikes = rng.nextInt(1, 6);
          const strikes: Record<number, number> = {};
          const availableNumbers = Array.from({ length: 36 }, (_, i) => i + 1);
          const shuffledAvailable = rng.shuffle(availableNumbers);
          const multOptions = [50, 100, 150, 200, 250, 300, 350, 400, 500];
          for (let i = 0; i < numStrikes; i++) {
            const strikeNum = shuffledAvailable[i];
            const strikeMult = multOptions[rng.nextInt(0, multOptions.length)];
            strikes[strikeNum] = strikeMult;
          }

          let candidates = numbersList;
          if (adminForcesLoss) {
            const losingCandidates = numbersList.filter(n => {
              const { totalWon } = evaluateRoulettePayouts(bets || {}, n, config, strikes);
              return totalWon === 0;
            });
            if (losingCandidates.length > 0) candidates = losingCandidates;
          } else if (adminForcesWin) {
            const winningCandidates = numbersList.filter(n => {
              const { totalWon } = evaluateRoulettePayouts(bets || {}, n, config, strikes);
              return totalWon > 0;
            });
            if (winningCandidates.length > 0) candidates = winningCandidates;
          }

          const spinIdx = rng.nextInt(0, candidates.length);
          landedNumber = candidates[spinIdx];
          const { totalWon, wonCells: wc } = evaluateRoulettePayouts(bets || {}, landedNumber, config, strikes);
          payout = totalWon;
          wonCells = wc;
          extraData = { lightningStrikes: strikes, winningNumber: landedNumber, wonCells };
        } else {
          // Standard Roulette
          let candidates = numbersList;
          if (adminForcesLoss) {
            const losingCandidates = numbersList.filter(n => {
              const { totalWon } = evaluateRoulettePayouts(bets || {}, n, config);
              return totalWon === 0;
            });
            if (losingCandidates.length > 0) candidates = losingCandidates;
          } else if (adminForcesWin) {
            const winningCandidates = numbersList.filter(n => {
              const { totalWon } = evaluateRoulettePayouts(bets || {}, n, config);
              return totalWon > 0;
            });
            if (winningCandidates.length > 0) candidates = winningCandidates;
          }

          const spinIdx = rng.nextInt(0, candidates.length);
          landedNumber = candidates[spinIdx];
          const { totalWon, wonCells: wc } = evaluateRoulettePayouts(bets || {}, landedNumber, config);
          payout = totalWon;
          wonCells = wc;
          extraData = { winningNumber: landedNumber, wonCells };
        }

        finalMultiplier = betAmount > 0 ? payout / betAmount : 0;
        responseMultiplier = finalMultiplier;
      } else if (gameId === "baccarat" || gameId.includes("baccarat") || gameId === "table-3") {
        const choice = (selectedTarget || 'PLAYER').toUpperCase();
        fairSeed = generateFairRNGSeed(`baccarat-${Date.now()}`);
        const rng = new FairRNG(fairSeed);
        const roll = rng.next();
        let winningHand: 'PLAYER' | 'BANKER' | 'TIE' = 'PLAYER';
        if (roll < 0.4462) {
          winningHand = 'PLAYER';
        } else if (roll < 0.4462 + 0.4586) {
          winningHand = 'BANKER';
        } else {
          winningHand = 'TIE';
        }

        let isWin = choice === winningHand;
        let odds = 0;
        if (isWin) {
          if (choice === 'PLAYER') odds = 2.0;
          else if (choice === 'BANKER') odds = 1.95;
          else if (choice === 'TIE') odds = 9.0;
        }
        finalMultiplier = odds;
        responseMultiplier = odds;
        extraData = { winningHand };
      } else if (gameId === "orig-8" || gameId.startsWith("blackjack-") || gameId.startsWith("orig-20")) { // Blackjack
        fairSeed = generateFairRNGSeed(`blackjack-${Date.now()}`);
        const rng = new FairRNG(fairSeed);
        
        let mainResult: "win" | "lose" | "push" | "blackjack" = "lose";
        let mainMultiplier = 0;
        
        const mainRoll = rng.next();
        if (mainRoll < 0.047) {
          mainResult = "blackjack";
          mainMultiplier = 2.5;
        } else if (mainRoll < 0.4222) {
          mainResult = "win";
          mainMultiplier = 2.0;
        } else if (mainRoll < 0.4222 + 0.0848) {
          mainResult = "push";
          mainMultiplier = 1.0;
        } else {
          mainResult = "lose";
          mainMultiplier = 0;
        }
        
        let sideBetsPayout = 0;
        let isPairsWin = false;
        let pairsType: string | null = null;
        let isThreeWin = false;
        let threeType: string | null = null;
        
        if (sideBets?.pairs) {
          const pairsRoll = rng.next();
          if (pairsRoll < 0.015) {
            isPairsWin = true;
            pairsType = "perfect";
            sideBetsPayout += 25;
          } else if (pairsRoll < 0.030) {
            isPairsWin = true;
            pairsType = "colored";
            sideBetsPayout += 12;
          } else if (pairsRoll < 0.045) {
            isPairsWin = true;
            pairsType = "mixed";
            sideBetsPayout += 6;
          }
        }
        
        if (sideBets?.three) {
          const threeRoll = rng.next();
          if (threeRoll < 0.0005) {
            isThreeWin = true;
            threeType = "suited_trips";
            sideBetsPayout += 100;
          } else if (threeRoll < 0.0025) {
            isThreeWin = true;
            threeType = "straight_flush";
            sideBetsPayout += 40;
          } else if (threeRoll < 0.0075) {
            isThreeWin = true;
            threeType = "three_of_a_kind";
            sideBetsPayout += 30;
          } else if (threeRoll < 0.0385) {
            isThreeWin = true;
            threeType = "straight";
            sideBetsPayout += 10;
          } else if (threeRoll < 0.096) {
            isThreeWin = true;
            threeType = "flush";
            sideBetsPayout += 5;
          }
        }
        
        let mainWagerProp = 1.0;
        let pairsWagerProp = 0.0;
        let threeWagerProp = 0.0;
        if (sideBets?.pairs && sideBets?.three) {
          mainWagerProp = 0.70;
          pairsWagerProp = 0.15;
          threeWagerProp = 0.15;
        } else if (sideBets?.pairs) {
          mainWagerProp = 0.85;
          pairsWagerProp = 0.15;
        } else if (sideBets?.three) {
          mainWagerProp = 0.85;
          threeWagerProp = 0.15;
        }
        
        const finalMultiplierVal = (mainWagerProp * mainMultiplier) + 
                                (pairsWagerProp * (sideBetsPayout > 0 ? sideBetsPayout + 1 : 0)) + 
                                (threeWagerProp * (sideBetsPayout > 0 ? sideBetsPayout + 1 : 0));
                                
        finalMultiplier = finalMultiplierVal;
        responseMultiplier = finalMultiplierVal;
        
        extraData = {
          mainResult,
          sideBetsPayout,
          isPairsWin,
          pairsType,
          isThreeWin,
          threeType
        };
      } else if (!gameId.startsWith("slot-")) {
        // General custom games
        fairSeed = generateFairRNGSeed(`custom-${Date.now()}`);
        const rng = new FairRNG(fairSeed);
        const isWin = rng.next() < 0.48;
        finalMultiplier = isWin ? (targetMultiplier ? Number(targetMultiplier) : 2.0) : 0;
        responseMultiplier = finalMultiplier;
      } else {
        // Slot machine fallback
        finalMultiplier = outcome ? outcome.multiplier : 0;
        responseMultiplier = outcome ? outcome.multiplier : 0;
      }

      // ── ADMIN WIN RATE GATE (instant-resolve games) ─────────────────────────
      // EXACT control: adminForcesLoss → zero payout regardless of game result
      //                adminForcesWin  → positive payout regardless of game result
      //
      // Non-roulette games (dice, limbo, plinko, keno, blackjack, baccarat, etc.)
      if (landedNumber === undefined) {
        if (adminForcesLoss) {
          // Guaranteed loss: wipe any win the game math computed
          finalMultiplier = 0;
          responseMultiplier = 0;
        } else if (adminForcesWin && finalMultiplier === 0) {
          // Guaranteed win: game math said loss but admin says win
          // Use Limbo's target multiplier if available (player-chosen payout),
          // otherwise standard near-even money return.
          if (gameId === 'orig-2' || gameId.includes('limbo')) {
            finalMultiplier = targetMultiplier ? Number(targetMultiplier) : 2.0;
          } else {
            finalMultiplier = 1.98; // near-even money — believable win
          }
          responseMultiplier = finalMultiplier;
        }
      }
      // Roulette path: payout is already computed from landed number + bet layout
      if (landedNumber !== undefined) {
        if (adminForcesLoss) {
          payout = 0;
        } else if (adminForcesWin && payout === 0) {
          // No winning bets on this spin — return even-money on total wager
          payout = Math.round(betAmount * 2 * 100) / 100;
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      // If payout is already calculated (Roulette), use it. Otherwise compute from finalMultiplier.
      const computedPayout = landedNumber !== undefined ? payout : Math.round(betAmount * finalMultiplier * 100) / 100;
      const netChange = computedPayout - totalDeduction;
      const newBalance = Math.round((activeBalance + netChange) * 100) / 100;

      const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const tx: Transaction = {
        id: txId,
        type: 'casino',
        amount: Math.abs(netChange),
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: commission > 0 
          ? `Played ${gameTitle || gameId} (Wager: ₹${betAmount} + ₹${commission.toFixed(2)} Live Fee, Payout: ₹${computedPayout})`
          : `Played ${gameTitle || gameId} (Wager: ₹${betAmount}, Payout: ₹${computedPayout})`,
        status: 'Completed'
      };

      const updates: any = {
        balance: newBalance,
        transactions: [tx]
      };

      if (accountType === 'real') {
        updates.realBalance = newBalance;
        updates.realTransactions = [tx];
        const newTotalWagered = (user.totalWagered || 0) + betAmount;
        updates.totalWagered = newTotalWagered;
        
        let resolvedVip = user.vipLevel || 'Bronze';
        if (!user.manualVipLevel || user.manualVipLevel === 'Auto') {
          if (newTotalWagered >= 5000000) resolvedVip = 'Diamond';
          else if (newTotalWagered >= 1000000) resolvedVip = 'Platinum';
          else if (newTotalWagered >= 250000) resolvedVip = 'Gold';
          else if (newTotalWagered >= 50000) resolvedVip = 'Silver';
          else resolvedVip = 'Bronze';
        } else {
          resolvedVip = user.manualVipLevel;
        }
        updates.vipLevel = resolvedVip;
      } else {
        updates.demoBalance = newBalance;
        updates.demoTransactions = [tx];
      }

      await updateUser(email, updates, txClient);

      return NextResponse.json({
        success: true,
        isInteractive: false,
        isWin: finalMultiplier > 0,
        multiplier: responseMultiplier,
        payout: computedPayout,
        newBalance,
        targetBinIndex,
        transactionId: txId,
        seed: fairSeed,
        ...extraData
      }, { status: 200 });
    });

    return response;

  } catch (err: any) {
    console.error("Casino Bet API Error:", err);
    return NextResponse.json({
      error: 'Failed to process casino bet.',
      ...(process.env.NODE_ENV !== 'production' && { details: err?.message })
    }, { status: 500 });
  }
}
