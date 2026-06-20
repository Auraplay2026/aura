"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { AlertTriangle, Crosshair } from "lucide-react";
import { startCrashAudio, updateCrashPitch, stopCrashAudio } from "@/lib/audio";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Star {
  x: number;
  y: number;
  size: number;
  twinklePeriod: number;
  twinklePhase: number;
  hue: number;       // 0 = white, otherwise coloured
  layer: 0 | 1 | 2; // 0=deep, 1=mid, 2=foreground
}

interface GalaxyStar {
  angle: number;
  radius: number;
  arm: number;
  dispersion: number;
  size: number;
  brightness: number;
}

interface NebulaNode {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
  rotSpeed: number;
  swayX: number;
  swayY: number;
  swayPhase: number;
  color: string;
  opacity: number;
}

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;   // 0 → 1
  maxLife: number;
  sparks: { x: number; y: number; vx: number; vy: number; life: number }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LAYER_SPEEDS = [0.005, 0.03, 0.15];
const STAR_COUNTS  = [250, 120, 60];
const STAR_SIZES   = [0.8, 1.2, 1.8];

// Warp tier thresholds
const TIER_NONE       = 1;
const TIER_HYPERSPACE = 25;
const TIER_LEGENDARY  = 50;
const TIER_MYTHIC     = 100;

// Nebula palettes keyed by phase
const NEBULA_PALETTES: Record<string, string[][]> = {
  launch:      [["#4ade80","#312e81"], ["#6366f1","#14532d"]],
  accel:       [["#22d3ee","#dc2626"], ["#7c3aed","#0e7490"]],
  hyperspace:  [["#7c3aed","#ffd700"], ["#be185d","#1e1b4b"]],
};

// Chromatic hue palette for mid-layer stars
const MID_HUES = [180, 300, 45, 0]; // cyan, magenta, gold, white

// ─── Seeded RNG helper ────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

// ─── Star Generation ──────────────────────────────────────────────────────────

function generateStarfield(): Star[] {
  const rng = seededRng(42);
  const stars: Star[] = [];
  for (let layer = 0; layer < 3; layer++) {
    const count = STAR_COUNTS[layer];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rng(),
        y: rng(),
        size: STAR_SIZES[layer] * (0.6 + rng() * 0.8),
        twinklePeriod: 1.5 + rng() * 4,
        twinklePhase: rng() * Math.PI * 2,
        hue: layer === 1 ? MID_HUES[Math.floor(rng() * MID_HUES.length)] : 0,
        layer: layer as 0 | 1 | 2,
      });
    }
  }
  return stars;
}

// ─── Galaxy Star Generation ───────────────────────────────────────────────────

function generateGalaxy(count: number, arms: number, spread: number, rng: () => number): GalaxyStar[] {
  const stars: GalaxyStar[] = [];
  const a = 0.3, b = 0.15; // logarithmic spiral params
  for (let i = 0; i < count; i++) {
    const arm  = Math.floor(rng() * arms);
    const t    = rng() * 4 * Math.PI; // how far along the arm
    const r    = a * Math.exp(b * t);
    const baseAngle = (arm / arms) * Math.PI * 2 + t;
    const dispX = (rng() - 0.5) * spread;
    const dispY = (rng() - 0.5) * spread;
    stars.push({
      angle: baseAngle,
      radius: r,
      arm,
      dispersion: Math.sqrt(dispX * dispX + dispY * dispY),
      size: 0.4 + rng() * 1.6,
      brightness: 0.3 + rng() * 0.7,
    });
  }
  return stars;
}

const GALAXY_STARS     = generateGalaxy(350, 2, 0.15, seededRng(7));
const COMPANION_STARS  = generateGalaxy(120, 2, 0.25, seededRng(13));

// ─── Nebula Node Generation ────────────────────────────────────────────────────

function generateNebula(count: number, palette: string[], rng: () => number, w: number, h: number): NebulaNode[] {
  const nodes: NebulaNode[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x:          rng() * w,
      y:          rng() * h,
      rx:         60 + rng() * 200,
      ry:         40 + rng() * 140,
      rotation:   rng() * 360,
      rotSpeed:   (rng() - 0.5) * 0.004,
      swayX:      (rng() - 0.5) * 30,
      swayY:      (rng() - 0.5) * 20,
      swayPhase:  rng() * Math.PI * 2,
      color:      palette[Math.floor(rng() * palette.length)],
      opacity:    0.04 + rng() * 0.09,
    });
  }
  return nodes;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CrashEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  autoCashout?: number;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CrashEngine({ isPlaying, betAmount = 10, autoCashout, onLiveTick, onComplete }: CrashEngineProps) {
  const [multiplier, setMultiplier]   = useState(1.0);
  const [crashed, setCrashed]         = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [yPos, setYPos]               = useState(0);

  const graphRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  // Animation state in refs to avoid stale closures
  const timeRef       = useRef(0);
  const scrollRef     = useRef(0);
  const galaxyRotRef  = useRef(0);
  const shootingStars = useRef<ShootingStar[]>([]);
  const nextShootRef  = useRef(0);
  const ssIdRef       = useRef(0);
  const starsRef      = useRef<Star[]>(generateStarfield());
  const multiplierRef = useRef(1.0);
  const isPlayingRef  = useRef(isPlaying);
  const crashedRef    = useRef(crashed);

  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);
  useEffect(() => { isPlayingRef.current  = isPlaying;  }, [isPlaying]);
  useEffect(() => { crashedRef.current    = crashed;    }, [crashed]);

  // ── Game Logic Refs ────────────────────────────────────────────────────────
  const onCompleteRef    = useRef(onComplete);
  const hasCashedOutRef  = useRef(hasCashedOut);
  const onLiveTickRef    = useRef(onLiveTick);
  useEffect(() => { onCompleteRef.current   = onComplete;   }, [onComplete]);
  useEffect(() => { hasCashedOutRef.current = hasCashedOut; }, [hasCashedOut]);
  useEffect(() => { onLiveTickRef.current   = onLiveTick;   }, [onLiveTick]);

  // ── Canvas Renderer ────────────────────────────────────────────────────────

  const renderFrame = useCallback((canvas: HTMLCanvasElement) => {
    const ctx  = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const t = timeRef.current;
    const mult = multiplierRef.current;
    const playing = isPlayingRef.current;

    // Velocity factor (0 = idle, 1 = max warp)
    const velocity = Math.min(1, Math.max(0, (mult - 1) / (TIER_MYTHIC - 1)));
    const isWarpActive = mult >= TIER_HYPERSPACE;

    // Phase for nebula colours
    const phase = mult >= TIER_MYTHIC ? "hyperspace"
                : mult >= TIER_HYPERSPACE ? "hyperspace"
                : mult >= 5 ? "accel"
                : "launch";

    // ── 1. Clear with deep space gradient ─────────────────────────────────
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.75);
    if (phase === "hyperspace") {
      bg.addColorStop(0,   "rgba(25,  10,  60, 1)");
      bg.addColorStop(0.6, "rgba(10,   5,  25, 1)");
      bg.addColorStop(1,   "rgba(0,    0,   5, 1)");
    } else if (phase === "accel") {
      bg.addColorStop(0,   "rgba(8,   18,  40, 1)");
      bg.addColorStop(0.6, "rgba(4,   10,  20, 1)");
      bg.addColorStop(1,   "rgba(0,    0,   5, 1)");
    } else {
      bg.addColorStop(0,   "rgba(5,   12,  30, 1)");
      bg.addColorStop(0.6, "rgba(3,    8,  18, 1)");
      bg.addColorStop(1,   "rgba(0,    0,   5, 1)");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── 2. Volumetric Nebulae ─────────────────────────────────────────────
    const nbRng   = seededRng(99);
    const palette = NEBULA_PALETTES[phase];
    const nodeCount = 12;
    ctx.save();
    for (let i = 0; i < nodeCount; i++) {
      const nx  = nbRng() * W;
      const ny  = nbRng() * H;
      const rx  = 70 + nbRng() * 220;
      const ry  = 45 + nbRng() * 150;
      const rot = nbRng() * 360 + t * ((nbRng() - 0.5) * 0.25);
      const sx  = Math.sin(t * 0.35 + nbRng() * Math.PI * 2) * 28;
      const sy  = Math.cos(t * 0.27 + nbRng() * Math.PI * 2) * 18;
      const col = palette[Math.floor(nbRng() * palette.length)][Math.floor(nbRng() * palette[0].length)];
      const op  = 0.04 + nbRng() * 0.09;

      ctx.save();
      ctx.translate(nx + sx, ny + sy);
      ctx.rotate((rot * Math.PI) / 180);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      grad.addColorStop(0,   hexAlpha(col, op * 2.2));
      grad.addColorStop(0.4, hexAlpha(col, op));
      grad.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.scale(1, ry / rx);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // ── 3. Companion (Barred Spiral) Galaxy ────────────────────────────────
    const cgx = W * 0.82, cgy = H * 0.18;
    const cgScale = Math.min(W, H) * 0.08;
    const cgRot = galaxyRotRef.current * 0.4;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.translate(cgx, cgy);
    ctx.scale(1, 0.38); // highly tilted
    // Core glow
    const cgGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, cgScale * 0.3);
    cgGrad.addColorStop(0, "rgba(255,180,255,0.9)");
    cgGrad.addColorStop(0.5,"rgba(180,80,220,0.4)");
    cgGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cgGrad;
    ctx.beginPath();
    ctx.arc(0, 0, cgScale * 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Barred arms + stars
    for (const gs of COMPANION_STARS) {
      const a  = gs.angle + cgRot;
      const r  = gs.radius * cgScale * 1.5;
      const sx = Math.cos(a) * r + (Math.random() - 0.5) * cgScale * 0.1;
      const sy = Math.sin(a) * r + (Math.random() - 0.5) * cgScale * 0.1;
      ctx.globalAlpha = gs.brightness * 0.4;
      ctx.fillStyle = `hsl(280, 70%, ${55 + gs.brightness * 30}%)`;
      ctx.beginPath();
      ctx.arc(sx, sy, gs.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── 4. Primary Andromeda-style Galaxy ─────────────────────────────────
    const gx = W * 0.35, gy = H * 0.38;
    const gScale = Math.min(W, H) * 0.22;
    const gRot = galaxyRotRef.current;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(gx, gy);
    // Volumetric core
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, gScale * 0.15);
    coreGrad.addColorStop(0,   "rgba(255, 248, 230, 1)");
    coreGrad.addColorStop(0.3, "rgba(120, 200, 255, 0.6)");
    coreGrad.addColorStop(0.7, "rgba(100,  60, 200, 0.3)");
    coreGrad.addColorStop(1,   "rgba(0,    0,   0,  0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, gScale * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Spiral arm stars
    for (const gs of GALAXY_STARS) {
      const a  = gs.angle + gRot + (gs.arm * Math.PI);
      const r  = gs.radius * gScale;
      const sx = Math.cos(a) * r + (Math.random() - 0.5) * gs.dispersion * gScale * 0.5;
      const sy = Math.sin(a) * r * 0.55 + (Math.random() - 0.5) * gs.dispersion * gScale * 0.25;
      // Color based on arm distance: core = warm white, outer = cyan/violet
      const dist = r / gScale;
      const hue  = 180 + (dist * 120);
      const sat  = 40 + dist * 50;
      const lig  = 55 + gs.brightness * 35;
      ctx.globalAlpha = gs.brightness * (0.5 - dist * 0.25);
      ctx.fillStyle = dist < 0.15
        ? `rgba(255, 248, 220, ${gs.brightness * 0.9})`
        : `hsl(${hue}, ${sat}%, ${lig}%)`;
      ctx.beginPath();
      ctx.arc(sx, sy, gs.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── 5. Star Layers (Parallax) ──────────────────────────────────────────
    ctx.globalAlpha = 1;
    const scroll = scrollRef.current;
    for (const star of starsRef.current) {
      const speed = LAYER_SPEEDS[star.layer];
      const sx = ((star.x + scroll * speed) % 1) * W;
      const sy = star.y * H;

      // Twinkle
      const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / star.twinklePeriod + star.twinklePhase));

      // Warp stretch (foreground layer only when active)
      let drawSize = star.size;
      let streakLen = 0;
      if (star.layer === 2 && isWarpActive && playing) {
        const stretch = 1 + velocity * 25;
        streakLen = star.size * stretch;
      }

      const col = star.hue === 0
        ? `rgba(255,255,255,${twinkle * (0.5 + star.size * 0.25)})`
        : `hsla(${star.hue}, 80%, 75%, ${twinkle * 0.7})`;

      if (streakLen > 0) {
        // Draw warp streak
        ctx.save();
        const warpGrad = ctx.createLinearGradient(sx - streakLen, sy, sx, sy);
        warpGrad.addColorStop(0, "rgba(255,255,255,0)");
        warpGrad.addColorStop(1, col);
        ctx.strokeStyle = warpGrad;
        ctx.lineWidth = drawSize;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sx - streakLen, sy);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(sx, sy, drawSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── 6. Shooting Stars / Meteors ────────────────────────────────────────
    const now = t;
    if (now > nextShootRef.current) {
      const angle  = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
      const speed_ = 600 + Math.random() * 400;
      shootingStars.current.push({
        id:      ssIdRef.current++,
        x:       Math.random() * W,
        y:       Math.random() * H * 0.5,
        vx:      Math.cos(angle) * speed_,
        vy:      Math.sin(angle) * speed_,
        length:  80 + Math.random() * 120,
        opacity: 1,
        life:    0,
        maxLife: 0.7 + Math.random() * 0.5,
        sparks:  [],
      });
      nextShootRef.current = now + 3 + Math.random() * 3;
    }

    const dt = 1 / 60;
    shootingStars.current = shootingStars.current.filter(ss => ss.life < ss.maxLife);
    for (const ss of shootingStars.current) {
      ss.life += dt;
      ss.x += ss.vx * dt;
      ss.y += ss.vy * dt;
      const progress = ss.life / ss.maxLife;
      const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;

      // Spawn sparks
      if (Math.random() < 0.3) {
        ss.sparks.push({
          x: ss.x, y: ss.y,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          life: 0.3 + Math.random() * 0.3,
        });
      }
      ss.sparks = ss.sparks.filter(sp => sp.life > 0);
      for (const sp of ss.sparks) {
        sp.life -= dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        ctx.globalAlpha = (sp.life / 0.4) * alpha * 0.6;
        ctx.fillStyle = "rgba(255,220,180,1)";
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw meteor streak
      const tailX = ss.x - Math.cos(Math.atan2(ss.vy, ss.vx)) * ss.length;
      const tailY = ss.y - Math.sin(Math.atan2(ss.vy, ss.vx)) * ss.length;
      const mGrad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      mGrad.addColorStop(0, "rgba(255,255,255,0)");
      mGrad.addColorStop(0.7,"rgba(200,220,255,0.4)");
      mGrad.addColorStop(1, `rgba(255,255,255,${alpha})`);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = mGrad;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── 7. Vignette Edge Gradient ─────────────────────────────────────────
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, W * 0.75);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.65,"rgba(0,0,0,0)");
    vignette.addColorStop(1,  "rgba(0,0,0,0.75)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // ── 8. Hyperspace colour-grade overlay ────────────────────────────────
    if (isWarpActive && playing) {
      const intensity = Math.min(0.18, (mult - TIER_HYPERSPACE) / (TIER_MYTHIC - TIER_HYPERSPACE) * 0.18);
      ctx.fillStyle = `rgba(80, 0, 180, ${intensity})`;
      ctx.fillRect(0, 0, W, H);
    }
  }, []);

  // ── Animation Loop ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      timeRef.current      += dt;
      galaxyRotRef.current += 0.0012;
      scrollRef.current    -= dt * 60; // pixel scroll per second base

      // Resize canvas to element
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width  = rect.width;
        canvas.height = rect.height;
      }

      renderFrame(canvas);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [renderFrame]);

  // ── Game Logic ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isPlaying) {
      setMultiplier(1.0);
      setCrashed(false);
      setHasCashedOut(false);
      setYPos(0);
      stopCrashAudio(false);
      return;
    }

    startCrashAudio();

    const outcome = calculateGameOutcome("CRASH");
    const target  = outcome.multiplier;

    let current = 1.0;
    const interval = setInterval(() => {
      current += 0.01 + (current * 0.015);
      updateCrashPitch(current);

      const maxHeight = (graphRef.current?.clientHeight || 400) * 0.7;
      const height    = Math.min(maxHeight, Math.log10(current) * maxHeight * 1.5);
      setYPos(height);

      if (current >= target) {
        clearInterval(interval);
        setMultiplier(target);
        setCrashed(true);
        stopCrashAudio(true);
        if (!hasCashedOutRef.current) {
          onCompleteRef.current(target, false);
        }
      } else {
        setMultiplier(current);
        onLiveTickRef.current?.(current);

        if (autoCashout && current >= autoCashout && !hasCashedOutRef.current) {
          clearInterval(interval);
          setHasCashedOut(true);
          stopCrashAudio(false);
          onCompleteRef.current(current, true);
        }
      }
    }, 50);

    return () => {
      clearInterval(interval);
      stopCrashAudio(false);
    };
  }, [isPlaying, autoCashout]);

  const handleCashout = () => {
    if (crashed || hasCashedOut || !isPlaying) return;
    setHasCashedOut(true);
    stopCrashAudio(false);
    onCompleteRef.current(multiplier, true);
  };

  useEffect(() => {
    const handleTriggerCashout = () => {
      if (isPlaying && !crashed && !hasCashedOut) handleCashout();
    };
    window.addEventListener("trigger-cashout",         handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout",         handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [isPlaying, crashed, hasCashedOut, multiplier]);

  // ── Multiplier colour tier ─────────────────────────────────────────────────
  const multColor =
    crashed      ? "text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]"     :
    hasCashedOut ? "text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.9)]" :
    multiplier >= TIER_MYTHIC     ? "text-yellow-200 drop-shadow-[0_0_40px_rgba(255,215,0,1)]"   :
    multiplier >= TIER_LEGENDARY  ? "text-fuchsia-300 drop-shadow-[0_0_35px_rgba(217,70,239,0.9)]" :
    multiplier >= TIER_HYPERSPACE ? "text-cyan-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.9)]"   :
    "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]";

  // ── Shake intensity ────────────────────────────────────────────────────────
  const shakeAmt =
    multiplier > 100 ? 4 :
    multiplier > 50  ? 3 :
    multiplier > 20  ? 2.5 :
    multiplier > 10  ? 2 :
    multiplier > 5   ? 1 : 0;

  const shakeArr = shakeAmt > 0
    ? ([-shakeAmt, shakeAmt, -shakeAmt, shakeAmt, 0] as number[])
    : ([0] as number[]);

  return (
    <motion.div
      animate={
        crashed   ? { x: 0, y: 0 } :
        isPlaying ? { x: shakeArr, y: shakeArr } :
        { x: 0, y: 0 }
      }
      transition={isPlaying ? { repeat: Infinity, duration: 0.08 } : {}}
      className="w-full h-full min-h-[500px] rounded-3xl border border-white/5 relative flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"
    >
      {/* ── Cinematic Canvas Background ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* ── Tactical Radar Grid ── */}
      <div
        className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize:     "40px 40px",
          backgroundPosition: "center center",
        }}
      />

      {/* ── Sweeping Radar Scanline ── */}
      <motion.div
        animate={{ top: ["-10%", "110%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        className="absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-emerald-500/8 to-emerald-500/20 border-b border-emerald-500/30 z-0 pointer-events-none"
      />

      {/* ── Axis Labels ── */}
      <div className="absolute left-4 top-4 bottom-4 w-12 border-r border-emerald-300/30 flex flex-col justify-between py-10 z-0 opacity-40 font-mono text-[10px] text-emerald-400">
        <span>100x</span>
        <span>50x</span>
        <span>10x</span>
        <span>2x</span>
        <span>1x</span>
      </div>

      {/* ── Multiplier Display ── */}
      <motion.div
        animate={crashed ? { scale: [1, 1.1, 1], filter: ["blur(0px)", "blur(10px)", "blur(0px)"] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className="z-20 relative flex flex-col items-center"
      >
        <motion.div
          animate={crashed ? { scale: [1, 1.2, 1], rotate: [-2, 2, -2, 2, 0] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`text-6xl md:text-8xl font-black font-mono tracking-tighter ${multColor}`}
        >
          {multiplier.toFixed(2)}x
        </motion.div>

        {/* Tier label badge */}
        <AnimatePresence>
          {isPlaying && !crashed && multiplier >= TIER_HYPERSPACE && (
            <motion.div
              key="tier-badge"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border"
              style={{
                background: multiplier >= TIER_MYTHIC
                  ? "rgba(255,215,0,0.12)"
                  : multiplier >= TIER_LEGENDARY
                    ? "rgba(217,70,239,0.12)"
                    : "rgba(34,211,238,0.12)",
                borderColor: multiplier >= TIER_MYTHIC
                  ? "rgba(255,215,0,0.4)"
                  : multiplier >= TIER_LEGENDARY
                    ? "rgba(217,70,239,0.4)"
                    : "rgba(34,211,238,0.4)",
                color: multiplier >= TIER_MYTHIC
                  ? "#ffd700"
                  : multiplier >= TIER_LEGENDARY
                    ? "#e879f9"
                    : "#22d3ee",
              }}
            >
              {multiplier >= TIER_MYTHIC ? "⚡ MYTHIC" : multiplier >= TIER_LEGENDARY ? "★ LEGENDARY" : "✦ HYPERSPACE"}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasCashedOut && !crashed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 px-6 py-2 bg-emerald-900/20 border border-emerald-500/30 rounded-xl backdrop-blur-md flex flex-col items-center shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Secured</span>
              <span className="text-white font-black text-xl">₹{(betAmount * multiplier).toFixed(2)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Cashout Button ── */}
      <AnimatePresence>
        {isPlaying && !crashed && !hasCashedOut && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-8 z-50 w-[90%] max-w-[300px]"
          >
            <button
              onClick={handleCashout}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-black text-xl md:text-2xl rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95"
            >
              <span>Cashout</span>
              <span className="bg-black/20 px-3 py-1 rounded-lg">
                ₹{(betAmount * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rocket & Trajectory Graph ── */}
      <div ref={graphRef} className="absolute inset-x-16 inset-y-10 z-10 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <motion.path
            d={`M 0,${graphRef.current?.clientHeight || 400} Q ${isPlaying ? 200 : 0},${(graphRef.current?.clientHeight || 400) - yPos} ${isPlaying ? 400 : 0},${(graphRef.current?.clientHeight || 400) - yPos}`}
            fill="none"
            stroke={crashed ? "#ef4444" : "#10b981"}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${crashed ? "#ef4444" : "#10b981"})` }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: isPlaying ? 1 : 0 }}
            transition={{ duration: 0.1 }}
          />
        </svg>

        {/* Rocket */}
        <AnimatePresence>
          {!crashed && isPlaying && (
            <motion.div
              className="absolute w-20 h-40 -ml-10 -mt-20"
              initial={{ left: 0, bottom: 0 }}
              animate={{ left: "400px", bottom: `${yPos}px`, rotate: 45 }}
              transition={{ ease: "linear", duration: 0.1 }}
            >
              <motion.div
                animate={{ y: [-2, 2, -2], x: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 0.05 }}
                className="w-full h-full relative"
              >
                <svg viewBox="0 0 100 200" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                  <path d="M50,10 C50,10 70,50 70,120 L30,120 C30,50 50,10 50,10 Z" fill="#e2e8f0" />
                  <path d="M50,10 C50,10 60,50 60,120 L40,120 C40,50 50,10 50,10 Z" fill="#cbd5e1" />
                  <path d="M70,100 L90,140 L70,120 Z" fill="#94a3b8" />
                  <path d="M30,100 L10,140 L30,120 Z" fill="#94a3b8" />
                  <rect x="40" y="120" width="20" height="10" fill="#334155" />
                  <rect x="35" y="130" width="30" height="15" fill="#1e293b" />
                </svg>
                <motion.div
                  className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-8 h-24 bg-gradient-to-t from-transparent via-orange-500 to-yellow-300 rounded-full blur-md opacity-80"
                  style={{ transform: `scale(${Math.min(2.5, 1.0 + (multiplier - 1.0) * 0.1)}) translateX(-50%)`, transformOrigin: "top center" }}
                  animate={{ scaleY: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.1 }}
                />
                <motion.div
                  className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 w-4 h-12 bg-white rounded-full blur-sm"
                  style={{ transform: `scale(${Math.min(2.2, 1.0 + (multiplier - 1.0) * 0.08)}) translateX(-50%)`, transformOrigin: "top center" }}
                  animate={{ scaleY: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.05 }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explosion */}
        <AnimatePresence>
          {crashed && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 3, 4], opacity: [1, 1, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute w-64 h-64 -ml-32 -mb-32 rounded-full mix-blend-screen"
              style={{
                left: "400px",
                bottom: `${yPos}px`,
                background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(239,68,68,1) 30%, rgba(0,0,0,0) 70%)",
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a CSS hex colour string + alpha to an rgba() string */
function hexAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#")) return `rgba(100,100,200,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
