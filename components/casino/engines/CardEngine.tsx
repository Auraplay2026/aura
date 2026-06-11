"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CardEngineProps {
  isPlaying: boolean;
  onComplete: (won: boolean) => void;
  gameId?: string;
  gameTitle?: string;
}

const CARDS = [
  { val: "A", suit: "♠", color: "text-slate-900", score: 11 },
  { val: "K", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "Q", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "J", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "10", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "A", suit: "♥️", color: "text-red-600", score: 11 },
  { val: "K", suit: "♥️", color: "text-red-600", score: 10 },
  { val: "Q", suit: "♥️", color: "text-red-600", score: 10 },
  { val: "J", suit: "♦️", color: "text-red-600", score: 10 },
  { val: "9", suit: "♣️", color: "text-slate-900", score: 9 }
];

export function CardEngine({ isPlaying, onComplete, gameId, gameTitle }: CardEngineProps) {
  const isBlackjack = gameTitle?.toLowerCase().includes("blackjack") || gameId?.includes("blackjack") || gameId === "orig-8";
  const isBaccarat = gameTitle?.toLowerCase().includes("baccarat") || gameId?.includes("baccarat") || gameId?.includes("table-3");

  const [playerHand, setPlayerHand] = useState<typeof CARDS>([]);
  const [dealerHand, setDealerHand] = useState<typeof CARDS>([]);
  const [dealt, setDealt] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayerHand([]);
      setDealerHand([]);
      setDealt(false);
      return;
    }

    const won = Math.random() < 0.45; // 45% win rate for live cards
    let interval: NodeJS.Timeout;

    // Simulate dealing blackjack/baccarat vs poker hands
    if (isBlackjack || isBaccarat) {
      // Deal 4 cards staggered: Player 1, Dealer 1, Player 2, Dealer 2
      interval = setInterval(() => {
        setPlayerHand(p => {
          if (p.length < 2) {
            const nextCard = CARDS[Math.floor(Math.random() * CARDS.length)];
            return [...p, nextCard];
          }
          return p;
        });

        setDealerHand(d => {
          if (d.length < 2 && playerHand.length > 0) {
            const nextCard = CARDS[Math.floor(Math.random() * CARDS.length)];
            return [...d, nextCard];
          }
          return d;
        });
      }, 500);
    } else {
      // Poker (5 cards deal)
      interval = setInterval(() => {
        setPlayerHand(p => {
          if (p.length < 5) {
            const nextCard = CARDS[Math.floor(Math.random() * CARDS.length)];
            return [...p, nextCard];
          }
          return p;
        });
      }, 400);
    }

    // Completion trigger
    const finishTimeout = setTimeout(() => {
      setDealt(true);
      onCompleteRef.current(won);
    }, (isBlackjack || isBaccarat) ? 2200 : 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimeout);
    };
  }, [isPlaying, isBlackjack, isBaccarat, playerHand.length]);

  const playerScore = playerHand.reduce((acc, c) => acc + c.score, 0);
  const dealerScore = dealerHand.reduce((acc, c) => acc + c.score, 0);

  // Styling based on game type
  let feltColor = "from-emerald-900 via-[#0a2e1c] to-[#04170e]"; // Green felt for Blackjack/General
  let boardLabel = "VIP BLACKJACK TABLE";
  let rulesText = "Dealer stands on Soft 17 • Pays 3 to 2";

  if (isBaccarat) {
    feltColor = "from-blue-950 via-[#0b1f3c] to-[#050e1b]"; // Dark Blue felt for Baccarat
    boardLabel = "HIGH LIMIT BACCARAT";
    rulesText = "Player Pays 1:1 • Banker Pays 0.95:1";
  } else if (!isBlackjack) {
    feltColor = "from-red-950 via-[#3c0b0b] to-[#1b0505]"; // Red felt for Poker
    boardLabel = "AURA CASINO POKER HYPE";
    rulesText = "High Card • Pairs • Full House Specials";
  }

  return (
    <div className={`w-full h-full min-h-[500px] bg-gradient-to-br ${feltColor} rounded-[3rem] border-[24px] border-[#1a1110] shadow-[inset_0_0_150px_rgba(0,0,0,0.9),0_20px_50px_rgba(0,0,0,0.5)] relative flex flex-col items-center justify-center overflow-hidden`}>
      
      {/* Spotlight / Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      
      {/* Overhead Spotlight */}
      <div className="absolute top-0 inset-x-0 h-[80%] bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15),_transparent_70%)] pointer-events-none" />

      {/* Gold Casino imprint */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-20 text-center">
        <h2 className="text-yellow-600 font-black text-2xl md:text-4xl tracking-[0.4em] uppercase">{boardLabel}</h2>
        <h3 className="text-yellow-600 font-bold tracking-widest text-[10px] mt-2 uppercase">{rulesText}</h3>
      </div>

      {/* Cards Table Rendering */}
      <div className="relative z-10 w-full flex flex-col items-center gap-6 mt-16 px-6">
        
        {/* Deal Side-by-Side hands for BJ/Baccarat */}
        {isBlackjack || isBaccarat ? (
          <div className="flex flex-col md:flex-row gap-12 w-full justify-center">
            {/* Dealer Hand (or Banker) */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">
                {isBaccarat ? "Banker Hand" : "Dealer Hand"}
              </span>
              <div className="flex gap-2">
                {dealerHand.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: -200, rotateY: 180, scale: 0.8 }}
                    animate={{ y: 0, rotateY: 0, scale: 1 }}
                    className={`w-20 h-28 bg-white border border-slate-200 rounded-lg shadow-lg relative flex items-center justify-center ${card.color}`}
                  >
                    <span className="absolute top-1 left-2 font-black text-sm">{card.val}{card.suit}</span>
                    <span className="text-3xl">{card.suit}</span>
                  </motion.div>
                ))}
              </div>
              {dealerHand.length > 0 && (
                <span className="text-slate-900 font-mono font-bold text-xs bg-white/60 px-3 py-1 rounded-full border border-slate-200">
                  Score: {dealerScore}
                </span>
              )}
            </div>

            {/* Player Hand */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">Player Hand</span>
              <div className="flex gap-2">
                {playerHand.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: -200, rotateY: 180, scale: 0.8 }}
                    animate={{ y: 0, rotateY: 0, scale: 1 }}
                    className={`w-20 h-28 bg-white border border-slate-200 rounded-lg shadow-lg relative flex items-center justify-center ${card.color}`}
                  >
                    <span className="absolute top-1 left-2 font-black text-sm">{card.val}{card.suit}</span>
                    <span className="text-3xl">{card.suit}</span>
                  </motion.div>
                ))}
              </div>
              {playerHand.length > 0 && (
                <span className="text-slate-900 font-mono font-bold text-xs bg-white/60 px-3 py-1 rounded-full border border-slate-200">
                  Score: {playerScore}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Poker 5-card layout */
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">Player Poker Hand</span>
            <div className="flex gap-3 justify-center">
              {playerHand.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: -300, rotateZ: 45 }}
                  animate={{ y: 0, rotateZ: 0 }}
                  className={`w-20 h-28 md:w-24 md:h-36 bg-white border border-slate-200 rounded-lg shadow-lg relative flex items-center justify-center ${card.color}`}
                >
                  <span className="absolute top-1 left-2 font-black text-sm">{card.val}{card.suit}</span>
                  <span className="text-4xl">{card.suit}</span>
                </motion.div>
              ))}
              {Array.from({ length: Math.max(0, 5 - playerHand.length) }).map((_, i) => (
                <div key={i} className="w-20 h-28 md:w-24 md:h-36 border border-slate-200 bg-slate-900/30 rounded-lg flex items-center justify-center text-slate-900/10 font-bold">
                  ?
                </div>
              ))}
            </div>
            {playerHand.length === 5 && (
              <span className="text-neon-yellow font-black uppercase tracking-widest text-xs mt-2 bg-white px-4 py-1.5 rounded-full border border-yellow-500/20 shadow-lg">
                Hand Rank: {playerScore > 40 ? "Three of a Kind" : "Pair of Kings"}
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
