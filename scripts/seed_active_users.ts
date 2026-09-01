import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { syncUserToSupabaseAuth } from '../lib/supabaseAuthSync';

async function seedTestUsers() {
  console.log("Seeding test players and active transactions into PostgreSQL & Supabase Auth...");
  
  const testUsers = [
    { username: 'alex99', email: 'alex99@aurabet.io', balance: 5000, deposit: 5000 },
    { username: 'rahul_trader', email: 'rahul_trader@aurabet.io', balance: 12500, deposit: 15000 },
    { username: 'priya_crypto', email: 'priya_crypto@aurabet.io', balance: 25000, deposit: 25000 }
  ];

  for (const u of testUsers) {
    const passwordHash = await bcrypt.hash("AuraPass2026!", 10);
    
    // 1. Upsert into PostgreSQL public.User
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        balance: u.balance,
        realBalance: u.balance,
        demoBalance: 100000,
        email: u.email
      },
      create: {
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

    // 2. Add an initial deposit transaction if not already present
    const existingTx = await prisma.transaction.findFirst({
      where: { userId: user.id, type: 'deposit' }
    });

    if (!existingTx) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'deposit',
          amount: u.deposit,
          balanceAfter: u.balance,
          timestamp: Date.now() - Math.floor(Math.random() * 3600000),
          details: `UPI Instant Deposit (+₹${u.deposit.toLocaleString()})`,
          status: 'Completed',
          walletType: 'real'
        }
      });
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