import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 1. Load environment variables manually
const dotenvPaths = [
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../.env.local')
];
for (const envPath of dotenvPaths) {
  if (fs.existsSync(envPath)) {
    const envText = fs.readFileSync(envPath, 'utf8');
    envText.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
          }
          if (val.startsWith("'") && val.endsWith("'")) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    });
  }
}

async function runSmokeTest() {
  console.log("======================================================================");
  console.log("SMOKE TEST: ADMIN DUAL-KEY SECURITY HANDSHAKE AUDIT");
  console.log("======================================================================");

  try {
    // Dynamically import routes after environment variables are loaded
    const { GET: getChallenge } = await import('../app/api/admin/auth/challenge/route');
    const { POST: verifyAuth } = await import('../app/api/admin/auth/verify/route');

    // Test 1: Fetch Challenge
    console.log("[Test 1] Requesting challenge from challenge handler...");
    const challengeRes = await getChallenge();
    const challengeData = await challengeRes.json();
    
    if (!challengeData.success || !challengeData.challenge) {
      throw new Error(`Challenge fetch failed: ${JSON.stringify(challengeData)}`);
    }
    const challenge = challengeData.challenge;
    console.log(`✅ Challenge successfully generated: ${challenge}`);

    // Compute signature using WebCrypto equivalent (HMAC-SHA256)
    const serverSecret = process.env.ADMIN_PASSCODE || "aura-dev-admin-secret";
    console.log(`Using configuration passcode: "${serverSecret}"`);
    const expectedSignature = crypto.createHmac('sha256', serverSecret).update(challenge).digest('hex');
    console.log(`Computed HMAC-SHA256 signature: ${expectedSignature}`);

    // Test 2: Verify with correct credentials (twintubrovquattro@gmail.com, correct key)
    console.log("\n[Test 2] Submitting valid admin credentials...");
    const req1 = new Request("http://localhost:3000/api/admin/auth/verify", {
      method: "POST",
      body: JSON.stringify({
        email: "twintubrovquattro@gmail.com",
        challenge,
        signature: expectedSignature,
        passcode: serverSecret
      })
    });
    
    const verifyRes1 = await verifyAuth(req1);
    const verifyData1 = await verifyRes1.json();
    
    console.log("Verify Response Status:", verifyRes1.status);
    console.log("Verify Response Body:", JSON.stringify(verifyData1));
    
    if (verifyRes1.status !== 200 || !verifyData1.success) {
      throw new Error(`Failed to authenticate valid admin: ${JSON.stringify(verifyData1)}`);
    }
    console.log("✅ Valid Admin Authentication Handshake PASSED successfully!");

    // Test 3: Verify incorrect passcode rejection
    console.log("\n[Test 3] Submitting incorrect Master Security Key...");
    const req2 = new Request("http://localhost:3000/api/admin/auth/verify", {
      method: "POST",
      body: JSON.stringify({
        email: "twintubrovquattro@gmail.com",
        challenge,
        signature: expectedSignature,
        passcode: "wrong-passcode-key-123"
      })
    });
    
    const verifyRes2 = await verifyAuth(req2);
    const verifyData2 = await verifyRes2.json();
    console.log("Verify Response Status:", verifyRes2.status);
    console.log("Verify Response Body:", JSON.stringify(verifyData2));
    
    if (verifyRes2.status !== 403 || verifyData2.success || !verifyData2.error.includes("Master Security Key")) {
      throw new Error(`Incorrect passcode was not correctly rejected: ${JSON.stringify(verifyData2)}`);
    }
    console.log("✅ Incorrect Master Security Key correctly rejected with 403 Forbidden!");

    // Test 4: Verify role mismatch (regular user)
    console.log("\n[Test 4] Submitting regular user email (role !== admin)...");
    const req3 = new Request("http://localhost:3000/api/admin/auth/verify", {
      method: "POST",
      body: JSON.stringify({
        email: "test_user_depositor@gmail.com",
        challenge,
        signature: expectedSignature,
        passcode: serverSecret
      })
    });
    
    const verifyRes3 = await verifyAuth(req3);
    const verifyData3 = await verifyRes3.json();
    console.log("Verify Response Status:", verifyRes3.status);
    console.log("Verify Response Body:", JSON.stringify(verifyData3));
    
    if (verifyRes3.status !== 403 || verifyData3.success || !verifyData3.error.includes("Administrative role mismatch")) {
      throw new Error(`Regular user was not correctly blocked with role mismatch: ${JSON.stringify(verifyData3)}`);
    }
    console.log("✅ Non-admin user email correctly rejected with role mismatch error!");

    console.log("\n======================================================================");
    console.log("⭐ ALL SECURITY CORE HANDSHAKE SMOKE TESTS PASSED ⭐");
    console.log("======================================================================");
  } catch (err: any) {
    console.error("\n❌ SMOKE TEST FAILURE:", err.message);
    process.exit(1);
  }
}

runSmokeTest();
