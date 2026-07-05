const encoder = new TextEncoder();

let sessionSecret: string = "";

function getJWTSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  if (secret) return secret;

  if (!sessionSecret) {
    sessionSecret = process.env.NODE_ENV === 'production'
      ? require('crypto').randomBytes(32).toString('hex')
      : "aura-bet-super-secret-development-jwt-signing-key-2026-matrix-secure";
    console.warn("WARNING: ADMIN_JWT_SECRET environment variable is not set. Using secure session key fallback.");
  }
  return sessionSecret;
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(s: string): Uint8Array {
  const parsed = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = parsed.length % 4;
  const padded = pad ? parsed + '='.repeat(4 - pad) : parsed;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function signJWT(payload: any): Promise<string> {
  const JWT_SECRET = getJWTSecret();
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  
  return `${data}.${base64urlEncode(new Uint8Array(signature))}`;
}

export async function verifyJWT(token: string): Promise<any> {
  const JWT_SECRET = getJWTSecret();
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  // Verify JWT header algorithm to prevent algorithm switching attacks
  try {
    const headerJson = new TextDecoder().decode(base64urlDecode(encodedHeader));
    const header = JSON.parse(headerJson);
    if (header.alg !== "HS256") {
      throw new Error("Unsupported JWT algorithm: " + header.alg);
    }
  } catch (err: any) {
    throw new Error("Invalid JWT header: " + err.message);
  }

  const data = `${encodedHeader}.${encodedPayload}`;
  const signatureBytes = base64urlDecode(encodedSignature);
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes as any,
    encoder.encode(data) as any
  );
  
  if (!isValid) {
    throw new Error("Invalid JWT signature");
  }
  
  const payloadJson = new TextDecoder().decode(base64urlDecode(encodedPayload));
  const payload = JSON.parse(payloadJson);
  
  if (!payload.exp) {
    throw new Error("Invalid JWT: missing expiration claim.");
  }
  if (Date.now() / 1000 > payload.exp) {
    throw new Error("Session expired. Please log in again.");
  }
  
  return payload;
}
