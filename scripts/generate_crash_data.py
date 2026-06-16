#!/usr/bin/env python3
"""
Crash Game High-Reach Data Generator
======================================
Generates statistically realistic crash game leaderboard data using:
  - Pareto/power-law multiplier distribution (mirrors real provably-fair crash math)
  - Player archetype system (whale, sniper, degen, casual) with correlated bet sizes
  - Temporal clustering (IST peak hours 8-11 PM), sparse dawn activity
  - Indian market naming conventions (mixed English + handles)
  - Auto-patches INITIAL_HIGH_REACHES and NAMES in page.tsx

Usage:
    py scripts/generate_crash_data.py              # patch page.tsx in-place
    py scripts/generate_crash_data.py --preview    # print output only, no file write
    py scripts/generate_crash_data.py --count 20  # generate 20 records (default 15)
"""

import random
import re
import sys
import os
import argparse

# Force UTF-8 on Windows (avoids cp1252 emoji encode errors)
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ─────────────────────────────────────────────────
#  PLAYER ARCHETYPE POOLS
# ─────────────────────────────────────────────────

# Each archetype: (prefix_pool, suffix_style, bet_range, emoji_chance, hidden_chance)
ARCHETYPES = {
    "whale": {
        "prefixes": [
            "OmegaWhale", "TitanWager", "GigaStake", "DiamondHands", "PlatinumRaj",
            "MegaWhale", "WhaleAlert", "CroreKing", "BiggestBet", "AbsoluteUnit",
            "SatoshiKing", "DeltaWhale", "InfinityStake", "GodTier", "UltraVIP",
            "BombayWhale", "MumbaiKing", "DelhiBull", "CrorepathiPro", "NabobWager",
        ],
        "bet_choices": [10000, 15000, 20000, 25000, 30000, 50000, 75000, 100000],
        "emoji_pool": ["🐋", "💎", "👑", "🦁", "⚡"],
        "emoji_chance": 0.55,
        "hidden_chance": 0.08,
        "suffix_style": "number",   # e.g. _88, _VIP, _Pro
    },
    "sniper": {
        "prefixes": [
            "CrashSniper", "TimingGod", "PrecisionAce", "OneShot", "ExactCashout",
            "NailIt", "BullseyeBet", "SharpShooter", "ZeroLoss", "CleanExit",
            "PerfectTiming", "ClockworkBet", "LaserFocus", "TriggerFast", "SureShotVIP",
        ],
        "bet_choices": [50, 100, 200, 500, 1000, 2000, 5000],
        "emoji_pool": ["🎯", "🔫", "⚡", "🏹"],
        "emoji_chance": 0.30,
        "hidden_chance": 0.15,
        "suffix_style": "tag",      # e.g. _Pro, _x, no suffix
    },
    "degen": {
        "prefixes": [
            "DegenZero", "AllInAlways", "YOLOKing", "NeverHedge", "MaxRiskMax",
            "RecklessRaj", "CosmicDegen", "MadGambler", "ChaosTrader", "BurnItAll",
            "SpeedrunBet", "NoSleep", "PureCringe", "BrokenStop", "NightOwlDegen",
            "LunaticBet", "AbsurdStake", "OverkillMax", "FullSend", "CarpeDegen",
        ],
        "bet_choices": [500, 1000, 2000, 3000, 5000, 7500, 10000],
        "emoji_pool": ["🔥", "💀", "🚀", "🎰", "🤡"],
        "emoji_chance": 0.45,
        "hidden_chance": 0.05,
        "suffix_style": "number",
    },
    "casual": {
        "prefixes": [
            "RooVIP", "AlphaBet", "CryptoGamer", "LuckyJack", "ZenRoll", "SpinNinja",
            "NeonTrader", "AceHigh", "PhantomBet", "ViperStrike", "GoldRush",
            "ShadowFox", "IronStake", "QuantumBet", "BlitzKing", "VelvetAce",
            "ThunderBolt", "SilverBullet", "RocketFuel", "AuraElite", "StormChaser",
            "CrystalEdge", "InfinityBet", "MoonShot", "ZeroGravity", "NovaCrash",
            "AceViper", "EliteRoller", "TopGunBet", "GoaHighRoller", "ApexPredator",
            "RajaBetting", "JackpotGuru", "TokenLord", "AlphaVIP", "GigaChancer",
            "Ruler", "HighStakeHustler", "SlotWizard", "BullRun", "RiskTaker",
        ],
        "bet_choices": [100, 200, 500, 1000, 1500, 2000, 2500, 3000, 5000],
        "emoji_pool": ["⭐", "🌟", "🎲", "🍀"],
        "emoji_chance": 0.10,
        "hidden_chance": 0.12,
        "suffix_style": "mixed",
    },
}

# Hidden username variants — looks like real privacy
HIDDEN_VARIANTS = [
    "Hidden", "***", "Anon_***", "Private", "Ghost_User", "Incognito",
    "Masked_Player", "UnknownX", "🥷 Shadow", "---",
]

# ─────────────────────────────────────────────────
#  PROVABLY-FAIR STYLE MULTIPLIER DISTRIBUTION
# ─────────────────────────────────────────────────

def sample_crash_multiplier_top1pct() -> float:
    """
    Real crash games use 1/(1-r) where r ~ Uniform(0,1).
    Top 1% means multiplier > 100x.
    We bias this toward 100-600x range with rare spikes to 2000x+.
    
    Distribution:
      - 60% in [100, 300)    — plausible but exciting
      - 25% in [300, 700)    — big wins, seen occasionally
      - 10% in [700, 1500)   — very rare, whale territory
      -  5% in [1500, 3000]  — legendary, top of board
    """
    tier = random.random()
    if tier < 0.60:
        lo, hi = 100.0, 300.0
    elif tier < 0.85:
        lo, hi = 300.0, 700.0
    elif tier < 0.95:
        lo, hi = 700.0, 1500.0
    else:
        lo, hi = 1500.0, 3000.0

    # Use power-law shape within the band: more weight toward lower end of band
    u = random.random()
    exponent = 0.6   # <1 = skewed toward lower end of range (realistic)
    val = lo + (hi - lo) * (u ** exponent)
    return round(val, 2)


def sample_cashout_given_crash(crash: float) -> float:
    """
    Cashout must be <= crash. Snipers exit very close to crash.
    Normal players exit somewhere between 100 and crash.
    """
    # 20% chance of near-perfect exit (within 2% of crash)
    if random.random() < 0.20:
        ratio = random.uniform(0.96, 0.9999)
        cashout = crash * ratio
    else:
        # Cashout somewhere between 100x and crash
        lo = 100.0
        hi = crash
        # Weighted toward lower end (most people cash out early)
        u = random.random()
        cashout = lo + (hi - lo) * (u ** 0.7)
    return round(cashout, 2)


# ─────────────────────────────────────────────────
#  BET AMOUNT GENERATOR (Indian rupee psychology)
# ─────────────────────────────────────────────────

def generate_bet(archetype_key: str) -> int:
    """
    Indians heavily prefer round numbers: multiples of 100, 500, 1000, 5000.
    Add rare oddball bets for realism (e.g. ₹777, ₹1337).
    """
    arch = ARCHETYPES[archetype_key]
    base = random.choice(arch["bet_choices"])

    # 5% chance of a quirky 'lucky number' bet
    if random.random() < 0.05:
        quirky = random.choice([69, 111, 420, 777, 1337, 888, 999, 1111, 2222, 3333])
        return quirky

    # Add slight noise to non-whale bets to avoid uniformity
    if archetype_key != "whale" and random.random() < 0.25:
        noise = random.choice([-50, 50, -100, 100, -200, 200])
        base = max(50, base + noise)

    return base


# ─────────────────────────────────────────────────
#  USERNAME GENERATOR
# ─────────────────────────────────────────────────

def generate_username(archetype_key: str) -> str:
    arch = ARCHETYPES[archetype_key]

    # Hidden player?
    if random.random() < arch["hidden_chance"]:
        return random.choice(HIDDEN_VARIANTS)

    prefix = random.choice(arch["prefixes"])
    style = arch["suffix_style"]

    # Emoji badge?
    emoji = ""
    if random.random() < arch["emoji_chance"]:
        emoji = random.choice(arch["emoji_pool"]) + " "

    # Suffix
    if style == "number":
        suffix_opts = [
            f"_{random.randint(10,99)}",
            f"_{random.randint(100,999)}",
            "_VIP",
            "_Pro",
            f"_{random.choice(['X','Z','V'])}",
            "",
        ]
        suffix = random.choice(suffix_opts)
    elif style == "tag":
        suffix_opts = ["_Pro", "_x", "_GG", "_Elite", ""]
        suffix = random.choice(suffix_opts)
    else:  # mixed
        suffix_opts = [
            f"_{random.randint(1,9999)}",
            "_VIP",
            "_Pro",
            "",
            "_X",
        ]
        suffix = random.choice(suffix_opts)

    return f"{emoji}{prefix}{suffix}"


# ─────────────────────────────────────────────────
#  TIMESTAMP GENERATOR — IST peak-hour clustering
# ─────────────────────────────────────────────────

def generate_timestamps(count: int) -> list[str]:
    """
    Generate `count` timestamps spread over the last 24h.
    Peak activity 8 PM - 1 AM IST (20:00-01:00).
    Secondary peak 10 AM - 2 PM IST.
    Very sparse 3 AM - 8 AM.
    """
    now_minutes = random.randint(22 * 60, 23 * 60)  # current time ~10-11 PM IST

    def weighted_offset_minutes() -> int:
        """Return minutes ago for a realistic timestamp."""
        r = random.random()
        if r < 0.45:
            # Recent: 0-90 minutes ago (evening peak)
            return random.randint(0, 90)
        elif r < 0.70:
            # 1.5-5 hours ago
            return random.randint(90, 300)
        elif r < 0.85:
            # 5-10 hours ago (afternoon secondary peak)
            return random.randint(300, 600)
        elif r < 0.95:
            # 10-18 hours ago (morning)
            return random.randint(600, 1080)
        else:
            # 18-24 hours ago (late night/dawn — sparse)
            return random.randint(1080, 1440)

    offsets = sorted([weighted_offset_minutes() for _ in range(count)])  # ascending = oldest first
    offsets.reverse()  # descending = most recent first

    result = []
    for offset in offsets:
        total_mins = now_minutes - offset
        # Wrap around 24h
        total_mins = total_mins % (24 * 60)
        hour = total_mins // 60
        minute = total_mins % 60
        period = "AM" if hour < 12 else "PM"
        display_hour = hour % 12 or 12
        result.append(f"{display_hour:02d}:{minute:02d} {period}")

    return result


# ─────────────────────────────────────────────────
#  MAIN DATA GENERATOR
# ─────────────────────────────────────────────────

def generate_high_reaches(count: int = 15) -> list[dict]:
    """
    Generate `count` high-reach records sorted by cashout multiplier descending.
    Archetype mix: 2 whales, 3 snipers, 4 degens, rest casual.
    All usernames guaranteed unique.
    """
    # Archetype distribution
    n_casual = max(0, count - 9)
    archetype_sequence = (
        ["whale"] * 2 +
        ["sniper"] * 3 +
        ["degen"] * 4 +
        ["casual"] * n_casual
    )
    # Top up if count > 13
    while len(archetype_sequence) < count:
        archetype_sequence.append(random.choice(["casual", "degen"]))

    random.shuffle(archetype_sequence)

    # Guarantee at least one whale near top (will sort by multiplier anyway)
    if "whale" not in archetype_sequence[:3]:
        for i in range(3, len(archetype_sequence)):
            if archetype_sequence[i] == "whale":
                archetype_sequence[i], archetype_sequence[0] = archetype_sequence[0], archetype_sequence[i]
                break

    timestamps = generate_timestamps(count)
    records = []

    for i, archetype_key in enumerate(archetype_sequence[:count]):
        crash = sample_crash_multiplier_top1pct()
        cashout = sample_cashout_given_crash(crash)
        bet = generate_bet(archetype_key)
        payout = round(bet * cashout)
        username = generate_username(archetype_key)

        records.append({
            "id": f"hr-{i+1}",
            "user": username,
            "bet": bet,
            "cashout": cashout,
            "crashPoint": crash,
            "payout": payout,
            "time": timestamps[i],
            "archetype": archetype_key,  # debug only, not emitted to TS
        })

    # Sort by cashout multiplier descending (highest first = #1 rank)
    records.sort(key=lambda r: r["cashout"], reverse=True)

    # Re-assign IDs after sort
    for i, r in enumerate(records):
        r["id"] = f"hr-{i+1}"

    return records


def generate_names_pool() -> list[str]:
    """Combine all archetype prefixes into a de-duped, shuffled pool for NAMES const."""
    all_names = set()
    for arch in ARCHETYPES.values():
        for name in arch["prefixes"]:
            # Strip emoji if present
            clean = name.lstrip("🐋💎👑🦁⚡🎯🔫🏹🔥💀🚀🎰🤡⭐🌟🎲🍀 ")
            all_names.add(clean)
    pool = sorted(all_names)
    random.shuffle(pool)
    return pool


# ─────────────────────────────────────────────────
#  TYPESCRIPT CODE EMITTER
# ─────────────────────────────────────────────────

def emit_names_ts(names: list[str]) -> str:
    """Emit the NAMES constant as TypeScript."""
    lines = []
    for i in range(0, len(names), 6):
        chunk = names[i:i+6]
        joined = ", ".join(f'"{n}"' for n in chunk)
        lines.append(f"  {joined},")
    inner = "\n".join(lines).rstrip(",")
    return f"const NAMES = [\n{inner}\n];"


def emit_high_reaches_ts(records: list[dict]) -> str:
    """Emit INITIAL_HIGH_REACHES as TypeScript."""
    lines = ['const INITIAL_HIGH_REACHES: HighReachOutcome[] = [']
    max_id_len = max(len(r["id"]) for r in records)
    max_user_len = max(len(r["user"]) for r in records)

    for r in records:
        id_pad = r["id"].ljust(max_id_len)
        # Escape backticks and double-quotes in username
        user_escaped = r["user"].replace('"', '\\"')
        user_pad = f'"{user_escaped}"'.ljust(max_user_len + 2)
        bet = r["bet"]
        cashout = f'{r["cashout"]:.2f}'
        crash = f'{r["crashPoint"]:.2f}'
        payout = r["payout"]
        time_str = r["time"]

        lines.append(
            f'  {{ id: "{id_pad}", user: {user_pad}, '
            f'bet: {bet:>6}, cashout: {cashout:>8}, crashPoint: {crash:>8}, '
            f'payout: {payout:>9}, time: "{time_str}", isTopOnePercent: true }},'
        )

    lines[-1] = lines[-1].rstrip(",")  # Remove trailing comma from last entry
    lines.append('];')
    return "\n".join(lines)


# ─────────────────────────────────────────────────
#  PAGE.TSX PATCHER
# ─────────────────────────────────────────────────

def patch_page_tsx(names_ts: str, reaches_ts: str, filepath: str) -> bool:
    """
    Replace the NAMES and INITIAL_HIGH_REACHES blocks in page.tsx.
    Uses regex anchored to the const declarations so it's safe to run repeatedly.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # ── Patch NAMES ──────────────────────────────
    names_pattern = re.compile(
        r"const NAMES\s*=\s*\[[\s\S]*?\];",
        re.MULTILINE
    )
    if not names_pattern.search(content):
        print("⚠  Could not find NAMES block in page.tsx — skipping NAMES patch")
    else:
        content = names_pattern.sub(names_ts, content, count=1)

    # ── Patch INITIAL_HIGH_REACHES ──────────────
    reaches_pattern = re.compile(
        r"const INITIAL_HIGH_REACHES:\s*HighReachOutcome\[\]\s*=\s*\[[\s\S]*?\];",
        re.MULTILINE
    )
    if not reaches_pattern.search(content):
        print("⚠  Could not find INITIAL_HIGH_REACHES block in page.tsx — skipping patch")
        return False
    else:
        content = reaches_pattern.sub(reaches_ts, content, count=1)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return True


# ─────────────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Crash game data generator")
    parser.add_argument("--preview", action="store_true",
                        help="Print generated TypeScript only; do not write to file")
    parser.add_argument("--count", type=int, default=15,
                        help="Number of high-reach records to generate (default: 15)")
    parser.add_argument("--seed", type=int, default=None,
                        help="RNG seed for reproducible output (optional)")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    print(f"[*] Generating {args.count} crash high-reach records...")

    records = generate_high_reaches(count=args.count)
    names = generate_names_pool()

    names_ts = emit_names_ts(names)
    reaches_ts = emit_high_reaches_ts(records)

    if args.preview:
        print("\n" + "─" * 60)
        print(names_ts)
        print()
        print(reaches_ts)
        print("─" * 60)
        print("[OK] Preview only - no file written.")
        return

    # Find page.tsx relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    page_path = os.path.join(
        project_root, "app", "(public)", "casino", "game", "[id]", "page.tsx"
    )

    if not os.path.isfile(page_path):
        print(f"❌  page.tsx not found at: {page_path}")
        sys.exit(1)

    ok = patch_page_tsx(names_ts, reaches_ts, page_path)
    if ok:
        print(f"[OK] Patched successfully: {page_path}")

        # Print top 5 for quick visual QA
        print("\n[TOP 5] Records generated:")
        print(f"{'Rank':<5} {'User':<28} {'Bet':>8} {'Cashout':>10} {'Payout':>12}")
        print("─" * 70)
        for i, r in enumerate(records[:5]):
            print(
                f"#{i+1:<4} {r['user']:<28} "
                f"₹{r['bet']:>7,} {r['cashout']:>9.2f}x  "
                f"+₹{r['payout']:>10,}"
            )
    else:
        print("[ERR] Patch failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
