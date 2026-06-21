import * as crypto from 'crypto';

export function generateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
    const hash = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
    
    // Provably fair crash math standard (e.g., Bustabit/Roobet style)
    // Take first 52 bits of the hash (13 hex characters)
    const partial = hash.slice(0, 13);
    const num = parseInt(partial, 16);
    
    // 52 bits maximum is Math.pow(2, 52)
    const e = Math.pow(2, 52);
    
    // Calculate result: 1% house edge (99% RTP)
    const r = num / e; // uniform random in [0, 1)
    
    if (r === 0) return 1.00;
    
    const crashPoint = Math.floor(0.99 / (1 - r) * 100) / 100;
    
    return Math.max(1.00, crashPoint);
}

// Simulation
let rtpSum = 0;
const rounds = 1_000_000;
let bustedAt1 = 0;

for(let i=0; i<rounds; i++) {
    const cp = generateCrashPoint('secret-server-seed', 'player-client-seed', i);
    // House takes everything on 1.00 (about ~1% of the time depending on formula)
    if (cp === 1.00) {
        bustedAt1++;
    }
}

console.log(`Busted at 1.00x: ${(bustedAt1/rounds*100).toFixed(2)}%`);
// Calculate RTP
// Expected RTP for 0.99 / (1-r) is 99% theoretically.
