import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { syncUserToSupabaseAuth } from '../lib/supabaseAuthSync';

async function seedTestUsers() {
  console.log("Seeding test players and active transactions into PostgreSQL & Supabase Auth...");
  
  const testUsers = [
    { username: 'kartik2561', email: 'kartik2561@aurabet.io', balance: 6434, deposit: 6434 },
    { username: 'alex99', email: 'alex99@aurabet.io', balance: 5000, deposit: 5000 },
    { username: 'rahul_trader', email: 'rahul_trader@aurabet.io', balance: 12500, deposit: 15000 },
    { username: 'priya_crypto', email: 'priya_crypto@aurabet.io', balance: 25000, deposit: 25000 }
  ];

  for (const u of testUsers) {
    const passwordHash = await bcrypt.hash("AuraPass2026!", 10);
    
    // 1. Only create if user does not exist. If user already exists, NEVER overwrite their balance or transactions!
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: u.username, mode: 'insensitive' } },
          { email: { equals: u.email, mode: 'insensitive' } }
        ]
      }
    });

    let user;
    if (existing) {
      if (u.username === 'kartik2561') {
        user = await prisma.user.update({
          where: { id: existing.id },
          data: { balance: 6434, realBalance: 6434 }
        });
        console.log(`✅ Set @kartik2561 exact verified balance to ₹6,434`);
      } else {
        user = existing;
        console.log(`ℹ️ Preserving existing user @${u.username} with live balance ₹${user.realBalance}`);
      }
    } else {
      user = await prisma.user.create({
        data: {
          username: u.username,
          email: u.email,
          passwordHash,
          balance: u.balance,
          realBalance: u.balance,
          demoBalance: 100000,
          role: 'user',
          hasCompletedOnboarding: true,
          kycStatus: 'VERIFIED'
        }
      });
      console.log(`✅ Initialized new user @${u.username} with balance ₹${u.balance}`);
    }

    // 2. Add an initial deposit / betting transaction
    const existingTx = await prisma.transaction.findFirst({
      where: { userId: user.id }
    });

    if (!existingTx) {
      await prisma.transaction.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          type: 'deposit',
          amount: u.deposit,
          balanceAfter: u.balance,
          timestamp: Date.now() - Math.floor(Math.random() * 3600000),
          details: `UPI Verified Deposit (+₹${u.deposit.toLocaleString()})`,
          status: 'Completed',
          walletType: 'real'
        }
      });

      // Add a betting session for kartik2561
      if (u.username === 'kartik2561') {
        await prisma.transaction.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            type: 'casino',
            amount: 500,
            balanceAfter: 6434,
            timestamp: Date.now() - 1800000,
            details: `Aviator Flight Session [Wager: ₹500 | Payout: ₹1,200 (x2.40)]`,
            status: 'Completed',
            walletType: 'real'
          }
        });
      }
    }

    // 3. Sync to Supabase auth.users & auth.identities
    await syncUserToSupabaseAuth({
      id: user.id,
      email: u.email,
      username: u.username,
      passwordHash,
      mustChangePassword: false
    });

    console.log(`✅ Seeded & Synced: @${u.username} (${u.email}) - Real Balance: ₹${u.balance}`);
  }

  const allUsers = await prisma.user.findMany({ select: { username: true, email: true, balance: true, realBalance: true } });
  console.log(`\n📊 Total Active Players in PostgreSQL Database Now: ${allUsers.length}`);
}

seedTestUsers().catch(console.error).finally(() => prisma.$disconnect());