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
    // 1. Generate a brand new unique user dynamically to verify login is 100% universal for ANY user
    const dynamicUsername = 'TestPlayer_' + Math.floor(1000 + Math.random() * 9000);
    const dynamicPassword = 'pass_' + Math.floor(1000 + Math.random() * 9000);

    // Create dynamic user in database
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id", "username", "passwordHash") 
      VALUES (gen_random_uuid()::text, '${dynamicUsername}', '${dynamicPassword}');
    `);

    try {
      // 2. Fetch CAPTCHA token
      const captchaRes = await page.request.get('/api/auth/captcha');
      expect(captchaRes.status()).toBe(200);
      const captchaData = await captchaRes.json();
      expect(captchaData.success).toBe(true);

      // 3. Login with dynamically created user credentials
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
      // Clean up dynamic user from DB
      await prisma.user.deleteMany({ where: { username: dynamicUsername } });
    }
  });

  test('Existing User Login Flow (Sahil)', async ({ page }) => {
    const captchaRes = await page.request.get('/api/auth/captcha');
    const captchaData = await captchaRes.json();

    const loginRes = await page.request.post('/api/auth/login', {
      data: {
        emailOrUsername: 'Sahil',
        password: '7003',
        captcha: captchaData.code
      }
    });

    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);
    expect(loginData.user.username).toBe('Sahil');
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
