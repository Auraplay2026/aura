"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BaccaratEngineProps {
  isPlaying: boolean;
  onComplete: (won: boolean) => void;
}

const DECK = [
  { val: "A", suit: "♠", color: "text-slate-900", score: 1 },
  { val: "10", suit: "♦️", color: "text-red-600", score: 0 },
  { val: "J", suit: "♥️", color: "text-red-600", score: 0 },
  { val: "Q", suit: "♣️", color: "text-slate-900", score: 0 },
  { val: "K", suit: "♠", color: "text-slate-900", score: 0 },
  { val: "9", suit: "♥️", color: "text-red-600", score: 9 },
  { val: "8", suit: "♦️", color: "text-red-600", score: 8 }
];

export function BaccaratEngine({ isPlaying, onComplete }: BaccaratEngineProps) {
  const [playerHand, setPlayerHand] = useState<typeof DECK>([]);
  const [bankerHand, setBankerHand] = useState<typeof DECK>([]);
  const [dealt, setDealt] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayerHand([]);
      setBankerHand([]);
      setDealt(false);
      return;
    }

    const won = Math.random() < 0.45;
    
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count === 1) {
        setPlayerHand(p => [...p, DECK[Math.floor(Math.random() * DECK.length)]]);
      } else if (count === 2) {
        setBankerHand(b => [...b, DECK[Math.floor(Math.random() * DECK.length)]]);
      } else if (count === 3) {
        setPlayerHand(p => [...p, DECK[Math.floor(Math.random() * DECK.length)]]);
      } else if (count === 4) {
        setBankerHand(b => [...b, DECK[Math.floor(Math.random() * DECK.length)]]);
        clearInterval(interval);
        setTimeout(() => {
          setDealt(true);
          onCompleteRef.current(won);
        }, 1000);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Baccarat score calculates only modulo 10
  const playerScore = playerHand.reduce((acc, c) => acc + c.score, 0) % 10;
  const bankerScore = bankerHand.reduce((acc, c) => acc + c.score, 0) % 10;

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-br from-[#0c1f3c] via-[#050e1b] to-[#010307] rounded-[3rem] border-[24px] border-[#1f1614] shadow-[inset_0_0_120px_rgba(0,0,0,1)] relative flex flex-col items-center justify-center overflow-hidden">
      
      {/* Table grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.9)_100%)] pointer-events-none" />

      <div className="absolute top-10 text-center opacity-30 select-none">
        <h2 className="text-yellow-600 font-black text-2xl md:text-3xl tracking-[0.4em] uppercase">ROYAL BACCARAT TABLE</h2>
        <span className="text-slate-900 text-[9px] font-bold tracking-widest mt-1 block">TIE PAYS 8 TO 1</span>
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row gap-12 justify-center mt-12 px-6">
        {/* Banker */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider">Banker Hand</span>
          <div className="flex gap-2 min-h-[112px]">
            {bankerHand.map((card, idx) => (
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
          {bankerHand.length > 0 && (
            <span className="text-slate-900 font-mono font-bold text-xs bg-slate-50 border border-slate-200 px-4 py-1 rounded-full shadow-inner">
              Banker: {bankerScore}
            </span>
          )}
        </div>

        {/* Player */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider">Player Hand</span>
          <div className="flex gap-2 min-h-[112px]">
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
            <span className="text-slate-900 font-mono font-bold text-xs bg-slate-50 border border-slate-200 px-4 py-1 rounded-full shadow-inner">
              Player: {playerScore}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
