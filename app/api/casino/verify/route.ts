import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { calculateGameOutcome } from '@/lib/fair-casino-math';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      serverSeed, 
      clientSeed, 
      nonce, 
      gameType = 'SLOTS',
      
      // Game-specific params
      targetMultiplier,
      target,
      direction,
      betType,
      betValue,
      playerTotal,
      dealerUpCard,
      riskLevel,
      mineCount,
      revealCount,
      rowCount,
      dangerPerRow,
      cellsPerRow,
      playerChoice,
      selectedNumbers,
      drawnCount
    } = body;

    if (!serverSeed || !clientSeed || typeof nonce !== 'number') {
      return NextResponse.json({ error: 'serverSeed, clientSeed, and numeric nonce are required.' }, { status: 400 });
    }

    // Step 1: Compute HMACS-SHA256 Hash
    const combinedHash = crypto
      .createHmac('sha256', serverSeed)
      .update(`${clientSeed}-${nonce}`)
      .digest('hex');

    // Step 2: Convert first 8 characters of hex hash to decimal fraction
    const hexSlice = combinedHash.substring(0, 8);
    const intVal = parseInt(hexSlice, 16);
    const roll = intVal / 0xffffffff;

    // Map legacy gameType to new gameType if needed
    let mappedGameType = gameType.toLowerCase();
    if (mappedGameType === 'slots') {
      mappedGameType = 'crash'; // Slots was unified/removed, Crash serves as standard multiplier
    } else if (mappedGameType === 'table') {
      mappedGameType = 'coinflip'; // Table unified to coinflip / blackjack
    }

    // Step 3: Run the provably fair game math
    let outcome;
    try {
      outcome = calculateGameOutcome({
        gameType: mappedGameType,
        seed: combinedHash as any,
        targetMultiplier: targetMultiplier !== undefined ? Number(targetMultiplier) : undefined,
        target: target !== undefined ? Number(target) : undefined,
        direction,
        betType,
        betValue: betValue !== undefined ? Number(betValue) : undefined,
        playerTotal: playerTotal !== undefined ? Number(playerTotal) : undefined,
        dealerUpCard: dealerUpCard !== undefined ? Number(dealerUpCard) : undefined,
        riskLevel,
        mineCount: mineCount !== undefined ? Number(mineCount) : undefined,
        revealCount: revealCount !== undefined ? Number(revealCount) : undefined,
        rowCount: rowCount !== undefined ? Number(rowCount) : undefined,
        dangerPerRow: dangerPerRow !== undefined ? Number(dangerPerRow) : undefined,
        cellsPerRow: cellsPerRow !== undefined ? Number(cellsPerRow) : undefined,
        playerChoice,
        selectedNumbers,
        drawnCount: drawnCount !== undefined ? Number(drawnCount) : undefined
      });
    } catch (e: any) {
      // Fallback if gameType is not matched
      return NextResponse.json({ error: `Game type '${gameType}' verification not supported: ${e.message}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      hash: combinedHash,
      hexSlice,
      intVal,
      roll,
      isWin: outcome.isWin,
      multiplier: outcome.multiplier,
      details: `Verification successful for game type: ${mappedGameType}. Outcome matches fair mathematics.`,
      targetBinIndex: outcome.targetBinIndex,
      randomValues: outcome.randomValues
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Verification failed.', details: err.message }, { status: 500 });
  }
}
