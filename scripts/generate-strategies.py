#!/usr/bin/env python3
"""
Game-Specific Strategy Generator
Generates moderate-profit, game-aware betting strategies for each casino engine.
Output: prints TypeScript-ready strategy data to stdout.
"""

import json
import math

# --- Strategy definitions per game engine ---
STRATEGIES = {
    "plinko": [
        {
            "name": "Low-Risk Steady",
            "emoji": "🟢",
            "risk": "Low",
            "description": "Play on Low risk with flat bets. The narrow multiplier spread (0.5x-5.6x) gives frequent small wins, protecting your bankroll over many rounds.",
            "tip": "Set risk to Low. Keep bet size fixed. Aim for 50+ rounds to let the distribution work in your favor.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 50,
        },
        {
            "name": "Medium Scatter",
            "emoji": "🟡",
            "risk": "Med",
            "description": "Use Medium risk for a balanced spread. Occasional 3x-13x hits mixed with 0.4x losses create a volatile but exciting session.",
            "tip": "Set risk to Medium. Use 1-2% of bankroll per drop. Multi-ball mode (3-5 balls) smooths variance.",
            "recommendedBetPercent": 1.5,
            "recommendedRounds": 30,
        },
    ],
    "crash": [
        {
            "name": "Conservative Exit",
            "emoji": "🛡️",
            "risk": "Low",
            "description": "Set auto-cashout at 1.5x. You win small but frequently, building steady gains. Most crash rounds exceed 1.5x.",
            "tip": "Set auto-cashout to 1.50x. Use flat bets. Don't chase - discipline is the edge.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 40,
        },
        {
            "name": "Moderate Growth",
            "emoji": "📈",
            "risk": "Med",
            "description": "Target 2.5x cashout for a balance of risk and reward. You'll lose more rounds but each win covers multiple losses.",
            "tip": "Set auto-cashout to 2.50x. Keep bets at 1% of bankroll. Accept losing streaks of 3-5 rounds.",
            "recommendedBetPercent": 1,
            "recommendedRounds": 30,
        },
    ],
    "mines": [
        {
            "name": "Safe Sweep",
            "emoji": "🧹",
            "risk": "Low",
            "description": "Set 3 mines and reveal 4-5 tiles. The probability of hitting a mine stays below 20% per click, giving reliable small multipliers around 1.5x-2x.",
            "tip": "Use 3 mines. Cashout after 4 safe reveals. Never push past 6 reveals.",
            "recommendedBetPercent": 3,
            "recommendedRounds": 25,
        },
        {
            "name": "Medium Sweep",
            "emoji": "💎",
            "risk": "Med",
            "description": "Set 5 mines and reveal 3 tiles for a solid 2x-3x payout. Higher mines mean higher per-tile multipliers but more danger per click.",
            "tip": "Use 5 mines. Cashout after exactly 3 reveals. The 3rd tile already carries ~25% mine probability.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 20,
        },
    ],
    "dice": [
        {
            "name": "Under 50 Grind",
            "emoji": "🎯",
            "risk": "Low",
            "description": "Roll under 49.5 for a near-coinflip with 2x payout. The slight edge against you is minimal, making this the safest dice play.",
            "tip": "Set target to Under 49.50. Use flat bets. This is a long-session grind.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 50,
        },
        {
            "name": "Corner Play",
            "emoji": "🔥",
            "risk": "Med",
            "description": "Roll under 25 for a ~3.8x payout. You'll win roughly 1 in 4 rolls, but each win pays nearly 4x your bet.",
            "tip": "Set target to Under 25.00. Keep bets at 1% of bankroll. Expect 3-4 losses between wins.",
            "recommendedBetPercent": 1,
            "recommendedRounds": 30,
        },
    ],
    "coinflip": [
        {
            "name": "Flat Bet",
            "emoji": "🪙",
            "risk": "Low",
            "description": "Pick one side (AURA or SKULL) and bet the same amount every round. The 1.98x payout on a 50/50 game keeps variance low.",
            "tip": "Stick to one side. Don't switch after losses - each flip is independent. Use 2% of bankroll.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 30,
        },
        {
            "name": "Streak Recovery",
            "emoji": "🔄",
            "risk": "Med",
            "description": "After 2 consecutive losses, increase bet by 50%. After a win, reset to base. Recovers streaks without aggressive doubling.",
            "tip": "Base bet = 1.5% of bankroll. Increase by 50% after 2 losses. Reset on any win. Cap at 3x base.",
            "recommendedBetPercent": 1.5,
            "recommendedRounds": 25,
        },
    ],
    "limbo": [
        {
            "name": "Low Target Grind",
            "emoji": "⚡",
            "risk": "Low",
            "description": "Set target to 1.5x. You need the result to exceed 1.5x to win - this happens frequently, giving consistent small profits.",
            "tip": "Target 1.50x. Flat bet 2% of bankroll. The win rate at 1.5x is roughly 65%.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 40,
        },
        {
            "name": "Medium Target",
            "emoji": "🚀",
            "risk": "Med",
            "description": "Set target to 3x. Wins are less frequent (~33%) but each win triples your stake, covering prior losses well.",
            "tip": "Target 3.00x. Use 1% of bankroll per round. Accept 2-3 loss streaks between wins.",
            "recommendedBetPercent": 1,
            "recommendedRounds": 30,
        },
    ],
    "keno": [
        {
            "name": "Pick 4 Balanced",
            "emoji": "🎱",
            "risk": "Low",
            "description": "Select 4 numbers. Matching 2+ gives a payout, and the probability of hitting at least 2 out of 4 is reasonable for steady returns.",
            "tip": "Pick 4 numbers spread across the board. 2 hits = 2x, 3 hits = 5x, 4 hits = 20x.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 30,
        },
        {
            "name": "Pick 8 Aggro",
            "emoji": "🎰",
            "risk": "Med",
            "description": "Select 8 numbers for a wider net. Hitting 4+ out of 8 is needed for profit, but jackpot potential for 7-8 hits is massive.",
            "tip": "Pick 8 numbers. Break-even at 4 hits. The real payoff starts at 5+ hits (10x-100x range).",
            "recommendedBetPercent": 1,
            "recommendedRounds": 25,
        },
    ],
    "tower": [
        {
            "name": "Low Floor Climb",
            "emoji": "🪜",
            "risk": "Low",
            "description": "Play on Easy mode and cashout after floor 3-4. Each correct pick on Easy has ~67% success rate, giving safe compound growth.",
            "tip": "Use Easy mode. Cashout at floor 4 for ~2.5x. Never push past floor 5.",
            "recommendedBetPercent": 3,
            "recommendedRounds": 20,
        },
        {
            "name": "Mid-Tower Push",
            "emoji": "🏗️",
            "risk": "Med",
            "description": "Play Medium mode and target floor 3. Each pick is riskier (~50%) but multipliers climb faster - floor 3 yields ~4x.",
            "tip": "Use Medium mode. Cashout at floor 3. Winning 3 consecutive 50/50 picks happens ~12.5% of rounds.",
            "recommendedBetPercent": 1.5,
            "recommendedRounds": 20,
        },
    ],
    "slots": [
        {
            "name": "Fixed Stake Endurance",
            "emoji": "🎰",
            "risk": "Low",
            "description": "Bet the same small amount every spin. Slots have high variance - fixed stakes protect your bankroll during dry spells.",
            "tip": "Use 1% of bankroll per spin. Play at least 50 spins to give bonus features a chance to trigger.",
            "recommendedBetPercent": 1,
            "recommendedRounds": 50,
        },
        {
            "name": "Scaled Stake",
            "emoji": "📊",
            "risk": "Med",
            "description": "Increase bet by 25% after 10 losing spins, reset after a win of 3x+. Capitalizes on bonus rounds after dry streaks.",
            "tip": "Base bet = 1% of bankroll. After 10 losses, increase to 1.25%. After a 3x+ win, reset to base.",
            "recommendedBetPercent": 1,
            "recommendedRounds": 40,
        },
    ],
    "blackjack": [
        {
            "name": "Basic Strategy",
            "emoji": "🃏",
            "risk": "Low",
            "description": "Follow standard blackjack basic strategy: hit on soft 17 or below, stand on hard 17+, double on 11, split aces and 8s.",
            "tip": "Always hit below 12. Stand on 17+. Double on 11. Split Aces and 8s. Never take insurance.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 30,
        },
        {
            "name": "Conservative Play",
            "emoji": "🛡️",
            "risk": "Low",
            "description": "Stand on 15+ against dealer 2-6. Hit on 12-16 against dealer 7+. Avoid risky doubles and splits to preserve bankroll.",
            "tip": "Play tight. Stand early against weak dealer cards. Use flat bets.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 25,
        },
    ],
    "roulette": [
        {
            "name": "Even Money Coverage",
            "emoji": "🔴",
            "risk": "Low",
            "description": "Bet on Red/Black or Odd/Even. Near 50% win rate with 2x payout. The simplest and safest roulette strategy.",
            "tip": "Pick Red or Black. Flat bet 2% of bankroll. Don't chase patterns.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 30,
        },
        {
            "name": "Dozen Rotation",
            "emoji": "🎯",
            "risk": "Med",
            "description": "Bet on one of the three dozens (1-12, 13-24, 25-36). ~32% win probability with 3x payout.",
            "tip": "Pick a dozen and stay with it. Use 1.5% of bankroll. Expect to lose 2 out of 3 spins.",
            "recommendedBetPercent": 1.5,
            "recommendedRounds": 25,
        },
    ],
    "hilo": [
        {
            "name": "Safe Calls Only",
            "emoji": "📊",
            "risk": "Low",
            "description": "Only guess when the probability is 65%+ in your favor. Skip rounds where the card is 7-9 (too close to middle).",
            "tip": "Only bet on strong edges (card is 3 or lower, or Jack or higher). Cashout after 3 correct guesses.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 20,
        },
        {
            "name": "Streak Rider",
            "emoji": "🔥",
            "risk": "Med",
            "description": "Ride winning streaks - keep guessing as long as you're correct. Cashout at 5 correct for ~4x.",
            "tip": "Start with safe guesses. If you hit 3 in a row, push for 5. Cashout immediately on any doubt.",
            "recommendedBetPercent": 1.5,
            "recommendedRounds": 20,
        },
    ],
    "default": [
        {
            "name": "Flat Stake",
            "emoji": "📏",
            "risk": "Low",
            "description": "Bet the same fixed amount every round. The simplest bankroll management - protects against tilt and chasing losses.",
            "tip": "Use 2% of your total bankroll per bet. Never increase after a loss. Consistency beats impulse.",
            "recommendedBetPercent": 2,
            "recommendedRounds": 30,
        },
        {
            "name": "Percentage Bankroll",
            "emoji": "📐",
            "risk": "Med",
            "description": "Bet a fixed percentage of your current bankroll. Bets shrink when losing and grow when winning - natural protection.",
            "tip": "Use 1.5% of current balance. Recalculate after every 5 rounds. This auto-adjusts to your session.",
            "recommendedBetPercent": 1.5,
            "recommendedRounds": 30,
        },
    ],
}

def main():
    for game, strats in STRATEGIES.items():
        assert len(strats) == 2, f"{game} must have exactly 2 strategies"
        for s in strats:
            assert all(k in s for k in ["name", "emoji", "risk", "description", "tip", "recommendedBetPercent", "recommendedRounds"])

    print(f"Generated strategies for {len(STRATEGIES)} game types:")
    for game, strats in STRATEGIES.items():
        print(f"  {game}: {strats[0]['name']} ({strats[0]['risk']}), {strats[1]['name']} ({strats[1]['risk']})")

    with open("lib/game-strategies.json", "w") as f:
        json.dump(STRATEGIES, f, indent=2)
    print(f"\nWritten to lib/game-strategies.json")

if __name__ == "__main__":
    main()
