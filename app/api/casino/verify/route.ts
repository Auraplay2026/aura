import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { serverSeed, clientSeed, nonce, gameType = 'SLOTS' } = await request.json();

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

    // Step 3: Run Centralized Game Rules
    const isWin = roll < 0.20; // 20% default win rate
    const isNearMiss = !isWin && (roll >= 0.20 && roll < 0.60);

    let multiplier = 0;
    let details = '';

    if (gameType === 'SLOTS') {
      if (isWin) {
        // Sample Win
        const sampleHex = combinedHash.substring(8, 16);
        const sampleRoll = parseInt(sampleHex, 16) / 0xffffffff;
        
        if (sampleRoll < 0.50) {
          multiplier = 1.2 + sampleRoll * 1.8;
          details = 'Standard Win (1.2x - 3.0x)';
        } else if (sampleRoll < 0.85) {
          multiplier = 3.0 + sampleRoll * 2.0;
          details = 'Mega Win (3.0x - 5.0x)';
        } else if (sampleRoll < 0.98) {
          multiplier = 5.0 + sampleRoll * 5.0;
          details = 'Super Win (5.0x - 10.0x)';
        } else {
          multiplier = 10.0 + sampleRoll * 40.0;
          details = 'Jackpot! (10.0x - 50.0x)';
        }
      } else {
        multiplier = 0;
        details = 'No Win';
      }
    } else if (gameType === 'CRASH') {
      const sampleHex = combinedHash.substring(8, 16);
      const sampleRoll = parseInt(sampleHex, 16) / 0xffffffff;

      if (isWin) {
        multiplier = 2.0 + sampleRoll * 8.0;
        details = 'High Crash Flight';
      } else {
        if (isNearMiss) {
          multiplier = 1.5 + sampleRoll * 0.45;
          details = 'Psychological Near Miss';
        } else {
          multiplier = 1.00 + sampleRoll * 0.15;
          details = 'Instant Early Crash';
        }
      }
    } else if (gameType === 'TABLE') {
      multiplier = isWin ? 2.0 : 0.0;
      details = isWin ? '1:1 Table Payout' : 'House Wins';
    } else {
      multiplier = isWin ? 2.0 : 0.0;
      details = isWin ? 'Original 2x Win' : 'No Win';
    }

    return NextResponse.json({
      success: true,
      hash: combinedHash,
      hexSlice,
      intVal,
      roll,
      isWin,
      multiplier: parseFloat(multiplier.toFixed(4)),
      details
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
