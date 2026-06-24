import { prisma } from '../lib/prisma';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function cleanupUser(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.delete({ where: { email } });
      console.log(`Cleaned up user ${email} from database.`);
    }
  } catch (err: any) {
    console.error(`Error cleaning up user ${email}:`, err.message);
  }
}

async function runTest() {
  console.log(`=== STARTING USER SESSION & BOLA SECURITY AUDIT ===`);
  console.log(`Targeting server at: ${BASE_URL}`);

  const testEmail = 'test_user_session@aura.com';
  const targetEmail = 'target_user_session@aura.com';

  // Ensure fresh database state
  await cleanupUser(testEmail);
  await cleanupUser(targetEmail);

  // 1. Pre-register target user (our BOLA victim)
  console.log('\nCreating victim user...');
  const signupVictimRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'victimuser',
      email: targetEmail,
      password: 'VictimPassword123!',
      accountType: 'demo'
    })
  });
  if (!signupVictimRes.ok) {
    throw new Error(`Failed to create victim user: ${signupVictimRes.statusText}`);
  }
  console.log('Victim user created.');

  // 2. Register test user (the attacker)
  console.log('\nRegistering attacker user...');
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'attackeruser',
      email: testEmail,
      password: 'AttackerPassword123!',
      accountType: 'demo'
    })
  });

  if (!signupRes.ok) {
    throw new Error(`Attacker signup failed: ${signupRes.statusText}`);
  }

  // Extract auth cookies from signup response
  const cookies = signupRes.headers.getSetCookie();
  let authTokenCookie = '';
  let emailCookie = '';
  for (const cookie of cookies) {
    if (cookie.startsWith('user_auth_token=')) {
      authTokenCookie = cookie.split(';')[0];
    } else if (cookie.startsWith('user_email=')) {
      emailCookie = cookie.split(';')[0];
    }
  }

  if (!authTokenCookie || !emailCookie) {
    throw new Error('❌ Failed: Session cookies were not issued upon registration!');
  }
  console.log('✅ Success: Session cookies set successfully on signup.');

  const attackerCookieHeader = `${authTokenCookie}; ${emailCookie}`;

  // 3. Test Endpoints for Gating and BOLA Defense
  const testEndpoints = [
    {
      name: '/api/auth/me',
      payload: { email: testEmail },
      bolaPayload: { email: targetEmail }
    },
    {
      name: '/api/auth/sync',
      payload: { email: testEmail, accountType: 'demo' },
      bolaPayload: { email: targetEmail, accountType: 'demo' }
    },
    {
      name: '/api/casino/bet',
      payload: { email: testEmail, gameId: 'slot-fruit', gameTitle: 'Fruit Slot', betAmount: 10, targetMultiplier: 2.0 },
      bolaPayload: { email: targetEmail, gameId: 'slot-fruit', gameTitle: 'Fruit Slot', betAmount: 10, targetMultiplier: 2.0 },
      invalidPayload: { email: testEmail, gameId: 'slot-fruit', gameTitle: 'Fruit Slot', betAmount: 'NaN', targetMultiplier: 2.0 }
    },
    {
      name: '/api/rewards/claim',
      payload: { email: testEmail, rewardType: 'daily', amount: 10, details: 'Daily Bonus Drop' },
      bolaPayload: { email: targetEmail, rewardType: 'daily', amount: 10, details: 'Daily Bonus Drop' },
      invalidPayload: { email: testEmail, rewardType: 'daily', amount: 'NaN', details: 'Daily Bonus Drop' }
    },
    {
      name: '/api/deposit/request',
      payload: { email: testEmail, amount: 500, utr: '123456789012', upiId: 'test@upi', screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', type: 'deposit', method: 'upi' },
      bolaPayload: { email: targetEmail, amount: 500, utr: '123456789012', upiId: 'test@upi', screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', type: 'deposit', method: 'upi' },
      invalidPayload: { email: testEmail, amount: 'NaN', utr: '123456789012', upiId: 'test@upi', screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', type: 'deposit', method: 'upi' }
    },
    {
      name: '/api/predictions/trade',
      payload: { email: testEmail, marketId: 'market-1', marketTitle: 'Will it rain?', side: 'yes', investment: 100, currentPrice: 50 },
      bolaPayload: { email: targetEmail, marketId: 'market-1', marketTitle: 'Will it rain?', side: 'yes', investment: 100, currentPrice: 50 },
      invalidPayload: { email: testEmail, marketId: 'market-1', marketTitle: 'Will it rain?', side: 'yes', investment: 'NaN', currentPrice: 50 }
    },
    {
      name: '/api/sports/bet',
      payload: { email: testEmail, matchTitle: 'Match A vs B', selection: 'A', odds: 2.0, stake: 50, side: 'yes' },
      bolaPayload: { email: targetEmail, matchTitle: 'Match A vs B', selection: 'A', odds: 2.0, stake: 50, side: 'yes' },
      invalidPayload: { email: testEmail, matchTitle: 'Match A vs B', selection: 'A', odds: 2.0, stake: 'NaN', side: 'yes' }
    },
    {
      name: '/api/account/activity',
      payload: { email: testEmail },
      bolaPayload: { email: targetEmail }
    }
  ];

  for (const ep of testEndpoints) {
    console.log(`\nTesting endpoint: ${ep.name}`);

    // Test A: Access without cookies
    const resNoCookies = await fetch(`${BASE_URL}${ep.name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ep.payload)
    });
    if (resNoCookies.status !== 401) {
      throw new Error(`❌ Failed: Endpoint ${ep.name} allowed access without session cookies! Status: ${resNoCookies.status}`);
    }
    console.log(`  ✅ Passed: Missing session cookie blocked (401 Unauthorized).`);

    // Test B: Access with valid matching cookies
    const resAuth = await fetch(`${BASE_URL}${ep.name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': attackerCookieHeader
      },
      body: JSON.stringify(ep.payload)
    });
    if (!resAuth.ok) {
      const text = await resAuth.text();
      throw new Error(`❌ Failed: Endpoint ${ep.name} rejected valid session request! Status: ${resAuth.status}, Body: ${text}`);
    }
    console.log(`  ✅ Passed: Authorized request allowed (200 OK).`);

    // Test C: BOLA Attack (Access other user's resource using attacker's session)
    const resBola = await fetch(`${BASE_URL}${ep.name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': attackerCookieHeader
      },
      body: JSON.stringify(ep.bolaPayload)
    });
    if (resBola.status !== 401) {
      throw new Error(`❌ Failed: BOLA attack succeeded! Endpoint ${ep.name} allowed authenticated user to access/modify another user's profile/resources! Status: ${resBola.status}`);
    }
    console.log(`  ✅ Passed: BOLA exploit blocked (401 Unauthorized).`);

    // Test D: Numeric Injection Validation (if invalidPayload is defined)
    if (ep.invalidPayload) {
      const resInvalid = await fetch(`${BASE_URL}${ep.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': attackerCookieHeader
        },
        body: JSON.stringify(ep.invalidPayload)
      });
      if (resInvalid.status !== 400) {
        throw new Error(`❌ Failed: Endpoint ${ep.name} accepted invalid numeric/malformed input! Status: ${resInvalid.status}`);
      }
      console.log(`  ✅ Passed: Malformed numeric input rejected (400 Bad Request).`);
    }
  }

  // Cleanup database
  await cleanupUser(testEmail);
  await cleanupUser(targetEmail);

  console.log('\n⭐⭐⭐ ALL USER SESSION AND BOLA PROTECTION VERIFICATION TESTS PASSED ⭐⭐⭐\n');
}

runTest().catch((err) => {
  console.error('\n❌ SECURITY TEST FAILURE:', err.message);
  process.exit(1);
});
