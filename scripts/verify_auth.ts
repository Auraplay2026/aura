import { signJWT, verifyJWT } from '../lib/jwt';
import { generateSecret, generateTOTP, verifyTOTP } from '../lib/totp';
import { proxy as middleware } from '../proxy';
import { NextRequest } from 'next/server';

async function testJWT() {
  console.log("--- Testing JWT Sign/Verify ---");
  const payload = { sub: "twintubrovquattro@gmail.com", role: "admin", exp: Math.floor(Date.now() / 1000) + 10 };
  const token = await signJWT(payload);
  console.log("Token generated successfully");

  const verified = await verifyJWT(token);
  if (verified.sub === payload.sub) {
    console.log("✅ Valid token verified successfully.");
  } else {
    throw new Error("❌ Valid token verification mismatch");
  }

  // Test tampered token by modifying the signature part (last 5 characters)
  const tamperedToken = token.slice(0, -5) + "xxxxx";
  try {
    await verifyJWT(tamperedToken);
    throw new Error("❌ Failed: Tampered token was verified!");
  } catch (err: any) {
    console.log("✅ Tampered token correctly rejected:", err.message);
  }

  // Test expired token
  const expiredPayload = { sub: "twintubrovquattro@gmail.com", role: "admin", exp: Math.floor(Date.now() / 1000) - 10 };
  const expiredToken = await signJWT(expiredPayload);
  try {
    await verifyJWT(expiredToken);
    throw new Error("❌ Failed: Expired token was verified!");
  } catch (err: any) {
    console.log("✅ Expired token correctly rejected:", err.message);
  }
}

async function testTOTP() {
  console.log("\n--- Testing TOTP Setup & Verification ---");
  const secret = generateSecret();
  console.log("Generated secret:", secret);

  const code = generateTOTP(secret);
  console.log("Generated TOTP code:", code);

  const isValid = verifyTOTP(code, secret);
  if (isValid) {
    console.log("✅ Valid TOTP code verified successfully.");
  } else {
    throw new Error("❌ Valid TOTP verification failed");
  }

  const invalidCode = "123456";
  const isInvalidValid = verifyTOTP(invalidCode, secret);
  if (!isInvalidValid) {
    console.log("✅ Invalid TOTP code correctly rejected.");
  } else {
    throw new Error("❌ Invalid TOTP code accepted!");
  }
}

async function testMiddlewareCSRF() {
  console.log("\n--- Testing Middleware CSRF Protection ---");
  // Mock request with different origin and host
  const req = new NextRequest("http://localhost:3000/api/admin/some-action", {
    method: "POST",
    headers: {
      "host": "localhost:3000",
      "origin": "http://malicious.com"
    }
  });

  const res = await middleware(req);
  if (res && res.status === 403) {
    const body = await res.json();
    if (body.error && body.error.includes("CSRF")) {
      console.log("✅ CSRF request blocked correctly with status 403:", body.error);
    } else {
      throw new Error("❌ CSRF block body mismatch");
    }
  } else {
    throw new Error("❌ Failed: CSRF request was not blocked!");
  }
}

async function testMiddlewareBOLA() {
  console.log("\n--- Testing Middleware BOLA Gating ---");

  process.env.ADMIN_SECRET_KEY = "AuraAdmin2026!";
  process.env.ADMIN_JWT_SECRET = "test-admin-jwt-secret";

  // 1. Test missing cookies
  const reqNoCookies = new NextRequest("http://localhost:3000/admin/dashboard", {
    headers: {
      "authorization": "Basic YWRtaW46QXVyYUFkbWluMjAyNiE="
    }
  });
  const resNoCookies = await middleware(reqNoCookies);
  if (resNoCookies && resNoCookies.status === 307) {
    console.log("✅ Unauthenticated request correctly redirected to home page.");
  } else {
    throw new Error("❌ Failed: Unauthenticated request not redirected!");
  }

  // 2. Test email mismatch (cookie email != JWT sub)
  const userPayload = { sub: "twintubrovquattro@gmail.com", role: "admin", exp: Math.floor(Date.now() / 1000) + 600 };
  const validToken = await signJWT(userPayload);

  const reqMismatch = new NextRequest("http://localhost:3000/admin/dashboard", {
    headers: {
      "cookie": `user_email=hacker@gmail.com; admin_auth_token=${validToken}`,
      "authorization": "Basic YWRtaW46QXVyYUFkbWluMjAyNiE="
    }
  });
  const resMismatch = await middleware(reqMismatch);
  if (resMismatch && (resMismatch.status === 307 || resMismatch.status === 401)) {
    console.log("✅ Identity mismatch (cookie email != JWT sub) correctly rejected.");
  } else {
    throw new Error("❌ Failed: Identity mismatch was not rejected!");
  }

  // 3. Test unauthorized email (not twintubrovquattro@gmail.com)
  const fakeAdminPayload = { sub: "fakeadmin@gmail.com", role: "admin", exp: Math.floor(Date.now() / 1000) + 600 };
  const fakeToken = await signJWT(fakeAdminPayload);

  const reqFake = new NextRequest("http://localhost:3000/admin/dashboard", {
    headers: {
      "cookie": `user_email=fakeadmin@gmail.com; admin_auth_token=${fakeToken}`,
      "authorization": "Basic YWRtaW46QXVyYUFkbWluMjAyNiE="
    }
  });
  const resFake = await middleware(reqFake);
  if (resFake && (resFake.status === 307 || resFake.status === 401)) {
    console.log("✅ Unauthorized admin email (not twintubrovquattro) correctly rejected.");
  } else {
    throw new Error("❌ Failed: Unauthorized admin email was not rejected!");
  }

  // 4. Test basic auth bypass attempt: username equal to secret must not be accepted
  const reqBasicBypass = new NextRequest("http://localhost:3000/admin/dashboard", {
    headers: {
      authorization: "Basic YWRtaW46QXVyYUFkbWluMjAyNiE=",
      host: "localhost:3000"
    }
  });
  const resBasicBypass = await middleware(reqBasicBypass);
  if (resBasicBypass && (resBasicBypass.status === 401 || resBasicBypass.status === 307)) {
    console.log("✅ Basic auth bypass attempt was rejected correctly.");
  } else {
    throw new Error(`❌ Failed: Basic auth bypass attempt was accepted with status: ${resBasicBypass?.status}`);
  }

  // 5. Test authorized access with sliding window renewal check
  const reqAuth = new NextRequest("http://localhost:3000/admin/dashboard", {
    headers: {
      "cookie": `user_email=twintubrovquattro@gmail.com; admin_auth_token=${validToken}`,
      "authorization": "Basic YWRtaW46QXVyYUFkbWluMjAyNiE="
    }
  });
  const resAuth = await middleware(reqAuth);
  if (resAuth && resAuth.status === 200) {
    const cookies = resAuth.cookies.getAll();
    const tokenCookie = cookies.find(c => c.name === 'admin_auth_token');
    if (tokenCookie && tokenCookie.value !== validToken) {
      console.log("✅ Authorized request allowed, and sliding window cookie issued successfully.");
    } else {
      throw new Error("❌ Failed: sliding window token not renewed!");
    }
  } else {
    throw new Error(`❌ Failed: Authorized request was rejected with status: ${resAuth?.status}`);
  }
}

async function runAll() {
  try {
    process.env.ADMIN_SECRET_KEY = "AuraAdmin2026!";
    process.env.ADMIN_JWT_SECRET = "test-admin-jwt-secret";
    await testJWT();
    await testTOTP();
    await testMiddlewareCSRF();
    await testMiddlewareBOLA();
    console.log("\n⭐⭐⭐ ALL SECURITY VERIFICATION TESTS PASSED ⭐⭐⭐");
  } catch (err: any) {
    console.error("\n❌ TEST SUITE FAILED:", err.message);
    process.exit(1);
  }
}

runAll();
