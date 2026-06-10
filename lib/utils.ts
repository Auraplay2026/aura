import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCasinoDetails(details: string): { wager: number; payout: number } {
  if (!details) return { wager: 0, payout: 0 };
  const wagerMatch = details.match(/Wager:\s*₹?\s*([\d.]+)/i);
  const payoutMatch = details.match(/Payout:\s*₹?\s*([\d.]+)/i);
  return {
    wager: wagerMatch ? parseFloat(wagerMatch[1]) || 0 : 0,
    payout: payoutMatch ? parseFloat(payoutMatch[1]) || 0 : 0
  };
}
