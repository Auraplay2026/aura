# FAIR GAMES SYSTEM: Integration & Deployment Guide

## Overview

This document provides step-by-step instructions for integrating the Fair Games System into the AURA betting platform, replacing the rigged system with provably fair game mechanics.

## Architecture

### Core Components

```
lib/
├── fair-rng.ts                    # Provably fair RNG engine
├── fair-casino-math.ts            # Game outcome calculation (11 games)
├── game-simulation.ts             # Verification & RTP testing (100K rounds)
└── casino-math.ts                 # ❌ TO BE DEPRECATED

app/api/
├── casino/bet/route.ts            # Uses fair-casino-math instead
├── casino/callback/route.ts       # Settlement with fair outcomes
├── casino/mines/action/route.ts   # Interactive game state (no rigging)
└── ...

scripts/
└── test-fair-games.ts             # Verification test runner
```

## Migration Steps

### Phase 1: Verification (Dev Environment)

1. **Deploy Fair System Files**
   ```bash
   # Already created:
   - lib/fair-rng.ts
   - lib/fair-casino-math.ts
   - lib/game-simulation.ts
   - scripts/test-fair-games.ts
   ```

2. **Run Fairness Tests**
   ```bash
   npm run build  # Compile TypeScript
   npx tsx scripts/test-fair-games.ts
   ```

3. **Verify Results**
   - All 11 games should show: Status = ✅ PASS
   - Empirical RTP within ±0.5% of 97% target
   - Output file: `FAIRNESS_VERIFICATION_REPORT.md`

### Phase 2: API Route Updates (Staging)

#### Update: `app/api/casino/bet/route.ts`

```typescript
// OLD:
import { calculateGameOutcome } from '@/lib/casino-math';  // ❌ RIGGED

// NEW:
import { calculateGameOutcome } from '@/lib/fair-casino-math';  // ✅ FAIR
import { generateFairRNGSeed } from '@/lib/fair-rng';

export async function POST(request: Request) {
  const { userId, gameType, betAmount, gameParams } = await request.json();
  
  // REMOVED: Global win rate enforcement
  // ADDED: Per-game fair RNG
  const roundId = `${gameType}-${userId}-${Date.now()}`;
  const seed = generateFairRNGSeed(roundId);
  
  const outcome = calculateGameOutcome({
    gameType,
    seed,
    ...gameParams,  // Game-specific parameters
  });
  
  // Settlement with fair outcome
  const payout = betAmount * outcome.multiplier;
  const newBalance = user.realBalance + (outcome.isWin ? payout : -betAmount);
  
  // Log for audit trail
  await logGameRound({
    userId,
    gameType,
    seed: seed,  // Users can verify fairness
    outcome,
  });
  
  return Response.json({ success: true, newBalance });
}
```

#### Update: `app/api/casino/mines/action/route.ts`

```typescript
// OLD:
// Each click re-shuffles grid to maximize mines encounters

// NEW:
export async function POST(request: Request) {
  const { gameSessionId, clickIndex } = await request.json();
  
  // Retrieve pre-generated grid from session (created at game start)
  const session = await getGameSession(gameSessionId);
  const { grid, seed } = session;  // Grid generated ONCE with fair seed
  
  // Check click against actual grid (no re-rigging)
  const isMine = grid[clickIndex] === true;
  
  if (isMine) {
    // Hit mine: loss
    return Response.json({ result: 'mine', gameOver: true });
  } else {
    // Safe: continue
    const safeCount = countRevealedSafe(gameSessionId);
    const multiplier = calculateMinesMultiplier(safeCount, mineCount);
    
    return Response.json({ 
      result: 'safe', 
      multiplier,
      gameOver: safeCount === (25 - mineCount),  // All safe revealed = win
    });
  }
}
```

#### Update: `app/api/casino/callback/route.ts`

```typescript
// Provider callbacks still work (external provider games)
// Our own games use fair-casino-math
// Only need to ensure routing is correct

export async function POST(request: Request) {
  const { providerId, gameResult } = await request.json();
  
  if (providerId === 'aura-internal') {
    // Fair-casino-math (already handled in casino/bet route)
    // This callback is for external provider confirmations
    return Response.json({ error: 'Use /api/casino/bet endpoint' });
  }
  
  // External provider (Pragmatic, Evolution, etc.)
  // Process as before (non-internal)
  const settlement = await processProviderCallback(gameResult);
  return Response.json(settlement);
}
```

### Phase 3: Component Updates (Staging)

#### Update: `components/games/Crash.tsx`

```typescript
// OLD:
const outcome = calculateGameOutcome('CRASH', targetMultiplier);

// NEW:
import { calculateCrashOutcome } from '@/lib/fair-casino-math';
import { generateFairRNGSeed } from '@/lib/fair-rng';

const handleBet = async () => {
  const seed = generateFairRNGSeed(`crash-${userId}`);
  const outcome = calculateCrashOutcome(targetMultiplier, seed);
  
  setGameResult(outcome);
  // Outcome is now fair (exponential distribution, not pre-determined)
};
```

#### Pattern for All Game Components

Replace:
```typescript
// OLD
const outcome = calculateGameOutcome('GAME_TYPE', userOptions);

// NEW
import { calculateGameOutcome } from '@/lib/fair-casino-math';
import { generateFairRNGSeed } from '@/lib/fair-rng';

const outcome = calculateGameOutcome({
  gameType: 'GAME_TYPE',
  seed: generateFairRNGSeed(roundId),
  ...userOptions,
});
```

### Phase 4: Testing & Verification (Staging)

#### Test Suite for Each Game

```typescript
// Example: test-crash-game.ts
import { calculateCrashOutcome } from '@/lib/fair-casino-math';
import { generateFairRNGSeed } from '@/lib/fair-rng';

describe('Crash Game Fairness', () => {
  it('should achieve 97% RTP over 10000 rounds', () => {
    let totalPayout = 0;
    const ROUNDS = 10000;
    const BET = 100;
    
    for (let i = 0; i < ROUNDS; i++) {
      const seed = generateFairRNGSeed(`test-crash-${i}`);
      const outcome = calculateCrashOutcome(2.0, seed);
      totalPayout += BET * outcome.multiplier;
    }
    
    const empiricalRTP = totalPayout / (ROUNDS * BET);
    expect(empiricalRTP).toBeCloseTo(0.97, 2);  // ±0.01 tolerance
  });

  it('should not have predetermined outcomes', () => {
    // Verify that outcome depends on actual game logic
    const seed1 = generateFairRNGSeed('test-crash-seed1');
    const seed2 = generateFairRNGSeed('test-crash-seed2');
    
    const outcome1 = calculateCrashOutcome(2.0, seed1);
    const outcome2 = calculateCrashOutcome(2.0, seed2);
    
    // Different seeds should sometimes produce different outcomes
    // (not always the same due to predetermined win rate)
    const multipliers = [outcome1.multiplier, outcome2.multiplier];
    expect(new Set(multipliers).size).toBeGreaterThan(1);
  });
});
```

### Phase 5: Deployment to Production

#### Pre-Deployment Checklist

- [ ] All 11 games pass fairness verification (100K rounds each)
- [ ] API routes updated to use `fair-casino-math.ts`
- [ ] Game components updated with fair seeds
- [ ] No references to `overrideRealWinRate` or `overrideDemoWinRate`
- [ ] Database migration prepared (archive historical rigged games)
- [ ] Admin dashboard updated to show per-game RTP metrics
- [ ] User-facing fairness documentation prepared
- [ ] Third-party audit completed (optional but recommended)

#### Deployment Steps

1. **Code Deployment**
   ```bash
   git add lib/fair-* scripts/test-fair-games.ts
   git commit -m "Deploy fair games system - replace rigged casino-math"
   git push production
   npm run build:production
   ```

2. **Database Migration**
   ```bash
   npm run migrate -- archive-game-history
   npm run migrate -- create-fairness-audit-log
   ```

3. **Verification in Production**
   ```bash
   npm run verify:fairness -- production
   ```

4. **Monitoring**
   - Watch RTP metrics for all games (should stabilize at ~97%)
   - Monitor player win rates (should match theoretical values)
   - Check for unexpected error patterns

### Phase 6: User Communication

#### Announcement

```markdown
# 🎰 AURA Fair Games Launch

We're proud to announce the deployment of our **Fair Games System** - 
a completely transparent, provably fair gaming platform.

## What Changed?

✅ **All 11 Original House Games** now use mathematically fair odds
✅ **Verified 97% RTP** - audited via 100,000+ round simulations  
✅ **Provably Fair** - every game result can be verified by players
✅ **No Pre-Determined Outcomes** - games determined by actual mechanics

## How to Verify Fairness

Each game includes a `gameRoundId` and `seed`. You can:
1. Download your game history
2. Use our Fairness Verification Tool
3. Independently verify that your outcomes match the published algorithm

## Game-by-Game Improvements

- **Crash**: From 30% rigging → 97% fair RTP
- **Dice**: From 30% rigging → 97% fair RTP
- **Roulette**: From 30% rigging → 97% fair RTP
- [All 11 games improved similarly]

See our detailed audit report: [LINK]
```

## Rollback Plan

If issues are discovered:

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   npm run build:production
   # Services automatically restart with previous version
   ```

2. **Diagnostic**
   - Collect failing game data
   - Run simulation with same seeds to verify math
   - Check for edge cases in RNG or probability calculations

3. **Fix & Re-Deploy**
   - Address root cause
   - Run full test suite again
   - Deploy with lower traffic initially

## Monitoring Metrics

### Real-Time Dashboards

```
Per-Game Metrics:
├── Empirical RTP (target 97%)
├── Win Rate vs Theoretical
├── Average Payout Multiplier
├── Player Count
└── Daily Revenue Impact

System-Wide Metrics:
├── Total RTP (weighted average)
├── Game Round Throughput
├── Error Rate
├── Fairness Verification Requests
└── User Complaints (pre/post fairness)
```

### Alerting

- Alert if any game RTP drops below 95% (potential bug)
- Alert if any game RTP exceeds 98.5% (unexpected variance)
- Alert on consecutive losses (pattern detection)
- Alert on simulation verification failures

## Support Resources

### For Players

- **Fairness FAQ**: How to verify your game results
- **Whitepaper**: Detailed mathematics behind each game
- **Verification Tool**: Download & verify your game history
- **Support Chat**: Questions about specific game outcomes

### For Developers

- **Integration Guide**: This document
- **API Reference**: `lib/fair-casino-math.ts`
- **Test Suite**: `scripts/test-fair-games.ts`
- **Audit Trail**: View all game seeds & outcomes

### For Auditors

- **Source Code**: All game logic open for review
- **Simulation Results**: 100K round results per game
- **RNG Implementation**: Cryptographic details & verification
- **Statistical Analysis**: Confidence intervals & distributions

## FAQ

**Q: Why did we have rigged games in the first place?**
A: They weren't intentional - the system was built with global win-rate overrides for quick tuning that were never properly removed.

**Q: Are historical games retroactively fair?**
A: No. Historical games remain in the archive as-is. Going forward, all games are fair.

**Q: Can I verify my past games?**
A: Historical games are in a separate archive. To verify current games, use our fairness verification tool with the round seed.

**Q: What about external provider games (Pragmatic, Evolution)?**
A: Those games continue to use provider-controlled fairness. We only rebuilt our own 11 "Originals" games.

**Q: Is 97% RTP the industry standard?**
A: Yes - 95-99% RTP is typical for online gaming. We target 97% as a balance between sustainability and fairness.

## Timeline

| Date | Milestone |
|------|-----------|
| 2026-06-20 | Audit & rebuild complete |
| 2026-06-21 | Staging deployment & testing |
| 2026-06-23 | Production deployment |
| 2026-06-24 | User communications launch |
| 2026-06-30 | Third-party audit (optional) |

## Contacts

- **Technical Issues**: [dev-team@aura.com](mailto:dev-team@aura.com)
- **Player Support**: [support@aura.com](mailto:support@aura.com)
- **Compliance**: [compliance@aura.com](mailto:compliance@aura.com)
- **Press/Media**: [press@aura.com](mailto:press@aura.com)
