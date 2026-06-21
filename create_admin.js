const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('AuraAdmin2026!', 12);

  // Elevate existing Google Auth account
  await prisma.user.updateMany({
    where: { email: 'twintubrovquattro@gmail.com' },
    data: { role: 'admin' }
  });
  console.log('Elevated twintubrovquattro@gmail.com to admin');

  // Create twintubrovquattro@gmail.com
  const existing = await prisma.user.findUnique({ where: { email: 'twintubrovquattro@gmail.com' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'twintubrovquattro@gmail.com',
        passwordHash: hashedPassword,
        accountType: 'real',
        balance: 100000,
        demoBalance: 100000,
        realBalance: 100000,
        hasCompletedOnboarding: true,
        role: 'admin',
      }
    });
    console.log('Created twintubrovquattro@gmail.com account');
  } else {
    await prisma.user.update({
      where: { email: 'twintubrovquattro@gmail.com' },
      data: { role: 'admin', passwordHash: hashedPassword }
    });
    console.log('Updated twintubrovquattro@gmail.com account');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma['$disconnect']());
