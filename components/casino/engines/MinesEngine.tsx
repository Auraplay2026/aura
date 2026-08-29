"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Bomb, Gem, Shuffle } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { playGameSound } from "@/lib/audio";

interface MinesEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onLiveTick?: (multiplier: number, clickCount: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

type GameState = "idle" | "playing" | "busted" | "cashed_out";

export function MinesEngine({ isPlaying, betAmount = 10, onLiveTick, onComplete }: MinesEngineProps) {
  const [minesCount, setMinesCount] = useState(3);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [bustedIndex, setBustedIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Game math state
  const [activeMultiplier, setActiveMultiplier] = useState(1.00);
  const [clickCount, setClickCount] = useState(0);
  const [showCoinShower, setShowCoinShower] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.username || currentUser?.email || "";

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const onLiveTickRef = useRef(onLiveTick);
  useEffect(() => { onLiveTickRef.current = onLiveTick; }, [onLiveTick]);

  // Next tile potential multiplier calculation
  const nextTileMultiplier = useMemo(() => {
    const totalTiles = 25;
    const safeTiles = totalTiles - minesCount;
    const currentUncovered = clickCount;
    if (currentUncovered >= safeTiles) return activeMultiplier;
    
    let prob = 1;
    for (let i = 0; i <= currentUncovered; i++) {
      prob *= (25 - minesCount - i) / (25 - i);
    }
    const fairNext = prob > 0 ? (1 / prob) * 0.97 : 0;
    return parseFloat(fairNext.toFixed(2));
  }, [minesCount, clickCount, activeMultiplier]);

  // Synchronize game start
  useEffect(() => {
    if (!isPlaying) {
      if (gameState === "playing") setGameState("idle");
      return;
    }
    startGame();
  }, [isPlaying]);

  // Hook into keyboard and sidebar cashout
  useEffect(() => {
    const handleTriggerCashout = () => {
      if (gameState === "playing" && clickCount > 0) {
        cashOut();
      }
    };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout", handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [gameState, clickCount]);

  const startGame = async () => {
    try {
      setRevealed(Array(25).fill(false));
      setMineLocations([]);
      setActiveMultiplier(1.00);
      setClickCount(0);
      onLiveTickRef.current?.(1.00, 0);
      setBustedIndex(null);
      setShowCoinShower(false);
      setIsRevealing(false);

      const res = await fetch('/api/casino/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          gameId: "orig-4",
          gameTitle: "Mines",
          betAmount,
          selectedTarget: minesCount
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessionId(data.sessionId);
        setGameState("playing");
      } else {
        setGameState("idle");
        onCompleteRef.current(0, false);
        alert(data.error || "Wager placement failed.");
      }
    } catch (err) {
      console.error("Mines start game failed:", err);
      setGameState("idle");
      onCompleteRef.current(0, false);
    }
  };

  const handleTileClick = async (index: number) => {
    if (gameState !== "playing" || revealed[index] || !sessionId || isRevealing) return;
    
    setIsRevealing(true);
    const nextClickCount = clickCount + 1;
    setClickCount(nextClickCount);

    try {
      const res = await fetch('/api/casino/mines/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reveal',
          email,
          sessionId,
          tileIndex: index
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsRevealing(false);
        alert(data.error || "Failed to reveal tile.");
        return;
      }

      if (data.isBust) {
        playGameSound('lose');
        setBustedIndex(index);
        setMineLocations(data.mineLocations || []);
        
        const newRevealed = Array(25).fill(true);
        setRevealed(newRevealed);
        
        setGameState("busted");
        onLiveTickRef.current?.(0, 0);
        setTimeout(() => onCompleteRef.current(0, false), 2200);
      } else {
        playGameSound('win');
        
        const newRevealed = [...revealed];
        newRevealed[index] = true;
        setRevealed(newRevealed);
        
        setActiveMultiplier(data.activeMultiplier);
        onLiveTickRef.current?.(data.activeMultiplier, nextClickCount);

        if (data.isCompleted) {
          setGameState("cashed_out");
          setMineLocations(data.mineLocations || []);
          setRevealed(Array(25).fill(true));
          playGameSound('jackpot');
          setShowCoinShower(true);
          setTimeout(() => onCompleteRef.current(data.activeMultiplier, true), 1500);
        }
      }
    } catch (err) {
      console.error("Tile reveal failed:", err);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleRandomPick = () => {
    if (gameState !== "playing" || isRevealing) return;
    const unrevealedIndices: number[] = [];
    revealed.forEach((isRev, idx) => {
      if (!isRev) unrevealedIndices.push(idx);
    });
    if (unrevealedIndices.length === 0) return;
    const randomIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    handleTileClick(randomIdx);
  };

  const cashOut = () => {
    if (gameState !== "playing" || clickCount === 0) return;
    const finalMult = activeMultiplier;
    
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([25, 35]); } catch {}
    }

    playGameSound('jackpot');
    setShowCoinShower(true);
    setGameState("cashed_out");
    setRevealed(Array(25).fill(true));
    onLiveTickRef.current?.(finalMult, 0);
    
    // Instant settlement
    onCompleteRef.current(finalMult, true);

    // Asynchronous background persistence
    if (sessionId) {
      fetch('/api/casino/mines/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cashout',
          email,
          sessionId
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.mineLocations) setMineLocations(data.mineLocations);
      })
      .catch(err => console.error("Async mines cashout sync:", err));
    }
  };

  const currentPayout = Math.round(betAmount * activeMultiplier * 100) / 100;
  const safeTilesCount = 25 - minesCount;

  return (
    <div className="w-full h-full min-h-[360px] md:min-h-[580px] relative bg-gradient-to-br from-slate-50 via-white to-amber-50/30 rounded-3xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] border border-slate-200/90 flex flex-col p-2.5 sm:p-4 md:p-6 gap-2.5 sm:gap-4 select-none">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12)_0%,transparent_60%)] pointer-events-none" />
      
      {/* Top HUD: Status, Mines Selector, and Current Multiplier */}
      <div className="relative z-10 flex items-center justify-between bg-white/90 p-2 sm:p-3 md:p-3.5 rounded-2xl border border-slate-200/80 backdrop-blur-md shadow-sm gap-2">
        
        {/* Left: Mines Count Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-inner">
            <Bomb className="w-4 h-4 text-red-500 shrink-0" />
            <select 
              disabled={gameState === "playing"}
              className="bg-transparent text-slate-900 font-black text-xs sm:text-sm outline-none cursor-pointer disabled:opacity-60"
              value={minesCount}
              onChange={(e) => setMinesCount(Number(e.target.value))}
            >
              {[1, 2, 3, 5, 10, 15, 20, 24].map(n => (
                <option key={n} value={n} className="bg-white text-slate-900 font-bold">
                  {n} {n === 1 ? 'Mine' : 'Mines'} ({25 - n} Gems)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Live Interactive Status */}
        <div className="hidden sm:flex flex-col items-center text-center">
          {gameState === "idle" && (
            <span className="text-[11px] font-bold text-slate-600">
              Select mines and press <strong className="text-slate-900">BET</strong> to begin
            </span>
          )}
          {gameState === "playing" && clickCount === 0 && (
            <span className="text-[11px] font-extrabold text-amber-600 animate-pulse flex items-center gap-1">
              <span>👉</span> Tap any tile to reveal safe diamonds!
            </span>
          )}
          {gameState === "playing" && clickCount > 0 && (
            <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1">
              <span>💎</span> {clickCount} / {safeTilesCount} Safe • Next: {nextTileMultiplier.toFixed(2)}x
            </span>
          )}
          {gameState === "busted" && (
            <span className="text-[11px] font-extrabold text-red-600 flex items-center gap-1">
              <span>💥</span> Mine hit! Round finished.
            </span>
          )}
          {gameState === "cashed_out" && (
            <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1">
              <span>🎉</span> Cashed Out +₹{currentPayout.toFixed(2)}!
            </span>
          )}
        </div>

        {/* Right: Active Multiplier & Value */}
        <div className="flex flex-col items-end leading-tight">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-black">
            {gameState === "playing" && clickCount > 0 ? "Current Multiplier" : "Base Odds"}
          </span>
          <motion.span 
            key={activeMultiplier}
            initial={{ scale: 1.3, color: "#10b981" }}
            animate={{ scale: 1, color: "#0f172a" }}
            className="text-lg sm:text-xl md:text-2xl font-black font-mono tracking-tight text-slate-900"
          >
            {activeMultiplier.toFixed(2)}x
          </motion.span>
        </div>
      </div>

      {/* Mobile Live Instruction Banner */}
      <div className="sm:hidden relative z-10 text-center py-0.5">
        {gameState === "idle" && (
          <p className="text-[10px] font-bold text-slate-600">
            Select mines count and tap <span className="text-slate-900 font-extrabold">BET</span>
          </p>
        )}
        {gameState === "playing" && clickCount === 0 && (
          <p className="text-[10px] font-extrabold text-amber-600 animate-pulse">
            👉 Tap any tile to uncover safe diamonds!
          </p>
        )}
        {gameState === "playing" && clickCount > 0 && (
          <p className="text-[10px] font-extrabold text-emerald-600">
            💎 {clickCount} / {safeTilesCount} Safe • Current: ₹{currentPayout.toFixed(2)}
          </p>
        )}
        {gameState === "busted" && (
          <p className="text-[10px] font-extrabold text-red-600">
            💥 Hit a Mine! Better luck next round.
          </p>
        )}
        {gameState === "cashed_out" && (
          <p className="text-[10px] font-extrabold text-emerald-600">
            🎉 Cashed Out: ₹{currentPayout.toFixed(2)} ({activeMultiplier.toFixed(2)}x)
          </p>
        )}
      </div>

      {/* 3D Mines Grid Container */}
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-0">
        <div className={`grid grid-cols-5 gap-1.5 sm:gap-2.5 md:gap-3 w-full max-w-[280px] sm:max-w-[340px] md:max-w-[420px] aspect-square p-2 sm:p-3 md:p-4 bg-white/80 rounded-2xl md:rounded-[2rem] border transition-all duration-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.03),0_8px_30px_rgba(0,0,0,0.06)] ${
          (gameState === "playing" && clickCount >= 3)
            ? "border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.18)]" 
            : "border-slate-200/90"
        }`}>
          {Array(25).fill(0).map((_, i) => {
            const isRevealed = revealed[i];
            const isMine = mineLocations.includes(i);
            const isBustCause = bustedIndex === i;

            return (
              <motion.button
                key={i}
                type="button"
                disabled={gameState !== "playing" || isRevealed || isRevealing}
                onClick={() => handleTileClick(i)}
                whileHover={gameState === "playing" && !isRevealed ? { scale: 1.05, y: -2 } : {}}
                whileTap={gameState === "playing" && !isRevealed ? { scale: 0.95 } : {}}
                className={`relative w-full h-full rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 outline-none select-none
                  ${!isRevealed 
                    ? gameState === "playing"
                      ? "bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 shadow-[0_4px_0_rgb(148,163,184),0_6px_15px_rgba(0,0,0,0.08)] border-t border-white cursor-pointer hover:from-white hover:to-slate-200 active:shadow-none"
                      : "bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300/80 opacity-90 cursor-default"
                    : isMine
                      ? isBustCause 
                        ? "bg-red-100 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] z-20"
                        : "bg-red-50 border border-red-200 opacity-80"
                      : "bg-emerald-50 border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  }
                `}
              >
                {/* Visual content */}
                {isRevealed ? (
                  isMine ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <Bomb className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 ${isBustCause ? 'text-red-600 animate-bounce drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-red-500/70'}`} />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0, y: 5 }}
                      animate={{ scale: 1, y: [0, -2, 0] }}
                      transition={{ y: { repeat: Infinity, duration: 2, ease: "easeInOut" }, scale: { type: "spring", bounce: 0.5 } }}
                      className="relative flex items-center justify-center"
                    >
                      <Gem className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-500 drop-shadow-[0_4px_10px_rgba(16,185,129,0.4)]" />
                    </motion.div>
                  )
                ) : (
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-400/40 border border-white/60" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Tray: Auto-Pick Button & Prominent Cash Out Button */}
      <div className="relative z-20 flex items-center justify-center gap-2 sm:gap-3 w-full max-w-[420px] mx-auto mt-1">
        {gameState === "playing" && (
          <>
            {/* Random Pick Button */}
            <button
              type="button"
              onClick={handleRandomPick}
              disabled={isRevealing}
              className="flex-1 py-3 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-slate-600" />
              <span>Auto-Pick</span>
            </button>

            {/* In-Canvas Large Cash Out Button (Both Mobile & Desktop) */}
            {clickCount > 0 && (
              <motion.button
                type="button"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={cashOut}
                disabled={isRevealing}
                className="flex-[2] py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.4)] border border-emerald-300 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                <span>Cash Out</span>
                <span className="bg-black/20 px-2 py-0.5 rounded-lg text-white font-mono">
                  ₹{currentPayout.toFixed(2)} ({activeMultiplier.toFixed(2)}x)
                </span>
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* Coin Shower on Win */}
      {showCoinShower && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {Array(20).fill(0).map((_, idx) => {
            const startX = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 1.2 + Math.random() * 0.8;
            return (
              <motion.div
                key={idx}
                initial={{ y: -50, x: `${startX}%`, opacity: 1, scale: 0.9, rotate: 0 }}
                animate={{ y: 550, rotate: 360, opacity: 0 }}
                transition={{ duration, delay, ease: "linear" }}
                className="absolute text-yellow-400 font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
              >
                💎
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
