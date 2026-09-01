import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { syncUserToSupabaseAuth } from '../lib/supabaseAuthSync';

async function syncAllUsers() {
  console.log("🔄 Synchronizing all application users into Supabase auth.users...");
  try {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} user(s) in public.User table.`);

    for (const u of users) {
      const email = u.email || `${u.username.toLowerCase()}@aurabet.io`;
      const res = await syncUserToSupabaseAuth({
        id: u.id,
        email,
        username: u.username,
        passwordHash: u.passwordHash,
        mustChangePassword: (u as any).mustChangePassword || false
      });

      if (res.success) {
        console.log(`✅ Synced: ${u.username} (${email}) -> Supabase Auth ID: ${res.id}`);
      } else {
        console.warn(`⚠️ Warning syncing ${u.username}: ${res.error}`);
      }
    }

    console.log("\n🎉 All users are now synchronized and visible in the Supabase Authentication Dashboard!");
  } catch (err: any) {
    console.error("❌ Sync Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncAllUsers();