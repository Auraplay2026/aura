export interface MarketBase {
  id: string;
  yes: number;
}

const MARKET_BASES: Record<string, { yes: number, options?: Record<string, number> }> = {
  "pol-1": { yes: 100, options: { opt1: 100, opt2: 100 } },
  "pol-2": { yes: 83, options: { opt1: 83, opt2: 18 } },
  "pol-3": { yes: 69, options: { opt1: 69, opt2: 58 } },
  "pol-4": { yes: 20, options: { opt1: 20, opt2: 10 } },
  "pol-5": { yes: 10, options: { opt1: 10, opt2: 10 } },
  "pol-6": { yes: 94, options: { opt1: 94, opt2: 6 } },
  "cry-1": { yes: 75, options: { opt1: 75, opt2: 25 } },
  "cry-2": { yes: 40, options: { opt1: 40, opt2: 60 } },
  "tru-1": { yes: 15, options: { opt1: 15, opt2: 85 } },
  "geo-2": { yes: 82, options: { opt1: 82, opt2: 18 } },
  "tec-2": { yes: 60, options: { opt1: 60, opt2: 40 } },
  "ear-2": { yes: 48, options: { opt1: 48, opt2: 52 } },
  "tru-2": { yes: 30, options: { opt1: 30, opt2: 70 } },
  "fin-2": { yes: 85, options: { opt1: 85, opt2: 15 } },
  "spo-cri-1": { yes: 48 },
  "spo-cri-2": { yes: 55 },
  "spo-cri-3": { yes: 65 },
  "spo-kab-1": { yes: 60 },
  "spo-kab-2": { yes: 45 },
  "spo-isl-1": { yes: 52 },
  "spo-isl-2": { yes: 58 },
  "spo-bgmi-1": { yes: 55 },
  "spo-bad-1": { yes: 65 },
  "spo-bad-2": { yes: 48 },
  "spo-che-1": { yes: 42 },
  "spo-hoc-1": { yes: 75 },
};

export function getDeterministicPrice(marketId: string, optionId?: string | null, timestamp = Date.now()): number {
  const cleanId = marketId.replace(/^scraped-cri-|^scraped-ten-/, 'spo-cri-').split('-').slice(0, 3).join('-');
  const base = MARKET_BASES[cleanId] || MARKET_BASES[marketId] || { yes: 50 };
  
  let basePrice = base.yes;
  if (optionId && base.options && base.options[optionId] !== undefined) {
    basePrice = base.options[optionId];
  }
  
  if (basePrice === 100 || basePrice === 0) return basePrice;

  // Compute a deterministic offset based on time
  // Slow sinusoidal drift: period of 10 minutes (600,000 ms)
  const angle = ((timestamp % 600000) / 600000) * 2 * Math.PI;
  
  // Use a hash of the market ID to give each market a different phase shift and amplitude
  let hash = 0;
  const key = `${marketId}-${optionId || ''}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const phase = ((Math.abs(hash) % 100) / 100) * 2 * Math.PI;
  const amplitude = 5 + (Math.abs(hash) % 11); // 5 to 15 cents amplitude
  
  const drift = Math.sin(angle + phase) * amplitude;
  let finalPrice = Math.round(basePrice + drift);
  
  if (finalPrice >= 99) finalPrice = 99;
  if (finalPrice <= 1) finalPrice = 1;
  
  return finalPrice;
}

export function getOptionIdFromBuyPrice(marketId: string, buyPrice: number): string | null {
  const cleanId = marketId.replace(/^scraped-cri-|^scraped-ten-/, 'spo-cri-').split('-').slice(0, 3).join('-');
  const base = MARKET_BASES[cleanId] || MARKET_BASES[marketId];
  if (!base || !base.options) return null;
  
  let closestOptId: string | null = null;
  let minDiff = Infinity;
  for (const [optId, optPrice] of Object.entries(base.options)) {
    const diff = Math.abs(buyPrice - optPrice);
    if (diff < minDiff) {
      minDiff = diff;
      closestOptId = optId;
    }
  }
  return closestOptId;
}
