import crypto from 'crypto';

let sessionSecret: string = "";

function getJWTSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  if (secret) return secret;

  if (!sessionSecret) {
    sessionSecret = "aura-bet-enterprise-secure-jwt-signing-key-2026-matrix-protocol";
  }
  return sessionSecret;
}

export async function signJWT(payload: any): Promise<string> {
  const JWT_SECRET = getJWTSecret();
  const header = { alg: "HS256", typ: "JWT" };
  
  if (typeof Buffer !== 'undefined') {
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
    return `${data}.${signature}`;
  }

  // WebCrypto fallback
  const encoder = new TextEncoder();
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const sigBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  
  const bytes = new Uint8Array(sigBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const signature = btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${signature}`;
}

export async function verifyJWT(token: string): Promise<any> {
  const JWT_SECRET = getJWTSecret();
  if (!token || typeof token !== 'string') {
    throw new Error("Invalid JWT token");
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  if (typeof Buffer !== 'undefined') {
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
    const sigBuf = Buffer.from(encodedSignature);
    const expBuf = Buffer.from(expectedSignature);
    
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new Error("Invalid JWT signature");
    }

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (!payload.exp) {
      throw new Error("Invalid JWT: missing expiration claim.");
    }
    if (Date.now() / 1000 > payload.exp) {
      throw new Error("Session expired. Please log in again.");
    }

    return payload;
  }

  // WebCrypto fallback
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const parsedSig = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
  const pad = parsedSig.length % 4;
  const paddedSig = pad ? parsedSig + '='.repeat(4 - pad) : parsedSig;
  const binarySig = atob(paddedSig);
  const sigBytes = new Uint8Array(binarySig.length);
  for (let i = 0; i < binarySig.length; i++) {
    sigBytes[i] = binarySig.charCodeAt(i);
  }

  const isValid = await globalThis.crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(data)
  );

  if (!isValid) {
    throw new Error("Invalid JWT signature");
  }

  const parsedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  const padP = parsedPayload.length % 4;
  const paddedPayload = padP ? parsedPayload + '='.repeat(4 - padP) : parsedPayload;
  const payloadStr = decodeURIComponent(escape(atob(paddedPayload)));
  const payload = JSON.parse(payloadStr);

  if (!payload.exp) {
    throw new Error("Invalid JWT: missing expiration claim.");
  }
  if (Date.now() / 1000 > payload.exp) {
    throw new Error("Session expired. Please log in again.");
  }

  return payload;
}
