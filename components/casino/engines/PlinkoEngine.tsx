"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";
import { Zap, Volume2, VolumeX, Shield, Trophy, Activity, AlertTriangle, Layers, Play, Sparkles } from "lucide-react";

interface PlinkoEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

type Risk = "low" | "medium" | "high" | "extreme";

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
  choices: number[]; // Left (-1) or Right (1) choices for each of the 10 rows
  currentRow: number;
  isCompleted: boolean;
  targetBinIndex: number;
  multiplier: number;
}

interface Peg {
  x: number;
  y: number;
  radius: number;
  row: number;
  col: number;
  hitProgress: number; // For impact animations
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface ActivityLog {
  id: string;
  user: string;
  bet: number;
  multiplier: number;
  won: boolean;
}

const ROWS = 10;
const MULTIPLIERS: Record<Risk, number[]> = {
  low:     [5.6, 2.1, 1.1, 1.0, 0.5, 0.5, 0.5, 1.0, 1.1, 2.1, 5.6],
  medium:  [13.0, 3.0, 1.5, 0.8, 0.4, 0.4, 0.4, 0.8, 1.5, 3.0, 13.0],
  high:    [76.0, 10.0, 2.5, 0.3, 0.2, 0.2, 0.2, 0.3, 2.5, 10.0, 76.0],
  extreme: [350.0, 25.0, 4.0, 0.2, 0.1, 0.1, 0.1, 0.2, 4.0, 25.0, 350.0]
};

// Risk themes configurations
const RISK_THEMES: Record<Risk, { color: string; border: string; glow: string; bg: string; text: string }> = {
  low: {
    color: "#06b6d4", // Cyan
    border: "border-cyan-500/30",
    glow: "rgba(6, 182, 212, 0.4)",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400"
  },
  medium: {
    color: "#a855f7", // Purple
    border: "border-purple-500/30",
    glow: "rgba(168, 85, 247, 0.4)",
    bg: "bg-purple-500/10",
    text: "text-purple-400"
  },
  high: {
    color: "#f97316", // Orange
    border: "border-orange-500/30",
    glow: "rgba(249, 115, 22, 0.4)",
    bg: "bg-orange-500/10",
    text: "text-orange-400"
  },
  extreme: {
    color: "#ef4444", // Red
    border: "border-red-500/40",
    glow: "rgba(239, 68, 68, 0.6)",
    bg: "bg-red-500/15",
    text: "text-red-400"
  }
};

export function PlinkoEngine({ isPlaying, betAmount = 100, onComplete }: PlinkoEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [risk, setRisk] = useState<Risk>("medium");
  const [ballCount, setBallCount] = useState<1 | 3 | 5 | 10>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lastResult, setLastResult] = useState<{ mult: number; won: boolean } | null>(null);
  const [activeBucketIndex, setActiveBucketIndex] = useState<number | null>(null);
  
  // Lobby activity log data
  const [liveActivities, setLiveActivities] = useState<ActivityLog[]>([]);
  const [winsCount, setWinsCount] = useState(32);
  const [dailyProgress, setDailyProgress] = useState(45);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";

  // Physics simulation constants
  const WIDTH = 600;
  const HEIGHT = 720;
  const PEG_RADIUS = 7;        // Larger pegs — clearly visible
  const BALL_RADIUS = 11;
  const GRAVITY = 0.18;
  const RESTITUTION = 0.45;

  // Refs for animation loop
  const ballsRef = useRef<Ball[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const activeBucketRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const onCompleteRef = useRef(onComplete);

  // Sync references
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: "tick" | "hit_high" | "hit_low") => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "tick") {
        // High click sound on peg collision
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.015);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        osc.start(now);
        osc.stop(now + 0.015);
      } else if (type === "hit_high") {
        // High major chord for big wins
        const notes = [440.00, 554.37, 659.25, 880.00];
        notes.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "triangle";
          o.frequency.setValueAtTime(f, now + idx * 0.05);
          g.gain.setValueAtTime(0.12, now + idx * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);
          o.start(now + idx * 0.05);
          o.stop(now + idx * 0.05 + 0.3);
        });
      } else if (type === "hit_low") {
        // Small chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(261.63, now);
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn("Synth audio trigger failed", e);
    }
  }, [isMuted]);

  // Define Peg positions at start
  const initPegs = useCallback(() => {
    const arr: Peg[] = [];
    const centerX = WIDTH / 2;
    const startY = 80;
    const ySpacing = 48;
    const xSpacing = 36;

    for (let r = 0; r < ROWS; r++) {
      const pegCount = r + 3;
      const rowY = startY + r * ySpacing;
      for (let p = 0; p < pegCount; p++) {
        const pegX = centerX + (p - (pegCount - 1) / 2) * xSpacing;
        arr.push({
          x: pegX,
          y: rowY,
          radius: PEG_RADIUS,
          row: r,
          col: p,
          hitProgress: 0
        });
      }
    }
    pegsRef.current = arr;
  }, []);

  useEffect(() => {
    initPegs();
  }, [initPegs]);

  // Spark sparks generator
  const spawnSparks = (x: number, y: number, color: string, count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        color,
        alpha: 1.0
      });
    }
  };

  // Launch drops trigger
  const triggerDrops = useCallback(async () => {
    const totalBalls = ballCount;
    const completedResults: number[] = [];
    const ballOutcomes: { multiplier: number; targetBinIndex: number }[] = [];

    // 1. Query server API wagers
    try {
      const singleWager = betAmount / totalBalls;
      for (let i = 0; i < totalBalls; i++) {
        const res = await fetch("/api/casino/bet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            gameId: "orig-3",
            gameTitle: "Plinko",
            betAmount: singleWager,
            selectedTarget: risk
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          ballOutcomes.push({
            multiplier: data.multiplier,
            targetBinIndex: data.targetBinIndex !== undefined ? data.targetBinIndex : 5
          });
        } else {
          const bin = Math.floor(Math.random() * (ROWS + 1));
          ballOutcomes.push({
            multiplier: MULTIPLIERS[risk][bin],
            targetBinIndex: bin
          });
        }
      }
    } catch (e) {
      console.warn("Wager call fallback used:", e);
      for (let i = 0; i < totalBalls; i++) {
        const bin = Math.floor(Math.random() * (ROWS + 1));
        ballOutcomes.push({
          multiplier: MULTIPLIERS[risk][bin],
          targetBinIndex: bin
        });
      }
    }

    // 2. Launch balls sequentially
    const theme = RISK_THEMES[risk];
    ballOutcomes.forEach((outcome, idx) => {
      setTimeout(() => {
        // Pre-compute Left/Right choices to land exactly in targetBinIndex
        const targetBin = outcome.targetBinIndex;
        
        // Decide left (-1) or right (1) choices
        const choices = [
          ...Array(targetBin).fill(1),
          ...Array(ROWS - targetBin).fill(-1)
        ];
        // Shuffle choices randomly
        for (let j = choices.length - 1; j > 0; j--) {
          const rIdx = Math.floor(Math.random() * (j + 1));
          [choices[j], choices[rIdx]] = [choices[rIdx], choices[j]];
        }

        const startX = WIDTH / 2 + (Math.random() * 12 - 6);
        const newBall: Ball = {
          id: Date.now() + idx + Math.random(),
          x: startX,
          y: 20,
          vx: Math.random() * 2 - 1,
          vy: 0.5,
          radius: BALL_RADIUS,
          color: theme.color,
          trail: [],
          choices,
          currentRow: 0,
          isCompleted: false,
          targetBinIndex: targetBin,
          multiplier: outcome.multiplier
        };

        ballsRef.current.push(newBall);
      }, idx * 180);
    });
  }, [ballCount, betAmount, risk, email]);

  // Monitor isPlaying trigger
  useEffect(() => {
    if (isPlaying) {
      triggerDrops();
    }
  }, [isPlaying, triggerDrops]);

  // Main Canvas Render and Physics update loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 1. Background — deep dark felt with depth layers
      ctx.fillStyle = "#03060f";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Tunnel vignette for depth
      const theme = RISK_THEMES[risk];
      const vigGrad = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.4, 80, WIDTH / 2, HEIGHT * 0.4, WIDTH * 0.85);
      vigGrad.addColorStop(0, "rgba(10,15,35,0)");
      vigGrad.addColorStop(0.6, "rgba(4,8,22,0.5)");
      vigGrad.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Ambient risk-color glow at center top
      const riskGlow = ctx.createRadialGradient(WIDTH / 2, 30, 10, WIDTH / 2, 30, WIDTH * 0.6);
      riskGlow.addColorStop(0, theme.glow.replace(/[\d.]+\)$/, "0.12)"));
      riskGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = riskGlow;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Faint dot grid for depth perception
      ctx.fillStyle = "rgba(255,255,255,0.025)";
      for (let gx = 30; gx < WIDTH; gx += 38) {
        for (let gy = 30; gy < HEIGHT; gy += 38) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Side Rail Guides ──
      const railLeft = 30;
      const railRight = WIDTH - 30;
      const railTopY = 50;
      const railBotY = HEIGHT - 58;
      // Left rail
      const leftRailGrad = ctx.createLinearGradient(railLeft, 0, railLeft + 8, 0);
      leftRailGrad.addColorStop(0, "rgba(255,255,255,0.18)");
      leftRailGrad.addColorStop(0.4, theme.glow.replace(/[\d.]+\)$/, "0.25)"));
      leftRailGrad.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx.fillStyle = leftRailGrad;
      ctx.beginPath();
      ctx.roundRect(railLeft - 4, railTopY, 8, railBotY - railTopY, 4);
      ctx.fill();
      // Right rail
      const rightRailGrad = ctx.createLinearGradient(railRight - 8, 0, railRight, 0);
      rightRailGrad.addColorStop(0, "rgba(255,255,255,0.04)");
      rightRailGrad.addColorStop(0.6, theme.glow.replace(/[\d.]+\)$/, "0.25)"));
      rightRailGrad.addColorStop(1, "rgba(255,255,255,0.18)");
      ctx.fillStyle = rightRailGrad;
      ctx.beginPath();
      ctx.roundRect(railRight - 4, railTopY, 8, railBotY - railTopY, 4);
      ctx.fill();
      // Glowing edge lines
      ctx.shadowBlur = 10; ctx.shadowColor = theme.color;
      ctx.strokeStyle = theme.glow.replace(/[\d.]+\)$/, "0.6)");
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(railLeft, railTopY); ctx.lineTo(railLeft, railBotY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(railRight, railTopY); ctx.lineTo(railRight, railBotY); ctx.stroke();
      ctx.shadowBlur = 0;

      // 2. Render Pockets / Buckets — always visually rich
      const bucketWidth = WIDTH / (ROWS + 1);
      const bucketY = HEIGHT - 60;
      const bucketH = 42;

      MULTIPLIERS[risk].forEach((m, idx) => {
        const bx = idx * bucketWidth + 2;
        const bw = bucketWidth - 4;
        const isActive = activeBucketIndex === idx;

        // Color tiers
        let c0: string, c1: string, glowC: string;
        if (m >= 25)       { c0 = "#ff3b3b"; c1 = "#7f0000"; glowC = "rgba(255,59,59,0.8)"; }
        else if (m >= 10)  { c0 = "#ff6a00"; c1 = "#a03300"; glowC = "rgba(255,106,0,0.7)"; }
        else if (m >= 3)   { c0 = "#f59e0b"; c1 = "#7c5300"; glowC = "rgba(245,158,11,0.6)"; }
        else if (m >= 1)   { c0 = "#22c55e"; c1 = "#0f5c2e"; glowC = "rgba(34,197,94,0.5)"; }
        else               { c0 = "#475569"; c1 = "#1e293b"; glowC = "rgba(71,85,105,0.3)"; }

        const liftY = isActive ? 6 : 0;
        const by = bucketY - liftY;

        // Outer glow when active
        if (isActive) {
          ctx.shadowBlur = 28; ctx.shadowColor = glowC;
        }

        // Gradient fill
        const bg = ctx.createLinearGradient(bx, by, bx, by + bucketH);
        bg.addColorStop(0, c0 + (isActive ? "ff" : "cc"));
        bg.addColorStop(1, c1 + (isActive ? "ff" : "88"));
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bucketH, [6, 6, 4, 4]);
        ctx.fill();

        // Top sheen highlight
        const sheen = ctx.createLinearGradient(bx, by, bx, by + bucketH * 0.45);
        sheen.addColorStop(0, "rgba(255,255,255,0.30)");
        sheen.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sheen;
        ctx.beginPath();
        ctx.roundRect(bx + 1, by + 1, bw - 2, bucketH * 0.45, [5, 5, 0, 0]);
        ctx.fill();

        // Border
        ctx.strokeStyle = isActive ? "rgba(255,255,255,0.9)" : c0 + "99";
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bucketH, [6, 6, 4, 4]);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Multiplier label
        const fontSize = m >= 10 ? 11 : 10;
        ctx.font = `900 ${fontSize}px 'Inter', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = m < 1 ? "rgba(255,255,255,0.65)" : "#ffffff";
        if (isActive) { ctx.shadowBlur = 8; ctx.shadowColor = "#fff"; }
        ctx.fillText(`${m}×`, bx + bw / 2, by + bucketH / 2);
        ctx.shadowBlur = 0;
      });

      // Bucket trough line
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, bucketY - 2);
      ctx.lineTo(WIDTH - 30, bucketY - 2);
      ctx.stroke();

      // 3. Update & Draw Pegs — premium diamond pins
      const pegs = pegsRef.current;
      pegs.forEach(peg => {
        if (peg.hitProgress > 0) {
          peg.hitProgress -= 0.07;
          if (peg.hitProgress < 0) peg.hitProgress = 0;
        }

        const hit = peg.hitProgress;
        const size = peg.radius + hit * 5;

        // Outer glow halo (always present, stronger on hit)
        ctx.shadowBlur = hit > 0 ? 22 : 8;
        ctx.shadowColor = hit > 0 ? theme.color : theme.glow.replace(/[\d.]+\)$/, "0.5)");

        // Outer chrome ring — always visible metallic look
        const ringGrad = ctx.createRadialGradient(peg.x - size * 0.3, peg.y - size * 0.3, 0, peg.x, peg.y, size + 3.5);
        ringGrad.addColorStop(0, hit > 0 ? "rgba(255,255,255,0.9)" : "rgba(200,210,230,0.7)");
        ringGrad.addColorStop(0.6, hit > 0 ? theme.glow.replace(/[\d.]+\)$/, "0.5)") : "rgba(100,120,160,0.4)");
        ringGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, size + 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Main peg body — chrome sphere
        const pegGrad = ctx.createRadialGradient(
          peg.x - size * 0.35, peg.y - size * 0.35, size * 0.05,
          peg.x, peg.y, size
        );
        if (hit > 0) {
          pegGrad.addColorStop(0, "#ffffff");
          pegGrad.addColorStop(0.35, theme.color);
          pegGrad.addColorStop(1, darkenColor(theme.color, 0.5));
        } else {
          pegGrad.addColorStop(0, "#e2e8f0");   // bright chrome top
          pegGrad.addColorStop(0.4, "#94a3b8");
          pegGrad.addColorStop(1, "#1e293b");   // dark base
        }
        ctx.fillStyle = pegGrad;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Specular micro-glint (top-left highlight)
        ctx.fillStyle = hit > 0 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)";
        ctx.beginPath();
        ctx.arc(peg.x - size * 0.28, peg.y - size * 0.28, size * 0.28, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Update & Draw Balls
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];

        if (ball.isCompleted) continue;

        // Apply physics
        ball.vy += GRAVITY;
        ball.vy = Math.min(7.5, ball.vy); // Terminal speed

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Cushion Boundaries Collisions
        const leftLimit = 32;
        const rightLimit = WIDTH - 32;
        if (ball.x - ball.radius < leftLimit) {
          ball.x = leftLimit + ball.radius;
          ball.vx = -ball.vx * 0.45;
          playSound("tick");
          spawnSparks(ball.x - ball.radius, ball.y, theme.color, 4);
        } else if (ball.x + ball.radius > rightLimit) {
          ball.x = rightLimit - ball.radius;
          ball.vx = -ball.vx * 0.45;
          playSound("tick");
          spawnSparks(ball.x + ball.radius, ball.y, theme.color, 4);
        }

        // Save trail coordinate points (Hero motion trails)
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        // Steering Guidance towards target pocket
        const startY = 80;
        const ySpacing = 48;
        // Check which row the ball is approaching
        const relY = ball.y - startY;
        const approachingRow = Math.floor(relY / ySpacing);

        if (approachingRow >= 0 && approachingRow < ROWS && approachingRow !== ball.currentRow) {
          // Identify nearest peg in row
          const rowPegs = pegs.filter(p => p.row === approachingRow);
          let nearestPeg: Peg | null = null;
          let minDist = Infinity;
          for (const p of rowPegs) {
            const dist = Math.abs(ball.x - p.x);
            if (dist < minDist) {
              minDist = dist;
              nearestPeg = p;
            }
          }

          if (nearestPeg) {
            // Apply steering decision choice
            const choice = ball.choices[approachingRow] || 1;
            const targetSideX = nearestPeg.x + choice * 12; // pass to left or right

            // Smooth steering torque adjustment
            const diffX = targetSideX - ball.x;
            ball.vx += diffX * 0.08; // guide force nudge
          }
        }

        // Update current row cross
        if (approachingRow >= 0 && approachingRow <= ROWS) {
          ball.currentRow = approachingRow;
        }

        // Check Peg collisions
        pegs.forEach(peg => {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const dist = Math.hypot(dx, dy);
          const contactDist = ball.radius + peg.radius;

          if (dist < contactDist) {
            // Push out overlap
            const overlap = contactDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            ball.x += nx * overlap;
            ball.y += ny * overlap;

            // Reflect velocities
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
              ball.vx = (ball.vx - 2 * dot * nx) * RESTITUTION;
              ball.vy = (ball.vy - 2 * dot * ny) * RESTITUTION;

              // Introduce minor kinetic wobble path deviation
              ball.vx += (Math.random() * 0.6 - 0.3);
            }

            // Trigger peg lights hit
            peg.hitProgress = 1.0;
            playSound("tick");
            spawnSparks(peg.x, peg.y, theme.color, 5);
          }
        });

        // Check if ball landed in bucket
        if (ball.y >= bucketY + 2) {
          ball.isCompleted = true;
          const bin = Math.min(ROWS, Math.max(0, Math.floor(ball.x / bucketWidth)));

          // Synchronize visual landing index feedback
          setActiveBucketIndex(bin);
          playSound(ball.multiplier >= 2.0 ? "hit_high" : "hit_low");
          spawnSparks(ball.x, bucketY, theme.color, 12);

          // Update lobby stats
          const actWin = ball.multiplier >= 1.0;
          setLastResult({ mult: ball.multiplier, won: actWin });
          setLiveActivities(prev => [
            {
              id: `act-${Date.now()}-${Math.random()}`,
              user: email.split("@")[0],
              bet: betAmount / ballCount,
              multiplier: ball.multiplier,
              won: actWin
            },
            ...prev
          ].slice(0, 8));

          if (actWin) {
            setWinsCount(prev => prev + 1);
            setDailyProgress(prev => Math.min(100, prev + 3));
          }

          // Complete parent bet callback
          onCompleteRef.current(ball.multiplier, actWin);

          // Remove ball from array
          balls.splice(i, 1);
          setTimeout(() => {
            setActiveBucketIndex(null);
          }, 320);
        }
      }

      // Draw Ball Trails (Hero visual effects)
      balls.forEach(ball => {
        if (ball.trail.length < 2) return;
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";

        for (let idx = 1; idx < ball.trail.length; idx++) {
          const pt1 = ball.trail[idx - 1];
          const pt2 = ball.trail[idx];
          const alpha = idx / ball.trail.length;

          ctx.strokeStyle = theme.color;
          ctx.globalAlpha = alpha * 0.35;
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      });

      // Draw Active Balls — premium casino sphere
      balls.forEach(ball => {
        const r = ball.radius;

        // Layer 0: drop shadow
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.ellipse(ball.x + 2, ball.y + 5, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Layer 1: outer glow halo
        ctx.shadowBlur = 20;
        ctx.shadowColor = ball.color;
        const haloGrad = ctx.createRadialGradient(ball.x, ball.y, r * 0.7, ball.x, ball.y, r + 4);
        haloGrad.addColorStop(0, "rgba(0,0,0,0)");
        haloGrad.addColorStop(1, ball.color + "55");
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Layer 2: outer chrome rim stroke
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Layer 3: main sphere body gradient
        const sphereGrad = ctx.createRadialGradient(
          ball.x - r * 0.35, ball.y - r * 0.35, r * 0.05,
          ball.x, ball.y, r
        );
        sphereGrad.addColorStop(0, "#ffffff");
        sphereGrad.addColorStop(0.15, ball.color);
        sphereGrad.addColorStop(0.6, darkenColor(ball.color, 0.25));
        sphereGrad.addColorStop(1, darkenColor(ball.color, 0.55));
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: top specular sheen (lens flare)
        const sheenGrad = ctx.createRadialGradient(
          ball.x - r * 0.3, ball.y - r * 0.38, 0,
          ball.x - r * 0.1, ball.y - r * 0.15, r * 0.65
        );
        sheenGrad.addColorStop(0, "rgba(255,255,255,0.85)");
        sheenGrad.addColorStop(0.5, "rgba(255,255,255,0.15)");
        sheenGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sheenGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Layer 5: pinpoint specular dot
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(ball.x - r * 0.28, ball.y - r * 0.32, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Update and Draw spark particles
      const particles = particlesRef.current;
      for (let j = particles.length - 1; j >= 0; j--) {
        const p = particles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;

        if (p.alpha <= 0) {
          particles.splice(j, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [risk, activeBucketIndex]);

  // Color modifier function
  const darkenColor = (hex: string, percent: number) => {
    let num = parseInt(hex.replace("#", ""), 16),
      amt = Math.round(2.55 * (percent * 100)),
      R = (num >> 16) - amt,
      G = (num >> 8 & 0x00FF) - amt,
      B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
  };

  const theme = RISK_THEMES[risk];

  return (
    <div className="w-full h-full min-h-[650px] bg-slate-950 rounded-3xl border border-slate-800 p-4 md:p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden shadow-2xl">
      
      {/* Background visual beams */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/15 via-slate-950 to-slate-950 pointer-events-none z-0" />

      {/* 1. HUD Left Panel (Player feed, Daily Missions, Live Stats) */}
      <div className="w-full md:w-72 flex flex-col gap-4 z-10 shrink-0 select-none">
        
        {/* User VIP badge card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-0.5 bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-[0_0_12px_rgba(99,102,241,0.25)]`}>
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-bold text-xs text-indigo-400 font-mono">
                VIP
              </div>
            </div>
            <div className="text-left">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">VIP ACCOUNT</span>
              <span className="text-xs text-white font-black truncate max-w-[110px]">{email.split("@")[0]}</span>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-0.5 text-center">
            <span className="text-[9px] font-black font-mono text-amber-500">PLATINUM</span>
          </div>
        </div>

        {/* Live Community Wins activity feed */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex-grow flex flex-col justify-between shadow-inner min-h-[180px] md:min-h-0">
          <div className="text-left mb-3">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-pink-500" /> Live Feed
            </span>
          </div>

          <div className="flex-grow overflow-y-auto space-y-2 max-h-[140px] pr-1.5 scrollbar-thin">
            {liveActivities.length === 0 ? (
              <div className="text-center text-xs text-slate-600 py-6 font-bold">
                Waiting for drops...
              </div>
            ) : (
              liveActivities.map((act) => (
                <div key={act.id} className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-950/40 border border-slate-800/40 rounded-lg">
                  <span className="text-slate-400 font-bold truncate max-w-[90px]">{act.user}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">₹{act.bet.toFixed(0)}</span>
                    <span className={`font-mono font-black ${act.won ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {act.multiplier.toFixed(1)}x
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gamified Achievements progressions */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-left shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Progression
            </span>
            <span className="text-[10px] font-mono font-black text-indigo-400">{dailyProgress}%</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            Hit <span className="text-cyan-400">10 wagers</span> in extreme risk mode to claim a seasonal loot crate.
          </p>
          <div className="h-1.5 w-full bg-slate-800 border border-slate-700/60 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 shadow-[0_0_8px_#a855f7] transition-all duration-300"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
        </div>

      </div>

      {/* 2. PLINKO X 3D Canvas Board Viewport */}
      <div className="flex-grow bg-slate-950 border border-slate-800/80 rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 md:p-6 z-10 min-h-[500px]">
        
        {/* Header HUD odds indicators */}
        <div className="w-full flex items-center justify-between z-10">
          
          {/* Risk Level skin status indicator */}
          <div className={`flex items-center gap-2 bg-slate-900/60 border ${theme.border} rounded-2xl px-4 py-2.5 shadow-lg`}>
            <Zap className={`w-4 h-4 ${theme.text}`} />
            <div className="text-left">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block">RISK MODE</span>
              <span className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>
                {risk}
              </span>
            </div>
          </div>

          {/* Winning Indicator result readout */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`px-5 py-2 rounded-xl text-sm font-black border ${
                  lastResult.won 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]" 
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}
              >
                Avg Outcome: <span className="font-mono">{lastResult.mult.toFixed(2)}x</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio toggle speaker */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-inner"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

        </div>

        {/* 3D Transform projected canvas box wrapper */}
        <div className="flex-grow flex items-center justify-center py-4 overflow-hidden perspective-[1200px]">
          <div 
            className="relative w-full max-w-[420px] aspect-[4/5] rounded-[24px] bg-slate-900/50 border-[10px] border-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.05)] transition-transform duration-1000 transform-style-3d overflow-hidden"
            style={{ transform: "rotateX(22deg)" }}
          >
            {/* Table inner rails border glow */}
            <div className="absolute inset-0 border border-indigo-500/15 pointer-events-none shadow-[inset_0_0_15px_rgba(99,102,241,0.1)] z-20" />

            <canvas
              ref={canvasRef}
              className="w-full h-full block select-none z-10"
            />
          </div>
        </div>

        {/* Bottom controls panel */}
        <div className="w-full flex flex-col md:flex-row items-center gap-4 justify-between border-t border-slate-900/60 pt-4 mt-2 z-10">
          
          {/* Risk Level Selectors */}
          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {(["low", "medium", "high", "extreme"] as Risk[]).map(r => (
              <button
                key={r}
                disabled={isPlaying}
                onClick={() => setRisk(r)}
                className={`px-4 py-2 rounded-xl text-xs font-black capitalize active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 ${
                  risk === r
                    ? r === "low" ? "bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]" :
                      r === "medium" ? "bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]" :
                      r === "high" ? "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]" :
                      "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Ball count selection dropdown/tabs */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {[1, 3, 5, 10].map(count => (
              <button
                key={count}
                disabled={isPlaying}
                onClick={() => setBallCount(count as 1 | 3 | 5 | 10)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  ballCount === count
                    ? "bg-slate-800 text-white border border-slate-700/60 shadow-inner"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                {count} {count === 1 ? "Ball" : "Balls"}
              </button>
            ))}
          </div>

          {/* Preset Play drops trigger */}
          <button
            onClick={triggerDrops}
            disabled={isPlaying}
            className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] border border-purple-300/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
            DROP BALLS
          </button>

        </div>

      </div>

    </div>
  );
}
