import { useTradingStore } from "@/lib/store";

export function useWallet() {
  const { balance: rawBalance, playCasino, houseEdge } = useTradingStore();
  const balance = typeof rawBalance === 'number' ? rawBalance : (parseFloat(String(rawBalance)) || 0);

  const SYSTEM_CONFIG = {
    globalHouseEdge: houseEdge / 100, // Convert percentage e.g. 2.0% -> 0.02
    maxExposure: 50000,
  };

  const validateBet = (amount: number) => {
    if (amount <= 0) return { valid: false, error: "Invalid bet amount" };
    if (amount > balance) return { valid: false, error: "Insufficient balance" };
    if (amount > SYSTEM_CONFIG.maxExposure) return { valid: false, error: "Maximum bet limit exceeded" };
    return { valid: true };
  };

  const processBet = (amount: number, gameTitle: string) => {
    const validation = validateBet(amount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    // Deduct the wager immediately
    playCasino(amount, 0, `${gameTitle} (Wager)`);
    return true;
  };

  const processWin = (wager: number, multiplier: number, gameTitle: string) => {
    if (multiplier <= 0) return 0;

    // Apply House Edge to the raw multiplier
    // A 1.5% house edge reduces a 2.0x multiplier to 1.97x
    const effectiveMultiplier = multiplier * (1 - SYSTEM_CONFIG.globalHouseEdge);
    const payout = wager * effectiveMultiplier;

    // Credit the payout
    playCasino(0, payout, `${gameTitle} (Payout)`);
    
    return payout;
  };

  return { balance, validateBet, processBet, processWin, houseEdge: SYSTEM_CONFIG.globalHouseEdge };
}
