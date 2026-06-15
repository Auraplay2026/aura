const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Elevate existing Google Auth account
  await prisma.user.updateMany({
    where: { email: 'twintubrovquattro@gmail.com' },
    data: { role: 'admin' }
  });
  console.log('Elevated twintubrovquattro@gmail.com to admin');

  // Create admin@aurabet.io
  const existing = await prisma.user.findUnique({ where: { email: 'admin@aurabet.io' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@aurabet.io',
        passwordHash: 'AuraAdmin2026!',
        accountType: 'real',
        balance: 100000,
        demoBalance: 100000,
        realBalance: 100000,
        hasCompletedOnboarding: true,
        role: 'admin',
      }
    });
    console.log('Created admin@aurabet.io account');
  } else {
    await prisma.user.update({
      where: { email: 'admin@aurabet.io' },
      data: { role: 'admin', passwordHash: 'AuraAdmin2026!' }
    });
    console.log('Updated admin@aurabet.io account');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma['$disconnect']());
