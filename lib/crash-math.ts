/**
 * Provably Fair Crash Math Module
 * 
 * Implements a verifiable HMAC-SHA256 based algorithm to determine crash points.
 * Ensures a strict, provable House Edge (default 1.00%).
 */

// Generate a random 256-bit hex string for a seed
export function generateSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Convert a string to an ArrayBuffer
function stringToArrayBuffer(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return new Uint8Array(encoder.encode(str));
}

// Compute HMAC-SHA256 (Web Crypto API)
async function computeHMAC(keyStr: string, messageStr: string): Promise<string> {
  const keyData = stringToArrayBuffer(keyStr);
  const messageData = stringToArrayBuffer(messageStr);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Calculates the exact crash point given a server seed, client seed, and round nonce.
 * @param serverSeed The secret server seed (hex)
 * @param clientSeed The public client seed (string)
 * @param nonce The round number
 * @returns The provably fair crash multiplier (e.g., 2.34)
 */
export async function generateProvablyFairCrashPoint(serverSeed: string, clientSeed: string, nonce: number): Promise<{ crashPoint: number, hash: string }> {
  const message = `${clientSeed}:${nonce}`;
  const hash = await computeHMAC(serverSeed, message);

  // Take the first 52 bits of the hash (13 hex characters)
  const partial = hash.slice(0, 13);
  const num = parseInt(partial, 16);

  // 52 bits maximum is Math.pow(2, 52)
  const e = Math.pow(2, 52);

  // Uniform random float in [0, 1)
  const r = num / e;

  if (r === 0) return { crashPoint: 1.00, hash };

  // Calculate result: 1% house edge (99% RTP)
  // crash_point = 0.99 / (1 - r)
  // Floor to 2 decimal places: floor(val * 100) / 100
  const crashPoint = Math.floor(0.99 / (1 - r) * 100) / 100;

  return { 
    crashPoint: Math.max(1.00, crashPoint),
    hash 
  };
}
