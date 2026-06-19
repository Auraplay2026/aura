import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { getSystemConfig } from '@/lib/systemConfig';
import { calculateGameOutcome } from '@/lib/casino-math';
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

    if (betAmount < 0) {
      return NextResponse.json({ error: 'Bet amount must be a positive number.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
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

    const outcome = calculateGameOutcome(gameType, targetMultiplier, isDemo, demoWinRate, realWinRate);

    // Progressive/interactive games: Mines, Tower, Crash/Aviator
    const isInteractive = gameId === "orig-4" || gameId === "orig-7" || gameId === "orig-1" || gameId === "aviator" || gameId.startsWith("crash-");

    if (isInteractive) {
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const newBalance = activeBalance - totalDeduction;

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

      await updateUser(email, updates);

      // Cache session data server-side
      const sessions = getSessions();
      
      let mineLocations: number[] = [];
      let riggedBustClick = 0;

      if (gameId === "orig-4") { // Mines
        const minesCount = selectedTarget ? Number(selectedTarget) : 3;
        if (outcome.isWin) {
          while (mineLocations.length < minesCount) {
            const r = Math.floor(Math.random() * 25);
            if (!mineLocations.includes(r)) mineLocations.push(r);
          }
        } else {
          riggedBustClick = outcome.isNearMiss ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 2) + 1;
        }
        
        sessions[sessionId] = {
          sessionId,
          email,
          gameId,
          gameTitle: gameTitle || "Mines",
          betAmount,
          commission,
          minesCount,
          mineLocations,
          riggedBustClick,
          revealedTiles: [],
          activeMultiplier: 1.0,
          scheduledOutcome: outcome,
          gameState: "playing",
          accountType,
          timestamp: Date.now()
        };
      } else if (gameId === "orig-7") { // Tower
        // Tower configuration (rows, safe slots)
        sessions[sessionId] = {
          sessionId,
          email,
          gameId,
          gameTitle: gameTitle || "Tower",
          betAmount,
          commission,
          revealedRows: 0,
          activeMultiplier: 1.0,
          scheduledOutcome: outcome,
          gameState: "playing",
          accountType,
          timestamp: Date.now()
        };
      } else { // Crash or Aviator
        sessions[sessionId] = {
          sessionId,
          email,
          gameId,
          gameTitle: gameTitle || "Crash",
          betAmount,
          commission,
          crashPoint: outcome.multiplier,
          gameState: "playing",
          accountType,
          timestamp: Date.now()
        };
      }

      saveSessions(sessions);

      return NextResponse.json({
        success: true,
        isInteractive: true,
        sessionId,
        activeMultiplier: 1.0,
        crashPoint: outcome.multiplier, // returned for crash animation
        newBalance
      }, { status: 200 });
    }

    // Custom game-specific outcome adjustments
    let finalMultiplier = outcome.multiplier;
    let responseMultiplier = outcome.multiplier;
    let targetBinIndex: number | undefined = undefined;

    if (gameId === "orig-3" || gameId.includes("plinko")) { // Plinko
      const risk = (selectedTarget || "medium") as "low" | "medium" | "high";
      const MULTIPLIERS: Record<string, number[]> = {
        low:    [5.6, 2.1, 1.1, 1.0, 0.5, 0.5, 0.5, 1.0, 1.1, 2.1, 5.6],
        medium: [13.0, 3.0, 1.5, 0.8, 0.4, 0.4, 0.4, 0.8, 1.5, 3.0, 13.0],
        high:   [76.0, 10.0, 2.5, 0.3, 0.2, 0.2, 0.2, 0.3, 2.5, 10.0, 76.0],
      };
      const riskMults = MULTIPLIERS[risk] || MULTIPLIERS.medium;
      if (outcome.isWin) {
        const winBins = [0, 1, 2, 8, 9, 10];
        targetBinIndex = winBins[Math.floor(Math.random() * winBins.length)];
      } else {
        const loseBins = [3, 4, 5, 6, 7];
        targetBinIndex = loseBins[Math.floor(Math.random() * loseBins.length)];
      }
      finalMultiplier = riskMults[targetBinIndex];
      responseMultiplier = finalMultiplier;
    } else if (gameId === "orig-5" || gameId.includes("dice")) { // Dice
      const targetVal = targetMultiplier ? Number(targetMultiplier) : 2.0;
      finalMultiplier = outcome.isWin ? targetVal : 0;
      responseMultiplier = finalMultiplier;
    } else if (gameId === "orig-9" || gameId.includes("coin")) { // Coinflip
      finalMultiplier = outcome.isWin ? 2.0 : 0;
      responseMultiplier = finalMultiplier;
    } else if (gameId === "orig-2" || gameId.includes("limbo")) { // Limbo
      const targetVal = targetMultiplier ? Number(targetMultiplier) : 2.0;
      finalMultiplier = outcome.isWin ? targetVal : 0;
      responseMultiplier = outcome.multiplier;
    } else if (gameId === "orig-6" || gameId.includes("keno")) { // Keno
      if (outcome.isWin) {
        const winMults = [1.5, 5.0, 50.0, 500.0];
        finalMultiplier = winMults[Math.floor(Math.random() * winMults.length)];
      } else {
        finalMultiplier = 0;
      }
      responseMultiplier = finalMultiplier;
    }

    const payout = Math.round(betAmount * finalMultiplier * 100) / 100;
    const netChange = payout - totalDeduction;
    const newBalance = activeBalance + netChange;

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

    await updateUser(email, updates);

    return NextResponse.json({
      success: true,
      isInteractive: false,
      isWin: finalMultiplier > 0,
      multiplier: responseMultiplier,
      payout,
      newBalance,
      targetBinIndex,
      transactionId: txId
    }, { status: 200 });

  } catch (err: any) {
    console.error("Casino Bet API Error:", err);
    return NextResponse.json({ error: 'Failed to process casino bet.', details: err?.message }, { status: 500 });
  }
}
