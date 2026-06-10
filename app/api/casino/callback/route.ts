import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername, updateUser, Transaction } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 Seamless Wallet Callback Received:", body);

    const action = body.action || body.method || body.type;
    const userId = body.userId || body.user_id || body.email || body.username || body.playerId || body.player_id;
    const amount = parseFloat(body.amount) || parseFloat(body.bet) || parseFloat(body.win) || 0;
    const transactionId = body.transactionId || body.transaction_id || body.txId || body.reference;
    const gameId = body.gameId || body.game_id || "slot";
    const roundId = body.roundId || body.round_id;

    if (!action) {
      return NextResponse.json({ status: "ERROR_INVALID_ACTION", message: "Action is required." }, { status: 200 });
    }

    if (!userId) {
      return NextResponse.json({ status: "ERROR_INVALID_USER", message: "User identification is required." }, { status: 200 });
    }

    const user = findUserByEmailOrUsername(userId);
    if (!user) {
      return NextResponse.json({ status: "ERROR_USER_NOT_FOUND", message: "Player profile not found." }, { status: 200 });
    }

    const normalizedAction = String(action).toLowerCase();

    // 1. BALANCE CHECK
    if (normalizedAction === 'balance' || normalizedAction === 'get_balance' || normalizedAction === 'getbalance') {
      return NextResponse.json({
        status: "OK",
        balance: user.realBalance,
        currency: "INR",
        username: user.username
      }, { status: 200 });
    }

    // 2. BET (DEBIT)
    if (normalizedAction === 'bet' || normalizedAction === 'debit' || normalizedAction === 'place_bet') {
      if (user.realBalance < amount) {
        return NextResponse.json({
          status: "ERROR_INSUFFICIENT_FUNDS",
          balance: user.realBalance,
          message: "Insufficient wallet balance."
        }, { status: 200 });
      }

      const newBalance = user.realBalance - amount;
      const newTxn: Transaction = {
        id: transactionId || `TX-BET-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        type: 'casino',
        amount: amount,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: `Casino Bet - ${gameId} (Round: ${roundId || 'N/A'})`,
        status: 'Completed'
      };

      const updates: any = {
        realBalance: newBalance,
        realTransactions: [newTxn, ...user.realTransactions]
      };

      if (user.accountType === 'real') {
        updates.balance = newBalance;
        updates.transactions = [newTxn, ...user.transactions];
      }

      updateUser(user.email, updates);

      return NextResponse.json({
        status: "OK",
        balance: newBalance,
        transactionId: newTxn.id
      }, { status: 200 });
    }

    // 3. WIN (CREDIT)
    if (normalizedAction === 'win' || normalizedAction === 'credit' || normalizedAction === 'settle_win') {
      const newBalance = user.realBalance + amount;
      const newTxn: Transaction = {
        id: transactionId || `TX-WIN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        type: 'casino',
        amount: amount,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: `Casino Win - ${gameId} (Round: ${roundId || 'N/A'})`,
        status: 'Completed'
      };

      const updates: any = {
        realBalance: newBalance,
        realTransactions: [newTxn, ...user.realTransactions]
      };

      if (user.accountType === 'real') {
        updates.balance = newBalance;
        updates.transactions = [newTxn, ...user.transactions];
      }

      updateUser(user.email, updates);

      return NextResponse.json({
        status: "OK",
        balance: newBalance,
        transactionId: newTxn.id
      }, { status: 200 });
    }

    // 4. REFUND / ROLLBACK
    if (normalizedAction === 'refund' || normalizedAction === 'rollback' || normalizedAction === 'refund_bet') {
      const newBalance = user.realBalance + amount;
      const newTxn: Transaction = {
        id: transactionId || `TX-RFD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        type: 'casino',
        amount: amount,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: `Casino Rollback/Refund - ${gameId} (Round: ${roundId || 'N/A'})`,
        status: 'Completed'
      };

      const updates: any = {
        realBalance: newBalance,
        realTransactions: [newTxn, ...user.realTransactions]
      };

      if (user.accountType === 'real') {
        updates.balance = newBalance;
        updates.transactions = [newTxn, ...user.transactions];
      }

      updateUser(user.email, updates);

      return NextResponse.json({
        status: "OK",
        balance: newBalance,
        transactionId: newTxn.id
      }, { status: 200 });
    }

    return NextResponse.json({ status: "ERROR_UNKNOWN_ACTION", message: `Action '${action}' is not recognized.` }, { status: 200 });
  } catch (err) {
    console.error("❌ Seamless Wallet Callback Error:", err);
    return NextResponse.json({ status: "ERROR_INTERNAL", message: "Internal server error occurred." }, { status: 200 });
  }
}
