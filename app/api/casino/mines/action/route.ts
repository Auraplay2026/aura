import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import fs from 'fs';
import path from 'path';

async function getGameSession(tx: any, sessionId: string): Promise<any> {
  const sess = await tx.gameSession.findUnique({
    where: { id: sessionId }
  });
  if (!sess) return null;
  return {
    sessionId: sess.id,
    email: sess.email,
    gameId: sess.gameId,
    gameTitle: sess.gameTitle,
    betAmount: sess.betAmount,
    commission: sess.commission,
    gameState: sess.gameState,
    timestamp: sess.timestamp,
    ...(sess.data as any)
  };
}

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
    const { action, email, sessionId, tileIndex, clientMultiplier } = body;

    if (!action || !email || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters: action, email, sessionId.' }, { status: 400 });
    }

    const response = await prisma.$transaction(async (txClient) => {
      // Acquire exclusive row lock in PostgreSQL to serialize user sessions & wagers
      await txClient.$queryRaw`SELECT id FROM "User" WHERE email = ${email} FOR UPDATE`;

      const session = await getGameSession(txClient, sessionId);

      if (!session) {
        return NextResponse.json({ error: 'Active session not found.' }, { status: 404 });
      }

      if (session.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({ error: 'Unauthorized session owner.' }, { status: 401 });
      }

      if (session.gameState !== 'playing') {
        return NextResponse.json({ error: 'Session is already completed or busted.', state: session.gameState }, { status: 400 });
      }

      const user = await txClient.user.findUnique({
        where: { email },
        include: { transactions: true }
      });

      if (!user) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
      }

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;

      // ==========================================
      // ACTION: REVEAL (MINES OR TOWER TILE)
      // ==========================================
      if (action === 'reveal') {
        if (tileIndex === undefined) {
          return NextResponse.json({ error: 'tileIndex is required for reveal action.' }, { status: 400 });
        }

        if (session.gameId === 'orig-4') { // Mines
          const idx = Number(tileIndex);
          if (session.revealedTiles.includes(idx)) {
            return NextResponse.json({ success: true, isBust: false, isCompleted: false, activeMultiplier: session.activeMultiplier });
          }

          const isBust = session.mineLocations.includes(idx);
          session.revealedTiles.push(idx);

          if (isBust) {
            session.gameState = 'busted';
            await saveGameSession(txClient, session);
            
            return NextResponse.json({
              success: true,
              isBust: true,
              isCompleted: true,
              activeMultiplier: 0,
              mineLocations: session.mineLocations,
              seed: session.seed
            }, { status: 200 });
          } else {
            // Calculate new multiplier fairly
            const safeRevealed = session.revealedTiles.length;
            let probability = 1;
            for (let i = 0; i < safeRevealed; i++) {
              probability *= (25 - session.minesCount - i) / (25 - i);
            }
            const fairMultiplier = probability > 0 ? (1 / probability) * 0.97 : 0;
            session.activeMultiplier = parseFloat(fairMultiplier.toFixed(2));

            const maxSafeTiles = 25 - session.minesCount;
            if (session.revealedTiles.length === maxSafeTiles) {
              // All safe tiles uncovered: Automatic Win!
              const payout = Math.round(session.betAmount * session.activeMultiplier * 100) / 100;
              const newBalance = activeBalance + payout;

              const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              const tx: Transaction = {
                id: txId,
                type: 'casino',
                amount: payout,
                balanceAfter: newBalance,
                timestamp: Date.now(),
                details: `Played ${session.gameTitle} (Wager: ₹${session.betAmount}, Payout: ₹${payout})`,
                status: 'Completed'
              };

              const updates: any = {
                balance: newBalance,
                transactions: [tx]
              };

              if (accountType === 'real') {
                updates.realBalance = newBalance;
                updates.realTransactions = [tx];
              } else {
                updates.demoBalance = newBalance;
                updates.demoTransactions = [tx];
              }

              await updateUser(email, updates, txClient);
              session.gameState = 'completed';
              await saveGameSession(txClient, session);

              return NextResponse.json({
                success: true,
                isBust: false,
                isCompleted: true,
                activeMultiplier: session.activeMultiplier,
                mineLocations: session.mineLocations,
                payout,
                newBalance,
                transactionId: txId,
                seed: session.seed
              }, { status: 200 });
            }

            await saveGameSession(txClient, session);
            return NextResponse.json({
              success: true,
              isBust: false,
              isCompleted: false,
              activeMultiplier: session.activeMultiplier
            }, { status: 200 });
          }
        }

        // Fallback for Tower/other progressive interactive games
        if (session.gameId === 'orig-7') {
          const rowIdx = Number(tileIndex);
          const isBust = rowIdx >= session.reachedRow;

          if (isBust) {
            session.gameState = 'busted';
            await saveGameSession(txClient, session);
            return NextResponse.json({
              success: true,
              isBust: true,
              isCompleted: true,
              activeMultiplier: 0,
              seed: session.seed
            }, { status: 200 });
          } else {
            session.revealedRows = rowIdx + 1;
            const nextMultiplier = Math.pow(1.5, session.revealedRows) * 0.97;
            session.activeMultiplier = parseFloat(nextMultiplier.toFixed(2));

            if (session.revealedRows === 9) { // top row reached
              const payout = Math.round(session.betAmount * session.activeMultiplier * 100) / 100;
              const newBalance = activeBalance + payout;

              const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              const tx: Transaction = {
                id: txId,
                type: 'casino',
                amount: payout,
                balanceAfter: newBalance,
                timestamp: Date.now(),
                details: `Played ${session.gameTitle} (Wager: ₹${session.betAmount}, Payout: ₹${payout})`,
                status: 'Completed'
              };

              const updates: any = { balance: newBalance, transactions: [tx] };
              if (accountType === 'real') {
                updates.realBalance = newBalance;
                updates.realTransactions = [tx];
              } else {
                updates.demoBalance = newBalance;
                updates.demoTransactions = [tx];
              }

              await updateUser(email, updates, txClient);
              session.gameState = 'completed';
              await saveGameSession(txClient, session);

              return NextResponse.json({
                success: true,
                isBust: false,
                isCompleted: true,
                activeMultiplier: session.activeMultiplier,
                payout,
                newBalance,
                transactionId: txId,
                seed: session.seed
              }, { status: 200 });
            }

            await saveGameSession(txClient, session);
            return NextResponse.json({
              success: true,
              isBust: false,
              isCompleted: false,
              activeMultiplier: session.activeMultiplier
            }, { status: 200 });
          }
        }
      }

      // ==========================================
      // ACTION: CASHOUT (SECURE CLAIM PAYOUT)
      // ==========================================
      if (action === 'cashout') {
        const isMines = session.gameId === 'orig-4';
        const isTower = session.gameId === 'orig-7';
        const isCrash = session.gameId === 'orig-1' || session.gameId === 'aviator' || session.gameId.startsWith("crash-");

        if (isMines && session.revealedTiles.length === 0) {
          return NextResponse.json({ error: 'Cannot cash out with zero revealed tiles.' }, { status: 400 });
        }

        if (isTower && session.revealedRows === 0) {
          return NextResponse.json({ error: 'Cannot cash out with zero cleared floors.' }, { status: 400 });
        }

        let multiplier = session.activeMultiplier;

        if (isCrash) {
          const cashoutMult = parseFloat(Number(clientMultiplier || 1.0).toFixed(2));
          
          // Security check: Verify that user cashed out BEFORE the crash point
          if (cashoutMult > session.crashPoint) {
            session.gameState = 'busted';
            await saveGameSession(txClient, session);
            return NextResponse.json({
              success: true,
              isBust: true,
              isCompleted: true,
              payout: 0,
              activeMultiplier: 0,
              message: `Crashed at ${session.crashPoint}x (Requested: ${cashoutMult}x)`
            }, { status: 200 });
          }

          // Anti-cheat verification: Verify elapsed time matches the multiplier
          const elapsedMs = Date.now() - session.timestamp;
          // expected minimum time in milliseconds based on standard exponential growth
          const expectedMinTimeMs = 4030 * Math.log((cashoutMult + 0.6667) / 1.6667);
          const toleranceMultiplier = 0.8; // Allow 20% network/processing latency tolerance
          
          if (cashoutMult > 1.2 && elapsedMs < expectedMinTimeMs * toleranceMultiplier) {
            console.warn(`[Anti-Cheat Blocked] User ${email} attempted instant cashout at ${cashoutMult}x after only ${elapsedMs}ms.`);
            return NextResponse.json({ error: 'Invalid cashout timing. Anti-cheat triggered.' }, { status: 400 });
          }

          multiplier = cashoutMult;
        }

        const payout = Math.round(session.betAmount * multiplier * 100) / 100;
        const newBalance = activeBalance + payout;

        const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const tx: Transaction = {
          id: txId,
          type: 'casino',
          amount: payout,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Played ${session.gameTitle} (Wager: ₹${session.betAmount}, Payout: ₹${payout})`,
          status: 'Completed'
        };

        const updates: any = {
          balance: newBalance,
          transactions: [tx]
        };

        if (accountType === 'real') {
          updates.realBalance = newBalance;
          updates.realTransactions = [tx];
        } else {
          updates.demoBalance = newBalance;
          updates.demoTransactions = [tx];
        }

        await updateUser(email, updates, txClient);
        session.gameState = 'completed';
        await saveGameSession(txClient, session);

        return NextResponse.json({
          success: true,
          isBust: false,
          isCompleted: true,
          payout,
          newBalance,
          activeMultiplier: multiplier,
          mineLocations: session.mineLocations,
          transactionId: txId,
          seed: session.seed
        }, { status: 200 });
      }

      return NextResponse.json({ error: 'Invalid game action.' }, { status: 400 });
    });

    return response;

  } catch (err: any) {
    console.error("Casino Action API Error:", err);
    return NextResponse.json({ error: 'Failed to complete action.', details: err?.message }, { status: 500 });
  }
}
