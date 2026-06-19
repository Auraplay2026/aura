"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, RotateCcw, Bot, User, Swords, Home, Sparkles, Crown } from "lucide-react";
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

// 52-cell clockwise main path [row, col] on 15×15 grid
const MAIN_PATH: [number, number][] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],                 // 0–4   Left arm top → right
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],            // 5–10  Upper arm left → up
  [0,7],[0,8],                                    // 11–12 Top → right
  [1,8],[2,8],[3,8],[4,8],[5,8],                  // 13–17 Upper arm right → down
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],       // 18–23 Right arm top → right
  [7,14],[8,14],                                  // 24–25 Right → down
  [8,13],[8,12],[8,11],[8,10],[8,9],              // 26–30 Right arm bottom → left
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],       // 31–36 Lower arm right → down
  [14,7],[14,6],                                  // 37–38 Bottom → left
  [13,6],[12,6],[11,6],[10,6],[9,6],              // 39–43 Lower arm left → up
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],            // 44–49 Left arm bottom → left
  [7,0],[6,0],                                    // 50–51 Left → up
];

// 6-cell home column per player (toward center)
const HOME_PATHS: Record<PlayerColor, [number, number][]> = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};

// 4 token parking spots per base [row, col]
const BASE_SPOTS: Record<PlayerColor, [number, number][]> = {
  red:    [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
  green:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  yellow: [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
  blue:   [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]],
};

const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const START_CELLS = new Set([0, 13, 26, 39]);

const COLORS: Record<PlayerColor, { token: string; dark: string; light: string; glow: string; bg: string; border: string }> = {
  red:    { token: "#DC2626", dark: "#991B1B", light: "#FEE2E2", glow: "rgba(220,38,38,0.5)", bg: "#FEF2F2", border: "#FECACA" },
  green:  { token: "#059669", dark: "#065F46", light: "#D1FAE5", glow: "rgba(5,150,105,0.5)",  bg: "#ECFDF5", border: "#A7F3D0" },
  yellow: { token: "#D97706", dark: "#92400E", light: "#FEF3C7", glow: "rgba(217,119,6,0.5)",  bg: "#FFFBEB", border: "#FDE68A" },
  blue:   { token: "#2563EB", dark: "#1E40AF", light: "#DBEAFE", glow: "rgba(37,99,235,0.5)",  bg: "#EFF6FF", border: "#BFDBFE" },
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

// ═══════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════

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

    // FROM BASE — need a 6
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

    // ON PATH
    if (token.position.zone === "path") {
      const steps = stepsFromStart(token.position.index, cfg.startPos);
      const newSteps = steps + dice;

      if (newSteps <= 50) {
        // Still on shared path
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
        // Enters home column
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

    // IN HOME COLUMN
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
// AI LOGIC
// ═══════════════════════════════════════════════

function selectAIMove(moves: Move[]): Move {
  // Priority: capture → finish → enter home → release from base → random
  const capture = moves.filter(m => m.captures);
  if (capture.length) return capture[Math.floor(Math.random() * capture.length)];
  const finish = moves.filter(m => m.to.zone === "finished");
  if (finish.length) return finish[0];
  const home = moves.filter(m => m.entersHome);
  if (home.length) return home[Math.floor(Math.random() * home.length)];
  const release = moves.filter(m => m.from.zone === "base");
  if (release.length) return release[0];
  return moves[Math.floor(Math.random() * moves.length)];
}

// ═══════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════

function DiceFace({ value, isRolling }: { value: number; isRolling: boolean }) {
  const pips: Record<number, [number, number][]> = {
    1: [[50,50]],
    2: [[28,28],[72,72]],
    3: [[28,28],[50,50],[72,72]],
    4: [[28,28],[72,28],[28,72],[72,72]],
    5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
    6: [[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
  };

  return (
    <motion.div
      animate={isRolling ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 0.95, 1.05, 1] } : { rotate: 0, scale: 1 }}
      transition={isRolling ? { duration: 0.15, repeat: Infinity } : { type: "spring", stiffness: 400 }}
      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200/80"
      style={{ background: "linear-gradient(145deg, #ffffff, #f8fafc)" }}
    >
      {(pips[value] || pips[1]).map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)",
            width: "18%", height: "18%",
            background: "radial-gradient(circle at 40% 40%, #334155, #0f172a)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)",
          }}
        />
      ))}
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-2xl" style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />
    </motion.div>
  );
}

function TokenPiece({
  color, isHighlighted, onClick, size = "normal",
}: {
  color: PlayerColor; isHighlighted?: boolean; onClick?: () => void; size?: "normal" | "small";
}) {
  const s = size === "small" ? "w-4 h-4" : "w-full h-full";
  return (
    <div
      onClick={onClick}
      className={`${s} rounded-full relative ${onClick ? "cursor-pointer" : ""} ${isHighlighted ? "ring-2 ring-white ring-offset-1" : ""}`}
      style={{
        background: `radial-gradient(circle at 35% 30%, ${COLORS[color].token}dd, ${COLORS[color].dark})`,
        boxShadow: isHighlighted
          ? `0 0 12px ${COLORS[color].glow}, 0 2px 6px rgba(0,0,0,0.3), inset 0 -2px 4px ${COLORS[color].dark}`
          : `0 2px 6px rgba(0,0,0,0.2), inset 0 -2px 4px ${COLORS[color].dark}`,
      }}
    >
      {/* Highlight shine */}
      <div className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full bg-white/40" />
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

interface LudoEngineProps {
  betAmount: number;
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
  onLiveTick?: (multiplier: number, picksCount?: number) => void;
}

export function LudoEngine({ betAmount, isPlaying, onComplete, onLiveTick }: LudoEngineProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>("idle");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dice, setDice] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState(1);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [message, setMessage] = useState("Roll the dice to begin!");
  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<"ai" | "friends">("ai");
  const [showSetup, setShowSetup] = useState(true);

  const startedRef = useRef(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const phaseRef = useRef(gamePhase);
  phaseRef.current = gamePhase;

  // ── INITIALIZE ──
  const initGame = useCallback(() => {
    const ps: Player[] = PLAYER_CONFIGS.map((cfg, i) => ({
      color: cfg.color,
      name: gameMode === "friends" ? `Player ${i + 1}` : cfg.name,
      tokens: [0, 1, 2, 3].map(id => ({ id, position: { zone: "base" as const, index: id } })),
      isHuman: gameMode === "friends" ? true : i === 0,
      tokensHome: 0,
    }));
    setPlayers(ps);
    setCurrentIdx(0);
    setDice(1);
    setConsecutiveSixes(0);
    setWinner(null);
    setValidMoves([]);
    setMessage("🎲 Roll the dice!");
    setMoveLog([]);
    setGamePhase("playing");
    setShowSetup(false);
  }, [gameMode]);

  // Trigger on isPlaying
  useEffect(() => {
    if (isPlaying && !startedRef.current) {
      startedRef.current = true;
      if (showSetup) return; // wait for mode selection
      initGame();
    }
    if (!isPlaying) {
      startedRef.current = false;
      setShowSetup(true);
      setGamePhase("idle");
    }
  }, [isPlaying, initGame, showSetup]);

  const currentPlayer = players[currentIdx] || null;

  // ── ROLL DICE ──
  const rollDice = useCallback(() => {
    if (phaseRef.current !== "playing" || isRolling || winner) return;
    setIsRolling(true);
    setGamePhase("rolling");
    setValidMoves([]);

    let count = 0;
    const interval = setInterval(() => {
      setDisplayDice(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 14) {
        clearInterval(interval);
        const result = Math.floor(Math.random() * 6) + 1;
        setDice(result);
        setDisplayDice(result);
        setIsRolling(false);
        setGamePhase("rolled");
        try { playGameSound("spin"); } catch {}
      }
    }, 55);
  }, [isRolling, winner]);

  // ── PROCESS ROLL ──
  useEffect(() => {
    if (gamePhase !== "rolled" || !currentPlayer || winner) return;

    const moves = getValidMoves(currentPlayer, dice, players);

    // Three 6s rule
    if (dice === 6) {
      const newC = consecutiveSixes + 1;
      setConsecutiveSixes(newC);
      if (newC >= 3) {
        setMessage("Three 6s in a row! Turn lost.");
        setValidMoves([]);
        const t = setTimeout(() => nextTurn(false), 1200);
        return () => clearTimeout(t);
      }
    } else {
      setConsecutiveSixes(0);
    }

    if (moves.length === 0) {
      setMessage(`No valid moves for ${dice}.`);
      const t = setTimeout(() => nextTurn(dice === 6), 900);
      return () => clearTimeout(t);
    }

    // AI auto-select
    if (!currentPlayer.isHuman) {
      const move = selectAIMove(moves);
      const t = setTimeout(() => executeMove(move), 500);
      return () => clearTimeout(t);
    }

    // Human: if only one move, auto-play it
    if (moves.length === 1) {
      const t = setTimeout(() => executeMove(moves[0]), 300);
      return () => clearTimeout(t);
    }

    setValidMoves(moves);
    setMessage(`Rolled ${dice}! Tap a highlighted token.`);
    setGamePhase("selecting");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, dice]);

  // ── EXECUTE MOVE ──
  const executeMove = useCallback((move: Move) => {
    setGamePhase("moving");
    setValidMoves([]);

    setPlayers(prev => {
      const np = prev.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t, position: { ...t.position } })) }));
      const player = np[currentIdx];
      const token = player.tokens.find(t => t.id === move.tokenId)!;
      token.position = { ...move.to };
      if (move.to.zone === "finished") player.tokensHome++;

      // Capture
      if (move.captures) {
        const victim = np.find(p => p.color === move.captures!.color)!;
        const vToken = victim.tokens.find(t => t.id === move.captures!.tokenId)!;
        const usedSpots = victim.tokens.filter(t => t.position.zone === "base").map(t => t.position.index);
        let spot = 0;
        while (usedSpots.includes(spot)) spot++;
        vToken.position = { zone: "base", index: spot };
      }

      return np;
    });

    // Log
    const desc = move.captures ? `⚔️ Captured ${move.captures.color}!`
      : move.to.zone === "finished" ? "🏠 Token home!"
      : move.entersHome ? "➡️ Entered home column"
      : move.from.zone === "base" ? "🎯 Released token"
      : `Moved ${dice} steps`;
    setMoveLog(prev => [`${currentPlayer?.name}: ${desc}`, ...prev].slice(0, 15));

    if (move.captures) {
      setMessage(`⚔️ ${currentPlayer?.name} captured ${move.captures.color}!`);
      try { playGameSound("win"); } catch {}
    } else if (move.to.zone === "finished") {
      setMessage("🏠 Token reached home!");
      try { playGameSound("win"); } catch {}
    }

    // Check win after animation
    const t = setTimeout(() => {
      setPlayers(prev => {
        const player = prev[currentIdx];
        if (player.tokensHome >= 4) {
          setWinner(player.color);
          setGamePhase("finished");
          if (player.isHuman && gameMode === "ai") {
            setMessage("🏆 YOU WIN! 🏆");
            try { playGameSound("jackpot"); } catch {}
            onComplete(3.8, true);
          } else if (gameMode === "ai") {
            setMessage(`${player.name} wins!`);
            try { playGameSound("lose"); } catch {}
            onComplete(0, false);
          }
          return prev;
        }
        nextTurn(dice === 6 || !!move.captures);
        return prev;
      });
    }, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, dice, gameMode, onComplete]);

  // ── NEXT TURN ──
  const nextTurn = useCallback((extraTurn: boolean) => {
    if (extraTurn) {
      setMessage("🎲 Extra turn! Roll again.");
      setGamePhase("playing");
      setDice(0);
      return;
    }
    setCurrentIdx(prev => (prev + 1) % 4);
    setConsecutiveSixes(0);
    setDice(0);
    setGamePhase("playing");
  }, []);

  // ── AI AUTO-ROLL ──
  useEffect(() => {
    if (gamePhase !== "playing" || !currentPlayer || currentPlayer.isHuman || winner) return;
    setMessage(`${currentPlayer.name} is thinking...`);
    aiTimerRef.current = setTimeout(rollDice, 700 + Math.random() * 400);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [gamePhase, currentIdx, currentPlayer, rollDice, winner]);

  // ── LIVE TICK ──
  useEffect(() => {
    if (!onLiveTick || !players[0]) return;
    const p = players[0];
    const progress = p.tokensHome / 4;
    onLiveTick(1 + progress * 2.8, p.tokensHome);
  }, [players, onLiveTick]);

  // ── TOKEN CLICK ──
  const handleTokenClick = useCallback((color: PlayerColor, tokenId: number) => {
    if (gamePhase !== "selecting" || !currentPlayer || color !== currentPlayer.color) return;
    const move = validMoves.find(m => m.tokenId === tokenId);
    if (move) executeMove(move);
  }, [gamePhase, currentPlayer, validMoves, executeMove]);

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  // ── SETUP SCREEN ──
  if (showSetup && isPlaying) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎲</div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ludo Royale</h2>
            <p className="text-slate-500 text-sm mt-2">Premium Board Game • 95% RTP</p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { id: "ai" as const, icon: <Bot className="w-5 h-5" />, title: "VS AI Bots", desc: "Play against 3 intelligent opponents" },
              { id: "friends" as const, icon: <User className="w-5 h-5" />, title: "VS Friends", desc: "Hot-seat multiplayer — pass & play" },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setGameMode(mode.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  gameMode === mode.id
                    ? "border-red-500 bg-red-50 shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2 rounded-xl ${gameMode === mode.id ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {mode.icon}
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">{mode.title}</div>
                  <div className="text-xs text-slate-500">{mode.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Entry Fee</span>
              <span className="font-bold text-slate-900">₹{betAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-500">Win Multiplier</span>
              <span className="font-bold text-emerald-600">3.80x → ₹{(betAmount * 3.8).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-500">RTP</span>
              <span className="font-bold text-slate-700">95.0%</span>
            </div>
          </div>

          <button
            onClick={() => { setShowSetup(false); initGame(); }}
            className="w-full py-4 rounded-2xl font-black text-white text-lg tracking-wide shadow-[0_8px_30px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(220,38,38,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)" }}
          >
            🎲 Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === "idle" || players.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-slate-400 text-sm font-medium">Press Play to start Ludo Royale</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // GAME BOARD RENDER
  // ═══════════════════════════════════════════════

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
    <div className="w-full flex flex-col items-center gap-4">
      {/* Status Message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-slate-200 shadow-sm"
        >
          <p className="text-sm font-bold text-slate-800 text-center">{message}</p>
        </motion.div>
      </AnimatePresence>

      {/* Main layout: board + side panel */}
      <div className="flex flex-col lg:flex-row gap-4 w-full max-w-4xl items-start">
        {/* ── BOARD ── */}
        <div className="relative aspect-square w-full max-w-[480px] mx-auto lg:mx-0 select-none"
          style={{
            background: "#FDF6E3",
            borderRadius: "1.5rem",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1), inset 0 0 0 2px rgba(0,0,0,0.05)",
          }}
        >
          {/* Base Areas */}
          {(["red", "green", "yellow", "blue"] as PlayerColor[]).map(color => {
            const pos = { red: { l: 0, t: 0, br: "1.5rem 0 0 0" }, green: { l: 60, t: 0, br: "0 1.5rem 0 0" },
                          yellow: { l: 60, t: 60, br: "0 0 1.5rem 0" }, blue: { l: 0, t: 60, br: "0 0 0 1.5rem" } }[color];
            return (
              <div key={`base-${color}`} className="absolute" style={{
                left: `${pos.l}%`, top: `${pos.t}%`, width: "40%", height: "40%",
                backgroundColor: COLORS[color].bg, borderRadius: pos.br,
                border: `2px solid ${COLORS[color].border}`,
              }}>
                {/* Inner white area with token spots */}
                <div className="absolute inset-[15%] bg-white/90 rounded-xl border border-slate-100 grid grid-cols-2 grid-rows-2 gap-[12%] p-[12%]">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="rounded-full" style={{
                      border: `2.5px solid ${COLORS[color].token}60`,
                      backgroundColor: `${COLORS[color].token}10`,
                    }} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Center area — 4 colored triangles */}
          <div className="absolute" style={{
            left: "40%", top: "40%", width: "20%", height: "20%",
            background: "white",
            border: "2px solid #e2e8f0",
          }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="0,0 50,50 100,0" fill={COLORS.green.token} opacity="0.3" />
              <polygon points="100,0 50,50 100,100" fill={COLORS.yellow.token} opacity="0.3" />
              <polygon points="100,100 50,50 0,100" fill={COLORS.blue.token} opacity="0.3" />
              <polygon points="0,100 50,50 0,0" fill={COLORS.red.token} opacity="0.3" />
              <polygon points="0,0 50,50 100,0" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <polygon points="100,0 50,50 100,100" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <polygon points="100,100 50,50 0,100" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <polygon points="0,100 50,50 0,0" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx="50" cy="50" r="12" fill="#fbbf24" opacity="0.5" />
              <circle cx="50" cy="50" r="6" fill="#f59e0b" />
            </svg>
          </div>

          {/* Path Cells */}
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
                  backgroundColor: startColor ? `${COLORS[startColor].token}25` : isValidTarget ? "rgba(251,191,36,0.15)" : "#FFFFFF",
                  border: "0.5px solid #e2e8f080",
                  boxShadow: isValidTarget ? "inset 0 0 8px rgba(251,191,36,0.3)" : "none",
                }}
              >
                {isSafe && <Star className="w-[50%] h-[50%] text-amber-400 opacity-60" />}
                {isStart && startColor && (
                  <div className="w-[40%] h-[40%] rounded-full" style={{ backgroundColor: `${COLORS[startColor].token}40` }} />
                )}
              </div>
            );
          })}

          {/* Home Column Cells */}
          {(["red", "green", "yellow", "blue"] as PlayerColor[]).map(color =>
            HOME_PATHS[color].map(([r, c], idx) => (
              <div
                key={`home-${color}-${idx}`}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${c * CELL_PCT}%`, top: `${r * CELL_PCT}%`,
                  width: `${CELL_PCT}%`, height: `${CELL_PCT}%`,
                  backgroundColor: `${COLORS[color].token}15`,
                  border: `0.5px solid ${COLORS[color].token}30`,
                }}
              >
                {idx === 5 && <Home className="w-[45%] h-[45%] opacity-30" style={{ color: COLORS[color].token }} />}
              </div>
            ))
          )}

          {/* Active Turn Indicator Ring */}
          {currentPlayer && !winner && (
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute pointer-events-none"
              style={{
                left: `${({ red: 5, green: 65, yellow: 65, blue: 5 }[currentPlayer.color])}%`,
                top: `${({ red: 5, green: 5, yellow: 65, blue: 65 }[currentPlayer.color])}%`,
                width: "30%", height: "30%",
                border: `3px solid ${COLORS[currentPlayer.color].token}`,
                borderRadius: currentPlayer.color === "red" ? "1.5rem 0 0 0" :
                              currentPlayer.color === "green" ? "0 1.5rem 0 0" :
                              currentPlayer.color === "yellow" ? "0 0 1.5rem 0" : "0 0 0 1.5rem",
                boxShadow: `0 0 20px ${COLORS[currentPlayer.color].glow}`,
              }}
            />
          )}

          {/* ── TOKENS ── */}
          {players.flatMap(player =>
            player.tokens
              .filter(t => t.position.zone !== "finished")
              .map(token => {
                const pos = getScreenPos(token.position, player.color);
                const key = `${pos.x.toFixed(1)}-${pos.y.toFixed(1)}`;
                const cellTokens = allTokensByCell[key] || [];
                const stackIdx = cellTokens.findIndex(ct => ct.color === player.color && ct.tokenId === token.id);
                const stackSize = cellTokens.length;

                // Offset for stacking
                let dx = 0, dy = 0;
                if (stackSize === 2) { dx = stackIdx === 0 ? -1.2 : 1.2; }
                else if (stackSize === 3) {
                  dx = stackIdx === 0 ? -1.2 : stackIdx === 1 ? 1.2 : 0;
                  dy = stackIdx === 2 ? 1.2 : -0.5;
                } else if (stackSize >= 4) {
                  dx = stackIdx % 2 === 0 ? -1.2 : 1.2;
                  dy = stackIdx < 2 ? -1.2 : 1.2;
                }

                const isHighlighted = gamePhase === "selecting" &&
                  currentPlayer?.color === player.color &&
                  validMoves.some(m => m.tokenId === token.id);

                const tokenSizePct = CELL_PCT * 0.65;

                return (
                  <motion.div
                    key={`token-${player.color}-${token.id}`}
                    animate={{
                      left: `${pos.x + dx}%`,
                      top: `${pos.y + dy}%`,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="absolute"
                    style={{
                      width: `${tokenSizePct}%`, height: `${tokenSizePct}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: isHighlighted ? 40 : 20,
                    }}
                  >
                    <motion.div
                      animate={isHighlighted ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={isHighlighted ? { duration: 0.6, repeat: Infinity } : {}}
                      className="w-full h-full"
                    >
                      <TokenPiece
                        color={player.color}
                        isHighlighted={isHighlighted}
                        onClick={isHighlighted ? () => handleTokenClick(player.color, token.id) : undefined}
                      />
                    </motion.div>
                  </motion.div>
                );
              })
          )}

          {/* Finished tokens indicator at center */}
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
                  left: `${(cy + ox + i * 0.15) * CELL_PCT + CELL_PCT / 2}%`,
                  top: `${(cx + oy + i * 0.15) * CELL_PCT + CELL_PCT / 2}%`,
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

        {/* ── SIDE PANEL ── */}
        <div className="flex flex-col gap-3 w-full lg:w-80 shrink-0">
          {/* Dice + Roll Button */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Dice</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                Turn #{moveLog.length + 1}
              </span>
            </div>

            <div className="flex items-center gap-5 justify-center mb-5">
              <DiceFace value={displayDice} isRolling={isRolling} />
              {dice > 0 && !isRolling && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-black text-slate-900 font-mono"
                >
                  {dice}
                </motion.div>
              )}
            </div>

            {currentPlayer?.isHuman && gamePhase === "playing" && !winner && (
              <button
                onClick={rollDice}
                className="w-full py-3.5 rounded-2xl font-black text-white text-sm tracking-wide shadow-[0_6px_20px_rgba(220,38,38,0.25)] transition-all hover:shadow-[0_10px_30px_rgba(220,38,38,0.35)] hover:scale-[1.02] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)" }}
              >
                🎲 Roll Dice
              </button>
            )}

            {!currentPlayer?.isHuman && gamePhase !== "finished" && (
              <div className="w-full py-3 text-center text-sm text-slate-400 font-medium">
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  {currentPlayer?.name} is playing...
                </motion.span>
              </div>
            )}
          </div>

          {/* Players */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Players</h3>
            <div className="space-y-2">
              {players.map((p, i) => {
                const isActive = i === currentIdx && !winner;
                return (
                  <div
                    key={p.color}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                      isActive ? "bg-slate-50 shadow-sm border border-slate-200" : "border border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: COLORS[p.color].token }}>
                        {p.isHuman ? "👤" : "🤖"}
                      </div>
                      {isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute -inset-1 rounded-full border-2"
                          style={{ borderColor: COLORS[p.color].token }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[0, 1, 2, 3].map(j => (
                          <div
                            key={j}
                            className="w-2.5 h-2.5 rounded-full transition-all"
                            style={{
                              backgroundColor: j < p.tokensHome ? COLORS[p.color].token : `${COLORS[p.color].token}20`,
                              boxShadow: j < p.tokensHome ? `0 0 4px ${COLORS[p.color].glow}` : "none",
                            }}
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-1 font-mono">{p.tokensHome}/4</span>
                      </div>
                    </div>
                    {p.tokensHome >= 4 && <Trophy className="w-4 h-4 text-amber-500" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Move History */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] max-h-48 overflow-hidden">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Activity</h3>
            <div className="space-y-1.5 overflow-y-auto max-h-32 custom-scrollbar">
              {moveLog.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No moves yet</p>
              ) : moveLog.map((log, i) => (
                <motion.div
                  key={`${log}-${i}`}
                  initial={i === 0 ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-[11px] leading-snug font-medium ${
                    i === 0 ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {log}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Entry Fee</p>
                <p className="text-sm font-black text-slate-800 font-mono">₹{betAmount.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Win Prize</p>
                <p className="text-sm font-black text-emerald-600 font-mono">₹{(betAmount * 3.8).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* New Game (after finish) */}
          {winner && (
            <button
              onClick={() => {
                setGamePhase("idle");
                setPlayers([]);
                setWinner(null);
                setShowSetup(true);
                startedRef.current = false;
              }}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          )}
        </div>
      </div>

      {/* ── WIN OVERLAY ── */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setWinner(null)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white rounded-[2rem] p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.2)] max-w-sm mx-4"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: 2 }}
                className="text-6xl mb-4"
              >
                {players[0]?.tokensHome >= 4 ? "🏆" : "😞"}
              </motion.div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">
                {players[0]?.tokensHome >= 4 ? "YOU WIN!" : `${players.find(p => p.color === winner)?.name} Wins!`}
              </h2>

              {players[0]?.tokensHome >= 4 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-3xl font-black font-mono mb-4"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #dc2626)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
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
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02]"
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
