import crypto from 'crypto';

// Base32 decoding helper
function decodeBase32(charSequence: string): Buffer {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanSequence = charSequence.toUpperCase().replace(/[^A-Z2-7]/g, '');
  
  let bits = '';
  for (let i = 0; i < cleanSequence.length; i++) {
    const val = base32chars.indexOf(cleanSequence.charAt(i));
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bufferBytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.substring(i, i + 8);
    bufferBytes.push(parseInt(chunk, 2));
  }
  
  return Buffer.from(bufferBytes);
}

// Generate TOTP for a given secret and time counter
export function generateTOTP(secret: string, timeOffset = 0): string {
  const key = decodeBase32(secret);
  
  // 30 second step
  const epoch = Math.floor(Date.now() / 1000);
  const time = Math.floor(epoch / 30) + timeOffset;
  
  // 8-byte buffer representing the counter
  const timeBytes = Buffer.alloc(8);
  timeBytes.writeBigInt64BE(BigInt(time));
  
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(timeBytes);
  const hmacResult = hmac.digest();
  
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

// Constant-time string comparison to mitigate side-channel timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify TOTP token (supports window of +/- 1 step)
export function verifyTOTP(token: string, secret: string): boolean {
  if (!token || token.length !== 6) return false;
  
  for (let i = -1; i <= 1; i++) {
    if (constantTimeCompare(generateTOTP(secret, i), token)) {
      return true;
    }
  }
  return false;
}

// Generate random base32 secret
export function generateSecret(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
