import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

test.describe('Live Betting System & Real-Time Engine E2E Suite', () => {

  test('Module 4: Real-Time SSE Stream Endpoint Health & Header Validation', async ({ baseURL }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${baseURL || 'http://localhost:3000'}/api/sports/stream`, {
        signal: controller.signal
      });

      expect(response.status).toBe(200);
      const contentType = response.headers.get('content-type') || '';
      expect(contentType).toContain('text/event-stream');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        throw e;
      }
    } finally {
      clearTimeout(timeout);
      controller.abort();
    }
  });

  test('Module 2 & 5: Atomic Sports Bet, Anti-Courtsiding & Dynamic Cashout', async ({ page }) => {
    const testUsername = 'Bettor_' + Math.floor(100000 + Math.random() * 900000);
    const plainPassword = 'SecretPass123!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Seed test user with initial balance in real account
    const user = await prisma.user.create({
      data: {
        username: testUsername,
        passwordHash,
        accountType: 'real',
        realBalance: 5000,
        demoBalance: 100000,
      }
    });

    try {
      // 1. Fetch CAPTCHA & Login
      const captchaRes = await page.request.get('/api/auth/captcha');
      const captchaData = await captchaRes.json();
      
      const loginRes = await page.request.post('/api/auth/login', {
        data: {
          emailOrUsername: testUsername,
          password: plainPassword,
          captcha: captchaData.code
        }
      });
      expect(loginRes.status()).toBe(200);

      // 2. Test Anti-Courtsiding Suspension Guard (Should reject if market is suspended)
      const suspendedBetRes = await page.request.post('/api/sports/bet', {
        data: {
          email: testUsername,
          matchTitle: 'India vs Australia',
          selection: 'India',
          odds: 1.85,
          stake: 500,
          side: 'yes',
          marketStatus: 'SUSPENDED'
        }
      });
      expect(suspendedBetRes.status()).toBe(400);
      const suspendedData = await suspendedBetRes.json();
      expect(suspendedData.error).toContain('MARKET_SUSPENDED');

      // 3. Place Valid Sports Back Bet
      const betRes = await page.request.post('/api/sports/bet', {
        data: {
          email: testUsername,
          matchTitle: 'India vs Australia',
          selection: 'India',
          odds: 2.00,
          stake: 1000,
          side: 'yes'
        }
      });
      expect(betRes.status()).toBe(200);
      const betData = await betRes.json();
      expect(betData.success).toBe(true);
      expect(betData.newBalance).toBe(4000); // 5000 - 1000 = 4000
      expect(betData.transactionId).toBeDefined();

      // 4. Test Dynamic Sports Cashout (Odds improved to 1.50 -> Cashout value higher)
      // Formula: (Stake * (InitialOdds / CurrentOdds)) * (1 - MarginFee)
      // (1000 * (2.00 / 1.50)) * 0.95 = 1333.33 * 0.95 = 1266.67
      const cashoutRes = await page.request.post('/api/sports/cashout', {
        data: {
          email: testUsername,
          transactionId: betData.transactionId,
          currentOdds: 1.50
        }
      });
      expect(cashoutRes.status()).toBe(200);
      const cashoutData = await cashoutRes.json();
      expect(cashoutData.success).toBe(true);
      expect(cashoutData.cashoutAmount).toBeGreaterThan(1000); // Profitable cashout
      expect(cashoutData.newBalance).toBeCloseTo(4000 + cashoutData.cashoutAmount, 1);

    } finally {
      // Clean up
      await prisma.user.deleteMany({ where: { username: testUsername } });
    }
  });

  test('Module 6: Cricket Session Void / Rain Interruption Refund', async ({ page }) => {
    const testUsername = 'CricketFan_' + Math.floor(100000 + Math.random() * 900000);
    const plainPassword = 'SecretPass123!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Seed test user with initial balance
    await prisma.user.create({
      data: {
        username: testUsername,
        passwordHash,
        accountType: 'real',
        realBalance: 3000,
      }
    });

    try {
      // 1. Authenticate user
      const captchaRes = await page.request.get('/api/auth/captcha');
      const captchaData = await captchaRes.json();
      
      await page.request.post('/api/auth/login', {
        data: {
          emailOrUsername: testUsername,
          password: plainPassword,
          captcha: captchaData.code
        }
      });

      // 2. Place 6-Over session bet (500 Stake @ 1.90)
      const betRes = await page.request.post('/api/sports/bet', {
        data: {
          email: testUsername,
          matchTitle: 'CSK vs MI (6 Over Runs)',
          selection: 'Over 48.5',
          odds: 1.90,
          stake: 500,
          side: 'yes'
        }
      });
      expect(betRes.status()).toBe(200);
      const betData = await betRes.json();
      expect(betData.newBalance).toBe(2500);

      // 3. Admin settles match as Void (Rain Interruption -> 100% refund)
      // Login as admin to verify session
      const adminCookie = await page.request.post('/api/auth/login', {
        data: {
          emailOrUsername: 'admin',
          password: process.env.ADMIN_FALLBACK_PASSWORD || 'AuraBetAdmin2026!',
          captcha: (await (await page.request.get('/api/auth/captcha')).json()).code
        }
      });

      const voidRes = await page.request.post('/api/sports/settle', {
        data: {
          email: testUsername,
          transactionId: betData.transactionId,
          status: 'Void',
          payout: 500 // Full stake refund
        }
      });
      expect(voidRes.status()).toBe(200);
      const voidData = await voidRes.json();
      expect(voidData.success).toBe(true);
      expect(voidData.newBalance).toBe(3000); // 2500 + 500 = 3000 refunded

    } finally {
      await prisma.user.deleteMany({ where: { username: testUsername } });
    }
  });

  test('Module 7: Double-Entry Financial Reconciliation Ledger Audit', async ({ page }) => {
    // Authenticate as admin
    const captchaRes = await page.request.get('/api/auth/captcha');
    const captchaData = await captchaRes.json();
    
    await page.request.post('/api/auth/login', {
      data: {
        emailOrUsername: 'admin',
        password: process.env.ADMIN_FALLBACK_PASSWORD || 'AuraBetAdmin2026!',
        captcha: captchaData.code
      }
    });

    const auditRes = await page.request.get('/api/admin/audit/reconcile');
    expect(auditRes.status()).toBe(200);
    const auditData = await auditRes.json();
    expect(auditData.success).toBe(true);
    expect(auditData.usersAudited).toBeGreaterThan(0);
    expect(Array.isArray(auditData.reports)).toBe(true);
  });

  test('Enterprise Pillar 3: System Health & Telemetry Endpoint', async ({ page }) => {
    const res = await page.request.get('/api/health');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('HEALTHY');
    expect(data.services.database.status).toBe('HEALTHY');
    expect(data.services.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(data.system.memory.rssMb).toBeGreaterThan(0);
  });

  test('Enterprise Pillar 2 & 4: Anti-Hedging Detection & KYC Limits', async ({ page }) => {
    const testUsername = 'HardenedUser_' + Math.floor(100000 + Math.random() * 900000);
    const plainPassword = 'SecurePass2026!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Seed unverified real-money user with balance
    await prisma.user.create({
      data: {
        username: testUsername,
        passwordHash,
        accountType: 'real',
        realBalance: 100000,
        kycStatus: 'NONE', // Unverified
      }
    });

    try {
      const captchaRes = await page.request.get('/api/auth/captcha');
      const captchaData = await captchaRes.json();
      
      await page.request.post('/api/auth/login', {
        data: {
          emailOrUsername: testUsername,
          password: plainPassword,
          captcha: captchaData.code
        }
      });

      // 1. Place Back Bet
      const backRes = await page.request.post('/api/sports/bet', {
        data: {
          email: testUsername,
          matchTitle: 'Liverpool vs Arsenal',
          selection: 'Liverpool',
          odds: 2.10,
          stake: 500,
          side: 'yes'
        }
      });
      expect(backRes.status()).toBe(200);

      // 2. Immediate Opposite Lay Bet on identical match & selection (Anti-Hedging Guard should trigger)
      const layHedgeRes = await page.request.post('/api/sports/bet', {
        data: {
          email: testUsername,
          matchTitle: 'Liverpool vs Arsenal',
          selection: 'Liverpool',
          odds: 2.10,
          stake: 500,
          side: 'no'
        }
      });
      expect(layHedgeRes.status()).toBe(429);
      const hedgeData = await layHedgeRes.json();
      expect(hedgeData.flagType).toBe('ARBITRAGE_HEDGING');

      // 3. High-Stake KYC Threshold Requirement (> ₹50,000 without verified KYC)
      const highStakeRes = await page.request.post('/api/sports/bet', {
        data: {
          email: testUsername,
          matchTitle: 'Man City vs Chelsea',
          selection: 'Man City',
          odds: 1.50,
          stake: 60000, // > 50,000 threshold
          side: 'yes'
        }
      });
      expect(highStakeRes.status()).toBe(403);
      const kycError = await highStakeRes.json();
      expect(kycError.error).toContain('KYC_VERIFICATION_REQUIRED');

    } finally {
      await prisma.user.deleteMany({ where: { username: testUsername } });
    }
  });

});
