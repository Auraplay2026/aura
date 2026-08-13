"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";
import { PremiumCard } from "./PremiumCard";

interface BaccaratEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplierOrWon: number | boolean, won?: boolean) => void;
  selectedTarget?: string;
  setSelectedTarget?: (t: string) => void;
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

export function BaccaratEngine({ isPlaying, betAmount = 10, onComplete, selectedTarget, setSelectedTarget }: BaccaratEngineProps) {
  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.username || currentUser?.email || "";

  const [playerHand, setPlayerHand] = useState<typeof DECK>([]);
  const [bankerHand, setBankerHand] = useState<typeof DECK>([]);
  const [dealt, setDealt] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [localSide, setLocalSide] = useState<string>("PLAYER");
  const selectedSide = selectedTarget === "PLAYER" || selectedTarget === "BANKER" || selectedTarget === "TIE" ? selectedTarget : localSide;
  const setSelectedSide = (side: string) => {
    setLocalSide(side);
    if (setSelectedTarget) setSelectedTarget(side);
  };

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayerHand([]);
      setBankerHand([]);
      setDealt(false);
      setResultMsg("");
      return;
    }

    let isActive = true;

    const executeBet = async () => {
      try {
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            gameId: "table-3",
            gameTitle: "Baccarat",
            betAmount,
            selectedTarget: selectedSide
          })
        });
        const data = await res.json();
        if (!isActive) return;

        if (res.ok && data.success) {
          const isWin = data.isWin;
          const winningHand = data.winningHand;

          const targetPlayerHand: typeof DECK = [];
          const targetBankerHand: typeof DECK = [];

          if (winningHand === "TIE") {
            targetPlayerHand.push(
              { val: "4", suit: "♠", color: "text-slate-900", score: 4 },
              { val: "2", suit: "♦️", color: "text-red-600", score: 2 }
            ); // modulo score: 6
            targetBankerHand.push(
              { val: "A", suit: "♥️", color: "text-red-600", score: 1 },
              { val: "5", suit: "♣️", color: "text-slate-900", score: 5 }
            ); // modulo score: 6
          } else if (winningHand === "PLAYER") {
            targetPlayerHand.push(
              { val: "8", suit: "♠", color: "text-slate-900", score: 8 },
              { val: "K", suit: "♦️", color: "text-red-600", score: 0 }
            ); // modulo score: 8
            targetBankerHand.push(
              { val: "2", suit: "♥️", color: "text-red-600", score: 2 },
              { val: "3", suit: "♣️", color: "text-slate-900", score: 3 }
            ); // modulo score: 5
          } else {
            // Banker wins
            targetPlayerHand.push(
              { val: "A", suit: "♠", color: "text-slate-900", score: 1 },
              { val: "2", suit: "♦️", color: "text-red-600", score: 2 }
            ); // modulo score: 3
            targetBankerHand.push(
              { val: "9", suit: "♥️", color: "text-red-600", score: 9 },
              { val: "10", suit: "♣️", color: "text-slate-900", score: 0 }
            ); // modulo score: 9
          }

          let count = 0;
          const interval = setInterval(() => {
            if (!isActive) {
              clearInterval(interval);
              return;
            }
            count++;
            if (count === 1) {
              setPlayerHand([targetPlayerHand[0]]);
            } else if (count === 2) {
              setBankerHand([targetBankerHand[0]]);
            } else if (count === 3) {
              setPlayerHand([targetPlayerHand[0], targetPlayerHand[1]]);
            } else if (count === 4) {
              setBankerHand([targetBankerHand[0], targetBankerHand[1]]);
              clearInterval(interval);
              
              setTimeout(() => {
                if (!isActive) return;
                setDealt(true);
                if (winningHand === "TIE") {
                  setResultMsg("Tie Hand!");
                } else if (winningHand === "PLAYER") {
                  setResultMsg("Player Wins!");
                } else {
                  setResultMsg("Banker Wins!");
                }
                onCompleteRef.current(data.multiplier, isWin);
              }, 1200);
            }
          }, 450);

        } else {
          onCompleteRef.current(0, false);
          alert(data.error || "Wager placement failed.");
        }
      } catch (err) {
        console.error("Baccarat bet placement failed", err);
        onCompleteRef.current(0, false);
      }
    };

    executeBet();

    return () => {
      isActive = false;
    };
  }, [isPlaying, selectedSide]);

  const getBaccaratScore = (hand: typeof DECK) => {
    const sum = hand.reduce((acc, c) => {
      const val = c.val;
      if (["10", "J", "Q", "K"].includes(val)) return acc;
      if (val === "A") return acc + 1;
      return acc + (parseInt(val) || 0);
    }, 0);
    return sum % 10;
  };

  const playerScore = getBaccaratScore(playerHand);
  const bankerScore = getBaccaratScore(bankerHand);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br from-[#1c0808] via-[#3a0d0d] to-[#0f0404] rounded-3xl border-[20px] border-[#291715] shadow-[inset_0_0_100px_rgba(0,0,0,0.95),_inset_0_0_0_2px_rgba(245,158,11,0.25),0_20px_50px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-center overflow-hidden perspective-[1000px]">
      
      {/* Hyper-realistic Casino Felt Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)] pointer-events-none" />
      
      {/* Table Border illusion */}
      <div className="absolute inset-4 rounded-[1.75rem] border border-red-500/10 pointer-events-none" />

      {/* Table Markings & felt designs */}
      <div className="absolute inset-x-8 inset-y-12 border border-dashed border-red-500/5 rounded-[2rem] pointer-events-none flex items-center justify-center">
        <div className="w-[85%] h-[80%] flex justify-between px-10 items-center opacity-[0.05] pointer-events-none select-none">
          <div className="text-center">
            <span className="text-6xl font-black block text-blue-500">PLAYER</span>
            <span className="text-[10px] font-bold text-blue-500 tracking-wider">PAYS 1 TO 1</span>
          </div>
          <div className="text-center border-l border-r border-yellow-600/20 px-8">
            <span className="text-5xl font-black block text-yellow-600">TIE</span>
            <span className="text-[10px] font-bold text-yellow-600 tracking-wider">PAYS 8 TO 1</span>
          </div>
          <div className="text-center">
            <span className="text-6xl font-black block text-red-500">BANKER</span>
            <span className="text-[10px] font-bold text-red-500 tracking-wider">PAYS 0.95 TO 1</span>
          </div>
        </div>
      </div>

      {/* Table Decals */}
      <div className="absolute top-8 text-center opacity-30 select-none pointer-events-none">
        <h2 className="text-yellow-500 font-black text-2xl md:text-4xl tracking-[0.3em] uppercase drop-shadow-md">MACAU VIP BACCARAT</h2>
        <span className="text-yellow-600 text-[10px] md:text-xs font-bold tracking-[0.5em] mt-1 block">COMMISSION FREE ROADWAY</span>
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row gap-8 md:gap-20 justify-center mt-12 px-6 transform-style-3d rotate-x-[15deg]">
        
        {/* Player Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="px-6 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <span className="text-xs text-blue-400 font-black uppercase tracking-widest">Player</span>
          </div>
          <div className="flex gap-[-20px] min-h-[140px] perspective-[800px]">
            {playerHand.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ y: -300, x: 200, rotateY: 180, rotateZ: 45, scale: 0.5 }}
                animate={{ y: 0, x: 0, rotateY: 0, rotateZ: idx === 0 ? -5 : 5, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ marginLeft: idx > 0 ? "-30px" : "0px" }}
              >
                <PremiumCard
                  val={card.val}
                  suit={card.suit}
                  themeBack="blue"
                  className="w-24 h-36"
                />
              </motion.div>
            ))}
          </div>
          {playerHand.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-slate-900 font-mono font-black text-xl bg-white/80 border border-slate-700 px-6 py-2 rounded-full shadow-lg backdrop-blur-md">
              {playerScore}
            </motion.div>
          )}
        </div>

        {/* Banker Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="px-6 py-1 rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <span className="text-xs text-red-400 font-black uppercase tracking-widest">Banker</span>
          </div>
          <div className="flex gap-[-20px] min-h-[140px] perspective-[800px]">
            {bankerHand.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ y: -300, x: -200, rotateY: 180, rotateZ: -45, scale: 0.5 }}
                animate={{ y: 0, x: 0, rotateY: 0, rotateZ: idx === 0 ? -5 : 5, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ marginLeft: idx > 0 ? "-30px" : "0px" }}
              >
                <PremiumCard
                  val={card.val}
                  suit={card.suit}
                  themeBack="red"
                  className="w-24 h-36"
                />
              </motion.div>
            ))}
          </div>
          {bankerHand.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-slate-900 font-mono font-black text-xl bg-white/80 border border-slate-700 px-6 py-2 rounded-full shadow-lg backdrop-blur-md">
              {bankerScore}
            </motion.div>
          )}
        </div>
      </div>

      {/* Selected Bet Indicator Overlay during play */}
      {isPlaying && (
        <div className="absolute top-4 left-4 flex items-center bg-white/60 border border-teal-500/30 rounded-full px-4 py-1.5 shadow-lg backdrop-blur-md z-30 select-none">
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">BET ON: {selectedSide}</span>
        </div>
      )}

      {/* Side Selector (Shown when not playing) */}
      {!isPlaying && (
        <div className="mt-8 flex gap-4 z-20">
          <button
            onClick={() => setSelectedSide("PLAYER")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
              selectedSide === "PLAYER"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-slate-900 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105"
                : "bg-white text-slate-650 border-slate-800 hover:border-blue-500/30"
            }`}
          >
            Player (2x)
          </button>
          <button
            onClick={() => setSelectedSide("BANKER")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
              selectedSide === "BANKER"
                ? "bg-gradient-to-br from-red-550 to-red-650 text-slate-900 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105"
                : "bg-white text-slate-650 border-slate-800 hover:border-red-500/30"
            }`}
          >
            Banker (1.95x)
          </button>
          <button
            onClick={() => setSelectedSide("TIE")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
              selectedSide === "TIE"
                ? "bg-gradient-to-br from-yellow-500 to-yellow-650 text-yellow-950 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105"
                : "bg-white text-slate-650 border-slate-800 hover:border-yellow-500/30"
            }`}
          >
            Tie (9x)
          </button>
        </div>
      )}

      {/* Results HUD Overlay */}
      <AnimatePresence>
        {dealt && resultMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="absolute bottom-10 z-50 px-12 py-4 bg-white/90 border border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] rounded-2xl backdrop-blur-lg"
          >
            <span className={`font-black uppercase tracking-widest text-3xl drop-shadow-md ${
              resultMsg.includes("Player") ? "text-blue-400" :
              resultMsg.includes("Banker") ? "text-red-400" : "text-yellow-400"
            }`}>
              {resultMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
