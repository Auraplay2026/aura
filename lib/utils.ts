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

export function obfuscateFloat(value: number, key: string): string {
  const str = value.toFixed(2);
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += charCode.toString(16).padStart(2, '0');
  }
  return result;
}

export function deobfuscateFloat(hex: string, key: string): number {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substring(i, i + 2), 16) ^ key.charCodeAt((i / 2) % key.length);
    str += String.fromCharCode(charCode);
  }
  return parseFloat(str);
}
