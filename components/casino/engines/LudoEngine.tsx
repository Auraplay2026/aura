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
  score: number; // For Speed/Points mode
  movesLeft: number; // For Speed mode (starts at 24)
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
  red:    [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
  green:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  yellow: [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
  blue:   [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]],
};

const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const START_CELLS = new Set([0, 13, 26, 39]);

const COLORS: Record<PlayerColor, { primary: string; dark: string; light: string; border: string; glow: string; text: string }> = {
  red:    { primary: "#EF4444", dark: "#991B1B", light: "#FEE2E2", border: "#F87171", glow: "rgba(239,68,68,0.4)", text: "#B91C1C" },
  green:  { primary: "#10B981", dark: "#065F46", light: "#D1FAE5", border: "#34D399", glow: "rgba(16,185,129,0.4)", text: "#047857" },
  yellow: { primary: "#F59E0B", dark: "#78350F", light: "#FEF3C7", border: "#FBBF24", glow: "rgba(245,158,11,0.4)", text: "#B45309" },
  blue:   { primary: "#3B82F6", dark: "#1E3A8A", light: "#DBEAFE", border: "#60A5FA", glow: "rgba(59,130,246,0.4)", text: "#1D4ED8" },
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
// COMPONENT
// ═══════════════════════════════════════════════

export function LudoEngine({
  betAmount,
  onBetAmountChange,
  onStartGame,
  isPlaying,
  onComplete,
  onLiveTick
}: LudoEngineProps) {
  // Game Setup & Mode
  const [gameMode, setGameMode] = useState<LudoGameMode>("1v1");
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [animatingToken, setAnimatingToken] = useState<{ color: PlayerColor; tokenId: number; steps: TokenPosition[] } | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(10);
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

  // Mode configurations
  const getMultiplierForMode = (mode: LudoGameMode): number => {
    switch (mode) {
      case "1v1": return 1.95;
      case "speed": return 1.95;
      case "4player": return 3.80;
    }
  };

  // Initialize Players based on selected mode
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
      // In Speed Rush Ludo, 2 tokens start already on the path for fast action!
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

    // 4 Player Royale
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

  // Compute legal moves for current player and rolled dice
  const calculateValidMoves = useCallback((player: Player, roll: number): Move[] => {
    const moves: Move[] = [];
    const cfg = ALL_CONFIGS.find(c => c.color === player.color)!;
    const startPos = cfg.startPos;

    for (const token of player.tokens) {
      // 1. Base tokens can only exit on roll = 6 (or in speed mode on roll > 0)
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

      // 2. Path tokens
      if (token.position.zone === "path") {
        const stepsDone = stepsFromStart(token.position.index, startPos);
        const targetSteps = stepsDone + roll;

        if (targetSteps < 51) {
          const nextIndex = (token.position.index + roll) % 52;
          let captures: { color: PlayerColor; tokenId: number } | undefined;
          if (!SAFE_CELLS.has(nextIndex)) {
            for (const opp of players) {
              if (opp.color === player.color) continue;
              for (const oppTok of opp.tokens) {
                if (oppTok.position.zone === "path" && oppTok.position.index === nextIndex) {
                  captures = { color: opp.color, tokenId: oppTok.id };
                }
              }
            }
          }
          moves.push({
            tokenId: token.id,
            from: token.position,
            to: { zone: "path", index: nextIndex },
            captures
          });
        } else if (targetSteps <= 56) {
          const homeIndex = targetSteps - 51;
          if (homeIndex <= 5) {
            moves.push({
              tokenId: token.id,
              from: token.position,
              to: { zone: "home", index: homeIndex },
              entersHome: true
            });
          }
        } else if (targetSteps === 57) {
          moves.push({
            tokenId: token.id,
            from: token.position,
            to: { zone: "finished", index: 0 },
            entersHome: true
          });
        }
        continue;
      }

      // 3. Home path tokens
      if (token.position.zone === "home") {
        const nextHomeIndex = token.position.index + roll;
        if (nextHomeIndex < 5) {
          moves.push({
            tokenId: token.id,
            from: token.position,
            to: { zone: "home", index: nextHomeIndex }
          });
        } else if (nextHomeIndex === 5) {
          moves.push({
            tokenId: token.id,
            from: token.position,
            to: { zone: "finished", index: 0 },
            entersHome: true
          });
        }
      }
    }

    return moves;
  }, [players, gameMode]);

  // Turn Switcher
  const advanceTurn = useCallback((hadExtraTurn: boolean = false) => {
    if (hadExtraTurn && consecutiveSixes < 3) {
      setPhase("playing");
      setTurnTimeRemaining(10);
      return;
    }

    setConsecutiveSixes(0);
    setTurnIndex(prev => (prev + 1) % players.length);
    setPhase("playing");
    setTurnTimeRemaining(10);
    setValidMoves([]);
  }, [consecutiveSixes, players.length]);

  // Execute Move Animation & Logic
  const executeMove = useCallback((move: Move) => {
    if (phase === "moving") return;
    setPhase("moving");
    setValidMoves([]);

    const p = players[turnIndex];
    playSfx("click");

    // Sequence of tile positions for animation
    const steps: TokenPosition[] = [move.to];
    setAnimatingToken({ color: p.color, tokenId: move.tokenId, steps });

    setTimeout(() => {
      setPlayers(prevPlayers => {
        return prevPlayers.map((player, pIdx) => {
          if (pIdx === turnIndex) {
            let addScore = move.to.zone === "finished" ? 56 : (move.captures ? 56 : diceValue);
            const nextMovesLeft = Math.max(0, player.movesLeft - 1);
            const updatedTokens = player.tokens.map(tok => {
              if (tok.id === move.tokenId) {
                return {
                  ...tok,
                  position: move.to,
                  stepsMoved: tok.stepsMoved + diceValue
                };
              }
              return tok;
            });
            const newHomeCount = updatedTokens.filter(t => t.position.zone === "finished").length;

            return {
              ...player,
              tokens: updatedTokens,
              score: player.score + addScore,
              movesLeft: nextMovesLeft,
              tokensHome: newHomeCount
            };
          }

          // If opponent token was captured, return it to base!
          if (move.captures && player.color === move.captures.color) {
            playSfx("cashout");
            return {
              ...player,
              tokens: player.tokens.map(tok => {
                if (tok.id === move.captures!.tokenId) {
                  return {
                    ...tok,
                    position: { zone: "base", index: tok.id },
                    stepsMoved: 0
                  };
                }
                return tok;
              }),
              score: Math.max(0, player.score - 20)
            };
          }

          return player;
        });
      });

      setAnimatingToken(null);

      // Check Victory Conditions
      const updatedPlayer = players[turnIndex];
      const hasFinishedAll = updatedPlayer.tokensHome + (move.to.zone === "finished" ? 1 : 0) >= (gameMode === "1v1" ? 4 : 2);
      const isSpeedFinished = gameMode === "speed" && updatedPlayer.movesLeft <= 1;

      if (hasFinishedAll || isSpeedFinished) {
        // Evaluate winner
        const winningPlayer = isSpeedFinished 
          ? (players[0].score >= players[1].score ? players[0] : players[1])
          : updatedPlayer;

        setWinner(winningPlayer);
        setPhase("finished");
        playSfx("win");

        const mult = getMultiplierForMode(gameMode);
        const payout = winningPlayer.isHuman ? betAmount * mult : 0;
        onComplete(winningPlayer.isHuman ? mult : 0, payout);
      } else {
        const extraTurn = diceValue === 6 || move.captures !== undefined || move.to.zone === "finished";
        advanceTurn(extraTurn);
      }
    }, 450);
  }, [phase, players, turnIndex, playSfx, diceValue, gameMode, advanceTurn, onComplete, betAmount]);

  // Handle Dice Roll
  const rollDice = useCallback(() => {
    if (phase !== "playing" || isRolling) return;
    setIsRolling(true);
    setPhase("rolling");
    playSfx("dice");

    // Dynamic roll calculation
    let rollCounter = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCounter++;
      if (rollCounter > 8) {
        clearInterval(rollInterval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);

        const currentP = players[turnIndex];
        const nextSixCount = finalRoll === 6 ? consecutiveSixes + 1 : 0;
        setConsecutiveSixes(nextSixCount);

        if (nextSixCount === 3) {
          // Penalty for 3 consecutive sixes
          setGameLog(l => [`⚠️ ${currentP.name} rolled 3 sixes! Turn passed.`, ...l.slice(0, 4)]);
          advanceTurn(false);
          return;
        }

        const legal = calculateValidMoves(currentP, finalRoll);
        setValidMoves(legal);

        if (legal.length === 0) {
          setPhase("rolled");
          setTimeout(() => advanceTurn(false), 900);
        } else if (legal.length === 1 && !currentP.isHuman) {
          // Auto move single option for AI
          setPhase("rolled");
          setTimeout(() => executeMove(legal[0]), 600);
        } else if (legal.length === 1 && currentP.isHuman) {
          // Auto move for human if only 1 legal move to speed up gameplay!
          setPhase("rolled");
          setTimeout(() => executeMove(legal[0]), 400);
        } else {
          setPhase("rolled");
        }
      }
    }, 70);
  }, [phase, isRolling, playSfx, players, turnIndex, consecutiveSixes, calculateValidMoves, advanceTurn, executeMove]);

  // AI Turn Autoplay
  useEffect(() => {
    if (phase === "playing" && activePlayer && !activePlayer.isHuman) {
      aiTurnTimeoutRef.current = setTimeout(() => {
        rollDice();
      }, 750);
    }
    return () => {
      if (aiTurnTimeoutRef.current) clearTimeout(aiTurnTimeoutRef.current);
    };
  }, [phase, activePlayer, rollDice]);

  // AI Move Selection
  useEffect(() => {
    if (phase === "rolled" && activePlayer && !activePlayer.isHuman && validMoves.length > 1) {
      aiTurnTimeoutRef.current = setTimeout(() => {
        // Smart AI priority: 1. Capture > 2. Enter Home > 3. Safe Zone > 4. Max Steps
        const captureMove = validMoves.find(m => m.captures);
        const homeMove = validMoves.find(m => m.to.zone === "finished" || m.to.zone === "home");
        const safeMove = validMoves.find(m => m.to.zone === "path" && SAFE_CELLS.has(m.to.index));
        const chosen = captureMove || homeMove || safeMove || validMoves[0];
        executeMove(chosen);
      }, 700);
    }
  }, [phase, activePlayer, validMoves, executeMove]);

  // Turn Countdown Timer (10s ring)
  useEffect(() => {
    if (phase !== "playing" && phase !== "rolled") return;

    timerRef.current = setInterval(() => {
      setTurnTimeRemaining(prev => {
        if (prev <= 1) {
          // Turn timeout: auto-advance
          if (validMoves.length > 0) {
            executeMove(validMoves[0]);
          } else {
            advanceTurn(false);
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, validMoves, executeMove, advanceTurn]);

  // Handle Match Start
  const handleStartGame = async () => {
    if (onStartGame) {
      const res = await onStartGame(betAmount);
      if (res === false) return;
    }

    const initial = initPlayers(gameMode);
    setPlayers(initial);
    setTurnIndex(0);
    setWinner(null);
    setPhase("playing");
    setTurnTimeRemaining(10);
    setConsecutiveSixes(0);
    setGameLog([`🚀 Match Started! Mode: ${gameMode.toUpperCase()} | Entry: ₹${betAmount.toLocaleString()}`]);
    playSfx("click");
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      
      {/* ═══ LOBBY & MODE SELECTION ═══ */}
      {phase === "lobby" && (
        <div className="w-full max-w-xl bg-white border-2 border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xl text-center">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  Pro Ludo Arena
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Real-Money Wagering • 1v1, Speed Rush & 4-Player
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title={soundMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-slate-800" />}
            </button>
          </div>

          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              {
                id: "1v1" as LudoGameMode,
                title: "1v1 Classic Duel",
                desc: "Fast 2-Player Match (Red vs Yellow)",
                mult: "1.95× Payout",
                badge: "⚡ Instant",
                color: "border-sky-300 bg-sky-50/50 hover:bg-sky-50 text-sky-950",
              },
              {
                id: "speed" as LudoGameMode,
                title: "Speed Rush (Points)",
                desc: "Zupee Style • 24 Moves • Highest Score Wins",
                mult: "1.95× Payout",
                badge: "🔥 Most Popular",
                color: "border-amber-400 bg-amber-50/60 hover:bg-amber-50 text-amber-950 ring-2 ring-amber-300",
              },
              {
                id: "4player" as LudoGameMode,
                title: "4-Player Royale",
                desc: "4 Contenders • Winner takes mega pot",
                mult: "3.80× Payout",
                badge: "🏆 Mega Pot",
                color: "border-purple-300 bg-purple-50/50 hover:bg-purple-50 text-purple-950",
              }
            ].map(m => (
              <div
                key={m.id}
                onClick={() => { setGameMode(m.id); playSfx("click"); }}
                className={cn(
                  "p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all active:scale-95 relative flex flex-col justify-between",
                  gameMode === m.id ? m.color + " shadow-md" : "border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700"
                )}
              >
                <div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 inline-block mb-1.5 shadow-2xs">
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
            <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              <span>Wager Stake</span>
              <span>Potential Return: <strong className="text-emerald-700 font-mono text-sm">₹{(betAmount * getMultiplierForMode(gameMode)).toLocaleString()}</strong></span>
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
            <span>PLAY {gameMode.toUpperCase()} • ₹{betAmount.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* ═══ LIVE IN-GAME ARENA ═══ */}
      {phase !== "lobby" && (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* LEFT: 15x15 LUDO BOARD */}
          <div className="lg:col-span-8 bg-white border-2 border-slate-200/90 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col items-center">
            
            {/* Top Match HUD: Active Player Banner + Timer Ring */}
            <div className="w-full flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 px-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                  style={{ backgroundColor: COLORS[activePlayer?.color || "red"].primary }}
                >
                  {activePlayer?.avatar || "👑"}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    {activePlayer?.name}'s Turn
                    {isHumanTurn && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-300">
                        YOU
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {gameMode === "speed" ? `Moves Left: ${activePlayer?.movesLeft} • Score: ${activePlayer?.score} pts` : `Mode: ${gameMode.toUpperCase()}`}
                  </p>
                </div>
              </div>

              {/* Turn Countdown Ring */}
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex items-center justify-center font-mono font-black text-xs text-slate-800 bg-slate-100 rounded-full border border-slate-200 shadow-2xs">
                  {turnTimeRemaining}
                </div>
              </div>
            </div>

            {/* ═══ 15x15 LUDO GRID SVG/CSS BOARD ═══ */}
            <div className="relative w-full aspect-square max-w-[460px] bg-[#F8FAFC] border-2 border-slate-300 rounded-2xl overflow-hidden shadow-inner">
              
              {/* Quadrant 1: RED (Top-Left 6x6) */}
              <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-red-50 border-r-2 border-b-2 border-red-300 p-2 flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-2xl border-2 border-red-200 shadow-inner flex flex-wrap items-center justify-around p-2">
                  <div className="w-full text-center text-[10px] font-black uppercase text-red-600 tracking-wider">
                    RED HOME
                  </div>
                </div>
              </div>

              {/* Quadrant 2: GREEN (Top-Right 6x6) */}
              <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-emerald-50 border-l-2 border-b-2 border-emerald-300 p-2 flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-2xl border-2 border-emerald-200 shadow-inner flex flex-wrap items-center justify-around p-2">
                  <div className="w-full text-center text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                    GREEN HOME
                  </div>
                </div>
              </div>

              {/* Quadrant 3: BLUE (Bottom-Left 6x6) */}
              <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-50 border-r-2 border-t-2 border-blue-300 p-2 flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-2xl border-2 border-blue-200 shadow-inner flex flex-wrap items-center justify-around p-2">
                  <div className="w-full text-center text-[10px] font-black uppercase text-blue-600 tracking-wider">
                    BLUE HOME
                  </div>
                </div>
              </div>

              {/* Quadrant 4: YELLOW (Bottom-Right 6x6) */}
              <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-amber-50 border-l-2 border-t-2 border-amber-300 p-2 flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-2xl border-2 border-amber-200 shadow-inner flex flex-wrap items-center justify-around p-2">
                  <div className="w-full text-center text-[10px] font-black uppercase text-amber-600 tracking-wider">
                    YELLOW HOME
                  </div>
                </div>
              </div>

              {/* Center Victory Triangle (3x3 Center) */}
              <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-slate-900 border-2 border-amber-400 rounded-xl shadow-lg flex flex-col items-center justify-center text-amber-300 z-10">
                <Crown className="w-6 h-6 animate-bounce text-amber-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white mt-0.5">VICTORY</span>
              </div>

              {/* SAFE STARS TILES (Render golden shields on safe cells) */}
              {[
                { r: 6, c: 1, color: "red" },
                { r: 1, c: 8, color: "green" },
                { r: 8, c: 13, color: "yellow" },
                { r: 13, c: 6, color: "blue" },
                { r: 2, c: 6, color: "neutral" },
                { r: 8, c: 2, color: "neutral" },
                { r: 12, c: 8, color: "neutral" },
                { r: 6, c: 12, color: "neutral" },
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
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
                </div>
              ))}

              {/* ═══ RENDER ALL PLAYER TOKENS ═══ */}
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
                      className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-white font-black text-[10px] shadow-md z-20 transition-transform",
                        isMovable ? "cursor-pointer ring-4 ring-yellow-400 animate-bounce scale-110" : "cursor-default"
                      )}
                      style={{
                        backgroundColor: COLORS[player.color].primary,
                        borderColor: COLORS[player.color].border,
                        boxShadow: `0 4px 8px ${COLORS[player.color].glow}`
                      }}
                    >
                      <span>{token.id + 1}</span>
                    </motion.div>
                  );
                })
              ))}
            </div>

            {/* Bottom Dice Rolling HUD */}
            <div className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              {/* 3D Dice Display */}
              <div className="flex items-center gap-3">
                <div
                  onClick={() => {
                    if (isHumanTurn && phase === "playing") rollDice();
                  }}
                  className={cn(
                    "w-12 h-12 rounded-2xl bg-white border-2 border-slate-300 shadow-md flex items-center justify-center font-mono font-black text-2xl text-slate-900 transition-all select-none",
                    isHumanTurn && phase === "playing" ? "cursor-pointer ring-4 ring-amber-400 hover:scale-105 active:scale-95" : "cursor-not-allowed opacity-90",
                    isRolling && "animate-spin"
                  )}
                >
                  {diceValue}
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Last Roll</span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {diceValue === 6 ? "⚡ SIX! (Bonus Turn)" : `Rolled: ${diceValue}`}
                  </span>
                </div>
              </div>

              {/* Human Action Roll Button */}
              {isHumanTurn && phase === "playing" && (
                <button
                  type="button"
                  onClick={rollDice}
                  disabled={isRolling}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  ⚡ ROLL DICE
                </button>
              )}

              {isHumanTurn && phase === "rolled" && validMoves.length > 0 && (
                <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 animate-pulse">
                  👉 Tap glowing token to move!
                </span>
              )}
            </div>
          </div>

          {/* RIGHT: SCOREBOARD & LIVE MATCH CONTROL */}
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Prize Pot</span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                  {getMultiplierForMode(gameMode)}× Return
                </span>
              </div>
              <p className="text-2xl font-black font-mono text-emerald-400">
                ₹{(betAmount * getMultiplierForMode(gameMode)).toLocaleString()}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <span>Your Stake: <strong className="text-white font-mono">₹{betAmount.toLocaleString()}</strong></span>
                <span>Commission: <strong className="text-emerald-400 font-mono">0%</strong></span>
              </div>
            </div>

            {/* Match Event Log */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Live Commentary</span>
              {gameLog.map((log, i) => (
                <p key={i} className="truncate">{log}</p>
              ))}
            </div>

            {/* Exit to Lobby */}
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
          <>
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
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
