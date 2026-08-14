"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, RotateCcw, Bot, User, Swords, Home, Sparkles, 
  Crown, Plus, Minus, Shield, HelpCircle, Coins, Zap, Clock, 
  Volume2, VolumeX, Flame, ChevronRight, AlertCircle
} from "lucide-react";
import { playGameSound } from "@/lib/audio";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════
// TYPES & MODES
// ═══════════════════════════════════════════════

export type LudoGameMode = "1v1" | "speed" | "4player";
export type PlayerColor = "red" | "green" | "yellow" | "blue";

export interface TokenPosition {
  zone: "base" | "path" | "home" | "finished";
  index: number;
}

export interface Token {
  id: number;
  position: TokenPosition;
  stepsMoved: number;
}

export interface Player {
  color: PlayerColor;
  name: string;
  avatar: string;
  tokens: Token[];
  isHuman: boolean;
  score: number;
  movesLeft: number;
  tokensHome: number;
}

export interface Move {
  tokenId: number;
  from: TokenPosition;
  to: TokenPosition;
  captures?: { color: PlayerColor; tokenId: number };
  entersHome?: boolean;
}

export type GamePhase = "lobby" | "playing" | "rolling" | "rolled" | "moving" | "finished";

interface LudoEngineProps {
  betAmount: number;
  onBetAmountChange: (amt: number) => void;
  onStartGame?: ((bet?: number) => Promise<boolean> | boolean | void) | (() => void);
  isPlaying: boolean;
  onComplete: (multiplierOrWon: any, wonBool?: any) => void;
  onLiveTick?: (activeValue: number) => void;
}

// ═══════════════════════════════════════════════
// BOARD CONSTANTS (15x15 Standard Ludo Grid)
// ═══════════════════════════════════════════════

const CELL_PCT = 100 / 15;

const ALL_CONFIGS = [
  { color: "red" as PlayerColor, name: "You (Red)", startPos: 0, emoji: "🔴", avatar: "👑" },
  { color: "green" as PlayerColor, name: "Bot Alpha", startPos: 13, emoji: "🟢", avatar: "🤖" },
  { color: "yellow" as PlayerColor, name: "Bot Sigma", startPos: 26, emoji: "🟡", avatar: "⚡" },
  { color: "blue" as PlayerColor, name: "Bot Omega", startPos: 39, emoji: "🔵", avatar: "🎯" },
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
  red:    [[1.8,1.8],[1.8,4.2],[4.2,1.8],[4.2,4.2]],
  green:  [[1.8,10.8],[1.8,13.2],[4.2,10.8],[4.2,13.2]],
  yellow: [[10.8,10.8],[10.8,13.2],[13.2,10.8],[13.2,13.2]],
  blue:   [[10.8,1.8],[10.8,4.2],[13.2,1.8],[13.2,4.2]],
};

const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const COLORS: Record<PlayerColor, { primary: string; dark: string; light: string; border: string; glow: string; text: string }> = {
  red:    { primary: "#EF4444", dark: "#991B1B", light: "#FEE2E2", border: "#F87171", glow: "rgba(239,68,68,0.5)", text: "#B91C1C" },
  green:  { primary: "#10B981", dark: "#065F46", light: "#D1FAE5", border: "#34D399", glow: "rgba(16,185,129,0.5)", text: "#047857" },
  yellow: { primary: "#F59E0B", dark: "#78350F", light: "#FEF3C7", border: "#FBBF24", glow: "rgba(245,158,11,0.5)", text: "#B45309" },
  blue:   { primary: "#3B82F6", dark: "#1E3A8A", light: "#DBEAFE", border: "#60A5FA", glow: "rgba(59,130,246,0.5)", text: "#1D4ED8" },
};

function gridToPos(row: number, col: number) {
  return { x: col * CELL_PCT + CELL_PCT / 2, y: row * CELL_PCT + CELL_PCT / 2 };
}

function getScreenPos(pos: TokenPosition, color: PlayerColor): { x: number; y: number } {
  if (pos.zone === "base") return gridToPos(BASE_SPOTS[color][pos.index][0], BASE_SPOTS[color][pos.index][1]);
  if (pos.zone === "path") return gridToPos(MAIN_PATH[pos.index][0], MAIN_PATH[pos.index][1]);
  if (pos.zone === "home") return gridToPos(HOME_PATHS[color][pos.index][0], HOME_PATHS[color][pos.index][1]);
  return gridToPos(7, 7);
}

function stepsFromStart(pathIdx: number, startPos: number): number {
  return ((pathIdx - startPos) + 52) % 52;
}

// ═══════════════════════════════════════════════
// 3D DICE & 3D PAWN COMPONENTS
// ═══════════════════════════════════════════════

function DicePips({ value }: { value: number }) {
  const pipColor = value === 1 ? "bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.6)]" : "bg-slate-900";
  return (
    <div className="w-full h-full p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center select-none">
      {value === 1 && (
        <div className={`col-start-2 row-start-2 w-3.5 h-3.5 rounded-full ${pipColor}`} />
      )}
      {value === 2 && (
        <>
          <div className="col-start-3 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-1 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900" />
        </>
      )}
      {value === 3 && (
        <>
          <div className="col-start-3 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-2 row-start-2 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-1 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900" />
        </>
      )}
      {value === 4 && (
        <>
          <div className="col-start-1 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-3 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-1 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-3 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900" />
        </>
      )}
      {value === 5 && (
        <>
          <div className="col-start-1 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-3 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-2 row-start-2 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-1 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-3 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900" />
        </>
      )}
      {value === 6 && (
        <>
          <div className="col-start-1 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-1 row-start-2 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-1 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-3 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-3 row-start-2 w-2.5 h-2.5 rounded-full bg-slate-900" />
          <div className="col-start-3 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900" />
        </>
      )}
    </div>
  );
}

function Pawn3D({ color, id, isMovable }: { color: PlayerColor; id: number; isMovable: boolean }) {
  const c = COLORS[color];
  return (
    <div className={cn(
      "relative w-7 h-8 sm:w-8 sm:h-9 flex flex-col items-center justify-center filter drop-shadow-[0_5px_4px_rgba(0,0,0,0.45)] select-none transition-transform",
      isMovable && "cursor-pointer scale-110"
    )}>
      {isMovable && (
        <div className="absolute -inset-1 rounded-full bg-amber-400/50 animate-ping pointer-events-none" />
      )}
      
      {/* Pawn Head (Glossy Sphere) */}
      <div 
        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/70 shadow-sm relative z-10"
        style={{
          background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${c.primary} 55%, ${c.dark} 100%)`
        }}
      />
      {/* Pawn Neck Collar */}
      <div 
        className="w-4.5 h-1.5 sm:w-5 sm:h-1.5 rounded-full -mt-0.5 border-t border-white/50 shadow-xs"
        style={{ background: c.border }}
      />
      {/* Pawn Base Body */}
      <div 
        className="w-6 h-4.5 sm:w-7 sm:h-5 rounded-b-2xl -mt-0.5 flex items-center justify-center text-white font-black text-[9px] border-b-2 border-black/40 shadow-inner"
        style={{
          background: `linear-gradient(180deg, ${c.primary} 0%, ${c.dark} 100%)`
        }}
      >
        <span className="drop-shadow-xs font-mono">{id + 1}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

export function LudoEngine({
  betAmount,
  onBetAmountChange,
  onStartGame,
  isPlaying,
  onComplete,
  onLiveTick
}: LudoEngineProps) {
  const [gameMode, setGameMode] = useState<LudoGameMode>("1v1");
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(12);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [soundMuted, setSoundMuted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const aiTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activePlayer = players[turnIndex];
  const isHumanTurn = activePlayer?.isHuman && (phase === "playing" || phase === "rolled");

  const playSfx = useCallback((type: "dice" | "click" | "win" | "cashout") => {
    if (soundMuted) return;
    try {
      playGameSound(type === "dice" ? "tick" : type === "win" ? "win" : type === "cashout" ? "jackpot" : "click");
    } catch {}
  }, [soundMuted]);

  const getMultiplierForMode = (mode: LudoGameMode): number => {
    switch (mode) {
      case "1v1": return 1.95;
      case "speed": return 1.95;
      case "4player": return 3.80;
    }
  };

  const initPlayers = useCallback((mode: LudoGameMode): Player[] => {
    if (mode === "1v1") {
      return [
        {
          color: "red",
          name: "You",
          avatar: "👑",
          tokens: [
            { id: 0, position: { zone: "base", index: 0 }, stepsMoved: 0 },
            { id: 1, position: { zone: "base", index: 1 }, stepsMoved: 0 },
            { id: 2, position: { zone: "base", index: 2 }, stepsMoved: 0 },
            { id: 3, position: { zone: "base", index: 3 }, stepsMoved: 0 },
          ],
          isHuman: true,
          score: 0,
          movesLeft: 24,
          tokensHome: 0,
        },
        {
          color: "yellow",
          name: "Bot Sigma",
          avatar: "⚡",
          tokens: [
            { id: 0, position: { zone: "base", index: 0 }, stepsMoved: 0 },
            { id: 1, position: { zone: "base", index: 1 }, stepsMoved: 0 },
            { id: 2, position: { zone: "base", index: 2 }, stepsMoved: 0 },
            { id: 3, position: { zone: "base", index: 3 }, stepsMoved: 0 },
          ],
          isHuman: false,
          score: 0,
          movesLeft: 24,
          tokensHome: 0,
        }
      ];
    }

    if (mode === "speed") {
      return [
        {
          color: "red",
          name: "You",
          avatar: "👑",
          tokens: [
            { id: 0, position: { zone: "path", index: 0 }, stepsMoved: 0 },
            { id: 1, position: { zone: "path", index: 8 }, stepsMoved: 8 },
            { id: 2, position: { zone: "base", index: 2 }, stepsMoved: 0 },
            { id: 3, position: { zone: "base", index: 3 }, stepsMoved: 0 },
          ],
          isHuman: true,
          score: 8,
          movesLeft: 24,
          tokensHome: 0,
        },
        {
          color: "yellow",
          name: "Speed Bot",
          avatar: "⚡",
          tokens: [
            { id: 0, position: { zone: "path", index: 26 }, stepsMoved: 0 },
            { id: 1, position: { zone: "path", index: 34 }, stepsMoved: 8 },
            { id: 2, position: { zone: "base", index: 2 }, stepsMoved: 0 },
            { id: 3, position: { zone: "base", index: 3 }, stepsMoved: 0 },
          ],
          isHuman: false,
          score: 8,
          movesLeft: 24,
          tokensHome: 0,
        }
      ];
    }

    return ALL_CONFIGS.map((cfg, idx) => ({
      color: cfg.color,
      name: idx === 0 ? "You" : cfg.name,
      avatar: cfg.avatar,
      tokens: [
        { id: 0, position: { zone: "base", index: 0 }, stepsMoved: 0 },
        { id: 1, position: { zone: "base", index: 1 }, stepsMoved: 0 },
        { id: 2, position: { zone: "base", index: 2 }, stepsMoved: 0 },
        { id: 3, position: { zone: "base", index: 3 }, stepsMoved: 0 },
      ],
      isHuman: idx === 0,
      score: 0,
      movesLeft: 24,
      tokensHome: 0,
    }));
  }, []);

  const calculateValidMoves = useCallback((player: Player, roll: number): Move[] => {
    const moves: Move[] = [];
    const cfg = ALL_CONFIGS.find(c => c.color === player.color)!;
    const startPos = cfg.startPos;

    for (const token of player.tokens) {
      if (token.position.zone === "base") {
        if (roll === 6 || gameMode === "speed") {
          let captures: { color: PlayerColor; tokenId: number } | undefined;
          for (const opp of players) {
            if (opp.color === player.color) continue;
            for (const oppTok of opp.tokens) {
              if (oppTok.position.zone === "path" && oppTok.position.index === startPos && !SAFE_CELLS.has(startPos)) {
                captures = { color: opp.color, tokenId: oppTok.id };
              }
            }
          }
          moves.push({
            tokenId: token.id,
            from: token.position,
            to: { zone: "path", index: startPos },
            captures
          });
        }
        continue;
      }

      if (token.position.zone === "path") {
        const stepsDone = stepsFromStart(token.position.index, startPos);
        const targetSteps = stepsDone + roll;

        if (targetSteps < 51) {
          const nextPathIdx = (startPos + targetSteps) % 52;
          let captures: { color: PlayerColor; tokenId: number } | undefined;
          for (const opp of players) {
            if (opp.color === player.color) continue;
            for (const oppTok of opp.tokens) {
              if (oppTok.position.zone === "path" && oppTok.position.index === nextPathIdx && !SAFE_CELLS.has(nextPathIdx)) {
                captures = { color: opp.color, tokenId: oppTok.id };
              }
            }
          }
          moves.push({
            tokenId: token.id,
            from: token.position,
            to: { zone: "path", index: nextPathIdx },
            captures
          });
        } else if (targetSteps >= 51 && targetSteps <= 56) {
          const homeIdx = targetSteps - 51;
          moves.push({
            tokenId: token.id,
            from: token.position,
            to: { zone: "home", index: homeIdx },
            entersHome: homeIdx === 5
          });
        }
        continue;
      }

      if (token.position.zone === "home") {
        const nextHomeIdx = token.position.index + roll;
        if (nextHomeIdx <= 5) {
          moves.push({
            tokenId: token.id,
            from: token.position,
            to: { zone: "home", index: nextHomeIdx },
            entersHome: nextHomeIdx === 5
          });
        }
      }
    }

    return moves;
  }, [players, gameMode]);

  const advanceTurn = useCallback((repeatTurn: boolean = false) => {
    if (repeatTurn) {
      setPhase("playing");
      setTurnTimeRemaining(12);
      return;
    }

    setConsecutiveSixes(0);
    setTurnIndex(prev => (prev + 1) % players.length);
    setPhase("playing");
    setTurnTimeRemaining(12);
  }, [players.length]);

  const executeMove = useCallback((move: Move) => {
    setPhase("moving");
    playSfx("click");

    setPlayers(prevPlayers => {
      const next = prevPlayers.map(pl => {
        if (pl.color !== activePlayer.color) {
          if (move.captures && pl.color === move.captures.color) {
            return {
              ...pl,
              tokens: pl.tokens.map(tok => {
                if (tok.id === move.captures!.tokenId) {
                  return { ...tok, position: { zone: "base" as const, index: tok.id }, stepsMoved: 0 };
                }
                return tok;
              })
            };
          }
          return pl;
        }

        const updatedTokens = pl.tokens.map(tok => {
          if (tok.id === move.tokenId) {
            const steps = move.to.zone === "home" && move.to.index === 5 ? 56 : tok.stepsMoved + diceValue;
            return {
              ...tok,
              position: move.to.zone === "home" && move.to.index === 5 ? { zone: "finished" as const, index: 0 } : move.to,
              stepsMoved: steps
            };
          }
          return tok;
        });

        const finishedCount = updatedTokens.filter(t => t.position.zone === "finished").length;
        const newScore = pl.score + diceValue + (move.captures ? 20 : 0) + (move.entersHome ? 50 : 0);
        const movesLeft = Math.max(0, pl.movesLeft - 1);

        return {
          ...pl,
          tokens: updatedTokens,
          tokensHome: finishedCount,
          score: newScore,
          movesLeft
        };
      });

      return next;
    });

    const hasCapture = !!move.captures;
    const reachedHome = !!move.entersHome;
    const isSix = diceValue === 6;
    const getsBonusTurn = (isSix || hasCapture || reachedHome) && consecutiveSixes < 2;

    if (hasCapture) {
      playSfx("cashout");
      setGameLog(prev => [`⚔️ ${activePlayer.name} captured a token! Bonus Turn!`, ...prev.slice(0, 4)]);
    } else if (reachedHome) {
      playSfx("win");
      setGameLog(prev => [`🏆 ${activePlayer.name} token reached HOME!`, ...prev.slice(0, 4)]);
    }

    setTimeout(() => {
      // Check win conditions
      const currentActive = players.find(p => p.color === activePlayer.color);
      if (currentActive) {
        if (currentActive.tokensHome >= (gameMode === "1v1" ? 4 : 4)) {
          setWinner(currentActive);
          setPhase("finished");
          playSfx("win");
          onComplete(currentActive.isHuman ? getMultiplierForMode(gameMode) : 0, currentActive.isHuman);
          return;
        }
      }

      setValidMoves([]);
      advanceTurn(getsBonusTurn);
    }, 450);
  }, [activePlayer, diceValue, consecutiveSixes, playSfx, advanceTurn, players, gameMode, onComplete]);

  const rollDice = useCallback(() => {
    if (isRolling || (phase !== "playing" && phase !== "lobby")) return;

    setIsRolling(true);
    setPhase("rolling");
    playSfx("dice");

    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 8) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        setPhase("rolled");

        if (finalValue === 6) {
          setConsecutiveSixes(prev => prev + 1);
        } else {
          setConsecutiveSixes(0);
        }

        const valid = calculateValidMoves(activePlayer, finalValue);
        setValidMoves(valid);

        if (valid.length === 0) {
          setTimeout(() => advanceTurn(false), 900);
        } else if (!activePlayer.isHuman) {
          // AI Turn: Pick best move (Prioritize captures -> safe moves -> progress)
          setTimeout(() => {
            const bestMove = valid.find(m => m.captures) || valid.find(m => m.entersHome) || valid[0];
            executeMove(bestMove);
          }, 800);
        }
      }
    }, 60);
  }, [isRolling, phase, playSfx, activePlayer, calculateValidMoves, advanceTurn, executeMove]);

  // Handle Match Start
  const handleStartGame = async () => {
    if (onStartGame) {
      const res = await onStartGame(betAmount);
      if (res === false) return;
    }
    const initialPlayers = initPlayers(gameMode);
    setPlayers(initialPlayers);
    setTurnIndex(0);
    setWinner(null);
    setPhase("playing");
    setTurnTimeRemaining(12);
    setGameLog([`⚔️ Match started: ${gameMode.toUpperCase()} Arena with ₹${betAmount.toLocaleString()} stake!`]);
    playSfx("click");
  };

  // Turn Countdown Timer
  useEffect(() => {
    if (phase !== "playing" && phase !== "rolled") return;

    timerRef.current = setInterval(() => {
      setTurnTimeRemaining(prev => {
        if (prev <= 1) {
          if (isHumanTurn && phase === "playing") {
            rollDice();
          } else if (isHumanTurn && phase === "rolled" && validMoves.length > 0) {
            executeMove(validMoves[0]);
          } else {
            advanceTurn(false);
          }
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isHumanTurn, rollDice, executeMove, validMoves, advanceTurn]);

  // AI Auto Roll
  useEffect(() => {
    if (phase === "playing" && activePlayer && !activePlayer.isHuman) {
      aiTurnTimeoutRef.current = setTimeout(() => {
        rollDice();
      }, 700);
    }
    return () => {
      if (aiTurnTimeoutRef.current) clearTimeout(aiTurnTimeoutRef.current);
    };
  }, [phase, activePlayer, rollDice]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 sm:p-4 text-slate-900 select-none">
      
      {/* ═══ LOBBY & STAKE CONFIGURATION ═══ */}
      {phase === "lobby" && (
        <div className="w-full max-w-2xl bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl">
          
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-md">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  3D Ludo Supreme Arena
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Tactile 3D Board • 1v1 Classic, Speed Rush & 4-Player Royale
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-slate-800" />}
            </button>
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              {
                id: "1v1" as LudoGameMode,
                title: "1v1 Classic Duel",
                desc: "Head-to-head tactical duel (Red vs Yellow)",
                mult: "1.95× Payout",
                badge: "⚡ 2-Player",
                color: "border-sky-300 bg-sky-50/60 ring-2 ring-sky-300 text-sky-950",
              },
              {
                id: "speed" as LudoGameMode,
                title: "Speed Rush (Points)",
                desc: "Zupee Style • 24 Moves • High-Score Wins",
                mult: "1.95× Payout",
                badge: "🔥 Fast Action",
                color: "border-amber-400 bg-amber-50/70 ring-2 ring-amber-400 text-amber-950",
              },
              {
                id: "4player" as LudoGameMode,
                title: "4-Player Royale",
                desc: "4 Contenders • Winner takes 3.80× Grand Pot",
                mult: "3.80× Payout",
                badge: "🏆 Mega Pot",
                color: "border-purple-300 bg-purple-50/60 ring-2 ring-purple-300 text-purple-950",
              }
            ].map(m => (
              <div
                key={m.id}
                onClick={() => { setGameMode(m.id); playSfx("click"); }}
                className={cn(
                  "p-4 rounded-2xl border-2 text-left cursor-pointer transition-all active:scale-98 flex flex-col justify-between",
                  gameMode === m.id ? m.color + " shadow-md" : "border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700"
                )}
              >
                <div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 inline-block mb-1.5 shadow-2xs">
                    {m.badge}
                  </span>
                  <h4 className="text-sm font-black tracking-tight">{m.title}</h4>
                  <p className="text-[10px] text-slate-500 font-bold leading-tight mt-0.5">{m.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-black font-mono text-emerald-700">{m.mult}</span>
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", gameMode === m.id ? "border-slate-900 bg-slate-900" : "border-slate-300")}>
                    {gameMode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stake Selector Chips */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
            <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
              <span>Select Stake</span>
              <span>Potential Win: <strong className="text-emerald-700 font-mono text-sm">₹{(betAmount * getMultiplierForMode(gameMode)).toLocaleString()}</strong></span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {[50, 100, 500, 1000, 2500, 5000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { onBetAmountChange(amt); playSfx("click"); }}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black font-mono transition-all border cursor-pointer select-none",
                    betAmount === amt
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  ₹{amt >= 1000 ? `${amt/1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Start Battle Action Button */}
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
          >
            <Swords className="w-5 h-5" />
            <span>START {gameMode.toUpperCase()} MATCH • ₹{betAmount.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* ═══ LIVE 3D LUDO ARENA ═══ */}
      {phase !== "lobby" && (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* 3D ISOMETRIC LUDO BOARD CONTAINER */}
          <div className="lg:col-span-8 bg-[#2A1508] border-[8px] sm:border-[12px] border-[#3E1E07] rounded-[32px] p-3 sm:p-5 shadow-[0_25px_50px_rgba(0,0,0,0.5)] flex flex-col items-center relative overflow-hidden">
            
            {/* Top Match HUD: Active Player Bar + Turn Timer */}
            <div className="w-full flex items-center justify-between pb-2.5 mb-3 border-b border-amber-900/50 px-2">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md border border-white/30"
                  style={{ backgroundColor: COLORS[activePlayer?.color || "red"].primary }}
                >
                  {activePlayer?.avatar || "👑"}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-100 flex items-center gap-1.5">
                    {activePlayer?.name}'s Turn
                    {isHumanTurn && (
                      <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        YOUR TURN
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-amber-300/80 font-bold">
                    {gameMode === "speed" ? `Moves: ${activePlayer?.movesLeft} • Score: ${activePlayer?.score} pts` : `Classic Mode`}
                  </p>
                </div>
              </div>

              {/* Turn Countdown Badge */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-mono font-black text-xs text-amber-300 shadow-inner">
                  {turnTimeRemaining}s
                </div>
              </div>
            </div>

            {/* ═══ 15x15 ISOMETRIC 3D LUDO BOARD ═══ */}
            <div className="relative w-full aspect-square max-w-[450px] bg-[#FAF8F5] rounded-2xl border-4 border-[#5A2C0B] shadow-[inset_0_0_20px_rgba(0,0,0,0.35)] overflow-hidden">
              
              {/* Quadrant 1: CRIMSON RED (Top-Left) */}
              <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-gradient-to-br from-red-500 to-red-600 border-r-4 border-b-4 border-red-700 p-2.5 flex items-center justify-center shadow-inner">
                <div className="w-full h-full bg-white/95 rounded-2xl border-2 border-red-300 shadow-lg flex flex-wrap items-center justify-around p-2 relative">
                  <span className="absolute top-1 text-[8px] font-black uppercase text-red-600 tracking-widest">RED HOME</span>
                </div>
              </div>

              {/* Quadrant 2: JADE GREEN (Top-Right) */}
              <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-gradient-to-br from-emerald-500 to-emerald-600 border-l-4 border-b-4 border-emerald-700 p-2.5 flex items-center justify-center shadow-inner">
                <div className="w-full h-full bg-white/95 rounded-2xl border-2 border-emerald-300 shadow-lg flex flex-wrap items-center justify-around p-2 relative">
                  <span className="absolute top-1 text-[8px] font-black uppercase text-emerald-600 tracking-widest">GREEN HOME</span>
                </div>
              </div>

              {/* Quadrant 3: SAPPHIRE BLUE (Bottom-Left) */}
              <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gradient-to-br from-blue-500 to-blue-600 border-r-4 border-t-4 border-blue-700 p-2.5 flex items-center justify-center shadow-inner">
                <div className="w-full h-full bg-white/95 rounded-2xl border-2 border-blue-300 shadow-lg flex flex-wrap items-center justify-around p-2 relative">
                  <span className="absolute top-1 text-[8px] font-black uppercase text-blue-600 tracking-widest">BLUE HOME</span>
                </div>
              </div>

              {/* Quadrant 4: AMBER GOLD (Bottom-Right) */}
              <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-gradient-to-br from-amber-400 to-yellow-500 border-l-4 border-t-4 border-amber-600 p-2.5 flex items-center justify-center shadow-inner">
                <div className="w-full h-full bg-white/95 rounded-2xl border-2 border-amber-300 shadow-lg flex flex-wrap items-center justify-around p-2 relative">
                  <span className="absolute top-1 text-[8px] font-black uppercase text-amber-700 tracking-widest">YELLOW HOME</span>
                </div>
              </div>

              {/* Center 3D Victory Castle */}
              <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-slate-950 border-2 border-amber-400 rounded-xl shadow-2xl flex flex-col items-center justify-center text-amber-300 z-10">
                <Crown className="w-6 h-6 animate-bounce text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <span className="text-[7.5px] font-black uppercase tracking-widest text-white mt-0.5">VICTORY</span>
              </div>

              {/* Home Path Colored Columns */}
              {HOME_PATHS.red.map(([r, c], i) => (
                <div 
                  key={`red-h-${i}`} 
                  className="absolute bg-red-500/80 border border-red-600/40"
                  style={{ left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`, width: `${CELL_PCT}%`, height: `${CELL_PCT}%` }}
                />
              ))}
              {HOME_PATHS.green.map(([r, c], i) => (
                <div 
                  key={`green-h-${i}`} 
                  className="absolute bg-emerald-500/80 border border-emerald-600/40"
                  style={{ left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`, width: `${CELL_PCT}%`, height: `${CELL_PCT}%` }}
                />
              ))}
              {HOME_PATHS.yellow.map(([r, c], i) => (
                <div 
                  key={`yellow-h-${i}`} 
                  className="absolute bg-amber-400/80 border border-amber-500/40"
                  style={{ left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`, width: `${CELL_PCT}%`, height: `${CELL_PCT}%` }}
                />
              ))}
              {HOME_PATHS.blue.map(([r, c], i) => (
                <div 
                  key={`blue-h-${i}`} 
                  className="absolute bg-blue-500/80 border border-blue-600/40"
                  style={{ left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`, width: `${CELL_PCT}%`, height: `${CELL_PCT}%` }}
                />
              ))}

              {/* STAR SAFE TILES */}
              {[
                { r: 6, c: 1 }, { r: 1, c: 8 }, { r: 8, c: 13 }, { r: 13, c: 6 },
                { r: 2, c: 6 }, { r: 8, c: 2 }, { r: 12, c: 8 }, { r: 6, c: 12 }
              ].map((star, idx) => (
                <div
                  key={`star-${idx}`}
                  className="absolute flex items-center justify-center z-5 pointer-events-none"
                  style={{
                    left: `${star.c * CELL_PCT}%`,
                    top: `${star.r * CELL_PCT}%`,
                    width: `${CELL_PCT}%`,
                    height: `${CELL_PCT}%`,
                  }}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-700 drop-shadow-xs" />
                </div>
              ))}

              {/* ═══ RENDER ALL 3D PAWN TOKENS ═══ */}
              {players.map(player => (
                player.tokens.map(token => {
                  const scr = getScreenPos(token.position, player.color);
                  const isMovable = isHumanTurn && validMoves.some(m => m.tokenId === token.id);
                  const matchingMove = validMoves.find(m => m.tokenId === token.id);

                  return (
                    <motion.div
                      key={`${player.color}-tok-${token.id}`}
                      animate={{ left: `${scr.x}%`, top: `${scr.y}%` }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      onClick={() => {
                        if (isMovable && matchingMove) {
                          executeMove(matchingMove);
                        }
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    >
                      <Pawn3D 
                        color={player.color} 
                        id={token.id} 
                        isMovable={isMovable} 
                      />
                    </motion.div>
                  );
                })
              ))}
            </div>

            {/* Bottom 3D Dice Rolling Dashboard */}
            <div className="w-full mt-4 p-3.5 bg-[#1F0E05] border border-amber-900/60 rounded-2xl flex items-center justify-between shadow-lg">
              
              {/* 3D Dice Display Box */}
              <div className="flex items-center gap-3.5">
                <div
                  onClick={() => {
                    if (isHumanTurn && phase === "playing") rollDice();
                  }}
                  className={cn(
                    "w-13 h-13 rounded-2xl bg-gradient-to-b from-white to-slate-100 border-2 border-slate-300 shadow-[0_8px_16px_rgba(0,0,0,0.35)] flex items-center justify-center transition-all select-none overflow-hidden",
                    isHumanTurn && phase === "playing" ? "cursor-pointer ring-4 ring-amber-400 hover:scale-105 active:scale-95 shadow-amber-400/30" : "cursor-not-allowed opacity-90",
                    isRolling && "animate-spin"
                  )}
                >
                  <DicePips value={diceValue} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">Dice Roll</span>
                  <span className="text-sm font-black font-mono text-white">
                    {diceValue === 6 ? "⚡ SIX! (Bonus Roll)" : `Rolled: ${diceValue}`}
                  </span>
                </div>
              </div>

              {/* Human Roll Action Button */}
              {isHumanTurn && phase === "playing" && (
                <button
                  type="button"
                  onClick={rollDice}
                  disabled={isRolling}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95 transition-all"
                >
                  ⚡ ROLL 3D DICE
                </button>
              )}

              {isHumanTurn && phase === "rolled" && validMoves.length > 0 && (
                <span className="text-xs font-black text-amber-950 bg-amber-300 px-3.5 py-2 rounded-xl border border-amber-400 shadow-md animate-pulse">
                  👉 Tap glowing 3D token to move!
                </span>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SCORECARD & MATCH CONTROLS */}
          <div className="lg:col-span-4 space-y-3">
            
            {/* Players Scorecard */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-md">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b pb-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Match Leaderboard
              </h4>

              <div className="space-y-2">
                {players.map((pl, idx) => (
                  <div
                    key={pl.color}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all",
                      turnIndex === idx ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-slate-50 text-slate-800 border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS[pl.color].primary }}
                      />
                      <span className="font-extrabold">{pl.name}</span>
                    </div>

                    <div className="text-right font-mono font-black">
                      {gameMode === "speed" ? `${pl.score} pts` : `${pl.tokensHome}/4 Home`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Pot & Stake */}
            <div className="bg-slate-950 text-white rounded-3xl p-4 border border-slate-800 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Prize Pot</span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                  {getMultiplierForMode(gameMode)}× Return
                </span>
              </div>
              <p className="text-2xl font-black font-mono text-emerald-400">
                ₹{(betAmount * getMultiplierForMode(gameMode)).toLocaleString()}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <span>Your Stake: <strong className="text-white font-mono">₹{betAmount.toLocaleString()}</strong></span>
                <span>House Fee: <strong className="text-emerald-400 font-mono">0%</strong></span>
              </div>
            </div>

            {/* Match Event Log */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Live Commentary</span>
              {gameLog.map((log, i) => (
                <p key={i} className="truncate">{log}</p>
              ))}
            </div>

            {/* Exit / Return to Lobby */}
            <button
              type="button"
              onClick={() => { setPhase("lobby"); setWinner(null); }}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Surrender / Return to Lobby
            </button>
          </div>
        </div>
      )}

      {/* ═══ VICTORY / DEFEAT MODAL ═══ */}
      <AnimatePresence>
        {phase === "finished" && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl border-2 border-slate-200 max-w-sm w-full p-6 text-center shadow-2xl overflow-hidden relative"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 mx-auto flex items-center justify-center text-amber-600 mb-3 shadow-md">
                <Crown className="w-8 h-8 animate-bounce" />
              </div>

              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {winner.isHuman ? "🎉 VICTORY! YOU WON!" : "DEFEAT! BOT WON!"}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                {winner.name} finished first in {gameMode.toUpperCase()} Arena.
              </p>

              <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-500 uppercase block">Total Payout</span>
                <span className="text-3xl font-black font-mono text-emerald-700 block mt-0.5">
                  ₹{winner.isHuman ? (betAmount * getMultiplierForMode(gameMode)).toLocaleString() : "0.00"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => { setPhase("lobby"); setWinner(null); }}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-md cursor-pointer active:scale-98 transition-all"
              >
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
