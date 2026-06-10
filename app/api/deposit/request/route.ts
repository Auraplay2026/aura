import { NextResponse } from 'next/server';
import { findUserByEmail, updateUser, Transaction } from '@/lib/userDb';
import fs from 'fs';
import path from 'path';
import { sendDepositNotification } from '@/lib/notificationService';

export async function POST(request: Request) {
  try {
    const { email, amount, utr, upiId, screenshot, type = 'deposit', method = 'upi' } = await request.json();

    if (!email || !amount || !upiId) {
      return NextResponse.json({ error: 'Email, amount, and UPI ID/Sender Account are required.' }, { status: 400 });
    }

    if (type === 'deposit') {
      if (method === 'upi') {
        if (!utr || String(utr).trim().length !== 12 || isNaN(Number(utr))) {
          return NextResponse.json({ error: 'UTR must be a valid 12-digit number for UPI deposits.' }, { status: 400 });
        }
      } else {
        if (!utr || String(utr).trim().length < 4) {
          return NextResponse.json({ error: 'Please enter a valid Transaction / Reference ID.' }, { status: 400 });
        }
      }
      if (!screenshot) {
        return NextResponse.json({ error: 'Screenshot is required for deposits.' }, { status: 400 });
      }
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (type === 'withdraw' && user.realBalance < amount) {
      return NextResponse.json({ error: 'Insufficient real balance for withdrawal.' }, { status: 400 });
    }

    let screenshotUrl = null;
    
    // Process screenshot if it's a deposit
    if (type === 'deposit' && screenshot) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `deposit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      screenshotUrl = `/uploads/${fileName}`;
    }

    const txnId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newTxn: any = {
      id: txnId,
      type: type,
      amount: Number(amount),
      balanceAfter: user.realBalance, 
      timestamp: Date.now(),
      details: type === 'deposit' 
        ? `${method.toUpperCase()} Deposit (Pending Review · Ref: ${utr})` 
        : `UPI Withdrawal (Pending Review · To: ${upiId})`,
      status: 'Pending',
      utr: utr || null,
      upiId,
      screenshotUrl
    };

    const updatedRealTransactions = [newTxn, ...user.realTransactions];
    
    const updates: any = {
      realTransactions: updatedRealTransactions
    };

    // If active mode is real, append to primary lists for instant UI reflection
    if (user.accountType === 'real') {
      updates.transactions = [newTxn, ...user.transactions];
      
      // If it's a withdrawal, instantly deduct the pending amount to prevent double spending
      if (type === 'withdraw') {
        updates.realBalance = user.realBalance - Number(amount);
        updates.balance = updates.realBalance;
      }
    } else {
      // If user is currently in demo mode, they still can declare real transactions.
      if (type === 'withdraw') {
        updates.realBalance = user.realBalance - Number(amount);
      }
      updates.transactions = user.transactions;
    }

    updateUser(email, updates);

    if (type === 'deposit') {
      sendDepositNotification(email, Number(amount), utr).catch(err => {
        console.error("Non-blocking notification dispatch error:", err);
      });
    }

    return NextResponse.json({ success: true, transactionId: txnId }, { status: 200 });
  } catch (err) {
    console.error("Deposit request submission error:", err);
    return NextResponse.json({ error: 'Failed to submit deposit request.' }, { status: 500 });
  }
}
