"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Wallet, Volume2, VolumeX, Trophy, Target, Clock, Play, RotateCcw, AlertTriangle } from "lucide-react";
import { useTradingStore } from "@/lib/store";

interface BilliardsEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  number: number;
  isCueBall: boolean;
  isPocketed: boolean;
  opacity: number;
  scale: number;
}

interface Pocket {
  x: number;
  y: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

export function BilliardsEngine({ isPlaying, betAmount = 10, onComplete }: BilliardsEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "aiming" | "striking" | "rolling" | "win_screen" | "lose_screen">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [shotPower, setShotPower] = useState(60); // 0 to 100
  const [cueAngle, setCueAngle] = useState(0); // in radians
  const [isDraggingCue, setIsDraggingCue] = useState(false);
  const [serverOutcome, setServerOutcome] = useState<{ isWin: boolean; multiplier: number; payout: number } | null>(null);
  const [winChance, setWinChance] = useState(48.5); // visual win probability
  const [shotClock, setShotClock] = useState(30);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";

  // Physics constants
  const TABLE_WIDTH = 800;
  const TABLE_HEIGHT = 400;
  const BALL_RADIUS = 12;
  const FRICTION = 0.985;
  const POCKET_RADIUS = 20;

  // State refs for physics loop
  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const gameStateRef = useRef(gameState);
  const isPlayingRef = useRef(isPlaying);
  const serverOutcomeRef = useRef(serverOutcome);
  const onCompleteRef = useRef(onComplete);

  // Sync references
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    serverOutcomeRef.current = serverOutcome;
  }, [serverOutcome]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthSound = useCallback((type: "hit" | "collision" | "pocket" | "win" | "lose") => {
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

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "hit") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "collision") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "pocket") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "win") {
        // Major Arpeggio Chord
        const freqs = [261.63, 329.63, 392.00, 523.25, 659.25];
        freqs.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "triangle";
          o.frequency.setValueAtTime(f, now + idx * 0.06);
          g.gain.setValueAtTime(0.12, now + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
          o.start(now + idx * 0.06);
          o.stop(now + idx * 0.06 + 0.4);
        });
      } else if (type === "lose") {
        // Diminished chords
        const freqs = [293.66, 277.18, 261.63, 220.00];
        freqs.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "sawtooth";
          o.frequency.setValueAtTime(f, now + idx * 0.08);
          g.gain.setValueAtTime(0.1, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          o.start(now + idx * 0.08);
          o.stop(now + idx * 0.08 + 0.35);
        });
      }
    } catch (e) {
      console.warn("Synth playback failed", e);
    }
  }, [isMuted]);

  // Define Pockets
  const pockets: Pocket[] = [
    { x: POCKET_RADIUS, y: POCKET_RADIUS, radius: POCKET_RADIUS }, // Top-Left
    { x: TABLE_WIDTH / 2, y: POCKET_RADIUS - 5, radius: POCKET_RADIUS }, // Top-Middle
    { x: TABLE_WIDTH - POCKET_RADIUS, y: POCKET_RADIUS, radius: POCKET_RADIUS }, // Top-Right
    { x: POCKET_RADIUS, y: TABLE_HEIGHT - POCKET_RADIUS, radius: POCKET_RADIUS }, // Bottom-Left
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - POCKET_RADIUS + 5, radius: POCKET_RADIUS }, // Bottom-Middle
    { x: TABLE_WIDTH - POCKET_RADIUS, y: TABLE_HEIGHT - POCKET_RADIUS, radius: POCKET_RADIUS } // Bottom-Right
  ];

  // Initialize/Reset Balls
  const initBalls = useCallback(() => {
    const arr: Ball[] = [];

    // Cue Ball (White)
    arr.push({
      id: 0,
      x: TABLE_WIDTH * 0.25,
      y: TABLE_HEIGHT * 0.5,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: "#ffffff",
      number: 0,
      isCueBall: true,
      isPocketed: false,
      opacity: 1,
      scale: 1
    });

    // Target Balls in a rack formation
    const colors = [
      "#facc15", // 1 Yellow
      "#3b82f6", // 2 Blue
      "#ef4444", // 3 Red
      "#a855f7", // 4 Purple
      "#f97316", // 5 Orange
      "#22c55e", // 6 Green
      "#ec4899", // 7 Pink
      "#0f172a", // 8 Black
      "#be123c", // 9 Maroon
    ];

    const rackX = TABLE_WIDTH * 0.68;
    const rackY = TABLE_HEIGHT * 0.5;
    const spacingX = BALL_RADIUS * 1.73; // sqrt(3) spacing
    const spacingY = BALL_RADIUS * 2;

    const positions = [
      { row: 0, col: 0, num: 1 },
      
      { row: 1, col: -0.5, num: 2 },
      { row: 1, col: 0.5, num: 3 },
      
      { row: 2, col: -1, num: 4 },
      { row: 2, col: 0, num: 8 }, // Black 8-ball in center
      { row: 2, col: 1, num: 5 },
      
      { row: 3, col: -1.5, num: 6 },
      { row: 3, col: -0.5, num: 7 },
      { row: 3, col: 0.5, num: 9 },
      { row: 3, col: 1.5, num: 10 }
    ];

    positions.forEach((pos, idx) => {
      arr.push({
        id: idx + 1,
        x: rackX + pos.row * spacingX,
        y: rackY + pos.col * spacingY,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: colors[pos.num - 1] || "#ec4899",
        number: pos.num,
        isCueBall: false,
        isPocketed: false,
        opacity: 1,
        scale: 1
      });
    });

    ballsRef.current = arr;
    particlesRef.current = [];
  }, []);

  // Set initial setup on mount
  useEffect(() => {
    initBalls();
  }, [initBalls]);

  // Shot clock timer
  useEffect(() => {
    if (gameState !== "aiming") return;
    const interval = setInterval(() => {
      setShotClock(prev => {
        if (prev <= 1) {
          // Auto-shoot if clock runs out
          handleStrike();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Trigger when isPlaying becomes true from parent sidebar wagers
  useEffect(() => {
    if (isPlaying) {
      if (gameState === "idle" || gameState === "win_screen" || gameState === "lose_screen") {
        setServerOutcome(null);
        initBalls();
        setGameState("aiming");
        setShotClock(30);
      }
    }
  }, [isPlaying, gameState, initBalls]);

  // Hit command executor
  const handleStrike = async () => {
    if (gameState !== "aiming") return;
    setGameState("striking");
    playSynthSound("hit");

    // Retrieve cue ball reference
    const cueBall = ballsRef.current.find(b => b.isCueBall);
    if (!cueBall) return;

    // Call server wager endpoint
    let outcome = { isWin: false, multiplier: 0, payout: 0 };
    try {
      const res = await fetch("/api/casino/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          gameId: "orig-17",
          gameTitle: "3D Neon Billiards",
          betAmount
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        outcome = {
          isWin: data.isWin,
          multiplier: data.multiplier,
          payout: data.payout
        };
        setServerOutcome(outcome);
      } else {
        console.warn("Bet placement fallback used due to api response:", data.error);
        outcome = { isWin: Math.random() < 0.45, multiplier: 2.0, payout: betAmount * 2 };
        setServerOutcome(outcome);
      }
    } catch (err) {
      console.error("Wager communication error:", err);
      outcome = { isWin: Math.random() < 0.45, multiplier: 2.0, payout: betAmount * 2 };
      setServerOutcome(outcome);
    }

    // Apply impulse to cue ball
    const force = 4 + (shotPower / 100) * 16; // Velocity scaling
    cueBall.vx = Math.cos(cueAngle) * force;
    cueBall.vy = Math.sin(cueAngle) * force;

    // Shift to rolling state
    setGameState("rolling");
  };

  // Spark Generator
  const spawnSparkles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  };

  // Canvas Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      // 1. Draw Table Felt Surface with premium radial gradient
      const feltGrad = ctx.createRadialGradient(
        TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 50,
        TABLE_WIDTH / 2, TABLE_HEIGHT / 2, TABLE_WIDTH * 0.6
      );
      feltGrad.addColorStop(0, "#0d2b28"); // Cyan deep felt
      feltGrad.addColorStop(0.5, "#061f1c");
      feltGrad.addColorStop(1, "#020c0a"); // Obsidian border transition
      ctx.fillStyle = feltGrad;
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      // Subtle table grid line overlay for high-tech look
      ctx.strokeStyle = "rgba(6, 182, 212, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < TABLE_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, TABLE_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < TABLE_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(TABLE_WIDTH, y);
        ctx.stroke();
      }

      // Draw Cushion Borders (Hot Pink/Purple Glowing boundaries)
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#d946ef"; // Magenta glow
      ctx.strokeStyle = "#a21caf";
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, TABLE_WIDTH - 8, TABLE_HEIGHT - 8);
      ctx.shadowBlur = 0; // reset

      // 2. Draw Pockets with animated neon halos
      pockets.forEach(p => {
        // Outer pulsing halo
        const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
        const outerGrad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.5, p.x, p.y, p.radius * 1.3 * pulse);
        outerGrad.addColorStop(0, "rgba(0, 242, 254, 0.4)");
        outerGrad.addColorStop(0.5, "rgba(0, 242, 254, 0.1)");
        outerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Pocket Rim Ring
        ctx.strokeStyle = "#00f2fe"; // Neon Cyan
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Dark Pocket Well
        ctx.fillStyle = "#020617";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius - 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Physics Simulation
      if (gameStateRef.current === "rolling") {
        let anyMoving = false;
        const balls = ballsRef.current;
        const outcome = serverOutcomeRef.current;

        // Update positions & bounds checking
        balls.forEach(ball => {
          if (ball.isPocketed) return;

          ball.x += ball.vx;
          ball.y += ball.vy;

          // Apply deceleration
          ball.vx *= FRICTION;
          ball.vy *= FRICTION;

          // Check if speed exceeds rolling threshold
          if (Math.abs(ball.vx) > 0.05 || Math.abs(ball.vy) > 0.05) {
            anyMoving = true;
          } else {
            ball.vx = 0;
            ball.vy = 0;
          }

          // Wall Collision
          const leftBound = BALL_RADIUS + 8;
          const rightBound = TABLE_WIDTH - BALL_RADIUS - 8;
          const topBound = BALL_RADIUS + 8;
          const bottomBound = TABLE_HEIGHT - BALL_RADIUS - 8;

          if (ball.x < leftBound) {
            ball.x = leftBound;
            ball.vx = -ball.vx * 0.8;
            playSynthSound("collision");
            spawnSparkles(ball.x - ball.radius, ball.y, "#a21caf", 4);
          } else if (ball.x > rightBound) {
            ball.x = rightBound;
            ball.vx = -ball.vx * 0.8;
            playSynthSound("collision");
            spawnSparkles(ball.x + ball.radius, ball.y, "#a21caf", 4);
          }

          if (ball.y < topBound) {
            ball.y = topBound;
            ball.vy = -ball.vy * 0.8;
            playSynthSound("collision");
            spawnSparkles(ball.x, ball.y - ball.radius, "#a21caf", 4);
          } else if (ball.y > bottomBound) {
            ball.y = bottomBound;
            ball.vy = -ball.vy * 0.8;
            playSynthSound("collision");
            spawnSparkles(ball.x, ball.y + ball.radius, "#a21caf", 4);
          }

          // Pocketing detection
          pockets.forEach(p => {
            const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
            if (dist < p.radius + 2) {
              // Pocket entry trigger
              ball.isPocketed = true;
              ball.vx = 0;
              ball.vy = 0;
              playSynthSound("pocket");
              spawnSparkles(p.x, p.y, ball.color, 15);
            }
          });

          // Magnetic outcomes steer if server outcome is set
          if (outcome) {
            if (outcome.isWin) {
              // Steer target balls generally towards pockets
              if (!ball.isCueBall) {
                pockets.forEach(p => {
                  const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
                  if (dist < 70 && dist > 10) {
                    // pull force vector
                    const pullX = (p.x - ball.x) / dist;
                    const pullY = (p.y - ball.y) / dist;
                    ball.vx += pullX * 0.28;
                    ball.vy += pullY * 0.28;
                  }
                });
              }
            } else {
              // If loss: steer Cue Ball into pocket if it gets near (Scratch)
              if (ball.isCueBall) {
                pockets.forEach(p => {
                  const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
                  if (dist < 80 && dist > 5) {
                    const pullX = (p.x - ball.x) / dist;
                    const pullY = (p.y - ball.y) / dist;
                    ball.vx += pullX * 0.35;
                    ball.vy += pullY * 0.35;
                  }
                });
              }
            }
          }
        });

        // Ball-to-ball collisions
        for (let i = 0; i < balls.length; i++) {
          const b1 = balls[i];
          if (b1.isPocketed) continue;

          for (let j = i + 1; j < balls.length; j++) {
            const b2 = balls[j];
            if (b2.isPocketed) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b1.radius + b2.radius;

            if (dist < minDist) {
              // Overlap correction
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              b1.x -= nx * overlap * 0.5;
              b1.y -= ny * overlap * 0.5;
              b2.x += nx * overlap * 0.5;
              b2.y += ny * overlap * 0.5;

              // Elastic impulse calculation
              const kx = b1.vx - b2.vx;
              const ky = b1.vy - b2.vy;
              const pVal = 2 * (nx * kx + ny * ky) / 2; // Equal masses

              b1.vx -= nx * pVal;
              b1.vy -= ny * pVal;
              b2.vx += nx * pVal;
              b2.vy += ny * pVal;

              playSynthSound("collision");
              spawnSparkles((b1.x + b2.x) / 2, (b1.y + b2.y) / 2, "#00f2fe", 6);
            }
          }
        }

        // If nothing is moving, finalize the round
        if (!anyMoving) {
          // Check round outcome
          const targetPocketed = balls.some(b => !b.isCueBall && b.isPocketed);
          const cuePocketed = balls.find(b => b.isCueBall)?.isPocketed;

          let didWin = false;
          let multiplier = 0;

          if (outcome) {
            didWin = outcome.isWin;
            multiplier = outcome.multiplier;
          } else {
            // fallback check
            didWin = targetPocketed && !cuePocketed;
            multiplier = didWin ? 2.0 : 0;
          }

          setTimeout(() => {
            setGameState(didWin ? "win_screen" : "lose_screen");
            playSynthSound(didWin ? "win" : "lose");
            onCompleteRef.current(multiplier, didWin);
          }, 600);
        }
      }

      // 4. Render Guide lines / trajectory (Only when aiming)
      if (gameStateRef.current === "aiming") {
        const cueBall = ballsRef.current.find(b => b.isCueBall);
        if (cueBall && !cueBall.isPocketed) {
          const dx = Math.cos(cueAngle);
          const dy = Math.sin(cueAngle);

          // Find first hit target
          let closestHitBall: Ball | null = null;
          let closestDist = Infinity;
          let contactX = 0;
          let contactY = 0;

          ballsRef.current.forEach(target => {
            if (target.isCueBall || target.isPocketed) return;

            // Vector math projection to check collision intersection
            const toBallX = target.x - cueBall.x;
            const toBallY = target.y - cueBall.y;
            const projection = toBallX * dx + toBallY * dy;

            if (projection > 0) {
              const perpDist = Math.hypot(toBallX - projection * dx, toBallY - projection * dy);
              if (perpDist < BALL_RADIUS * 2) {
                // Potential intersection
                const a = 1;
                const b = -2 * projection;
                const c = toBallX * toBallX + toBallY * toBallY - 4 * BALL_RADIUS * BALL_RADIUS;
                const disc = b * b - 4 * a * c;

                if (disc >= 0) {
                  const dist = (-b - Math.sqrt(disc)) / 2;
                  if (dist < closestDist && dist > 0) {
                    closestDist = dist;
                    closestHitBall = target;
                    contactX = cueBall.x + dx * dist;
                    contactY = cueBall.y + dy * dist;
                  }
                }
              }
            }
          });

          // Draw main laser guideline
          ctx.strokeStyle = "rgba(0, 242, 254, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);

          ctx.beginPath();
          ctx.moveTo(cueBall.x, cueBall.y);
          if (closestHitBall) {
            ctx.lineTo(contactX, contactY);
            ctx.stroke();

            // Draw shadow ghost cue ball at intersection contact
            ctx.setLineDash([]);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
            ctx.beginPath();
            ctx.arc(contactX, contactY, BALL_RADIUS, 0, Math.PI * 2);
            ctx.stroke();

            // Draw Target Ball reflection deflection trajectory
            const targetBall: Ball = closestHitBall;
            const normX = (targetBall.x - contactX) / (BALL_RADIUS * 2);
            const normY = (targetBall.y - contactY) / (BALL_RADIUS * 2);

            ctx.strokeStyle = "rgba(236, 72, 153, 0.5)"; // Magenta guide for target
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(targetBall.x, targetBall.y);
            ctx.lineTo(targetBall.x + normX * 80, targetBall.y + normY * 80);
            ctx.stroke();

            // Draw Cue Ball tangent path trajectory
            const tangentX = -normY;
            const tangentY = normX;
            // Project relative to current angle dot product
            const dot = dx * tangentX + dy * tangentY;
            const pathSign = dot >= 0 ? 1 : -1;

            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.beginPath();
            ctx.moveTo(contactX, contactY);
            ctx.lineTo(contactX + tangentX * pathSign * 60, contactY + tangentY * pathSign * 60);
            ctx.stroke();
          } else {
            // guide hits cushion border
            let endX = cueBall.x + dx * 600;
            let endY = cueBall.y + dy * 600;

            // clamp at borders
            const lLimit = BALL_RADIUS + 8;
            const rLimit = TABLE_WIDTH - BALL_RADIUS - 8;
            const tLimit = BALL_RADIUS + 8;
            const bLimit = TABLE_HEIGHT - BALL_RADIUS - 8;

            if (endX < lLimit) {
              const scale = (lLimit - cueBall.x) / dx;
              endX = lLimit;
              endY = cueBall.y + dy * scale;
            } else if (endX > rLimit) {
              const scale = (rLimit - cueBall.x) / dx;
              endX = rLimit;
              endY = cueBall.y + dy * scale;
            }

            if (endY < tLimit) {
              const scale = (tLimit - cueBall.y) / dy;
              endY = cueBall.y + dx * scale; // simple clamp
              endX = cueBall.x + dx * scale;
              endY = tLimit;
            } else if (endY > bLimit) {
              const scale = (bLimit - cueBall.y) / dy;
              endX = cueBall.x + dx * scale;
              endY = bLimit;
            }

            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
          ctx.setLineDash([]); // Reset line dash
        }
      }

      // 5. Draw Balls
      ballsRef.current.forEach(ball => {
        if (ball.isPocketed && ball.opacity <= 0) return;

        // Fading out in pocket animation
        if (ball.isPocketed && ball.opacity > 0) {
          ball.opacity -= 0.05;
          ball.scale -= 0.05;
          if (ball.scale < 0) ball.scale = 0;
        }

        ctx.globalAlpha = ball.opacity;

        // A. Draw Volumetric Drop Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.arc(ball.x + 3, ball.y + 4, ball.radius * ball.scale, 0, Math.PI * 2);
        ctx.fill();

        // B. Ball Base sphere color
        const ballGrad = ctx.createRadialGradient(
          ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.1,
          ball.x, ball.y, ball.radius
        );

        if (ball.isCueBall) {
          ballGrad.addColorStop(0, "#ffffff");
          ballGrad.addColorStop(0.65, "#e2e8f0");
          ballGrad.addColorStop(1, "#94a3b8");
        } else {
          ballGrad.addColorStop(0, "#ffffff"); // shiny hot-spot
          ballGrad.addColorStop(0.2, ball.color);
          ballGrad.addColorStop(1, darkenColor(ball.color, 0.45));
        }

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * ball.scale, 0, Math.PI * 2);
        ctx.fill();

        // C. Draw shiny specular overlay arc (Glass polish check)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.75 * ball.scale, -Math.PI * 0.75, -Math.PI * 0.25);
        ctx.stroke();

        // D. Draw Number ID Badges (except for Cue ball)
        if (!ball.isCueBall && ball.scale > 0.4) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius * 0.4 * ball.scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#0f172a";
          ctx.font = `bold ${Math.max(6, 8 * ball.scale)}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ball.number.toString(), ball.x, ball.y);
        }

        ctx.globalAlpha = 1.0;
      });

      // 6. Draw particles/sparkles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 7. Draw physical cue stick in 3D (only when aiming)
      if (gameStateRef.current === "aiming") {
        const cueBall = ballsRef.current.find(b => b.isCueBall);
        if (cueBall && !cueBall.isPocketed) {
          const angle = cueAngle;
          const stickPull = (shotPower / 100) * 22; // pullback animation visual distance
          const startDist = stickPull + BALL_RADIUS + 12;
          const stickLength = 220;

          const dx = Math.cos(angle);
          const dy = Math.sin(angle);

          // Cue Stick Coordinates
          const cueX1 = cueBall.x - dx * startDist;
          const cueY1 = cueBall.y - dy * startDist;
          const cueX2 = cueBall.x - dx * (startDist + stickLength);
          const cueY2 = cueBall.y - dy * (startDist + stickLength);

          // Draw laser line glow
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#00f2fe";
          ctx.strokeStyle = "rgba(0, 242, 254, 0.85)";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(cueX1, cueY1);
          ctx.lineTo(cueX2, cueY2);
          ctx.stroke();

          // Laser tip accents
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(cueX1, cueY1, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [cueAngle, shotPower]);

  // Color modifier function
  const darkenColor = (hex: string, percent: number) => {
    let num = parseInt(hex.replace("#", ""), 16),
      amt = Math.round(2.55 * (percent * 100)),
      R = (num >> 16) - amt,
      G = (num >> 8 & 0x00FF) - amt,
      B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Cue Stick Rotation Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== "aiming") return;
    setIsDraggingCue(true);
    updateCueAngle(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingCue || gameState !== "aiming") return;
    updateCueAngle(e);
  };

  const handlePointerUp = () => {
    setIsDraggingCue(false);
  };

  const updateCueAngle = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Project coordinates
    const scaleX = TABLE_WIDTH / rect.width;
    const scaleY = TABLE_HEIGHT / rect.height;
    const canvasX = clientX * scaleX;
    const canvasY = clientY * scaleY;

    const cueBall = ballsRef.current.find(b => b.isCueBall);
    if (!cueBall) return;

    // Calculate heading angle from ball to pointer
    const dx = canvasX - cueBall.x;
    const dy = canvasY - cueBall.y;
    const angle = Math.atan2(dy, dx);
    setCueAngle(angle);

    // Dynamic win probability update based on heading vector alignment
    const idealAngle = 0; // facing towards rack
    const diff = Math.abs(Math.sin(angle - idealAngle));
    const prob = Number((85 - diff * 65 + Math.random() * 5).toFixed(1));
    setWinChance(Math.max(10, Math.min(98.8, prob)));
  };

  return (
    <div className="w-full h-full min-h-[380px] md:min-h-[600px] bg-slate-950 rounded-3xl border border-slate-800 p-3 md:p-8 flex flex-col items-center justify-between relative overflow-hidden shadow-2xl">
      
      {/* Background Volumetric Arena Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-900/15 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-40 bg-[linear-gradient(to_bottom,_rgba(6,182,212,0.1),_transparent)] blur-[60px] pointer-events-none" />

      {/* Cyber Lobby Header & Scoreboard */}
      <div className="w-full z-10 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
        
        {/* VIP Player Stats Card */}
        <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-bold text-xs text-cyan-400 font-mono">
              VIP
            </div>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Player</p>
            <p className="text-xs text-white font-black font-mono truncate max-w-[140px]">
              {email.split("@")[0]}
            </p>
          </div>
        </div>

        {/* AAA Center HUD Metrics */}
        <div className="flex items-center gap-6 md:gap-12">
          
          {/* Win Probability HUD */}
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">WIN PROBABILITY</span>
            <span className="text-2xl font-black font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              {winChance}%
            </span>
          </div>

          {/* Shot clock */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-4 py-1.5 rounded-xl">
            <Clock className="w-4 h-4 text-magenta-400 animate-pulse text-pink-400" />
            <span className="font-mono text-lg font-black text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]">
              {shotClock}s
            </span>
          </div>

          {/* Current Wager */}
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">CURRENT STAKE</span>
            <span className="text-xl font-black font-mono text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">
              ₹{betAmount}
            </span>
          </div>
        </div>

        {/* Audio Speaker Mute Toggle */}
        <button
          onClick={() => setIsMuted(prev => !prev)}
          className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-inner"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* 3D Render Perspective Table Box Container */}
      <div className="w-full flex-grow flex items-center justify-center z-10 py-6 overflow-hidden perspective-[1400px]">
        <div 
          className="relative w-full max-w-[800px] aspect-[2/1] rounded-[24px] bg-slate-900 border-[14px] border-slate-950 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.1)] transition-transform duration-1000 ease-out transform-style-3d overflow-hidden"
          style={{ transform: "rotateX(23deg)" }}
        >
          {/* Inner Rail Glow strip */}
          <div className="absolute inset-0 border border-cyan-500/25 pointer-events-none shadow-[inset_0_0_20px_rgba(6,182,212,0.15)] z-20" />

          {/* Table Felt Canvas */}
          <canvas
            ref={canvasRef}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full cursor-crosshair block select-none touch-none"
          />
        </div>
      </div>

      {/* Strike & Power Charging Controls */}
      <div className="w-full z-10 flex flex-col md:flex-row items-center gap-6 justify-between mt-4 border-t border-slate-800/60 pt-4">
        
        {/* Aim direction Fine-tuning controller */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCueAngle(prev => prev - 0.05)}
            disabled={gameState !== "aiming"}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center font-bold text-sm shadow-inner"
          >
            ↺
          </button>
          <span className="text-xs text-slate-400 font-black font-mono uppercase tracking-wider">
            Aim Fine-tune
          </span>
          <button
            onClick={() => setCueAngle(prev => prev + 0.05)}
            disabled={gameState !== "aiming"}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center font-bold text-sm shadow-inner"
          >
            ↻
          </button>
        </div>

        {/* Neon Power Meter Slide Controller */}
        <div className="flex-grow max-w-sm flex items-center gap-4">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="flex-grow relative flex items-center">
            {/* Background slider track */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative border border-slate-700 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-500 shadow-[0_0_10px_#00f2fe]"
                style={{ width: `${shotPower}%` }}
              />
            </div>
            {/* Input Slider */}
            <input
              type="range"
              min="10"
              max="100"
              value={shotPower}
              onChange={(e) => setShotPower(Number(e.target.value))}
              disabled={gameState !== "aiming"}
              className="absolute inset-x-0 w-full h-8 opacity-0 cursor-pointer disabled:pointer-events-none z-10"
            />
          </div>
          <span className="text-xs font-black font-mono text-cyan-400 w-10">
            {shotPower}%
          </span>
        </div>

        {/* Launch Trigger Button */}
        <button
          onClick={handleStrike}
          disabled={gameState !== "aiming"}
          className="relative px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-300/30 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 group"
        >
          <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
          STRIKE BALL
        </button>
      </div>

      {/* Cinematic Victory overlay */}
      <AnimatePresence>
        {gameState === "win_screen" && serverOutcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-6"
          >
            {/* Particle splash */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.15),_transparent_70%)]" />

            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 30 }}
              className="max-w-md w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-[32px] p-8 text-center relative shadow-[0_0_50px_rgba(6,182,212,0.3)]"
            >
              {/* Rotating Shiny Trophy */}
              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center bg-cyan-500/10 rounded-full border border-cyan-400/20 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                <Trophy className="w-14 h-14 text-cyan-400 drop-shadow-[0_0_15px_#00f2fe] animate-bounce" />
              </div>

              <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase block mb-1">
                VICTORY DETECTED
              </span>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">
                GREAT SHOT!
              </h2>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
                <div className="text-left border-r border-slate-800/50 pr-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Multiplier</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {serverOutcome.multiplier.toFixed(2)}x
                  </span>
                </div>
                <div className="text-left pl-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Payout</span>
                  <span className="text-2xl font-black font-mono text-yellow-400">
                    ₹{serverOutcome.payout.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setGameState("idle");
                  initBalls();
                  onComplete(0, false); // tell page that we are reset
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Defeat overlay */}
      <AnimatePresence>
        {gameState === "lose_screen" && serverOutcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 30 }}
              className="max-w-md w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/20 rounded-[32px] p-8 text-center relative shadow-[0_0_50px_rgba(244,114,182,0.15)]"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-pink-500/10 rounded-full border border-pink-400/20 shadow-[0_0_15px_rgba(244,114,182,0.1)]">
                <AlertTriangle className="w-10 h-10 text-pink-400" />
              </div>

              <span className="text-[10px] text-pink-400 font-black tracking-widest uppercase block mb-1">
                ROUND CLOSED
              </span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-6">
                SCRATCHED OR MISSED
              </h2>

              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Your cue ball scratched or the shot missed the target pockets. Refine your laser guides and try again!
              </p>

              <button
                onClick={() => {
                  setGameState("idle");
                  initBalls();
                  onComplete(0, false);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-300 hover:text-white font-black uppercase text-sm tracking-widest border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
