import random

def simulate_european(rounds=100000):
    spent = rounds
    won = 0
    for _ in range(rounds):
        res = random.randint(0, 36)
        if res == 7: # bet on 7
            won += 36 # 35:1 payout means you get 36 back
    return won / spent

def simulate_american(rounds=100000):
    spent = rounds
    won = 0
    for _ in range(rounds):
        res = random.randint(-1, 36) # -1 is 00
        if res == 7:
            won += 36
    return won / spent

def simulate_french(rounds=100000):
    # even money bet (e.g. Red)
    spent = rounds
    won = 0
    for _ in range(rounds):
        res = random.randint(0, 36)
        if res == 0:
            won += 0.5 # half back
        elif res % 2 == 1: # pretend odd is red
            won += 2
    return won / spent

def simulate_mini(rounds=100000):
    spent = rounds
    won = 0
    for _ in range(rounds):
        res = random.randint(0, 12)
        if res == 7:
            won += 12 # 11:1 payout
    return won / spent

def simulate_multi_wheel(rounds=100000):
    # 4 wheels, bet 1 unit on each wheel (total 4)
    spent = rounds * 4
    won = 0
    for _ in range(rounds):
        for _ in range(4):
            res = random.randint(0, 36)
            if res == 7:
                won += 36
    return won / spent

def simulate_lightning(rounds=100000):
    spent = rounds
    won = 0
    for _ in range(rounds):
        res = random.randint(0, 36)
        # Randomly select 1-5 multiplier numbers
        num_mults = random.randint(1, 5)
        mult_nums = random.sample(range(0, 37), num_mults)
        
        # Determine multiplier if our number (7) hits
        if res == 7:
            if 7 in mult_nums:
                # Assign a random multiplier between 50 and 500
                mult = random.choice([50, 100, 200, 300, 400, 500])
                won += mult
            else:
                won += 30 # standard 29:1 payout
    return won / spent

def simulate_double_ball(rounds=100000):
    spent = rounds
    won = 0
    for _ in range(rounds):
        b1 = random.randint(0, 36)
        b2 = random.randint(0, 36)
        if b1 == 7 and b2 == 7:
            won += 35 # Double hit pays 34:1 (35x)
        elif b1 == 7 or b2 == 7:
            won += 18 # Single hit pays 17:1 (18x)
    return won / spent

def simulate_speed(rounds=100000):
    return simulate_european(rounds)

def simulate_zerofree(rounds=100000):
    spent = rounds
    won = 0
    for _ in range(rounds):
        res = random.randint(1, 36)
        if res == 7:
            won += 35 # pays 34:1
    return won / spent

results = {
    "European": simulate_european(),
    "American": simulate_american(),
    "French (Even Money)": simulate_french(),
    "Mini": simulate_mini(),
    "Multi-Wheel": simulate_multi_wheel(),
    "Lightning": simulate_lightning(),
    "Double Ball": simulate_double_ball(),
    "Speed": simulate_speed(),
    "Zero-Free": simulate_zerofree()
}

for name, rtp in results.items():
    print(f"{name}: {rtp*100:.2f}%")
