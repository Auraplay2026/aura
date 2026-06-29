import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername, updateUser, Transaction, sanitizeUserProfile } from '@/lib/userDb';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 1. Authorization Gating Check
    let expectedToken = process.env.CASINO_CALLBACK_SECRET;
    if (!expectedToken) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error("FATAL: CASINO_CALLBACK_SECRET environment variable is not set.");
      } else {
        expectedToken = "aura-dev-callback-secret";
      }
    }
    
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ status: "ERROR_UNAUTHORIZED", message: "Unauthorized callback request." }, { status: 401 });
    }

    const body = await request.json();
    console.log("📥 Seamless Wallet Callback Received:", body);

    const action = body.action || body.method || body.type;
    const userId = body.userId || body.user_id || body.email || body.username || body.playerId || body.player_id;
    const amount = parseFloat(body.amount) || parseFloat(body.bet) || parseFloat(body.win) || 0;
    const transactionId = body.transactionId || body.transaction_id || body.txId || body.reference;
    const gameId = body.gameId || body.game_id || "slot";
    const roundId = body.roundId || body.round_id;

    if (amount < 0 || isNaN(amount)) {
      return NextResponse.json({ status: "ERROR_INVALID_AMOUNT", message: "Amount must be a positive number." }, { status: 200 });
    }

    if (!action) {
      return NextResponse.json({ status: "ERROR_INVALID_ACTION", message: "Action is required." }, { status: 200 });
    }

    if (!userId) {
      return NextResponse.json({ status: "ERROR_INVALID_USER", message: "User identification is required." }, { status: 200 });
    }

    const initialUser = await findUserByEmailOrUsername(userId);
    if (!initialUser) {
      return NextResponse.json({ status: "ERROR_USER_NOT_FOUND", message: "Player profile not found." }, { status: 200 });
    }

    const normalizedAction = String(action).toLowerCase();
    
    // Wrap database updates in a transaction with pessimistic locking
    const result = await prisma.$transaction(async (txClient) => {
      // Lock user row first to prevent race conditions
      await txClient.$queryRaw`SELECT id FROM "User" WHERE email = ${initialUser.email} FOR UPDATE`;

      const dbUser = await txClient.user.findUnique({
        where: { email: initialUser.email },
        include: { transactions: true }
      });

      if (!dbUser) {
        return { error: 'Player profile not found.', status: 'ERROR_USER_NOT_FOUND' };
      }

      const user = sanitizeUserProfile(dbUser);
      const isReal = user.accountType === 'real';
      const activeBalance = isReal ? user.realBalance : user.demoBalance;

      // 2. Idempotency Check
      if (transactionId) {
        const existingTx = await txClient.transaction.findUnique({
          where: { id: transactionId }
        });
        if (existingTx) {
          if (existingTx.userId !== dbUser.id) {
            return { error: 'Transaction ID collision detected.', status: 'ERROR_TRANSACTION_COLLISION' };
          }
          return {
            success: true,
            balance: isReal ? dbUser.realBalance : dbUser.demoBalance,
            transactionId
          };
        }
      }

      // Balance check only (no state mutation)
      if (normalizedAction === 'balance' || normalizedAction === 'get_balance' || normalizedAction === 'getbalance') {
        return {
          success: true,
          balance: activeBalance,
          transactionId: null
        };
      }

      let newBalance = activeBalance;
      let details = '';

      if (normalizedAction === 'bet' || normalizedAction === 'debit' || normalizedAction === 'place_bet') {
        if (activeBalance < amount) {
          return { error: 'Insufficient wallet balance.', status: 'ERROR_INSUFFICIENT_FUNDS', balance: activeBalance };
        }
        newBalance = activeBalance - amount;
        details = `Casino Bet - ${gameId} (Round: ${roundId || 'N/A'})`;
      } else if (normalizedAction === 'win' || normalizedAction === 'credit' || normalizedAction === 'settle_win') {
        newBalance = activeBalance + amount;
        details = `Casino Win - ${gameId} (Round: ${roundId || 'N/A'})`;
      } else if (normalizedAction === 'refund' || normalizedAction === 'rollback' || normalizedAction === 'refund_bet') {
        newBalance = activeBalance + amount;
        details = `Casino Rollback/Refund - ${gameId} (Round: ${roundId || 'N/A'})`;
      } else {
        return { error: `Action '${action}' is not recognized.`, status: 'ERROR_UNKNOWN_ACTION' };
      }

      const txId = transactionId || `TX-CAS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newTxn: Transaction = {
        id: txId,
        type: 'casino',
        amount: amount,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details,
        status: 'Completed'
      };

      const updates: any = {
        balance: newBalance,
        transactions: [newTxn, ...user.transactions]
      };

      if (isReal) {
        updates.realBalance = newBalance;
        updates.realTransactions = [newTxn, ...user.realTransactions];
      } else {
        updates.demoBalance = newBalance;
        updates.demoTransactions = [newTxn, ...user.demoTransactions];
      }

      await updateUser(user.email, updates, txClient);

      return {
        success: true,
        balance: newBalance,
        transactionId: txId
      };
    });

    if ('error' in result) {
      if (result.status === 'ERROR_INSUFFICIENT_FUNDS') {
        return NextResponse.json({
          status: result.status,
          balance: result.balance,
          message: result.error
        }, { status: 200 });
      }
      return NextResponse.json({
        status: result.status,
        message: result.error
      }, { status: 200 });
    }

    return NextResponse.json({
      status: "OK",
      balance: result.balance,
      transactionId: result.transactionId || undefined
    }, { status: 200 });

  } catch (err) {
    console.error("❌ Seamless Wallet Callback Error:", err);
    return NextResponse.json({ status: "ERROR_INTERNAL", message: "Internal server error occurred." }, { status: 200 });
  }
}
