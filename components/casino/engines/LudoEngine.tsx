"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, RotateCcw, Bot, User, Swords, Home, Sparkles, Crown, Plus, Minus, Shield, HelpCircle, Coins } from "lucide-react";
import { playGameSound } from "@/lib/audio";

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

type PlayerColor = "red" | "green" | "yellow" | "blue";

interface TokenPosition {
  zone: "base" | "path" | "home" | "finished";
  index: number;
}

interface Token {
  id: number;
  position: TokenPosition;
}

interface Player {
  color: PlayerColor;
  name: string;
  tokens: Token[];
  isHuman: boolean;
  tokensHome: number;
}

interface Move {
  tokenId: number;
  from: TokenPosition;
  to: TokenPosition;
  captures?: { color: PlayerColor; tokenId: number };
  entersHome?: boolean;
}

type GamePhase = "idle" | "playing" | "rolling" | "rolled" | "selecting" | "moving" | "finished";

// ═══════════════════════════════════════════════
// BOARD CONSTANTS
// ═══════════════════════════════════════════════

const CELL_PCT = 100 / 15;

const PLAYER_CONFIGS = [
  { color: "red" as PlayerColor, name: "You", startPos: 0, emoji: "🔴" },
  { color: "green" as PlayerColor, name: "Bot Alpha", startPos: 13, emoji: "🟢" },
  { color: "yellow" as PlayerColor, name: "Bot Sigma", startPos: 26, emoji: "🟡" },
  { color: "blue" as PlayerColor, name: "Bot Omega", startPos: 39, emoji: "🔵" },
];

const MAIN_PATH: [number, number][] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0],
];

const HOME_PATHS: Record<PlayerColor, [number, number][]> = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};

const BASE_SPOTS: Record<PlayerColor, [number, number][]> = {
  red:    [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
  green:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  yellow: [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
  blue:   [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]],
};

const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const START_CELLS = new Set([0, 13, 26, 39]);

const COLORS: Record<PlayerColor, { token: string; dark: string; light: string; glow: string; bg: string; border: string }> = {
  red:    { token: "#F43F5E", dark: "#9F1239", light: "rgba(244,63,94,0.15)", glow: "rgba(244,63,94,0.5)", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.35)" },
  green:  { token: "#10B981", dark: "#065F46", light: "rgba(16,185,129,0.15)", glow: "rgba(16,185,129,0.5)",  bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.35)" },
  yellow: { token: "#F59E0B", dark: "#78350F", light: "rgba(245,158,11,0.15)", glow: "rgba(245,158,11,0.5)",  bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.35)" },
  blue:   { token: "#3B82F6", dark: "#1E3A8A", light: "rgba(59,130,246,0.15)", glow: "rgba(59,130,246,0.5)",  bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.35)" },
};

// ═══════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════

function gridToPos(row: number, col: number) {
  return { x: col * CELL_PCT + CELL_PCT / 2, y: row * CELL_PCT + CELL_PCT / 2 };
}

function getScreenPos(pos: TokenPosition, color: PlayerColor): { x: number; y: number } {
  if (pos.zone === "base") return gridToPos(BASE_SPOTS[color][pos.index][0], BASE_SPOTS[color][pos.index][1]);
  if (pos.zone === "path") return gridToPos(MAIN_PATH[pos.index][0], MAIN_PATH[pos.index][1]);
  if (pos.zone === "home") return gridToPos(HOME_PATHS[color][pos.index][0], HOME_PATHS[color][pos.index][1]);
  return gridToPos(7, 7); // finished → center
}

function stepsFromStart(pathIdx: number, startPos: number): number {
  return ((pathIdx - startPos) + 52) % 52;
}

function checkCapture(pathIdx: number, movingColor: PlayerColor, players: Player[]): { color: PlayerColor; tokenId: number } | null {
  if (SAFE_CELLS.has(pathIdx)) return null;
  for (const p of players) {
    if (p.color === movingColor) continue;
    for (const t of p.tokens) {
      if (t.position.zone === "path" && t.position.index === pathIdx) return { color: p.color, tokenId: t.id };
    }
  }
  return null;
}

function getValidMoves(player: Player, dice: number, allPlayers: Player[]): Move[] {
  const moves: Move[] = [];
  const cfg = PLAYER_CONFIGS.find(c => c.color === player.color)!;

  for (const token of player.tokens) {
    if (token.position.zone === "finished") continue;
    if (token.position.zone === "base") {
      if (dice === 6) {
        const dest = cfg.startPos;
        const ownBlocked = player.tokens.some(t => t.id !== token.id && t.position.zone === "path" && t.position.index === dest);
        if (!ownBlocked) {
          moves.push({
            tokenId: token.id,
            from: { ...token.position },
            to: { zone: "path", index: dest },
            captures: checkCapture(dest, player.color, allPlayers) ?? undefined,
          });
        }
      }
      continue;
    }
    if (token.position.zone === "path") {
      const steps = stepsFromStart(token.position.index, cfg.startPos);
      const newSteps = steps + dice;

      if (newSteps <= 50) {
        const newIdx = (cfg.startPos + newSteps) % 52;
        const ownBlocked = player.tokens.some(t => t.id !== token.id && t.position.zone === "path" && t.position.index === newIdx);
        if (!ownBlocked) {
          moves.push({
            tokenId: token.id,
            from: { ...token.position },
            to: { zone: "path", index: newIdx },
            captures: checkCapture(newIdx, player.color, allPlayers) ?? undefined,
          });
        }
      } else if (newSteps <= 56) {
        const homeIdx = newSteps - 51;
        if (homeIdx <= 5) {
          const ownBlocked = player.tokens.some(t => t.id !== token.id && t.position.zone === "home" && t.position.index === homeIdx);
          if (!ownBlocked) moves.push({ tokenId: token.id, from: { ...token.position }, to: { zone: "home", index: homeIdx }, entersHome: true });
        }
      } else if (newSteps === 57) {
        moves.push({ tokenId: token.id, from: { ...token.position }, to: { zone: "finished", index: 0 }, entersHome: true });
      }
      continue;
    }
    if (token.position.zone === "home") {
      const newIdx = token.position.index + dice;
      if (newIdx <= 5) {
        const ownBlocked = player.tokens.some(t => t.id !== token.id && t.position.zone === "home" && t.position.index === newIdx);
        if (!ownBlocked) moves.push({ tokenId: token.id, from: { ...token.position }, to: { zone: "home", index: newIdx } });
      } else if (newIdx === 6) {
        moves.push({ tokenId: token.id, from: { ...token.position }, to: { zone: "finished", index: 0 } });
      }
    }
  }
  return moves;
}

// ═══════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════

function TokenPiece({ color, size = "medium" }: { color: PlayerColor; size?: "small" | "medium" | "large" }) {
  const s = size === "small" ? "w-3 h-3 sm:w-4.5 sm:h-4.5" : "w-5 h-5 sm:w-6.5 sm:h-6.5";
  return (
    <div
      className={`${s} rounded-full relative flex items-center justify-center transition-all duration-205 select-none shadow-[0_5px_12px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(0,0,0,0.5),0_0_12px_${COLORS[color].glow}]`}
      style={{
        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${COLORS[color].token} 45%, ${COLORS[color].dark} 100%)`,
        border: "1px solid rgba(255,255,255,0.4)"
      }}
    >
      <div className="absolute top-[10%] left-[10%] w-[35%] h-[35%] bg-white/40 rounded-full blur-[0.4px] pointer-events-none" />
    </div>
  );
}

function DiceFace({ 
  value, 
  isRolling, 
  isActive = false,
  onClick
}: { 
  value: number; 
  isRolling: boolean; 
  isActive?: boolean;
  onClick?: () => void;
}) {
  const diceDots: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <div 
      onClick={isActive && !isRolling ? onClick : undefined}
      className={`w-14 h-14 relative flex items-center justify-center select-none overflow-visible ${
        isActive && !isRolling ? "cursor-pointer" : ""
      }`}
    >
      {/* 3D Pedestal Shadow Glow below the dice */}
      <AnimatePresence>
        {isActive && !isRolling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0.35, 0.7, 0.35],
              scale: [0.8, 1.15, 0.8],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
            className="absolute bottom-[-10px] w-11 h-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur-[4px] pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={isRolling ? {
          y: [0, -22, -26, -10, 0, -4, 0],
          scale: [1, 1.12, 1.15, 1.08, 0.88, 1.03, 1],
          rotateZ: [0, 90, 270, 450, 630, 680, 720],
          rotateX: [0, 15, -15, 10, 0, -3, 0],
          rotateY: [0, -15, 15, -10, 0, 3, 0],
          filter: ["blur(0px)", "blur(1px)", "blur(1.2px)", "blur(0.8px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        } : isActive ? {
          y: [0, -5, 0],
          rotateX: [0, 2, -2, 0],
          rotateY: [0, -3, 3, 0],
          rotateZ: [0, 1.2, -1.2, 0],
          scale: 1,
          filter: "blur(0px)",
        } : {
          y: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1,
          filter: "blur(0px)",
        }}
        transition={isRolling ? { 
          duration: 0.85, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        } : isActive ? {
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        } : { 
          duration: 0.25 
        }}
        className={`w-full h-full border rounded-2xl flex items-center justify-center p-3 relative z-10 ${
          isRolling
            ? "border-red-400/90 bg-gradient-to-br from-rose-500 via-red-650 to-red-800 shadow-[0_12px_30px_rgba(220,38,38,0.65),0_0_20px_rgba(239,68,68,0.4)]"
            : isActive
              ? "border-amber-400 bg-gradient-to-br from-rose-500 via-red-650 to-red-800 shadow-[0_0_22px_rgba(245,158,11,0.6),0_6px_18px_rgba(220,38,38,0.35),inset_0_0_12px_rgba(251,191,36,0.35)] hover:border-amber-300 hover:brightness-110 active:scale-95"
              : "border-slate-800/80 bg-gradient-to-br from-rose-650/80 via-red-750/80 to-red-900/90 shadow-[0_4px_10px_rgba(0,0,0,0.6)] opacity-85"
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Glassy diagonal sheer reflection layer */}
        <div className="absolute inset-0.5 rounded-[14px] bg-gradient-to-tr from-white/0 via-white/8 to-white/25 pointer-events-none z-10" />

        {/* Outer/Inner bevel borders */}
        <div className="absolute inset-1 rounded-[12px] border border-white/10 pointer-events-none z-10" />

        {/* 3D Recessed Ivory Pips */}
        <div className="absolute inset-0 m-auto grid grid-cols-3 grid-rows-3 gap-1 w-8 h-8 z-20 pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => {
            const hasDot = diceDots[value]?.includes(i);
            return (
              <div key={i} className="flex items-center justify-center">
                {hasDot && (
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                    className="w-2.5 h-2.5 rounded-full bg-[#fbfcf7] border border-black/10 shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.85),0_0.8px_1px_rgba(255,255,255,0.4)]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

interface LudoEngineProps {
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onStartGame: () => void;
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
  onLiveTick?: (multiplier: number, picksCount?: number) => void;
}

export function LudoEngine({ betAmount, onBetAmountChange, onStartGame, isPlaying, onComplete, onLiveTick }: LudoEngineProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>("idle");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dice, setDice] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState(1);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [message, setMessage] = useState("Configure settings & roll the dice to win!");
  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<"ai" | "friends">("ai");
  const [showSetup, setShowSetup] = useState(true);

  const startedRef = useRef(false);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(gamePhase);
  phaseRef.current = gamePhase;

  const initGame = useCallback(() => {
    const ps: Player[] = PLAYER_CONFIGS.map((cfg, i) => ({
      color: cfg.color,
      name: gameMode === "friends" ? `Player ${i + 1}` : cfg.name,
      tokens: [0, 1, 2, 3].map(id => ({ id, position: { zone: "base", index: id } })),
      isHuman: gameMode === "friends" ? true : i === 0,
      tokensHome: 0,
    }));
    setPlayers(ps);
    setCurrentIdx(0);
    setDice(1);
    setConsecutiveSixes(0);
    setWinner(null);
    setValidMoves([]);
    setMoveLog([]);
    setGamePhase("playing");
  }, [gameMode]);

  useEffect(() => {
    if (isPlaying && !startedRef.current) {
      startedRef.current = true;
      setShowSetup(false);
      initGame();
    }
    if (!isPlaying) {
      startedRef.current = false;
      setShowSetup(true);
      setGamePhase("idle");
    }
  }, [isPlaying, initGame]);

  const nextTurn = useCallback((bonusTurn = false) => {
    if (winner) return;
    setPlayers(prev => {
      let nextIdx = currentIdx;
      if (!bonusTurn) {
        nextIdx = (currentIdx + 1) % prev.length;
        setConsecutiveSixes(0);
      }
      setCurrentIdx(nextIdx);
      setGamePhase("playing");
      
      const nextPlayer = prev[nextIdx];
      if (nextPlayer.isHuman) {
        setMessage(bonusTurn ? "🎲 Bonus turn! Roll again!" : `🎲 Your turn (${nextPlayer.name})`);
      } else {
        setMessage(`🤖 ${nextPlayer.name} is thinking...`);
      }
      return prev;
    });
  }, [currentIdx, winner]);

  const executeMove = useCallback((move: Move) => {
    if (winner || (phaseRef.current !== "selecting" && phaseRef.current !== "moving")) return;
    
    setGamePhase("moving");
    setValidMoves([]);
    try { playGameSound("click"); } catch {}

    setPlayers(prev => {
      const updated = prev.map((p, pIdx) => {
        if (pIdx !== currentIdx) return p;
        return {
          ...p,
          tokens: p.tokens.map(t => {
            if (t.id !== move.tokenId) return t;
            return { ...t, position: move.to };
          })
        };
      });

      if (move.captures) {
        try { playGameSound("lose"); } catch {}
        const { color, tokenId } = move.captures;
        const capPlayer = PLAYER_CONFIGS.find(cfg => cfg.color === color)!;
        setMoveLog(l => [`💥 Captured ${capPlayer.emoji} ${color} piece!`, ...l]);
        
        return updated.map(p => {
          if (p.color !== color) return p;
          return {
            ...p,
            tokens: p.tokens.map(t => {
              if (t.id !== tokenId) return t;
              return { ...t, position: { zone: "base" as const, index: t.id } };
            })
          };
        });
      }

      if (move.to.zone === "finished") {
        try { playGameSound("win"); } catch {}
        const updatedSelf = updated[currentIdx];
        updatedSelf.tokensHome += 1;
        setMoveLog(l => [`🎉 Token finished home!`, ...l]);
      }

      return updated;
    });

    const activePlayer = players[currentIdx];
    const tokenName = `piece #${move.tokenId + 1}`;
    setMoveLog(l => [`${activePlayer?.name} moved ${tokenName}`, ...l]);

    const t = setTimeout(() => {
      setPlayers(prev => {
        const player = prev[currentIdx];
        if (player.tokensHome >= 4) {
          setWinner(player.color);
          setGamePhase("finished");
          if (player.isHuman) {
            setMessage("🏆 YOU WIN! 🏆");
            onComplete(3.8, true);
          } else {
            setMessage(`${player.name} wins!`);
            onComplete(0, false);
          }
        } else {
          nextTurn(dice === 6 || !!move.captures);
        }
        return prev;
      });
    }, 500);
    return () => clearTimeout(t);
  }, [currentIdx, dice, winner, nextTurn, onComplete, players]);

  useEffect(() => {
    if (gamePhase !== "playing" || !players[currentIdx] || players[currentIdx].isHuman || winner) return;

    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(() => {
      if (winner || phaseRef.current !== "playing") return;
      
      setIsRolling(true);
      try { playGameSound("spin"); } catch {}
      
      const rollTimer = setTimeout(() => {
        setIsRolling(false);
        const rolledVal = Math.floor(Math.random() * 6) + 1;
        setDice(rolledVal);
        setDisplayDice(rolledVal);

        const currentActive = players[currentIdx];
        const moves = getValidMoves(currentActive, rolledVal, players);

        if (moves.length === 0) {
          setMoveLog(l => [`🤖 ${currentActive.name} rolled a ${rolledVal} (No moves)`, ...l]);
          const nextTurnTimer = setTimeout(() => nextTurn(false), 800);
          return () => clearTimeout(nextTurnTimer);
        }

        let chosenMove = moves[0];
        const captureMove = moves.find(m => m.captures);
        const winMove = moves.find(m => m.to.zone === "finished");
        const homeMove = moves.find(m => m.to.zone === "home" || m.entersHome);
        
        if (captureMove) chosenMove = captureMove;
        else if (winMove) chosenMove = winMove;
        else if (homeMove) chosenMove = homeMove;
        else {
          chosenMove = moves.reduce((prev, curr) => {
            if (curr.from.zone === "base") return prev;
            if (prev.from.zone === "base") return curr;
            return curr;
          }, moves[0]);
        }

        setMoveLog(l => [`🤖 ${currentActive.name} rolled a ${rolledVal}`, ...l]);
        setGamePhase("selecting");
        
        const execTimer = setTimeout(() => executeMove(chosenMove), 800);
        return () => clearTimeout(execTimer);
      }, 800);
      return () => clearTimeout(rollTimer);
    }, 1200);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [gamePhase, currentIdx, players, executeMove, winner, nextTurn]);

  const rollDice = useCallback(() => {
    if (isRolling || winner || gamePhase !== "playing" || !players[currentIdx]?.isHuman) return;

    setIsRolling(true);
    try { playGameSound("spin"); } catch {}

    setTimeout(() => {
      setIsRolling(false);
      const rolledVal = Math.floor(Math.random() * 6) + 1;
      setDice(rolledVal);
      setDisplayDice(rolledVal);

      const activePlayer = players[currentIdx];
      const moves = getValidMoves(activePlayer, rolledVal, players);

      setMoveLog(l => [`🎲 You rolled a ${rolledVal}`, ...l]);

      if (moves.length === 0) {
        setMessage(`No valid moves with ${rolledVal}. Passing turn...`);
        setTimeout(() => nextTurn(false), 1200);
        return;
      }

      setValidMoves(moves);
      setGamePhase("selecting");
      setMessage("👉 Choose a highlighted piece to move!");
      
      if (moves.length === 1) {
        setTimeout(() => {
          executeMove(moves[0]);
        }, 600);
      }
    }, 800);
  }, [isRolling, winner, gamePhase, players, currentIdx, nextTurn, executeMove]);

  const handleTokenClick = useCallback((color: PlayerColor, tokenId: number) => {
    if (gamePhase !== "selecting" || !players[currentIdx] || color !== players[currentIdx].color) return;
    
    const move = validMoves.find(m => m.tokenId === tokenId);
    if (move) {
      executeMove(move);
    }
  }, [gamePhase, currentIdx, players, validMoves, executeMove]);

  if (showSetup) {
    return (
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="bg-white/90 border border-amber-500/25 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            {/* Left Decorative Banner */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/10 blur-[35px] rounded-full pointer-events-none" />
                <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_15px_#fbbf24]" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 uppercase tracking-widest leading-none mb-3">Ludo Royale</h2>
              <p className="text-slate-650 text-xs font-bold uppercase tracking-widest max-w-xs">Premium Casino Board Game • 95% RTP</p>
              
              <div className="relative w-44 h-44 mt-8 rounded-full border border-dashed border-amber-500/30 flex items-center justify-center bg-white/40 shadow-inner">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border border-dashed border-amber-500/20"
                />
                <div className="absolute top-4 left-1/2 -translate-x-1/2"><TokenPiece color="red" size="small" /></div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2"><TokenPiece color="green" size="small" /></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2"><TokenPiece color="yellow" size="small" /></div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><TokenPiece color="blue" size="small" /></div>
                <div className="flex flex-col items-center justify-center text-center">
                  <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
                  <span className="text-[10px] font-black text-slate-700 uppercase mt-1 tracking-wider">3.80x POT</span>
                </div>
              </div>
            </div>

            {/* Right Setup Controls */}
            <div className="flex-1 w-full max-w-md bg-white/40 border border-slate-800/80 p-5 sm:p-6 rounded-[2rem] flex flex-col gap-5">
              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2.5">Select Arena Mode</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "ai" as const, icon: <Bot className="w-4 h-4" />, title: "VS BOTS", desc: "Play 3 computer AI" },
                    { id: "friends" as const, icon: <User className="w-4 h-4" />, title: "VS FRIENDS", desc: "Pass & Play hotseat" },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setGameMode(mode.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${
                        gameMode === mode.id
                          ? "border-amber-500/60 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-[1.02]"
                          : "border-slate-850 bg-white/40 hover:border-slate-700 text-slate-650 hover:text-slate-900"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${gameMode === mode.id ? "bg-amber-500 text-slate-950" : "bg-white text-slate-650"}`}>
                        {mode.icon}
                      </div>
                      <span className="font-black text-[10px] uppercase tracking-wider">{mode.title}</span>
                      <span className="text-[8px] text-slate-500 text-center font-medium mt-0.5 leading-tight">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/60 border border-slate-900 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Entry Fee Stake</span>
                  <span className="text-xs font-black font-mono text-slate-900">₹{betAmount.toLocaleString()}</span>
                </div>

                <div className="flex items-center bg-white border border-slate-850 rounded-xl overflow-hidden shadow-sm transition-all focus-within:border-amber-500/50">
                  <div className="flex items-center pl-3 pr-2 border-r border-slate-850 bg-white/40 h-10">
                    <span className="text-slate-500 font-bold text-xs">₹</span>
                  </div>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => onBetAmountChange(Math.max(10, Number(e.target.value)))}
                    className="flex-1 bg-transparent border-none text-slate-900 font-black text-xs px-2 py-1.5 focus:outline-none focus:ring-0 font-mono"
                  />
                  <div className="flex items-center bg-white/40 border-l border-slate-850 h-10">
                    <button onClick={() => onBetAmountChange(Math.max(100, Math.floor(betAmount / 2)))} className="px-2 h-full text-[9px] font-black text-slate-650 hover:bg-slate-50 hover:text-slate-900 border-r border-slate-800 transition-colors">1/2</button>
                    <button onClick={() => onBetAmountChange(Math.min(1000000, betAmount * 2))} className="px-2 h-full text-[9px] font-black text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-colors">2X</button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1 mt-4 overflow-x-auto py-1 scrollbar-none">
                  {[
                    { amount: 100, label: "100", color: "from-red-650 to-red-700 border-red-500" },
                    { amount: 500, label: "500", color: "from-teal-650 to-teal-700 border-teal-500" },
                    { amount: 1000, label: "1k", color: "from-amber-500 to-amber-600 border-amber-400" },
                    { amount: 5000, label: "5k", color: "from-pink-500 to-pink-650 border-pink-400" },
                    { amount: 10000, label: "10k", color: "from-rose-500 to-rose-600 border-rose-450" },
                    { amount: 50000, label: "50k", color: "from-red-800 to-red-900 border-red-700" }
                  ].map((chip) => {
                    const isSelected = betAmount === chip.amount;
                    return (
                      <button
                        key={chip.amount}
                        type="button"
                        onClick={() => onBetAmountChange(chip.amount)}
                        className={`relative w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-black text-slate-900 shadow-md transition-all duration-300 transform cursor-pointer border-[1.5px] border-white/70 select-none ${
                          isSelected ? "scale-110 ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-950 opacity-100 z-10" : "hover:scale-105 opacity-70 hover:opacity-100"
                        } bg-gradient-to-br ${chip.color}`}
                      >
                        <div className="absolute inset-[2px] rounded-full border border-dashed border-white/50 flex items-center justify-center">
                          <span className="text-[7.5px] font-black tracking-tight drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">
                            {chip.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-4 pt-3.5 border-t border-slate-900">
                  <span>RTP: 95.0%</span>
                  <span className="text-amber-400 font-extrabold flex items-center gap-1 text-right">
                    WIN POT: <span className="text-emerald-400">3.80x → ₹{(betAmount * 3.8).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={onStartGame}
                className="w-full py-3.5 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(245,158,11,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-400 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 cursor-pointer animate-pulse"
              >
                🎰 Enter Arena
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allTokensByCell: Record<string, { color: PlayerColor; tokenId: number }[]> = {};
  for (const p of players) {
    for (const t of p.tokens) {
      if (t.position.zone === "finished") continue;
      const pos = getScreenPos(t.position, p.color);
      const key = `${pos.x.toFixed(1)}-${pos.y.toFixed(1)}`;
      if (!allTokensByCell[key]) allTokensByCell[key] = [];
      allTokensByCell[key].push({ color: p.color, tokenId: t.id });
    }
  }

  const currentPlayer = players[currentIdx];

  return (
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-2 sm:py-6 text-slate-900 overflow-visible">
      {/* Dynamic Header / Info Bar (Wager HUD & Message) */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-white/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-lg">
        {/* Turn Message */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentPlayer?.isHuman ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentPlayer?.isHuman ? "bg-emerald-500" : "bg-amber-500"}`} />
          </span>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-none">
            {message}
          </h3>
        </div>

        {/* Wager HUD */}
        <div className="flex items-center gap-4 bg-white/80 border border-slate-800/60 px-3 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Wager:</span>
            <span className="text-xs font-black font-mono text-slate-900">₹{betAmount.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-slate-50" />
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Win Pot:</span>
            <span className="text-xs font-black font-mono text-emerald-400">₹{(betAmount * 3.8).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row items-start justify-center gap-6 w-full overflow-visible">
        {/* Left Column: Ludo Board */}
        <div className="w-full md:w-[480px] lg:w-[540px] xl:w-[600px] shrink-0 flex flex-col items-center">
          <div className="relative aspect-square w-full select-none overflow-hidden bg-white/90 border-4 border-slate-800/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_0_35px_rgba(0,0,0,0.7)]">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: "radial-gradient(#ffffff 1px, transparent 0), radial-gradient(#ffffff 1px, transparent 0)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px"
              }}
            />

            {(["red", "green", "yellow", "blue"] as PlayerColor[]).map(color => {
              const pos = {
                red: { l: 0, t: 0 }, green: { l: 60, t: 0 },
                yellow: { l: 60, t: 60 }, blue: { l: 0, t: 60 }
              }[color];
              
              const p = players.find(x => x.color === color);
              const isTurn = currentPlayer?.color === color && !winner;

              return (
                <motion.div
                  key={`base-${color}`}
                  animate={isTurn ? { borderColor: [COLORS[color].token, "rgba(255,255,255,0.8)", COLORS[color].token] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute transition-all duration-300"
                  style={{
                    left: `${pos.l}%`, top: `${pos.t}%`, width: "40%", height: "40%",
                    backgroundColor: COLORS[color].bg,
                    border: `3px solid ${isTurn ? COLORS[color].token : "rgba(255,255,255,0.05)"}`,
                    boxShadow: isTurn ? `0 0 25px ${COLORS[color].glow}` : "none",
                  }}
                >
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-white/75 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1 max-w-[90%] truncate z-10">
                    <span className="text-[8px] sm:text-[9px] font-black text-slate-900/95 uppercase tracking-wide truncate">
                      {p ? `${p.name} (${p.tokensHome}/4)` : ""}
                    </span>
                    {p && p.tokensHome > 0 && (
                      <span className="text-[8px] text-amber-400 font-extrabold flex items-center shrink-0">
                        🏆
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-[20%] bg-white/85 backdrop-blur-sm rounded-2xl border border-slate-800/40 grid grid-cols-2 grid-rows-2 gap-[15%] p-[15%]">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="rounded-full flex items-center justify-center" style={{
                        border: `1.5px solid ${COLORS[color].token}25`,
                        backgroundColor: `rgba(0,0,0,0.3)`,
                      }} />
                    ))}
                  </div>
                </motion.div>
              );
            })}

            <div className="absolute" style={{
              left: "40%", top: "40%", width: "20%", height: "20%",
              background: "#090d14",
              border: "2px solid rgba(255,255,255,0.08)",
            }}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="0,0 50,50 100,0" fill={COLORS.green.token} opacity="0.25" />
                <polygon points="100,0 50,50 100,100" fill={COLORS.yellow.token} opacity="0.25" />
                <polygon points="100,100 50,50 0,100" fill={COLORS.blue.token} opacity="0.25" />
                <polygon points="0,100 50,50 0,0" fill={COLORS.red.token} opacity="0.25" />
                
                <polygon points="0,0 50,50 100,0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <polygon points="100,0 50,50 100,100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <polygon points="100,100 50,50 0,100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <polygon points="0,100 50,50 0,0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ scale: [0.95, 1.15, 0.95] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Crown className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_#fbbf24]" />
                </motion.div>
              </div>
            </div>

            {MAIN_PATH.map(([r, c], idx) => {
              const isStart = START_CELLS.has(idx);
              const isSafe = SAFE_CELLS.has(idx) && !isStart;
              const isValidTarget = validMoves.some(m => m.to.zone === "path" && m.to.index === idx);
              const startColor = isStart ? PLAYER_CONFIGS.find(p => p.startPos === idx)?.color : null;

              return (
                <div
                  key={`cell-${idx}`}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`,
                    width: `${CELL_PCT}%`, height: `${CELL_PCT}%`,
                    backgroundColor: startColor ? `${COLORS[startColor].token}15` : isValidTarget ? "rgba(245,158,11,0.15)" : "#0f1622",
                    border: "0.5px solid rgba(255,255,255,0.03)",
                    boxShadow: isValidTarget ? "inset 0 0 6px rgba(245,158,11,0.4)" : "none",
                  }}
                >
                  {isSafe && <Star className="w-[50%] h-[50%] text-amber-400 drop-shadow-[0_0_4px_#fbbf24] opacity-75" />}
                  {isStart && startColor && (
                    <div className="w-[35%] h-[35%] rounded-full animate-pulse" style={{ backgroundColor: `${COLORS[startColor].token}60` }} />
                  )}
                </div>
              );
            })}

            {(["red", "green", "yellow", "blue"] as PlayerColor[]).map(color =>
              HOME_PATHS[color].map(([r, c], idx) => (
                <div
                  key={`home-${color}-${idx}`}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`,
                    width: `${CELL_PCT}%`, height: `${CELL_PCT}%`,
                    backgroundColor: `${COLORS[color].token}25`,
                    border: `0.5px solid ${COLORS[color].token}35`,
                    boxShadow: `inset 0 0 5px ${COLORS[color].glow}`,
                  }}
                >
                  {idx === 5 && <Home className="w-[45%] h-[45%] opacity-60" style={{ color: COLORS[color].token }} />}
                </div>
              ))
            )}

            {players.flatMap(player =>
              player.tokens
                .filter(t => t.position.zone !== "finished")
                .map(token => {
                  const pos = getScreenPos(token.position, player.color);
                  const key = `${pos.x.toFixed(1)}-${pos.y.toFixed(1)}`;
                  const cellTokens = allTokensByCell[key] || [];
                  const tokenIdx = cellTokens.findIndex(x => x.tokenId === token.id);
                  
                  const tokenOffset = cellTokens.length > 1 ? {
                    x: ((tokenIdx - (cellTokens.length - 1) / 2) * 8),
                    y: ((tokenIdx - (cellTokens.length - 1) / 2) * -2)
                  } : { x: 0, y: 0 };

                  const isMovable = validMoves.some(m => m.tokenId === token.id) && currentPlayer?.isHuman;

                  return (
                    <motion.div
                      key={`token-${player.color}-${token.id}`}
                      layoutId={`token-${player.color}-${token.id}`}
                      animate={isMovable ? {
                        scale: [1, 1.15, 1],
                        y: [tokenOffset.y, tokenOffset.y - 8, tokenOffset.y],
                        filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
                      } : { scale: 1, y: tokenOffset.y }}
                      transition={isMovable ? { repeat: Infinity, duration: 1.2 } : { type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: "translate(-50%, -50%)",
                        marginLeft: `${tokenOffset.x}px`,
                        zIndex: 20 + tokenIdx,
                      }}
                      onClick={() => handleTokenClick(player.color, token.id)}
                    >
                      <TokenPiece color={player.color} size={cellTokens.length > 2 ? "small" : "medium"} />
                      {isMovable && (
                        <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-60 pointer-events-none" />
                      )}
                    </motion.div>
                  );
                })
            )}

            {players.map(p => {
              if (p.tokensHome === 0) return null;
              const cx = 7, cy = 7;
              const offsets: Record<PlayerColor, [number, number]> = {
                red: [-0.3, -0.3], green: [0.3, -0.3], yellow: [0.3, 0.3], blue: [-0.3, 0.3],
              };
              const [ox, oy] = offsets[p.color];
              return Array.from({ length: p.tokensHome }).map((_, i) => (
                <div
                  key={`fin-${p.color}-${i}`}
                  className="absolute"
                  style={{
                    left: `${(cy + ox + i * 0.12) * CELL_PCT + CELL_PCT / 2}%`,
                    top: `${(cx + oy + i * 0.12) * CELL_PCT + CELL_PCT / 2}%`,
                    width: `${CELL_PCT * 0.4}%`, height: `${CELL_PCT * 0.4}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 15,
                  }}
                >
                  <TokenPiece color={p.color} size="small" />
                </div>
              ));
            })}
          </div>

          {/* Mobile Dice Action Bar (Visible only on mobile right below board) */}
          <div className="w-full md:hidden mt-3 bg-[#121b28]/90 border border-slate-700/30 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <DiceFace 
                value={displayDice} 
                isRolling={isRolling} 
                isActive={currentPlayer?.isHuman && gamePhase === "playing" && !winner}
                onClick={rollDice}
              />
              {dice > 0 && !isRolling && (
                <div className="text-left">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block">Rolled</span>
                  <span className="text-base font-black text-slate-900 font-mono">{dice}</span>
                </div>
              )}
            </div>

            {currentPlayer?.isHuman && gamePhase === "playing" && !winner ? (
              <button
                onClick={rollDice}
                className="flex-1 py-3 px-4 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest border border-amber-400 bg-gradient-to-r from-amber-400 to-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse"
              >
                🎲 Roll Dice
              </button>
            ) : (
              <div className="flex-1 text-right pr-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  {currentPlayer?.isHuman ? "Select Piece" : "Waiting..."}
                </span>
                <span className="text-[9px] text-slate-550 italic block mt-0.5">
                  {currentPlayer?.isHuman ? "Tap your glowing token" : `${currentPlayer?.name} is thinking`}
                </span>
              </div>
            )}

            {winner && (
              <button
                onClick={() => {
                  setGamePhase("idle");
                  setPlayers([]);
                  setWinner(null);
                  setShowSetup(true);
                  startedRef.current = false;
                }}
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-50/80 text-slate-900 font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Desktop Command Center (Hidden on mobile) */}
        <div className="hidden md:flex flex-col flex-1 w-full gap-4">
          <div className="bg-[#121b28]/80 border border-slate-700/40 backdrop-blur-md rounded-3xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-slate-350 uppercase tracking-widest">
                  {currentPlayer?.isHuman ? "Your Turn" : `${currentPlayer?.name}'s Turn`}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-800">
                TURN #{moveLog.length + 1}
              </span>
            </div>

            {/* Dice Control Box */}
            <div className="flex items-center justify-between bg-white/40 border border-slate-800/50 p-4 rounded-2xl gap-4">
              <div className="flex items-center gap-4">
                <DiceFace 
                  value={displayDice} 
                  isRolling={isRolling} 
                  isActive={currentPlayer?.isHuman && gamePhase === "playing" && !winner}
                  onClick={rollDice}
                />
                {dice > 0 && !isRolling && (
                  <div className="text-left">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Rolled</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{dice}</span>
                  </div>
                )}
              </div>

              {currentPlayer?.isHuman && gamePhase === "playing" && !winner ? (
                <button
                  onClick={rollDice}
                  className="flex-1 py-3.5 px-5 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest border border-amber-400 bg-gradient-to-r from-amber-400 to-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse"
                >
                  🎲 Roll Dice
                </button>
              ) : (
                <div className="flex-1 text-right pr-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    {currentPlayer?.isHuman ? "Choose Piece" : "Waiting for Bot..."}
                  </span>
                  <span className="text-[9px] text-slate-500 italic block mt-0.5">
                    {currentPlayer?.isHuman ? "Click highlighted piece on board" : "Bot makes its move"}
                  </span>
                </div>
              )}
            </div>

            {/* Players Status Summary */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Players Stats</span>
              <div className="grid grid-cols-2 gap-2">
                {players.map(p => {
                  const isPlayerTurn = currentPlayer?.color === p.color && !winner;
                  return (
                    <div key={p.color} className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isPlayerTurn ? "bg-white border-amber-500/50" : "bg-white/30 border-slate-800/80"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[p.color].token }} />
                        <span className="text-xs font-bold text-slate-355">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-black text-slate-650">
                        {p.tokensHome}/4 🏆
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Move Feed Logs */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Lobby Log</span>
              <div className="bg-[#090d14]/90 border border-slate-900 rounded-xl p-3 h-24 overflow-hidden">
                <div className="space-y-1 overflow-y-auto h-full custom-scrollbar">
                  {moveLog.length === 0 ? (
                    <p className="text-[10px] text-slate-650 text-center py-4 uppercase font-bold tracking-wider">Lobby Feed Active</p>
                  ) : moveLog.map((log, i) => (
                    <motion.div
                      key={`${log}-${i}`}
                      initial={i === 0 ? { opacity: 0, y: 5 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-[10px] font-mono leading-relaxed ${
                        i === 0 ? "text-amber-400 font-bold" : "text-slate-550"
                      }`}
                    >
                      &gt; {log}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {winner && (
              <button
                onClick={() => {
                  setGamePhase("idle");
                  setPlayers([]);
                  setWinner(null);
                  setShowSetup(true);
                  startedRef.current = false;
                }}
                className="w-full py-3.5 rounded-xl border border-slate-700 bg-slate-50/85 hover:bg-slate-750 text-slate-900 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-97"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Play Again
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md px-4"
            onClick={() => setWinner(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white border border-amber-500/30 p-8 rounded-[2rem] text-center shadow-[0_30px_90px_rgba(0,0,0,0.85)] max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 1, repeat: 3 }}
                className="text-6xl mb-4"
              >
                {players[0]?.tokensHome >= 4 ? "🏆" : "💀"}
              </motion.div>

              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-wide">
                {players[0]?.tokensHome >= 4 ? "Victory Royale!" : "Defeat!"}
              </h2>

              {players[0]?.tokensHome >= 4 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-3xl font-black font-mono mb-4 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                >
                  +₹{((betAmount * 3.8) - betAmount).toLocaleString()}
                </motion.div>
              )}

              <p className="text-sm text-slate-500 mb-6">
                {players[0]?.tokensHome >= 4
                  ? `You earned 3.80× on your ₹${betAmount.toLocaleString()} entry!`
                  : "Better luck next time. The board always has another game."}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setWinner(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setWinner(null);
                    setGamePhase("idle");
                    setPlayers([]);
                    setShowSetup(true);
                    startedRef.current = false;
                  }}
                  className="flex-1 py-3 rounded-xl text-slate-900 font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)" }}
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
