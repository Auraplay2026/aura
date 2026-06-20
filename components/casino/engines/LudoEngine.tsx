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

function getPathPositions(from: TokenPosition, to: TokenPosition, color: PlayerColor): TokenPosition[] {
  const seq: TokenPosition[] = [];
  const cfg = PLAYER_CONFIGS.find(c => c.color === color)!;
  const startPos = cfg.startPos;

  if (from.zone === "base") {
    seq.push({ zone: "path", index: startPos });
    return seq;
  }

  if (from.zone === "path") {
    const currentSteps = stepsFromStart(from.index, startPos);
    
    if (to.zone === "path") {
      const targetSteps = stepsFromStart(to.index, startPos);
      for (let s = currentSteps + 1; s <= targetSteps; s++) {
        seq.push({ zone: "path", index: (startPos + s) % 52 });
      }
    } else if (to.zone === "home") {
      const targetSteps = 51 + to.index;
      for (let s = currentSteps + 1; s <= targetSteps; s++) {
        if (s <= 50) {
          seq.push({ zone: "path", index: (startPos + s) % 52 });
        } else {
          seq.push({ zone: "home", index: s - 51 });
        }
      }
    } else if (to.zone === "finished") {
      const targetSteps = 57;
      for (let s = currentSteps + 1; s <= targetSteps; s++) {
        if (s <= 50) {
          seq.push({ zone: "path", index: (startPos + s) % 52 });
        } else if (s <= 56) {
          seq.push({ zone: "home", index: s - 51 });
        } else {
          seq.push({ zone: "finished", index: 0 });
        }
      }
    }
    return seq;
  }

  if (from.zone === "home") {
    if (to.zone === "home") {
      for (let i = from.index + 1; i <= to.index; i++) {
        seq.push({ zone: "home", index: i });
      }
    } else if (to.zone === "finished") {
      for (let i = from.index + 1; i <= 5; i++) {
        seq.push({ zone: "home", index: i });
      }
      seq.push({ zone: "finished", index: 0 });
    }
    return seq;
  }

  return seq;
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

function TokenPiece({ color, size = "medium", className }: { color: PlayerColor; size?: "small" | "medium" | "large"; className?: string }) {
  const s = className || (size === "small" ? "w-3 h-3 sm:w-4.5 sm:h-4.5" : "w-5 h-5 sm:w-6.5 sm:h-6.5");
  return (
    <div className={`${s} relative select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]`}>
      {/* 3D Base Disk */}
      <div 
        className="absolute inset-[10%] rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.4)] border border-white/20"
        style={{
          background: `linear-gradient(135deg, ${COLORS[color].dark} 0%, ${COLORS[color].token} 50%, ${COLORS[color].dark} 100%)`,
        }}
      />
      {/* 3D Inner Dome */}
      <div
        className="absolute inset-[20%] rounded-full flex items-center justify-center border border-white/30 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.4)]"
        style={{
          background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${COLORS[color].token} 55%, ${COLORS[color].dark} 100%)`,
        }}
      >
        {/* Shiny Highlight */}
        <div className="absolute top-[12%] left-[12%] w-[25%] h-[25%] bg-white/50 rounded-full blur-[0.3px]" />
      </div>
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
        } : value === 6 ? {
          scale: [1, 1.08, 1],
          y: [0, -4, 0],
          rotateZ: [0, 2, -2, 0],
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
        } : value === 6 ? {
          repeat: Infinity,
          duration: 1.4,
          ease: "easeInOut"
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
  const [selectedColor, setSelectedColor] = useState<PlayerColor>("red");
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
  const [movingToken, setMovingToken] = useState<{ color: PlayerColor; id: number } | null>(null);
  const [capturedToken, setCapturedToken] = useState<{ color: PlayerColor; id: number } | null>(null);

  const startedRef = useRef(false);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(gamePhase);
  phaseRef.current = gamePhase;

  const initGame = useCallback(() => {
    const ps: Player[] = PLAYER_CONFIGS.map((cfg, i) => ({
      color: cfg.color,
      name: gameMode === "friends" ? `Player ${i + 1}` : cfg.color === selectedColor ? "You" : cfg.name,
      tokens: [0, 1, 2, 3].map(id => ({ id, position: { zone: "base", index: id } })),
      isHuman: gameMode === "friends" ? true : cfg.color === selectedColor,
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
  }, [gameMode, selectedColor]);

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

    const activePlayer = players[currentIdx];
    if (!activePlayer) return;

    // Calculate step-by-step path sequence
    const pathSeq = getPathPositions(move.from, move.to, activePlayer.color);
    const tokenName = `piece #${move.tokenId + 1}`;
    setMoveLog(l => [`${activePlayer.name} moving ${tokenName}...`, ...l]);

    // Set moving token state for animations
    setMovingToken({ color: activePlayer.color, id: move.tokenId });

    let stepIdx = 0;

    const runStep = () => {
      if (stepIdx >= pathSeq.length) {
        // Reached destination!
        setMovingToken(null);

        if (move.captures) {
          // Play capture vibration/flash animation
          const { color, tokenId } = move.captures;
          setCapturedToken({ color, id: tokenId });
          
          try { playGameSound("lose"); } catch {}
          const capPlayer = PLAYER_CONFIGS.find(cfg => cfg.color === color)!;
          setMoveLog(l => [`💥 Captured ${capPlayer.emoji} ${color} piece!`, ...l]);

          // Delay to show capture animation before token teleports back to base
          setTimeout(() => {
            setPlayers(prev => {
              const updated = prev.map(p => {
                if (p.color !== color) return p;
                return {
                  ...p,
                  tokens: p.tokens.map(t => {
                    if (t.id !== tokenId) return t;
                    return { ...t, position: { zone: "base" as const, index: t.id } };
                  })
                };
              });

              // Finalize moving token's target position
              return updated.map(p => {
                if (p.color !== activePlayer.color) return p;
                return {
                  ...p,
                  tokens: p.tokens.map(t => {
                    if (t.id !== move.tokenId) return t;
                    return { ...t, position: move.to };
                  })
                };
              });
            });

            setCapturedToken(null);
            finalizeMove();
          }, 500); // 500ms capture animation duration
        } else {
          // No capture, update moving token to final position
          setPlayers(prev => {
            const updated = prev.map(p => {
              if (p.color !== activePlayer.color) return p;
              return {
                ...p,
                tokens: p.tokens.map(t => {
                  if (t.id !== move.tokenId) return t;
                  return { ...t, position: move.to };
                })
              };
            });

            if (move.to.zone === "finished") {
              try { playGameSound("win"); } catch {}
              const updatedSelf = updated[currentIdx];
              updatedSelf.tokensHome += 1;
              setMoveLog(l => [`🎉 Token finished home!`, ...l]);
            }
            return updated;
          });

          // Short delay for landing settle animation
          setTimeout(finalizeMove, 300);
        }
        return;
      }

      // Move to next step coordinate
      const nextPos = pathSeq[stepIdx];
      setPlayers(prev => {
        return prev.map(p => {
          if (p.color !== activePlayer.color) return p;
          return {
            ...p,
            tokens: p.tokens.map(t => {
              if (t.id !== move.tokenId) return t;
              return { ...t, position: nextPos };
            })
          };
        });
      });

      try { playGameSound("click"); } catch {}
      stepIdx++;
      setTimeout(runStep, 220); // 220ms per step hop
    };

    const finalizeMove = () => {
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
    };

    runStep();
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

  const currentPlayer = players[currentIdx];

  useEffect(() => {
    if (gamePhase === "idle" || showSetup) {
      window.dispatchEvent(new CustomEvent("ludo-state-change", { detail: null }));
      return;
    }
    const isHumanTurn = !!(currentPlayer?.isHuman && gamePhase === "playing" && !winner);
    window.dispatchEvent(new CustomEvent("ludo-state-change", {
      detail: {
        isHumanTurn,
        isRolling,
        dice,
        winner
      }
    }));
  }, [currentPlayer, gamePhase, winner, isRolling, dice, showSetup]);

  useEffect(() => {
    const handleTrigger = () => {
      const isHumanTurn = currentPlayer?.isHuman && gamePhase === "playing" && !winner;
      if (isHumanTurn && !isRolling) {
        rollDice();
      }
    };
    window.addEventListener("ludo-trigger-roll", handleTrigger);
    return () => window.removeEventListener("ludo-trigger-roll", handleTrigger);
  }, [currentPlayer, gamePhase, winner, isRolling, rollDice]);

  if (showSetup) {
    return (
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="bg-white/90 border border-amber-500/25 backdrop-blur-2xl p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            {/* Left Decorative Banner */}
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-4">
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
            <div className="flex-1 w-full max-w-md bg-white/90 border border-slate-200 p-4 sm:p-6 rounded-[2rem] flex flex-col gap-4 sm:gap-5 shadow-sm">
              {/* Mobile-Only Header */}
              <div className="block md:hidden text-center pb-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-0.5">Premium Board Game</span>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Ludo Royale</h3>
              </div>
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
                          : "border-slate-200 bg-white/40 hover:border-slate-300 text-slate-650 hover:text-slate-900"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${gameMode === mode.id ? "bg-amber-500 text-slate-950" : "bg-slate-100 text-slate-650"}`}>
                        {mode.icon}
                      </div>
                      <span className="font-black text-[10px] uppercase tracking-wider">{mode.title}</span>
                      <span className="text-[8px] text-slate-500 text-center font-medium mt-0.5 leading-tight">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {gameMode === "ai" && (
                <div>
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2.5">Choose Your Color Faction</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(["red", "green", "yellow", "blue"] as PlayerColor[]).map((color) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? `border-amber-500 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.2)] scale-[1.03]`
                              : "border-slate-200 bg-white/45 hover:border-slate-300 text-slate-600"
                          }`}
                        >
                          <div className="relative">
                            <TokenPiece color={color} size="small" />
                            {isSelected && (
                              <div className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-75" />
                            )}
                          </div>
                          <span className="font-black text-[8px] uppercase tracking-wider">{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="hidden sm:block bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Entry Fee Stake</span>
                  <span className="text-xs font-black font-mono text-slate-900">₹{betAmount.toLocaleString()}</span>
                </div>

                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all focus-within:border-amber-500/50">
                  <div className="flex items-center pl-3 pr-2 border-r border-slate-200 bg-slate-50/50 h-10">
                    <span className="text-slate-500 font-bold text-xs">₹</span>
                  </div>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => onBetAmountChange(Math.max(10, Number(e.target.value)))}
                    className="flex-1 bg-transparent border-none text-slate-900 font-black text-xs px-2 py-1.5 focus:outline-none focus:ring-0 font-mono"
                  />
                  <div className="flex items-center bg-white/40 border-l border-slate-200 h-10">
                    <button onClick={() => onBetAmountChange(Math.max(100, Math.floor(betAmount / 2)))} className="px-2 h-full text-[9px] font-black text-slate-650 hover:bg-slate-50 hover:text-slate-900 border-r border-slate-200 transition-colors">1/2</button>
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
                          isSelected ? "scale-110 ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-200 opacity-100 z-10" : "hover:scale-105 opacity-70 hover:opacity-100"
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

                <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-4 pt-3.5 border-t border-slate-200">
                  <span>RTP: 95.0%</span>
                  <span className="text-amber-600 font-extrabold flex items-center gap-1 text-right">
                    WIN POT: <span className="text-emerald-600">3.80x → ₹{(betAmount * 3.8).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={onStartGame}
                className="w-full py-3.5 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(245,158,11,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-400 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 cursor-pointer animate-pulse"
              >
                🎰 Enter Arena
              </button>

              <div className="text-center mt-1 text-[8px] text-slate-400 font-black uppercase tracking-widest block sm:hidden">
                RTP: 95.0% • Est. Win Pot: 3.80x
              </div>
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

  return (
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-2 sm:py-6 text-slate-900 overflow-visible">
      {/* Consolidated Premium Header Bar */}
      <div className="w-full h-12 flex items-center justify-between px-3 mb-3 bg-white/80 border border-slate-200 backdrop-blur-md rounded-2xl shadow-sm select-none">
        {/* Left: Turn / Action Indicator */}
        <div className="flex items-center gap-2 max-w-[45%] truncate">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentPlayer?.isHuman ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${currentPlayer?.isHuman ? "bg-emerald-500" : "bg-amber-500"}`} />
          </span>
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider truncate">
            {message}
          </span>
        </div>

        {/* Center: Live Player Mini Faction HUD */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full">
          {(["red", "green", "yellow", "blue"] as PlayerColor[]).map((color, idx) => {
            const p = players.find(x => x.color === color);
            const isCurrent = currentIdx === idx && !winner;
            const isWinner = winner === color;
            return (
              <div
                key={color}
                className={`relative w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  isCurrent 
                    ? "ring-2 ring-offset-1 scale-110" 
                    : "opacity-60"
                }`}
                style={{
                  backgroundColor: COLORS[color].token,
                  borderColor: isCurrent ? COLORS[color].token : "transparent",
                  boxShadow: isCurrent ? `0 0 8px ${COLORS[color].glow}` : "none",
                }}
              >
                {isWinner ? (
                  <span className="text-[7px] text-white">🏆</span>
                ) : p?.isHuman ? (
                  <span className="text-[6px] text-white font-extrabold uppercase">U</span>
                ) : (
                  <span className="text-[6px] text-white/80 uppercase font-bold">B</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Compact Stake & Dice Roll */}
        <div className="flex items-center gap-3">
          {/* Stake */}
          <div className="hidden xs:flex items-center gap-1 font-mono">
            <Coins className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-black text-slate-800">
              ₹{betAmount.toLocaleString()}
            </span>
          </div>

          {/* Dice Roll Display */}
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border font-black text-sm transition-all select-none ${
                currentPlayer?.isHuman && gamePhase === "playing" && !winner
                  ? "border-amber-500 bg-amber-500/5 text-amber-600 cursor-default"
                  : "border-slate-200 bg-slate-50/50 text-slate-400 opacity-60"
              }`}
            >
              {isRolling ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                  className="text-base"
                >
                  🎲
                </motion.span>
              ) : (
                <span className="font-mono text-xs">{dice || "🎲"}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full overflow-visible">
        {/* Left Column: Ludo Board */}
        <div className="w-auto shrink-0 flex flex-col items-center">
          <div className="relative aspect-square w-[calc(100dvh-340px)] h-[calc(100dvh-340px)] max-w-[90vw] max-h-[90vw] xs:max-w-[330px] xs:max-h-[330px] sm:max-w-[380px] sm:max-h-[380px] md:w-full md:h-full md:max-w-none md:max-h-none select-none overflow-hidden bg-white/90 border-4 border-slate-800/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_0_35px_rgba(0,0,0,0.7)]">
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
                    background: `linear-gradient(135deg, ${COLORS[color].light} 0%, rgba(255,255,255,0.95) 100%)`,
                    border: `2px solid ${isTurn ? COLORS[color].token : "rgba(226,232,240,0.8)"}`,
                    borderRadius: "1.5rem",
                    boxShadow: isTurn ? `0 0 20px ${COLORS[color].glow}` : "none",
                  }}
                >
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1 max-w-[90%] truncate z-10 shadow-sm">
                    <span className="text-[8px] sm:text-[9px] font-black text-slate-800 uppercase tracking-wide truncate">
                      {p ? `${p.name} (${p.tokensHome}/4)` : ""}
                    </span>
                    {p && p.tokensHome > 0 && (
                      <span className="text-[8px] text-amber-500 font-extrabold flex items-center shrink-0">
                        🏆
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-[20%] bg-white rounded-2xl border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]" />
                </motion.div>
              );
            })}

            <div className="absolute" style={{
              left: "40%", top: "40%", width: "20%", height: "20%",
              background: "#ffffff",
              border: "2px solid rgba(226,232,240,0.8)",
            }}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="0,0 50,50 100,0" fill={COLORS.green.token} opacity="0.2" />
                <polygon points="100,0 50,50 100,100" fill={COLORS.yellow.token} opacity="0.2" />
                <polygon points="100,100 50,50 0,100" fill={COLORS.blue.token} opacity="0.2" />
                <polygon points="0,100 50,50 0,0" fill={COLORS.red.token} opacity="0.2" />
                
                <polygon points="0,0 50,50 100,0" fill="none" stroke="rgba(226,232,240,0.8)" strokeWidth="1" />
                <polygon points="100,0 50,50 100,100" fill="none" stroke="rgba(226,232,240,0.8)" strokeWidth="1" />
                <polygon points="100,100 50,50 0,100" fill="none" stroke="rgba(226,232,240,0.8)" strokeWidth="1" />
                <polygon points="0,100 50,50 0,0" fill="none" stroke="rgba(226,232,240,0.8)" strokeWidth="1" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ scale: [0.95, 1.15, 0.95] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Crown className="w-5 h-5 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
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
                  className="absolute flex items-center justify-center rounded-sm transition-all duration-300"
                  style={{
                    left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`,
                    width: `${CELL_PCT}%`, height: `${CELL_PCT}%`,
                    backgroundColor: startColor 
                      ? `${COLORS[startColor].token}18` 
                      : isValidTarget 
                        ? "rgba(245,158,11,0.18)" 
                        : "#ffffff",
                    border: "1px solid rgba(226,232,240,0.8)",
                    boxShadow: isValidTarget 
                      ? "inset 0 0 8px rgba(245,158,11,0.3)" 
                      : "inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.02)",
                  }}
                >
                  {isSafe && <Star className="w-[45%] h-[45%] text-amber-500 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)] opacity-90" />}
                  {isStart && startColor && (
                    <div className="w-[35%] h-[35%] rounded-full animate-pulse" style={{ backgroundColor: `${COLORS[startColor].token}70` }} />
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

            {/* Real Grid-Aligned Base Spot Circles */}
            {(["red", "green", "yellow", "blue"] as PlayerColor[]).map(color =>
              [0, 1, 2, 3].map(i => {
                const pos = getScreenPos({ zone: "base", index: i }, color);
                return (
                  <div
                    key={`base-spot-${color}-${i}`}
                    className="absolute rounded-full flex items-center justify-center pointer-events-none"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: `${CELL_PCT * 0.9}%`,
                      height: `${CELL_PCT * 0.9}%`,
                      transform: "translate(-50%, -50%)",
                      border: `1.5px solid ${COLORS[color].token}25`,
                      backgroundColor: `rgba(0,0,0,0.25)`,
                    }}
                  />
                );
              })
            )}

            {players.flatMap(player =>
              player.tokens
                .filter(t => t.position.zone !== "finished")
                .map(token => {
                  const pos = getScreenPos(token.position, player.color);
                  const key = `${pos.x.toFixed(1)}-${pos.y.toFixed(1)}`;
                  const cellTokens = allTokensByCell[key] || [];
                  const tokenIdx = cellTokens.findIndex(x => x.tokenId === token.id);

                  const isMovable = validMoves.some(m => m.tokenId === token.id) && currentPlayer?.isHuman;
                  
                  const isMoving = movingToken?.color === player.color && movingToken?.id === token.id;
                  const isCaptured = capturedToken?.color === player.color && capturedToken?.id === token.id;
                  const isCurrentTurn = player.color === currentPlayer?.color && !winner;

                  // Spacing offsets for 2x2 micro-grid
                  const isMulti = cellTokens.length > 1;
                  const sizePct = isMulti ? CELL_PCT * 0.38 : CELL_PCT * 0.7;

                  let dxPct = 0;
                  let dyPct = 0;
                  if (isMulti) {
                    const col = tokenIdx % 2;
                    const row = Math.floor(tokenIdx / 2);
                    dxPct = (col === 0 ? -1 : 1) * CELL_PCT * 0.19;
                    dyPct = (row === 0 ? -1 : 1) * CELL_PCT * 0.19;
                  }

                  return (
                    <motion.div
                      key={`token-${player.color}-${token.id}`}
                      className="absolute cursor-pointer animate-none"
                      style={{
                        width: `${sizePct}%`,
                        height: `${sizePct}%`,
                        transform: "translate(-50%, -50%)",
                        zIndex: isMoving || isCaptured ? 50 : 20 + tokenIdx,
                      }}
                      animate={{
                        left: `${pos.x + dxPct}%`,
                        top: `${pos.y + dyPct}%`,
                      }}
                      transition={{
                        duration: isMoving ? 0.22 : 0,
                        ease: "easeOut"
                      }}
                      onClick={() => handleTokenClick(player.color, token.id)}
                    >
                      <motion.div
                        key={isMoving ? `hop-${token.position.zone}-${token.position.index}` : `idle`}
                        initial={isMoving ? { y: 0, scaleY: 1, scaleX: 1 } : false}
                        animate={
                          isCaptured
                            ? {
                                scale: [1, 1.4, 0],
                                rotate: [0, 360, 720],
                                filter: ["brightness(1)", "brightness(2)", "brightness(2)"],
                              }
                            : isMoving
                            ? {
                                y: [0, -12, 0],
                                scaleY: [1, 0.8, 1.18, 0.82, 1],
                                scaleX: [1, 1.18, 0.82, 1.05, 1],
                              }
                            : isMovable
                            ? {
                                scale: [1, 1.12, 1],
                                filter: ["brightness(1)", "brightness(1.15)", "brightness(1)"],
                              }
                            : isCurrentTurn
                            ? {
                                scale: 1,
                                filter: "brightness(1)",
                              }
                            : {
                                scale: 0.9,
                                filter: "brightness(0.75) saturate(0.7)",
                              }
                        }
                        transition={
                          isCaptured
                            ? { duration: 0.45, ease: "easeInOut" }
                            : isMoving
                            ? { duration: 0.22, ease: "easeOut" }
                            : isMovable
                            ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                            : { duration: 0.2 }
                        }
                        className="w-full h-full flex items-center justify-center relative origin-bottom"
                      >
                        <TokenPiece color={player.color} className="w-full h-full" />
                        {isMovable && (
                          <div className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-55 pointer-events-none" />
                        )}
                      </motion.div>
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
                <motion.div
                  key={`fin-${p.color}-${i}`}
                  initial={{ scale: 0, rotate: -180, filter: "brightness(2)" }}
                  animate={{ scale: 1, rotate: 0, filter: "brightness(1)" }}
                  transition={{ type: "spring", stiffness: 180, damping: 14 }}
                  className="absolute flex items-center justify-center overflow-visible"
                  style={{
                    left: `${(cy + ox + i * 0.12) * CELL_PCT + CELL_PCT / 2}%`,
                    top: `${(cx + oy + i * 0.12) * CELL_PCT + CELL_PCT / 2}%`,
                    width: `${CELL_PCT * 0.4}%`,
                    height: `${CELL_PCT * 0.4}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 15,
                  }}
                >
                  {/* Concentric gold celebration ripple */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 rounded-full border border-amber-400 pointer-events-none"
                  />
                  <TokenPiece color={p.color} className="w-full h-full" />
                </motion.div>
              ));
            })}
          </div>

          {/* Mobile Dice Action Bar Removed - Dice integrated in header */}
        </div>

        {/* Right Column: Desktop Command Center (Hidden on mobile) */}
        <div className="hidden md:flex flex-col flex-1 w-full gap-4">
          <div className="bg-white/90 border border-slate-200 backdrop-blur-md rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                  {currentPlayer?.isHuman ? "Your Turn" : `${currentPlayer?.name}'s Turn`}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                TURN #{moveLog.length + 1}
              </span>
            </div>

            {/* Dice Control Box */}
            <div className="flex items-center justify-between bg-slate-50/50 border border-slate-200 p-4 rounded-2xl gap-4">
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
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                    {message}
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
