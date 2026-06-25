import { NextResponse } from 'next/server';
import { getUsers, updateUser, findUserByEmail, sanitizeUserProfile } from '@/lib/userDb';
import { logAdminAction } from '@/app/(admin)/admin/actions';
import { sendTransactionNotification } from '@/lib/notificationService';
import { verifyAdminSession } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await verifyAdminSession();

    const users = await getUsers();
    const pendingDeposits: any[] = [];
    const completedDeposits: any[] = [];
    const rejectedDeposits: any[] = [];

    // Scan all users and gather deposits
    for (const user of users) {
      const allTxns = user.realTransactions || [];
      for (const txn of allTxns) {
        if (txn.type === 'deposit' || txn.type === 'withdraw') {
          const item = {
            user: {
              username: user.username,
              email: user.email,
              phone: user.phoneNumber || 'N/A',
              state: user.gamingState || 'N/A'
            },
            transaction: txn
          };

          if (txn.status === 'Pending' || txn.status === 'Processing') {
            pendingDeposits.push(item);
          } else if (txn.status === 'Completed') {
            completedDeposits.push(item);
          } else if (txn.status === 'Failed') {
            rejectedDeposits.push(item);
          }
        }
      }
    }

    // Sort by timestamp descending
    pendingDeposits.sort((a, b) => b.transaction.timestamp - a.transaction.timestamp);
    completedDeposits.sort((a, b) => b.transaction.timestamp - a.transaction.timestamp);
    rejectedDeposits.sort((a, b) => b.transaction.timestamp - a.transaction.timestamp);

    return NextResponse.json({
      success: true,
      pending: pendingDeposits,
      completed: completedDeposits,
      rejected: rejectedDeposits
    }, { status: 200 });
  } catch (err: any) {
    console.error("Failed to load admin deposits data:", err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve deposits.' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    const verifiedAdminEmail = session.email;

    const { email, transactionId, action, reason } = await request.json();

    if (!email || !transactionId || !action) {
      return NextResponse.json({ error: 'Email, transactionId, and action are required.' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action. Must be approve or reject.' }, { status: 400 });
    }

    if (email.toLowerCase() === verifiedAdminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Conflict of Interest: Admins cannot approve or reject transactions for their own accounts.' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (txClient) => {
      // Acquire exclusive row lock in PostgreSQL to prevent race conditions with gameplay or other admins
      await txClient.$queryRaw`SELECT id FROM "User" WHERE email = ${email} FOR UPDATE`;

      const dbUser = await txClient.user.findUnique({
        where: { email },
        include: { transactions: true, positions: true, notifications: true }
      });

      if (!dbUser) {
        return { error: 'User not found.', status: 404 };
      }

      const user = sanitizeUserProfile(dbUser);

      // 1. Update in realTransactions list
      const realTxnIndex = user.realTransactions.findIndex(t => t.id === transactionId);
      if (realTxnIndex === -1) {
        return { error: 'Transaction not found in real wallet history.', status: 404 };
      }

      const txn = user.realTransactions[realTxnIndex] as any;
      if (txn.status !== 'Pending') {
        return { error: 'Transaction has already been reviewed.', status: 400 };
      }

      const amount = txn.amount;

      if (action === 'approve') {
        txn.status = 'Completed';
        
        if (txn.type === 'deposit') {
          txn.details = `UPI Deposit (Approved · UTR: ${txn.utr})`;
          user.realBalance = Math.round((user.realBalance + amount) * 100) / 100;
        } else {
          txn.details = `UPI Withdrawal (Approved · To: ${txn.upiId})`;
        }
        
        txn.balanceAfter = user.realBalance;

        // Add actual completed transaction item to log
        const completedTx: any = {
          id: `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: txn.type,
          amount: amount,
          balanceAfter: user.realBalance,
          timestamp: Date.now(),
          details: txn.type === 'deposit' 
            ? `Deposited ₹${amount.toLocaleString()} (Verified UTR: ${txn.utr})`
            : `Withdrew ₹${amount.toLocaleString()} (To: ${txn.upiId})`,
          status: 'Completed'
        };

        // Put it at the top of history
        user.realTransactions = [completedTx, ...user.realTransactions.filter(t => t.id !== transactionId)];
        
        // If currently active in real wallet, sync immediate pointers
        if (user.accountType === 'real') {
          user.balance = user.realBalance;
          user.positions = user.realPositions;
          user.transactions = user.realTransactions;
        }

        await logAdminAction(verifiedAdminEmail, "DEPOSIT_APPROVE", email, `Approved deposit of ₹${amount.toLocaleString()} (UTR: ${txn.utr || "N/A"})`);

        // WhatsApp / Email / SMS Notification
        sendTransactionNotification({
          userEmail: email,
          amount: Number(amount),
          utr: txn.utr || undefined,
          type: txn.type === 'deposit' ? 'deposit_approved' : 'withdrawal_approved',
          newBalance: user.realBalance
        }).catch(err => {
          console.error("Non-blocking approval notification dispatch error:", err);
        });
      } else {
        // Reject
        txn.status = 'Failed';
        
        const declineReason = reason || "Declined during reference checks.";
        
        if (txn.type === 'deposit') {
          txn.details = `UPI Deposit (Rejected · UTR: ${txn.utr} · Reason: ${declineReason})`;
        } else {
          txn.details = `UPI Withdrawal (Rejected · To: ${txn.upiId} · Reason: ${declineReason})`;
          // Refund the pending withdrawal back to their balance
          user.realBalance = Math.round((user.realBalance + amount) * 100) / 100;
        }
        
        txn.balanceAfter = user.realBalance;
        
        // Filter or replace the transaction status in list
        user.realTransactions[realTxnIndex] = txn;

        // If active in real wallet, sync pointers
        if (user.accountType === 'real') {
          user.balance = user.realBalance;
          user.transactions = user.realTransactions;
        }

        // Add user notification
        if (!user.notifications) user.notifications = [];
        user.notifications.unshift({
          id: `notif_${Date.now()}`,
          message: `Your deposit request of ₹${amount.toLocaleString()} was declined. Reason: ${declineReason}`,
          timestamp: Date.now(),
          read: false
        } as any);

        await logAdminAction(verifiedAdminEmail, "DEPOSIT_REJECT", email, `Declined deposit of ₹${amount.toLocaleString()} (UTR: ${txn.utr || "N/A"}). Reason: ${declineReason}`);

        // WhatsApp / Email / SMS Notification
        sendTransactionNotification({
          userEmail: email,
          amount: Number(amount),
          utr: txn.utr || undefined,
          type: txn.type === 'deposit' ? 'deposit_rejected' : 'withdrawal_rejected',
          reason: declineReason,
          newBalance: user.realBalance
        }).catch(err => {
          console.error("Non-blocking rejection notification dispatch error:", err);
        });
      }

      // Save updated user database via Prisma inside transaction
      await updateUser(email, {
        realBalance: user.realBalance,
        realTransactions: user.realTransactions,
        balance: user.balance,
        transactions: user.transactions,
        notifications: user.notifications
      }, txClient);

      return { success: true, updatedBalance: user.realBalance };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, updatedBalance: result.updatedBalance }, { status: 200 });
  } catch (err: any) {
    console.error("Admin review transaction error:", err);
    return NextResponse.json({ error: err.message || 'Failed to process admin review request.' }, { status: 500 });
  }
}
