import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';

test.describe('AURA System Universal E2E Workflow Tests', () => {
  
  test('Landing Page & Mobile Navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AURA|Bet/i);
    const logo = page.locator('text=AURA');
    await expect(logo.first()).toBeVisible();
  });

  test('Universal Captcha & Dynamic User Login Flow', async ({ page }) => {
    // Generate a brand new unique user dynamically to verify authentication works generically for any account
    const dynamicUsername = 'User_' + Math.floor(100000 + Math.random() * 900000);
    const dynamicPassword = 'pass_' + Math.floor(100000 + Math.random() * 900000);

    // Create temporary dynamic user in database
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id", "username", "passwordHash") 
      VALUES (gen_random_uuid()::text, '${dynamicUsername}', '${dynamicPassword}');
    `);

    try {
      // 1. Fetch CAPTCHA token
      const captchaRes = await page.request.get('/api/auth/captcha');
      expect(captchaRes.status()).toBe(200);
      const captchaData = await captchaRes.json();
      expect(captchaData.success).toBe(true);

      // 2. Login with dynamic user credentials
      const loginRes = await page.request.post('/api/auth/login', {
        data: {
          emailOrUsername: dynamicUsername,
          password: dynamicPassword,
          captcha: captchaData.code
        }
      });

      expect(loginRes.status()).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.success).toBe(true);
      expect(loginData.user.username).toBe(dynamicUsername);
      expect(loginData.user.affiliateCode).toBeDefined();
    } finally {
      // Clean up temporary user from DB
      await prisma.user.deleteMany({ where: { username: dynamicUsername } });
    }
  });

  test('Admin Authentication Challenge Endpoint', async ({ page }) => {
    const response = await page.request.get('/api/admin/auth/challenge');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.challenge).toBeDefined();
  });

  test('Casino Games Endpoint Health Check', async ({ page }) => {
    const response = await page.request.post('/api/casino/bet', {
      data: {
        gameId: 'roulette',
        betAmount: 0
      }
    });

    expect([400, 401]).toContain(response.status());
  });

});
