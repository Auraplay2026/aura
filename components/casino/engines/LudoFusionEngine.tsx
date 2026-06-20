"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, RotateCcw, Bot, User, Swords, Home, Sparkles, 
  Crown, Plus, Minus, Shield, HelpCircle, Coins, Zap, 
  Activity, Wifi, Clock, Award
} from "lucide-react";
import { playGameSound } from "@/lib/audio";

// ═══════════════════════════════════════════════
// TYPES & FACTIONS
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

const FACTIONS: Record<PlayerColor, {
  name: string;
  slogan: string;
  badge: string;
  emoji: string;
  glow: string;
  token: string;
  dark: string;
  glowBorder: string;
  avatar: string;
}> = {
  red: {
    name: "VIPER SYNDICATE",
    slogan: "Strike fast, strike deep.",
    badge: "NINJA",
    emoji: "🐍",
    glow: "rgba(244,63,94,0.6)",
    token: "#F43F5E",
    dark: "#881337",
    glowBorder: "#FEF08A",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150&auto=format&fit=crop"
  },
  green: {
    name: "NEXUS CYBER",
    slogan: "Code the future, hack the board.",
    badge: "HACKER",
    emoji: "🌐",
    glow: "rgba(16,185,129,0.6)",
    token: "#10B981",
    dark: "#064E3B",
    glowBorder: "#34D399",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop"
  },
  yellow: {
    name: "SOLARIS EMPIRE",
    slogan: "Burn bright, conquer all.",
    badge: "EMPEROR",
    emoji: "☀️",
    glow: "rgba(245,158,11,0.6)",
    token: "#F59E0B",
    dark: "#78350F",
    glowBorder: "#FDE047",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&auto=format&fit=crop"
  },
  blue: {
    name: "AEGIS SENTINEL",
    slogan: "Unbreakable defenses, absolute control.",
    badge: "SENTINEL",
    emoji: "🛡️",
    glow: "rgba(59,130,246,0.6)",
    token: "#3B82F6",
    dark: "#1E3A8A",
    glowBorder: "#60A5FA",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=150&auto=format&fit=crop"
  }
};

// ═══════════════════════════════════════════════
// BOARD CONSTANTS & GRID UTILS
// ═══════════════════════════════════════════════

const CELL_PCT = 100 / 15;

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

const PLAYER_CONFIGS = [
  { color: "red" as PlayerColor, name: "You", startPos: 0, emoji: "🔴" },
  { color: "green" as PlayerColor, name: "Bot Alpha", startPos: 13, emoji: "🟢" },
  { color: "yellow" as PlayerColor, name: "Bot Sigma", startPos: 26, emoji: "🟡" },
  { color: "blue" as PlayerColor, name: "Bot Omega", startPos: 39, emoji: "🔵" },
];

function gridToPos(row: number, col: number) {
  return { x: col * CELL_PCT + CELL_PCT / 2, y: row * CELL_PCT + CELL_PCT / 2 };
}

function getScreenPos(pos: TokenPosition, color: PlayerColor): { x: number; y: number } {
  if (pos.zone === "base") return gridToPos(BASE_SPOTS[color][pos.index][0], BASE_SPOTS[color][pos.index][1]);
  if (pos.zone === "path") return gridToPos(MAIN_PATH[pos.index][0], MAIN_PATH[pos.index][1]);
  if (pos.zone === "home") return gridToPos(HOME_PATHS[color][pos.index][0], HOME_PATHS[color][pos.index][1]);
  return gridToPos(7, 7); // finished -> center
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

// 1. Hero Token Component
interface HeroTokenProps {
  color: PlayerColor;
  size?: "small" | "medium";
  isActive?: boolean;
  className?: string;
}

function HeroToken({ color, size = "medium", isActive = false, className }: HeroTokenProps) {
  const f = FACTIONS[color];
  const scaleClass = className || (size === "small" ? "w-4 h-4 sm:w-5 sm:h-5" : "w-6 h-6 sm:w-8 sm:h-8");
  
  return (
    <div className="relative flex items-center justify-center select-none overflow-visible">
      {/* Halo Active pulse */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.2 }}
            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.2, 0.6, 0.2] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-[-6px] rounded-full blur-[3px] pointer-events-none"
            style={{ border: `1.5px solid ${f.token}` }}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={isActive ? {
          y: [0, -5, 0],
          boxShadow: `0 8px 20px ${f.glow}, inset 0 -1.5px 3px rgba(0,0,0,0.6)`
        } : { y: 0 }}
        transition={isActive ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" } : { duration: 0.2 }}
        className={`${scaleClass} rounded-full relative flex items-center justify-center border transition-all duration-200`}
        style={{
          background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${f.token} 45%, ${f.dark} 100%)`,
          borderColor: "rgba(255,255,255,0.45)",
          transform: "translateZ(8px)",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Specular Highlight */}
        <div className="absolute top-[8%] left-[8%] w-[35%] h-[35%] bg-white/40 rounded-full blur-[0.3px] pointer-events-none" />
        
        {/* Micro Faction Emblem SVG */}
        <span className="text-[8px] sm:text-[10px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] filter font-black select-none pointer-events-none">
          {f.emoji}
        </span>
      </motion.div>
    </div>
  );
}

// 2. CSS 3D Dice Component
interface ThreeDDiceProps {
  value: number;
  isRolling: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

const DICE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 180, y: 0 }
};

function ThreeDDice({ value, isRolling, isActive = false, onClick }: ThreeDDiceProps) {
  const rotation = DICE_ROTATIONS[value] || { x: 0, y: 0 };
  
  return (
    <div 
      onClick={isActive && !isRolling ? onClick : undefined}
      className={`w-16 h-16 relative flex items-center justify-center select-none overflow-visible perspective-[500px] ${
        isActive && !isRolling ? "cursor-pointer" : ""
      }`}
    >
      {/* 3D Pedestal Shadow Glow below the dice */}
      <AnimatePresence>
        {isActive && !isRolling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [0.8, 1.2, 0.8],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute bottom-[-14px] w-12 h-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-full blur-[4px] pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={isRolling ? {
          y: [0, -40, -45, -15, 0, -6, 0],
          scale: [1, 1.15, 1.2, 1.08, 0.82, 1.04, 1],
          rotateZ: [0, 90, 270, 450, 630, 680, 720],
          rotateX: [0, 15, -15, 10, 0, -3, 0],
          rotateY: [0, -15, 15, -10, 0, 3, 0],
          filter: ["blur(0px)", "blur(1px)", "blur(1.5px)", "blur(0.8px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        } : value === 6 ? {
          scale: [1, 1.08, 1],
          y: [0, -4, 0],
          rotateZ: [0, 2, -2, 0],
          rotateX: rotation.x,
          rotateY: rotation.y,
        } : isActive ? {
          y: [0, -5, 0],
          rotateX: [rotation.x, rotation.x + 2, rotation.x - 2, rotation.x],
          rotateY: [rotation.y, rotation.y - 3, rotation.y + 3, rotation.y],
          rotateZ: [0, 1, -1, 0],
          scale: 1,
          filter: "blur(0px)",
        } : {
          y: 0,
          rotateX: rotation.x,
          rotateY: rotation.y,
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
          duration: 2.2,
          ease: "easeInOut"
        } : { 
          duration: 0.25 
        }}
        className="w-12 h-12 relative z-10"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Six faces of the CSS 3D Cube */}
        {[
          { num: 1, transform: "rotateY(0deg) translateZ(24px)" },
          { num: 6, transform: "rotateY(180deg) translateZ(24px)" },
          { num: 2, transform: "rotateY(90deg) translateZ(24px)" },
          { num: 5, transform: "rotateY(-90deg) translateZ(24px)" },
          { num: 3, transform: "rotateX(90deg) translateZ(24px)" },
          { num: 4, transform: "rotateX(-90deg) translateZ(24px)" }
        ].map((face) => (
          <div
            key={face.num}
            className={`absolute w-12 h-12 rounded-xl border flex items-center justify-center shadow-[inset_0_0_12px_rgba(251,113,133,0.15)] ${
              isRolling 
                ? "border-purple-400/80 bg-purple-950/90 text-purple-200" 
                : isActive 
                  ? "border-amber-400/80 bg-purple-900/90 text-amber-300"
                  : "border-purple-500/30 bg-[#090514]/90 text-purple-400"
            }`}
            style={{
              transform: face.transform,
              backfaceVisibility: "hidden",
            }}
          >
            {/* Grid structure for dots */}
            <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-7 h-7 pointer-events-none">
              {Array.from({ length: 9 }).map((_, i) => {
                const diceDots: Record<number, number[]> = {
                  1: [4],
                  2: [0, 8],
                  3: [0, 4, 8],
                  4: [0, 2, 6, 8],
                  5: [0, 2, 4, 6, 8],
                  6: [0, 2, 3, 5, 6, 8],
                };
                const hasDot = diceDots[face.num]?.includes(i);
                return (
                  <div key={i} className="flex items-center justify-center">
                    {hasDot && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isRolling 
                          ? "bg-purple-300 shadow-[0_0_5px_#d8b4fe]" 
                          : isActive 
                            ? "bg-amber-400 shadow-[0_0_6px_#fbbf24]"
                            : "bg-fuchsia-400 shadow-[0_0_4px_#f472b6]"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

interface LudoFusionEngineProps {
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onStartGame: () => void;
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
  onLiveTick?: (multiplier: number, picksCount?: number) => void;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  playerIdx: number;
}

export function LudoFusionEngine({ 
  betAmount, 
  onBetAmountChange, 
  onStartGame, 
  isPlaying, 
  onComplete,
  onLiveTick 
}: LudoFusionEngineProps) {
  
  const [gamePhase, setGamePhase] = useState<GamePhase>("idle");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dice, setDice] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState(1);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [message, setMessage] = useState("Awaiting arena initialization...");
  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<"ai" | "friends">("ai");
  const [showSetup, setShowSetup] = useState(true);
  const [movingToken, setMovingToken] = useState<{ color: PlayerColor; id: number } | null>(null);
  const [capturedToken, setCapturedToken] = useState<{ color: PlayerColor; id: number } | null>(null);
  
  // High-End FX states
  const [isImpactShaking, setIsImpactShaking] = useState(false);
  const [showImpactRipple, setShowImpactRipple] = useState(false);
  const [xp, setXp] = useState(250);
  const [level, setLevel] = useState(4);
  const [spectators, setSpectators] = useState(1540);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const startedRef = useRef(false);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(gamePhase);
  phaseRef.current = gamePhase;

  // Initialize Game Factions
  const initGame = useCallback(() => {
    const ps: Player[] = PLAYER_CONFIGS.map((cfg, i) => ({
      color: cfg.color,
      name: gameMode === "friends" 
        ? `${FACTIONS[cfg.color].name} (P${i+1})`
        : i === 0 ? "You (Viper)" : FACTIONS[cfg.color].name,
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
    setSpectators(Math.floor(Math.random() * 500) + 1200);
  }, [gameMode]);

  // Synchronize dynamic live ticks & states
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

  // Spectators counter simulation
  useEffect(() => {
    if (gamePhase === "idle" || winner) return;
    const interval = setInterval(() => {
      setSpectators(prev => prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4));
    }, 4000);
    return () => clearInterval(interval);
  }, [gamePhase, winner]);

  // Trigger floating emojis bubbles
  const triggerEmoji = useCallback((emoji: string, playerIdx: number) => {
    const id = Math.random().toString();
    setFloatingEmojis(prev => [...prev, { id, emoji, playerIdx }]);
    try { playGameSound("click"); } catch {}
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(x => x.id !== id));
    }, 1500);
  }, []);

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
        setMessage(bonusTurn ? "🎲 CRITICAL BONUS! Roll again!" : `🎲 Your Turn (${FACTIONS[nextPlayer.color].name})`);
      } else {
        setMessage(`🤖 ${FACTIONS[nextPlayer.color].name} is processing...`);
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
    const tokenName = `cyber-piece #${move.tokenId + 1}`;
    setMoveLog(l => [`${FACTIONS[activePlayer.color]?.name} deployed ${tokenName}...`, ...l]);

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
          setMoveLog(l => [`💥 Vaporized ${FACTIONS[color].name} piece!`, ...l]);
          triggerEmoji("💥", currentIdx);

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
              setMoveLog(l => [`🎉 Sovereign piece entered home center!`, ...l]);
              triggerEmoji("👑", currentIdx);
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
            setMessage("🏆 ARENA CONQUERED! VICTORY! 🏆");
            // Add XP
            setXp(x => {
              const newXp = x + 150;
              if (newXp >= 400) {
                setLevel(l => l + 1);
                setShowLevelUp(true);
                return newXp - 400;
              }
              return newXp;
            });
            onComplete(3.8, true);
          } else {
            setMessage(`${FACTIONS[player.color].name} claiming throne.`);
            onComplete(0, false);
          }
        } else {
          nextTurn(dice === 6 || !!move.captures);
        }
        return prev;
      });
    };

    runStep();
  }, [currentIdx, dice, winner, nextTurn, onComplete, players, triggerEmoji]);

  // AI Bots thinking logic
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

        // Impact FX
        setIsImpactShaking(true);
        setShowImpactRipple(true);
        setTimeout(() => setIsImpactShaking(false), 300);
        setTimeout(() => setShowImpactRipple(false), 900);

        const currentActive = players[currentIdx];
        const moves = getValidMoves(currentActive, rolledVal, players);

        if (moves.length === 0) {
          setMoveLog(l => [`🤖 ${FACTIONS[currentActive.color].name} rolled ${rolledVal} (Stuck)`, ...l]);
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

        setMoveLog(l => [`🤖 ${FACTIONS[currentActive.color].name} rolled ${rolledVal}`, ...l]);
        setGamePhase("selecting");
        
        const execTimer = setTimeout(() => executeMove(chosenMove), 800);
        return () => clearTimeout(execTimer);
      }, 850);
      return () => clearTimeout(rollTimer);
    }, 1300);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [gamePhase, currentIdx, players, executeMove, winner, nextTurn]);

  // Player manual dice roll execution
  const rollDice = useCallback(() => {
    if (isRolling || winner || gamePhase !== "playing" || !players[currentIdx]?.isHuman) return;

    setIsRolling(true);
    try { playGameSound("spin"); } catch {}

    setTimeout(() => {
      setIsRolling(false);
      const rolledVal = Math.floor(Math.random() * 6) + 1;
      setDice(rolledVal);
      setDisplayDice(rolledVal);

      // Trigger Screen Shake & Neon Shockwave
      setIsImpactShaking(true);
      setShowImpactRipple(true);
      setTimeout(() => setIsImpactShaking(false), 300);
      setTimeout(() => setShowImpactRipple(false), 900);

      const activePlayer = players[currentIdx];
      const moves = getValidMoves(activePlayer, rolledVal, players);

      setMoveLog(l => [`🎲 You rolled a ${rolledVal}`, ...l]);

      if (moves.length === 0) {
        setMessage(`No pathways unlocked with ${rolledVal}. Cycling turn...`);
        setTimeout(() => nextTurn(false), 1200);
        return;
      }

      setValidMoves(moves);
      setGamePhase("selecting");
      setMessage("👉 Tap a glowing hologram token to advance!");
      
      if (moves.length === 1) {
        setTimeout(() => {
          executeMove(moves[0]);
        }, 600);
      }
    }, 850);
  }, [isRolling, winner, gamePhase, players, currentIdx, nextTurn, executeMove]);

  const handleTokenClick = useCallback((color: PlayerColor, tokenId: number) => {
    if (gamePhase !== "selecting" || !players[currentIdx] || color !== players[currentIdx].color) return;
    
    const move = validMoves.find(m => m.tokenId === tokenId);
    if (move) {
      executeMove(move);
    }
  }, [gamePhase, currentIdx, players, validMoves, executeMove]);

  // SVG Flowing Energy Loop along the path
  const getFlowingTrackPoints = () => {
    return [...MAIN_PATH, MAIN_PATH[0]].map(([r, c]) => {
      const pos = gridToPos(r, c);
      return `${pos.x},${pos.y}`;
    }).join(" ");
  };

  if (showSetup) {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white/70 border border-purple-500/20 backdrop-blur-2xl p-6 sm:p-10 rounded-[3rem] shadow-[0_30px_80px_rgba(168,85,247,0.15),inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
          
          {/* Animated Background neon glows */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-10 items-center justify-between relative z-10">
            {/* Left Brand Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
              <div className="relative mb-3">
                <Crown className="w-20 h-20 text-fuchsia-400 mx-auto drop-shadow-[0_0_20px_#d8b4fe] animate-bounce" />
                <div className="absolute inset-0 bg-fuchsia-500/20 blur-[25px] rounded-full pointer-events-none" />
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 uppercase tracking-widest leading-none mb-4 drop-shadow-sm font-sans">
                Ludo Fusion
              </h2>
              <div className="inline-block bg-purple-500/10 border border-purple-500/25 px-4 py-1.5 rounded-full text-xs text-purple-700 font-bold uppercase tracking-widest mb-6">
                🌌 ARENA OF SENTINELS
              </div>

              {/* Holographic Ring display */}
              <div className="relative w-48 h-48 rounded-full border border-dashed border-purple-500/40 flex items-center justify-center bg-purple-950/20 shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]">
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border border-dashed border-fuchsia-500/15"
                />
                
                <div className="absolute top-3 left-1/2 -translate-x-1/2"><HeroToken color="red" size="small" isActive /></div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><HeroToken color="green" size="small" isActive /></div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2"><HeroToken color="yellow" size="small" isActive /></div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2"><HeroToken color="blue" size="small" isActive /></div>
                
                <div className="flex flex-col items-center justify-center text-center z-10">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-0.5">EST. RETURN</span>
                  <span className="text-xl font-black font-mono text-slate-900">3.80x POT</span>
                </div>
              </div>
            </div>

            {/* Right Control Panels */}
            <div className="flex-1 w-full max-w-md bg-white/90 border border-purple-200 p-6 rounded-[2.5rem] flex flex-col gap-6 shadow-sm">
              <div>
                <span className="text-[9px] text-purple-450 font-black uppercase tracking-widest block mb-3">Arena Combat Mode</span>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "ai" as const, icon: <Bot className="w-4 h-4" />, title: "ARENA LEAGUE", desc: "Bots Battle" },
                    { id: "friends" as const, icon: <User className="w-4 h-4" />, title: "FUSION HOTSEAT", desc: "Pass & Play" },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setGameMode(mode.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                        gameMode === mode.id
                          ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)] scale-[1.03]"
                          : "border-purple-200 bg-white/40 hover:border-purple-350 text-purple-600 hover:text-slate-900"
                      }`}
                    >
                      <div className={`p-2 rounded-xl transition-colors ${gameMode === mode.id ? "bg-purple-500 text-slate-900" : "bg-purple-100 text-purple-600"}`}>
                        {mode.icon}
                      </div>
                      <span className="font-black text-[9px] uppercase tracking-wider">{mode.title}</span>
                      <span className="text-[8px] opacity-60 text-center font-medium mt-0.5 leading-tight">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake input box */}
              <div className="bg-white/95 border border-purple-200 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[9px] text-purple-500 font-black uppercase tracking-widest">Entry stake amount</span>
                  <span className="text-xs font-black font-mono text-slate-900">₹{betAmount.toLocaleString()}</span>
                </div>

                <div className="flex items-center bg-white border border-purple-200 rounded-xl overflow-hidden shadow-sm transition-all focus-within:border-purple-500/50">
                  <div className="flex items-center pl-3.5 pr-2.5 border-r border-purple-200 bg-purple-550/10 h-10">
                    <span className="text-purple-600 font-black text-xs">₹</span>
                  </div>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => onBetAmountChange(Math.max(10, Number(e.target.value)))}
                    className="flex-1 bg-transparent border-none text-slate-900 font-black text-xs px-3 py-2 focus:outline-none focus:ring-0 font-mono"
                  />
                  <div className="flex items-center bg-white/40 border-l border-purple-200 h-10">
                    <button onClick={() => onBetAmountChange(Math.max(100, Math.floor(betAmount / 2)))} className="px-2.5 h-full text-[9px] font-black text-purple-650 hover:bg-purple-500 hover:text-slate-900 border-r border-purple-200 transition-colors">1/2</button>
                    <button onClick={() => onBetAmountChange(Math.min(1000000, betAmount * 2))} className="px-2.5 h-full text-[9px] font-black text-purple-650 hover:bg-purple-500 hover:text-slate-900 transition-colors">2X</button>
                  </div>
                </div>

                {/* Stake Presets Chip layout */}
                <div className="flex items-center justify-between gap-1.5 mt-4 overflow-x-auto py-1 scrollbar-none">
                  {[
                    { amount: 100, label: "100", color: "from-purple-600 to-indigo-700 border-purple-500" },
                    { amount: 500, label: "500", color: "from-fuchsia-600 to-pink-700 border-fuchsia-500" },
                    { amount: 1000, label: "1k", color: "from-indigo-650 to-purple-800 border-indigo-500" },
                    { amount: 5000, label: "5k", color: "from-rose-500 to-pink-650 border-rose-450" },
                    { amount: 10000, label: "10k", color: "from-purple-800 to-fuchsia-900 border-purple-700" },
                    { amount: 50000, label: "50k", color: "from-indigo-900 to-slate-900 border-indigo-750" }
                  ].map((chip) => {
                    const isSelected = betAmount === chip.amount;
                    return (
                      <button
                        key={chip.amount}
                        type="button"
                        onClick={() => onBetAmountChange(chip.amount)}
                        className={`relative w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center font-black text-slate-900 shadow-lg transition-all duration-300 transform cursor-pointer border-[1.5px] border-white/60 select-none ${
                          isSelected ? "scale-110 ring-2 ring-purple-500 ring-offset-2 ring-offset-purple-100 opacity-100 z-10" : "hover:scale-105 opacity-60 hover:opacity-100"
                        } bg-gradient-to-br ${chip.color}`}
                      >
                        <div className="absolute inset-[2.5px] rounded-full border border-dashed border-white/50 flex items-center justify-center">
                          <span className="text-[7.5px] font-black tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                            {chip.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[9px] text-purple-450/80 font-bold uppercase tracking-wider mt-4 pt-3.5 border-t border-purple-950/70">
                  <span>95.0% RTP</span>
                  <span className="text-purple-300 font-extrabold flex items-center gap-1 text-right">
                    WIN POT: <span className="text-fuchsia-400">3.80x → ₹{(betAmount * 3.8).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              {/* Enter Button */}
              <button
                onClick={onStartGame}
                className="w-full py-4 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest shadow-[0_12px_35px_rgba(168,85,247,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-purple-400 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 cursor-pointer animate-pulse"
              >
                🎰 Initiate Fusion Strike
              </button>

              {/* Missions Display */}
              <div className="border border-purple-200 bg-purple-550/5 p-3 rounded-xl">
                <span className="text-[8px] font-black uppercase text-purple-700 tracking-wider block mb-1.5">⚡ ACTIVE MISSIONS (+XP)</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[8px] text-slate-700"><Star className="w-2.5 h-2.5 text-amber-500" /> Capture bot piece (+50 XP)</div>
                  <div className="flex items-center gap-2 text-[8px] text-slate-700"><Star className="w-2.5 h-2.5 text-amber-500" /> Roll a Critical Six (+75 XP)</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Tokens Coordinates Math
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
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-2 sm:py-6 text-slate-900 overflow-visible select-none font-sans">
      
      {/* 1. Header HUD Area */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white/60 border border-purple-500/15 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl">
        
        {/* Match Details */}
        <div className="flex items-center gap-3">
          {/* Active flashing dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-fuchsia-400" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-fuchsia-500" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
              Ludo Fusion Arena
            </h3>
            <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider mt-1">
              {message}
            </p>
          </div>
        </div>

        {/* Mid-screen HUD Info */}
        <div className="flex items-center gap-5 bg-white border border-purple-200 px-4 py-2 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Buy-In:</span>
            <span className="text-xs font-black font-mono text-slate-850">₹{betAmount.toLocaleString()}</span>
          </div>
          <div className="w-px h-4 bg-purple-200" />
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-fuchsia-600 animate-pulse" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Winner Pot:</span>
            <span className="text-xs font-black font-mono text-fuchsia-600">₹{(betAmount * 3.8).toLocaleString()}</span>
          </div>
        </div>

        {/* Player Profile & XP HUD */}
        <div className="hidden lg:flex items-center gap-3 bg-white border border-purple-200 px-3.5 py-1 rounded-xl shadow-sm">
          <Award className="w-5 h-5 text-amber-500" />
          <div className="text-left">
            <p className="text-[9px] font-black text-slate-800 uppercase leading-none">Lvl {level} Champion</p>
            <div className="w-20 bg-purple-100 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-400 to-fuchsia-500 h-full" style={{ width: `${(xp / 400) * 100}%` }} />
            </div>
          </div>
          <div className="text-[9px] font-mono font-black text-slate-600 ml-1">
            {xp}/400 XP
          </div>
        </div>
      </div>

      {/* 2. Main Gameplay Layout */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 w-full overflow-visible font-sans">
        
        {/* Left Column: 3D Floating Ludo Platform */}
        <div className="w-full max-w-[230px] md:max-w-none md:w-[480px] lg:w-[540px] xl:w-[600px] shrink-0 flex flex-col items-center overflow-visible">
          
          {/* Perspective Container */}
          <div 
            className="w-full aspect-square relative select-none overflow-visible flex items-center justify-center p-4"
            style={{ perspective: "1200px" }}
          >
            <motion.div
              animate={isImpactShaking ? {
                x: [0, -4, 4, -4, 4, 0],
                y: [0, 4, -4, 4, -4, 0],
                rotateX: [42, 43, 41, 43, 42],
                rotateZ: [-32, -31, -33, -32],
              } : {}}
              transition={{ duration: 0.25 }}
              className="w-full h-full relative"
              style={{
                transformStyle: "preserve-3d",
                transform: "rotateX(42deg) rotateZ(-32deg) translateY(-25px)"
              }}
            >
              {/* Volumetric Thickness (3D Edge Panel) */}
              <div 
                className="absolute inset-0 bg-gradient-to-b from-purple-400 via-purple-500 to-indigo-750 rounded-[2.5rem] border border-purple-300 pointer-events-none"
                style={{ transform: "translateZ(-14px)", boxShadow: "0 20px 40px rgba(168,85,247,0.12)" }}
              />
              <div 
                className="absolute inset-0 bg-[#fdfaff] rounded-[2.5rem] border-2 border-purple-200"
                style={{ transform: "translateZ(0px)" }}
              />

              {/* Neon Grid Pattern background */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-30 rounded-[2.5rem] overflow-hidden"
                style={{
                  backgroundImage: "radial-gradient(rgba(168,85,247,0.12) 1px, transparent 0), radial-gradient(rgba(168,85,247,0.15) 1.5px, transparent 0)",
                  backgroundSize: "24px 24px",
                  backgroundPosition: "0 0, 12px 12px",
                  transform: "translateZ(0.5px)"
                }}
              />

              {/* Dynamic Impact shockwave rings */}
              <AnimatePresence>
                {showImpactRipple && (
                  <motion.div
                    initial={{ scale: 0.1, opacity: 0.8 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute rounded-full border-[3px] border-purple-400/70 pointer-events-none z-10"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: "160px",
                      height: "160px",
                      transform: "translate(-50%, -50%) translateZ(2px)",
                      boxShadow: "0 0 20px rgba(168,85,247,0.4), inset 0 0 20px rgba(168,85,247,0.4)",
                    }}
                  />
                )}
              </AnimatePresence>

              {/* SVG FLOWING LIGHT TRACE */}
              <svg 
                viewBox="0 0 100 100" 
                className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
                style={{ transform: "translateZ(1.5px)" }}
              >
                <defs>
                  <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <motion.polyline
                  points={getFlowingTrackPoints()}
                  fill="none"
                  stroke="url(#neonGlow)"
                  strokeWidth="0.8"
                  strokeDasharray="2.5, 5"
                  animate={{ strokeDashoffset: [0, -100] }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="opacity-75"
                />
              </svg>

              {/* Home Bases (Obsidian platforms) */}
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
                    animate={isTurn ? { borderColor: [FACTIONS[color].token, "rgba(255,255,255,0.7)", FACTIONS[color].token] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute rounded-3xl transition-all duration-300 overflow-visible flex flex-col items-center"
                    style={{
                      left: `${pos.l}%`, top: `${pos.t}%`, width: "40%", height: "40%",
                      backgroundColor: "rgba(9,5,20,0.75)",
                      border: `2px solid ${isTurn ? FACTIONS[color].token : "rgba(255,255,255,0.06)"}`,
                      boxShadow: isTurn ? `0 0 25px ${FACTIONS[color].glow}` : "none",
                      transform: "translateZ(3px)",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    {/* Faction Header HUD */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1.5 max-w-[90%] truncate z-10">
                      <span className="text-[7.5px] sm:text-[8px] font-black text-slate-900 uppercase tracking-wider truncate">
                        {p ? `${p.name} (${p.tokensHome}/4)` : ""}
                      </span>
                    </div>

                    {/* Faction Emblem Ring */}
                    <div className="absolute inset-[20%] bg-purple-950/15 border border-purple-500/10 rounded-2xl" style={{ transform: "translateZ(2px)" }} />

                    {/* Floating emoji overlay trigger */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 overflow-visible">
                      <AnimatePresence>
                        {floatingEmojis.filter(x => players[x.playerIdx]?.color === color).map(x => (
                          <motion.div
                            key={x.id}
                            initial={{ opacity: 0, y: 15, scale: 0.5 }}
                            animate={{ opacity: 1, y: -25, scale: 1.4 }}
                            exit={{ opacity: 0, y: -45 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="text-2xl z-30 pointer-events-none filter drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                          >
                            {x.emoji}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}

              {/* Home center portal */}
              <div className="absolute bg-[#0b0717]" style={{
                left: "40%", top: "40%", width: "20%", height: "20%",
                border: "2px solid rgba(168,85,247,0.15)",
                transform: "translateZ(4px)",
                transformStyle: "preserve-3d"
              }}>
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="0,0 50,50 100,0" fill={FACTIONS.green.token} opacity="0.15" />
                  <polygon points="100,0 50,50 100,100" fill={FACTIONS.yellow.token} opacity="0.15" />
                  <polygon points="100,100 50,50 0,100" fill={FACTIONS.blue.token} opacity="0.15" />
                  <polygon points="0,100 50,50 0,0" fill={FACTIONS.red.token} opacity="0.15" />
                  
                  <polygon points="0,0 50,50 100,0" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="0.8" />
                  <polygon points="100,0 50,50 100,100" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="0.8" />
                  <polygon points="100,100 50,50 0,100" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="0.8" />
                  <polygon points="0,100 50,50 0,0" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="0.8" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={{ scale: [0.9, 1.1, 0.9], rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  >
                    <Crown className="w-5 h-5 text-fuchsia-400 drop-shadow-[0_0_6px_rgba(216,180,254,0.6)]" />
                  </motion.div>
                </div>
              </div>

              {/* Main Path grid nodes */}
              {MAIN_PATH.map(([r, c], idx) => {
                const isStart = START_CELLS.has(idx);
                const isSafe = SAFE_CELLS.has(idx) && !isStart;
                const isValidTarget = validMoves.some(m => m.to.zone === "path" && m.to.index === idx);
                const startColor = isStart ? PLAYER_CONFIGS.find(p => p.startPos === idx)?.color : null;

                return (
                  <div
                    key={`cell-${idx}`}
                    className="absolute flex items-center justify-center transition-all duration-300"
                    style={{
                      left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`,
                      width: `${CELL_PCT}%`, height: `${CELL_PCT}%`,
                      backgroundColor: isValidTarget 
                        ? "rgba(168,85,247,0.15)" 
                        : startColor 
                          ? `${FACTIONS[startColor].token}20` 
                          : "#ffffff",
                      border: "0.5px solid rgba(168,85,247,0.12)",
                      boxShadow: isValidTarget ? "inset 0 0 8px rgba(168,85,247,0.3)" : "none",
                      transform: "translateZ(1px)",
                    }}
                  >
                    {isSafe && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="w-[60%] h-[60%] rounded-full border border-dashed border-amber-400/40 flex items-center justify-center"
                      >
                        <Star className="w-[60%] h-[60%] text-amber-400/80 drop-shadow-[0_0_2px_#fbbf24]" />
                      </motion.div>
                    )}
                    {isStart && startColor && (
                      <div className="w-[30%] h-[30%] rounded-full animate-pulse" style={{ backgroundColor: `${FACTIONS[startColor].token}50` }} />
                    )}
                  </div>
                );
              })}

              {/* Faction Home paths (Neon lanes) */}
              {(["red", "green", "yellow", "blue"] as PlayerColor[]).map(color =>
                HOME_PATHS[color].map(([r, c], idx) => (
                  <div
                    key={`home-${color}-${idx}`}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`,
                      width: `${CELL_PCT}%`, height: `${CELL_PCT}%`,
                      backgroundColor: `${FACTIONS[color].token}20`,
                      border: `0.5px solid ${FACTIONS[color].token}30`,
                      boxShadow: `inset 0 0 6px ${FACTIONS[color].glow}`,
                      transform: "translateZ(1.5px)"
                    }}
                  >
                    {idx === 5 && <Home className="w-[40%] h-[40%] opacity-50" style={{ color: FACTIONS[color].token }} />}
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
                        transform: "translate(-50%, -50%) translateZ(1.5px)",
                        border: `1.5px solid ${FACTIONS[color].token}25`,
                        backgroundColor: `rgba(0,0,0,0.25)`,
                      }}
                    />
                  );
                })
              )}

              {/* Holographic Interactive Tokens */}
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
                        layoutId={`token-${player.color}-${token.id}`}
                        className="absolute cursor-pointer overflow-visible"
                        style={{
                          left: `${pos.x + dxPct}%`,
                          top: `${pos.y + dyPct}%`,
                          width: `${sizePct}%`,
                          height: `${sizePct}%`,
                          transform: "translate(-50%, -50%) translateZ(10px)",
                          zIndex: isMoving || isCaptured ? 50 : 30 + tokenIdx,
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
                          <HeroToken color={player.color} size={cellTokens.length > 2 ? "small" : "medium"} isActive={isMovable} />
                          {isMovable && (
                            <div className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-50 pointer-events-none" />
                          )}
                          </motion.div>
                      </motion.div>
                    );
                  })
              )}

              {/* Finished Center Platform tokens */}
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
                      width: `${CELL_PCT * 0.38}%`,
                      height: `${CELL_PCT * 0.38}%`,
                      transform: "translate(-50%, -50%) translateZ(6px)",
                      zIndex: 25,
                    }}
                  >
                    {/* Concentric gold celebration ripple */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 rounded-full border border-amber-400 pointer-events-none"
                    />
                    <HeroToken color={p.color} className="w-full h-full" size="small" />
                  </motion.div>
                ));
              })}

            </motion.div>
          </div>

          {/* Mobile Dice Action Bar (Visible only on mobile devices) */}
          <div className="w-full md:hidden mt-4 bg-white/80 border border-purple-500/15 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <ThreeDDice 
                value={displayDice} 
                isRolling={isRolling} 
                isActive={currentPlayer?.isHuman && gamePhase === "playing" && !winner}
                onClick={rollDice}
              />
              {dice > 0 && !isRolling && (
                <div className="text-left leading-none">
                  <span className="text-[7px] text-purple-400 uppercase tracking-widest font-black block">Outcome</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{dice}</span>
                </div>
              )}
            </div>

            {currentPlayer?.isHuman && gamePhase === "playing" && !winner ? (
              <button
                onClick={rollDice}
                className="flex-1 py-3 px-4 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest border border-purple-400 bg-gradient-to-r from-purple-400 to-fuchsia-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.25)] animate-pulse"
              >
                🎲 Cast Roll
              </button>
            ) : (
              <div className="flex-1 text-right pr-2">
                <span className="text-[9px] font-black text-fuchsia-600 uppercase tracking-widest block">
                  {message}
                </span>
                <span className="text-[8px] text-slate-500 italic block mt-0.5 leading-tight">
                  {currentPlayer?.isHuman ? "Tap your glowing faction token" : "Computing next action"}
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
                className="py-3 px-4 rounded-xl border border-purple-500/20 bg-purple-950/20 text-slate-900 font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Desktop Esports Command Dashboard */}
        <div className="hidden md:flex flex-col flex-1 w-full gap-4">
          <div className="bg-white/70 border border-purple-500/15 backdrop-blur-md rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
            
            <div className="flex items-center justify-between border-b border-purple-200 pb-3 font-sans">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                  {currentPlayer?.isHuman ? "YOUR PHASE" : `${FACTIONS[currentPlayer?.color]?.name} PHASE`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[8px] text-slate-500 font-bold uppercase">
                  <Wifi className="w-2.5 h-2.5 text-emerald-500" /> 18ms
                </div>
                <div className="flex items-center gap-1 text-[8px] text-slate-500 font-bold uppercase">
                  <Clock className="w-2.5 h-2.5 text-purple-400" /> Live
                </div>
              </div>
            </div>

            {/* Premium Dice Controller Area */}
            <div className="flex items-center justify-between bg-[#090514]/60 border border-purple-950 p-4 rounded-2xl gap-4">
              <div className="flex items-center gap-4">
                <ThreeDDice 
                  value={displayDice} 
                  isRolling={isRolling} 
                  isActive={currentPlayer?.isHuman && gamePhase === "playing" && !winner}
                  onClick={rollDice}
                />
                {dice > 0 && !isRolling && (
                  <div className="text-left">
                    <span className="text-[8px] text-purple-450 uppercase tracking-widest font-black block">Outcome</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{dice}</span>
                  </div>
                )}
              </div>

              {currentPlayer?.isHuman && gamePhase === "playing" && !winner ? (
                <button
                  onClick={rollDice}
                  className="flex-1 py-3.5 px-5 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest border border-purple-455 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.25)] animate-pulse"
                >
                  🎲 Initiate Roll
                </button>
              ) : (
                <div className="flex-1 text-right pr-2">
                  <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest block">
                    {message}
                  </span>
                  <span className="text-[9px] text-slate-500 italic block mt-0.5">
                    {currentPlayer?.isHuman ? "Select highlighted token on board" : "Computing next action"}
                  </span>
                </div>
              )}
            </div>

            {/* Spectator Feed ticker */}
            <div className="flex justify-between items-center bg-purple-50/30 px-3 py-1.5 rounded-lg border border-purple-200">
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Spectators</span>
              <span className="text-[9px] font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                👁️ {spectators.toLocaleString()} watching
              </span>
            </div>

            {/* Player Faction Standings */}
            <div className="space-y-2">
              <span className="text-[9px] text-purple-600 uppercase tracking-widest font-black block">Faction Status Grid</span>
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => {
                  const isPlayerTurn = currentPlayer?.color === p.color && !winner;
                  return (
                    <div key={p.color} className={`p-2.5 rounded-xl border flex items-center justify-between transition-all relative ${
                      isPlayerTurn 
                        ? "bg-white border-purple-200 shadow-sm" 
                        : "bg-white/65 border-purple-200/50"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ color: FACTIONS[p.color].token, backgroundColor: FACTIONS[p.color].token }} />
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[90px]">{p.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-black text-purple-400 flex items-center shrink-0">
                        {p.tokensHome}/4 👑
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat Reaction System */}
            <div>
              <span className="text-[9px] text-purple-600 uppercase tracking-widest font-black block mb-2">Send Chat Reaction</span>
              <div className="flex gap-2 justify-between bg-purple-50/40 border border-purple-200 p-2 rounded-xl">
                {["😂", "👍", "😮", "🔥", "💀", "👑"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => triggerEmoji(emoji, 0)} // Send as player 0 (human)
                    className="text-lg hover:scale-125 transition-transform cursor-pointer p-1 active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Feed Ticker */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-purple-600 uppercase tracking-widest font-black block">Arena Combat Log</span>
              <div className="bg-slate-50 border border-purple-200 rounded-xl p-3 h-24 overflow-hidden">
                <div className="space-y-1 overflow-y-auto h-full scrollbar-none">
                  {moveLog.length === 0 ? (
                    <p className="text-[8px] text-slate-600 text-center py-5 uppercase font-bold tracking-widest">Feed Standby • Awaiting Rolls</p>
                  ) : moveLog.map((log, i) => (
                    <motion.div
                      key={`${log}-${i}`}
                      initial={i === 0 ? { opacity: 0, x: -5 } : false}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-[8.5px] font-mono leading-relaxed truncate ${
                        i === 0 ? "text-purple-300 font-bold" : "text-slate-550"
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
                className="w-full py-3.5 rounded-xl border border-purple-500/20 bg-purple-950/40 hover:bg-purple-900/60 text-slate-900 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-97"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-enter Match
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. Grand Level-Up Banner */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-md px-4"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#090514] border-2 border-amber-400 p-8 rounded-[2.5rem] text-center shadow-[0_30px_90px_rgba(168,85,247,0.3)] max-w-sm w-full"
            >
              <Award className="w-16 h-16 text-amber-400 mx-auto mb-3 drop-shadow-[0_0_15px_#fbbf24]" />
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-widest mb-1.5">Level Promoted</h2>
              <p className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-4">REACHED LEVEL {level} CHAMPION</p>
              <div className="bg-purple-950 p-3.5 rounded-xl border border-purple-500/10 mb-6">
                <span className="text-[9px] font-black text-slate-650 uppercase tracking-widest block mb-1">UNLOCKED COSMETIC SKIN</span>
                <span className="text-xs font-black text-amber-300 uppercase tracking-widest block">🔮 Obsidian Neon Dice</span>
              </div>
              <button 
                onClick={() => setShowLevelUp(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest cursor-pointer hover:scale-103"
              >
                Acknowledge Reward
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Cinematic Victory Celebration Overlay */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md px-4 font-sans"
            onClick={() => {
              setWinner(null);
              setGamePhase("idle");
              setPlayers([]);
              setShowSetup(true);
              startedRef.current = false;
            }}
          >
            <motion.div
              initial={{ scale: 0.7, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 18 }}
              className="bg-white border-2 border-purple-500/40 p-8 rounded-[3rem] text-center shadow-[0_30px_100px_rgba(168,85,247,0.45)] max-w-md w-full relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Confetti system simulated by absolute elements */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, 400],
                      x: [0, (Math.random() - 0.5) * 150],
                      rotate: [0, Math.random() * 360],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: Math.random() * 2.5 + 2,
                      ease: "linear",
                      delay: Math.random() * 1.5,
                    }}
                    className="absolute w-2 h-4"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-20px`,
                      backgroundColor: i % 2 === 0 ? "#a855f7" : "#ec4899",
                    }}
                  />
                ))}
              </div>

              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 1.2, repeat: 3 }}
                className="text-7xl mb-4"
              >
                🏆
              </motion.div>

              <h2 className="text-3xl font-black text-slate-900 mb-1 uppercase tracking-widest">
                {players[0]?.tokensHome >= 4 ? "Victory Royale!" : "Battle Terminated"}
              </h2>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-4">
                FACTION: {FACTIONS[winner].name}
              </p>

              {players[0]?.tokensHome >= 4 ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: "spring" }}
                  className="text-4xl font-black font-mono mb-4 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                >
                  +₹{((betAmount * 3.8) - betAmount).toLocaleString()}
                </motion.div>
              ) : (
                <div className="text-2xl font-black font-mono mb-4 text-rose-500">
                  -₹{betAmount.toLocaleString()}
                </div>
              )}

              <div className="bg-purple-950/20 border border-purple-500/10 rounded-2xl p-4 mb-6 text-left">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">SESSION STAKING SUMMARY</span>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-slate-350">Wager Stake:</span>
                  <span className="text-[10px] font-mono text-slate-900 font-bold">₹{betAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-350">Win Multiplier:</span>
                  <span className="text-[10px] font-mono text-fuchsia-400 font-bold">3.80x</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-350">XP Earned:</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">+150 XP</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setWinner(null);
                    setGamePhase("idle");
                    setPlayers([]);
                    setShowSetup(true);
                    startedRef.current = false;
                  }}
                  className="flex-1 py-3 rounded-xl bg-white text-slate-700 border border-slate-800 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close Lobby
                </button>
                <button
                  onClick={() => {
                    setWinner(null);
                    setGamePhase("idle");
                    setPlayers([]);
                    setShowSetup(true);
                    startedRef.current = false;
                  }}
                  className="flex-1 py-3 rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
                >
                  Fight Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
