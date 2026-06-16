import time
import random
import json
import os

USERNAMES = [
    "CryptoWhale", "Anon_77", "VIP_Diamond", "LuckBox", "SatoshiFan",
    "MumbaiKing", "DelhiBull", "GoaHighRoller", "GoldDigger", "ApexPredator",
    "RajaBetting", "JackpotGuru", "SlotWizard", "CrorepathiPro", "TokenLord",
    "DeltaWhale", "AlphaVIP", "GigaChancer", "Ruler777", "HighStakeHustler"
]

GAMES = [
    "Sweet Bonanza", "Gates of Olympus", "Book of Dead", "The Dog House",
    "Crash", "Limbo", "Plinko", "Mines", "Dice", "Aviator", "Crazy Time",
    "Lightning Roulette", "Infinite Blackjack", "Flappy Chicken", "Krunker 3D"
]

DATA_DIR = "data"
FILE_PATH = os.path.join(DATA_DIR, "hype_bets.json")

def generate_bet():
    username = random.choice(USERNAMES)
    game = random.choice(GAMES)
    
    # 75% Win rate to create "high grade hype"
    is_win = random.random() < 0.75
    
    if is_win:
        # High value wagers
        bet_amount = random.choice([10000, 20000, 25000, 50000, 100000, 150000, 200000, 250000, 500000])
        # High-hype multipliers ranging from 1.5x up to massive 500x
        multiplier = random.choice([1.5, 2.0, 2.5, 3.0, 5.0, 8.0, 10.0, 15.0, 20.0, 25.0, 50.0, 75.0, 100.0, 150.0, 250.0, 500.0])
        payout = int(bet_amount * multiplier)
    else:
        bet_amount = random.choice([5000, 10000, 20000, 50000])
        multiplier = 0.0
        payout = 0

    # Color coding based on multipliers (standard emerald, amber, neon-purple, slate-500)
    if multiplier == 0.0:
        color = "text-slate-500"
    elif multiplier < 5.0:
        color = "text-emerald-400"
    elif multiplier < 20.0:
        color = "text-amber-400"
    else:
        color = "text-neon-purple animate-pulse"

    return {
        "user": username,
        "bet": f"₹{bet_amount:,}",
        "mult": f"{multiplier}x",
        "win": f"₹{payout:,}",
        "raw_bet": bet_amount,
        "raw_payout": payout,
        "raw_mult": multiplier,
        "game": game,
        "color": color
    }

def main():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    print("Starting Hype Bet Generator Workflow...")
    
    # Initial session stats
    total_wagered = 4200000  # ₹4.2M
    max_win = 850000        # ₹850K
    active_players = 1402
    
    # Seed exactly the user-requested initial bets mapped to real games
    bets = [
        {
            "user": "CryptoWhale",
            "bet": "₹50,000",
            "mult": "2.5x",
            "win": "₹125,000",
            "raw_bet": 50000,
            "raw_payout": 125000,
            "raw_mult": 2.5,
            "game": "Sweet Bonanza",
            "color": "text-emerald-400"
        },
        {
            "user": "Anon_77",
            "bet": "₹10,000",
            "mult": "10.0x",
            "win": "₹100,000",
            "raw_bet": 10000,
            "raw_payout": 100000,
            "raw_mult": 10.0,
            "game": "Crash",
            "color": "text-amber-400"
        },
        {
            "user": "SatoshiFan",
            "bet": "₹5,000",
            "mult": "0.0x",
            "win": "₹0",
            "raw_bet": 5000,
            "raw_payout": 0,
            "raw_mult": 0.0,
            "game": "Plinko",
            "color": "text-slate-500"
        },
        {
            "user": "VIP_Diamond",
            "bet": "₹250,000",
            "mult": "1.5x",
            "win": "₹375,000",
            "raw_bet": 250000,
            "raw_payout": 375000,
            "raw_mult": 1.5,
            "game": "Gates of Olympus",
            "color": "text-emerald-400"
        },
        {
            "user": "LuckBox",
            "bet": "₹2,000",
            "mult": "50.0x",
            "win": "₹100,000",
            "raw_bet": 2000,
            "raw_payout": 100000,
            "raw_mult": 50.0,
            "game": "Limbo",
            "color": "text-neon-purple animate-pulse"
        }
    ]
    
    # Save the initial seed
    payload = {
        "bets": bets,
        "stats": {
            "totalWagered": "₹4.20M",
            "maxWin": "₹850K",
            "activePlayers": "1,402"
        }
    }
    with open(FILE_PATH, "w") as f:
        json.dump(payload, f, indent=2)
        
    while True:
        # Generate new bet
        new_bet = generate_bet()
        bets.insert(0, new_bet)
        bets = bets[:5]  # Keep last 5 wagers
        
        # Update session stats
        total_wagered += new_bet["raw_bet"]
        if new_bet["raw_payout"] > max_win:
            max_win = new_bet["raw_payout"]
        active_players = random.randint(1380, 1495)
        
        # Format stats
        total_wagered_str = f"₹{total_wagered/1000000:.2f}M" if total_wagered >= 1000000 else f"₹{total_wagered:,}"
        max_win_str = f"₹{max_win/1000:.0f}K" if max_win < 1000000 else f"₹{max_win/1000000:.2f}M"
        
        payload = {
            "bets": bets,
            "stats": {
                "totalWagered": total_wagered_str,
                "maxWin": max_win_str,
                "activePlayers": f"{active_players:,}"
            }
        }
        
        # Save to file
        try:
            with open(FILE_PATH, "w") as f:
                json.dump(payload, f, indent=2)
            # Replace ₹ with INR for console prints to avoid charmap encode errors on Windows
            console_bet = new_bet['bet'].replace('₹', 'INR ')
            console_win = new_bet['win'].replace('₹', 'INR ')
            print(f"Generated hype bet for {new_bet['user']}: bet={console_bet} mult={new_bet['mult']} win={console_win} game={new_bet['game']}")
        except Exception as e:
            print(f"Error writing to file: {e}")
            
        # Sleep for a random interval between 2 to 4 seconds
        time.sleep(random.uniform(2.0, 4.0))

if __name__ == "__main__":
    main()
