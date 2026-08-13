import { NextResponse } from 'next/server';
import { findUserByEmail, updateUser, Transaction, sanitizeUserProfile } from '@/lib/userDb';
import fs from 'fs';
import path from 'path';
import { sendDepositNotification } from '@/lib/notificationService';
import { verifyUserSession } from '@/lib/userAuth';
import { prisma } from '@/lib/prisma';

function isAllowedImageFormat(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // WebP/RIFF
  if (buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const { email, amount, utr, upiId, screenshot, type = 'deposit', method = 'upi' } = await request.json();

    const parsedAmount = Number(amount);

    if (!email || isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0 || !upiId) {
      return NextResponse.json({ error: 'Email, valid positive finite amount, and UPI ID/Sender Account are required.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
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

    let screenshotUrl = null;
    
    // Process screenshot if it's a deposit (done outside transaction block to prevent holding DB locks during IO)
    if (type === 'deposit' && screenshot) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Screenshot file size exceeds 5MB limit.' }, { status: 400 });
      }

      if (!isAllowedImageFormat(buffer)) {
        return NextResponse.json({ error: 'Uploaded file is not a supported image format (PNG, JPG, WebP, GIF).' }, { status: 400 });
      }

      const fileName = `deposit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      screenshotUrl = `/uploads/${fileName}`;
    }

    const result = await prisma.$transaction(async (txClient) => {
      // Lock user row first to prevent race conditions (especially on withdrawals)
      const lockedRows: any[] = await txClient.$queryRaw`
        SELECT id FROM "User"
        WHERE LOWER(email) = LOWER(${email}) OR LOWER(username) = LOWER(${email})
        FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        return { error: 'User not found.', status: 404 };
      }

      const dbUser = await txClient.user.findFirst({
        where: { id: lockedRows[0].id },
        include: { transactions: true, positions: true, notifications: true }
      });

      if (!dbUser) {
        return { error: 'User not found.', status: 404 };
      }

      if (type === 'deposit' && utr) {
        const existingTxn = await txClient.transaction.findFirst({
          where: { utr }
        });
        if (existingTxn) {
          return { error: 'This UTR has already been submitted or processed.', status: 400 };
        }
      }

      const user = sanitizeUserProfile(dbUser);

      if (type === 'withdraw' && user.realBalance < parsedAmount) {
        return { error: 'Insufficient real balance for withdrawal.', status: 400 };
      }

      const txnId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const pendingBalance = type === 'withdraw' ? Math.max(0, Math.round((user.realBalance - parsedAmount) * 100) / 100) : user.realBalance;

      const newTxn: any = {
        id: txnId,
        type: type,
        amount: parsedAmount,
        balanceAfter: pendingBalance, 
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
          updates.realBalance = Math.round((user.realBalance - parsedAmount) * 100) / 100;
          updates.balance = updates.realBalance;
        }
      } else {
        // If user is currently in demo mode, they still can declare real transactions.
        if (type === 'withdraw') {
          updates.realBalance = Math.round((user.realBalance - parsedAmount) * 100) / 100;
        }
        updates.transactions = user.transactions;
      }

      await updateUser(email, updates, txClient);

      return { success: true, transactionId: txnId };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (type === 'deposit') {
      sendDepositNotification(email, parsedAmount, utr).catch(err => {
        console.error("Non-blocking notification dispatch error:", err);
      });
    }

    return NextResponse.json({ success: true, transactionId: result.transactionId }, { status: 200 });
  } catch (err) {
    console.error("Deposit request submission error:", err);
    return NextResponse.json({ error: 'Failed to submit deposit request.' }, { status: 500 });
  }
}
