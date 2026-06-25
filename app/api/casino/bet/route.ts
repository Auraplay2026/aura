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
import fs from 'fs';
import path from 'path';

const SESSIONS_FILE = path.join(process.cwd(), 'data', 'active_game_sessions.json');

function getSessions(): Record<string, any> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read sessions file:", err);
  }
  return {};
}

function saveSessions(sessions: Record<string, any>) {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write sessions file:", err);
  }
}

export async function POST(request: Request) {
  try {
    const { email, gameId, gameTitle, betAmount, targetMultiplier, selectedTarget } = await request.json();

    if (!email || !gameId || betAmount === undefined) {
      return NextResponse.json({ error: 'Missing required parameters: email, gameId, betAmount.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
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
      // Lock user row first to prevent race conditions
      await txClient.$queryRaw`SELECT id FROM "User" WHERE email = ${email} FOR UPDATE`;

      const user = await txClient.user.findUnique({
        where: { email },
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

      let outcome = null;
      if (gameId.startsWith("slot-")) {
        outcome = calculateGameOutcome(gameType, targetMultiplier);
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

        // Cache session data server-side
        const sessions = getSessions();
        
        let mineLocations: number[] = [];
        let crashPoint = 0;
        let reachedRow = 0;
        let fairSeed = null;

        if (gameId === "orig-4") { // Mines
          const minesCount = selectedTarget ? Number(selectedTarget) : 3;
          fairSeed = generateFairRNGSeed(`mines-${Date.now()}`);
          const rng = new FairRNG(fairSeed);
          const grid = Array(25 - minesCount).fill(false).concat(Array(minesCount).fill(true));
          const shuffled = rng.shuffle(grid);
          mineLocations = shuffled.reduce((acc: number[], isMine: boolean, idx: number) => {
            if (isMine) acc.push(idx);
            return acc;
          }, []);
          
          sessions[sessionId] = {
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
          for (let r = 0; r < 9; r++) {
            const isSafe = rng.nextInt(0, 3) >= 1; // 1 bomb, 3 cols
            if (!isSafe) {
              break;
            }
            reachedRow = r + 1;
          }

          sessions[sessionId] = {
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
          const uniformRandom = rng.next();
          crashPoint = Math.round((0.97 / uniformRandom) * 100) / 100;

          sessions[sessionId] = {
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

        saveSessions(sessions);

        return NextResponse.json({
          success: true,
          isInteractive: true,
          sessionId,
          activeMultiplier: 1.0,
          crashPoint: crashPoint || (outcome ? outcome.multiplier : 0),
          newBalance,
          seed: fairSeed
        }, { status: 200 });
      }

      // Custom game-specific outcome adjustments
      let finalMultiplier = 0;
      let responseMultiplier = 0;
      let targetBinIndex: number | undefined = undefined;
      let fairSeed = null;

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
        const choice = (selectedTarget || 'heads') as 'heads' | 'tails';
        fairSeed = generateFairRNGSeed(`coinflip-${Date.now()}`);
        const fairOutcome = calculateCoinflipOutcome(choice, fairSeed);
        finalMultiplier = fairOutcome.multiplier;
        responseMultiplier = finalMultiplier;
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
      } else if (gameId === "orig-11" || gameId.startsWith("roulette-") || gameId.startsWith("orig-r")) { // Roulette
        const type = selectedTarget === 'straight' ? 'straight' : 'even_money';
        const val = targetMultiplier !== undefined ? Number(targetMultiplier) : 17;
        fairSeed = generateFairRNGSeed(`roulette-${Date.now()}`);
        const fairOutcome = calculateRouletteOutcome(type, val, fairSeed);
        finalMultiplier = fairOutcome.multiplier;
        responseMultiplier = finalMultiplier;
      } else if (gameId === "orig-8" || gameId.startsWith("blackjack-") || gameId.startsWith("orig-20")) { // Blackjack
        const playerVal = targetMultiplier !== undefined ? Number(targetMultiplier) : 18;
        const dealerVal = selectedTarget !== undefined ? Number(selectedTarget) : 6;
        fairSeed = generateFairRNGSeed(`blackjack-${Date.now()}`);
        const fairOutcome = calculateBlackjackOutcome(playerVal, dealerVal, fairSeed);
        finalMultiplier = fairOutcome.multiplier;
        responseMultiplier = finalMultiplier;
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

      const payout = Math.round(betAmount * finalMultiplier * 100) / 100;
      const netChange = payout - totalDeduction;
      const newBalance = Math.round((activeBalance + netChange) * 100) / 100;

      const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const tx: Transaction = {
        id: txId,
        type: 'casino',
        amount: Math.abs(netChange),
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: commission > 0 
          ? `Played ${gameTitle || gameId} (Wager: ₹${betAmount} + ₹${commission.toFixed(2)} Live Fee, Payout: ₹${payout})`
          : `Played ${gameTitle || gameId} (Wager: ₹${betAmount}, Payout: ₹${payout})`,
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
        payout,
        newBalance,
        targetBinIndex,
        transactionId: txId,
        seed: fairSeed
      }, { status: 200 });
    });

    return response;

  } catch (err: any) {
    console.error("Casino Bet API Error:", err);
    return NextResponse.json({ error: 'Failed to process casino bet.', details: err?.message }, { status: 500 });
  }
}
