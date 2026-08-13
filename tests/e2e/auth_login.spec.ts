import { test, expect } from '@playwright/test';

test.describe('AURA System E2E Workflow Tests', () => {
  
  test('Landing Page & Navigation Loading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AURA|Bet/i);
    const logo = page.locator('text=AURA');
    await expect(logo.first()).toBeVisible();
  });

  test('Captcha Generation & User Login Flow', async ({ page }) => {
    // 1. Fetch captcha via page context so cookies persist automatically
    const captchaRes = await page.request.get('/api/auth/captcha');
    expect(captchaRes.status()).toBe(200);
    const captchaData = await captchaRes.json();
    expect(captchaData.success).toBe(true);

    // 2. Perform login with fetched captcha on same context
    const loginRes = await page.request.post('/api/auth/login', {
      data: {
        email: 'Sahil',
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
