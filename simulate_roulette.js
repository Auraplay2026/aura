function simulateEuropean(rounds = 1000000) {
    let spent = rounds;
    let won = 0;
    for (let i = 0; i < rounds; i++) {
        let res = Math.floor(Math.random() * 37);
        if (res === 7) won += 36;
    }
    return won / spent;
}

function simulateAmerican(rounds = 1000000) {
    let spent = rounds;
    let won = 0;
    for (let i = 0; i < rounds; i++) {
        let res = Math.floor(Math.random() * 38);
        if (res === 7) won += 36;
    }
    return won / spent;
}

function simulateFrench(rounds = 1000000) {
    let spent = rounds;
    let won = 0;
    for (let i = 0; i < rounds; i++) {
        let res = Math.floor(Math.random() * 37);
        if (res === 0) won += 0.5;
        else if (res % 2 === 1) won += 2;
    }
    return won / spent;
}

function simulateMini(rounds = 1000000) {
    let spent = rounds;
    let won = 0;
    for (let i = 0; i < rounds; i++) {
        let res = Math.floor(Math.random() * 13);
        if (res === 7) won += 12;
    }
    return won / spent;
}

function simulateMultiWheel(rounds = 100000) {
    let spent = rounds * 4;
    let won = 0;
    for (let i = 0; i < rounds; i++) {
        for (let j = 0; j < 4; j++) {
            let res = Math.floor(Math.random() * 37);
            if (res === 7) won += 36;
        }
    }
    return won / spent;
}

// Lightning
// If we want a target RTP of 97.3%, we must mathematically balance the multipliers.
// Total expected normal payout for 37 numbers = 37 * 30 = 1110. Target = 36 * 37 = 1332.
// We need to distribute an average of 222 units of multiplier per round.
// If we select 3 numbers on average, their average multiplier boost should be 222 / 3 = 74.
// So if a number is lightning, it pays 30 + 74 = 104x on average.
// Let's implement this precise math.
function simulateLightning(rounds = 1000000) {
    let spent = rounds;
    let won = 0;
    for (let i = 0; i < rounds; i++) {
        let res = Math.floor(Math.random() * 37);
        let numMults = 3; // Fixed 3 for simpler math, can be random 1-5
        
        let multNums = new Set();
        while(multNums.size < numMults) {
            multNums.add(Math.floor(Math.random() * 37));
        }
        
        if (res === 7) {
            if (multNums.has(7)) {
                // Average multiplier of 104x. 
                // Let's mix 50x, 100x, 162x to average 104x
                let mults = [50, 100, 162];
                won += mults[Math.floor(Math.random() * mults.length)];
            } else {
                won += 30; // 29:1
            }
        }
    }
    return won / spent;
}

// Double Ball
// To get ~97.3% RTP:
// (1/37 * 1/37) * X + 2 * (1/37 * 36/37) * Y = 0.973
// X/1369 + 72*Y/1369 = 0.973  => X + 72Y = 1332
// Standard rules often pay 35 to 1 (36x) for both, and 17 to 1 (18x) for single.
// X = 36, Y = 18.
// 36 + 72*18 = 36 + 1296 = 1332 !
// EXACTLY 1332! So RTP is exactly 1332/1369 = 97.297% (same as European)!
// So payout is 17:1 for one ball, and 35:1 for two balls!
function simulateDoubleBall(rounds = 1000000) {
    let spent = rounds;
    let won = 0;
    for (let i = 0; i < rounds; i++) {
        let b1 = Math.floor(Math.random() * 37);
        let b2 = Math.floor(Math.random() * 37);
        
        if (b1 === 7 && b2 === 7) won += 36;
        else if (b1 === 7 || b2 === 7) won += 18;
    }
    return won / spent;
}

function simulateSpeed(rounds = 1000000) {
    return simulateEuropean(rounds);
}

function simulateZeroFree(rounds = 1000000) {
    let spent = rounds;
    let won = 0;
    for (let i = 0; i < rounds; i++) {
        let res = Math.floor(Math.random() * 36) + 1; // 1 to 36
        if (res === 7) won += 35; // 34:1
    }
    return won / spent;
}

const results = {
    "European": simulateEuropean(),
    "American": simulateAmerican(),
    "French (Even Money)": simulateFrench(),
    "Mini": simulateMini(),
    "Multi-Wheel": simulateMultiWheel(),
    "Lightning": simulateLightning(),
    "Double Ball": simulateDoubleBall(),
    "Speed": simulateSpeed(),
    "Zero-Free": simulateZeroFree()
};

for (const [name, rtp] of Object.entries(results)) {
    console.log(`${name}: ${(rtp * 100).toFixed(2)}%`);
}
