"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startCrashAudio, updateCrashPitch, stopCrashAudio } from "@/lib/audio";
import { useTradingStore } from "@/lib/store";

interface CrashEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  autoCashout?: number;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

// ─── Types ───────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; size: number;
  color: string; type: "exhaust" | "spark" | "explosion" | "streak" | "shockwave" | "cashout";
}
interface Star { x: number; y: number; size: number; speed: number; brightness: number; }
interface TrailPoint { x: number; y: number; mult: number; time: number; }

// ─── Multiplier → Tier System ────────────────────────────────
function getTier(m: number): { name: string; color: string; glow: string; secondary: string; intensity: number } {
  if (m >= 100) return { name: "legendary", color: "#fbbf24", glow: "rgba(251,191,36,0.9)", secondary: "#f59e0b", intensity: 1.0 };
  if (m >= 50)  return { name: "cosmic",    color: "#a78bfa", glow: "rgba(167,139,250,0.85)", secondary: "#c4b5fd", intensity: 0.88 };
  if (m >= 25)  return { name: "hyper",     color: "#f97316", glow: "rgba(249,115,22,0.8)", secondary: "#fb923c", intensity: 0.75 };
  if (m >= 10)  return { name: "surge",     color: "#ef4444", glow: "rgba(239,68,68,0.7)", secondary: "#f87171", intensity: 0.6 };
  if (m >= 5)   return { name: "boost",     color: "#06b6d4", glow: "rgba(6,182,212,0.6)", secondary: "#22d3ee", intensity: 0.45 };
  if (m >= 2)   return { name: "climb",     color: "#10b981", glow: "rgba(16,185,129,0.5)", secondary: "#34d399", intensity: 0.3 };
  return { name: "launch", color: "#10b981", glow: "rgba(16,185,129,0.4)", secondary: "#6ee7b7", intensity: 0.15 };
}

export function CrashEngine({ isPlaying, betAmount = 10, autoCashout, onLiveTick, onComplete }: CrashEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const stateRef = useRef({
    multiplier: 1.0,
    crashed: false,
    cashedOut: false,
    isPlaying: false,
    sessionId: null as string | null,
    tick: 0,
    // Ship position in WORLD space (camera offsets applied during render)
    shipWorldX: 0,
    shipWorldY: 0,
    trailPoints: [] as TrailPoint[],
    particles: [] as Particle[],
    stars: [] as Star[],
    explosionTime: 0,
    cameraShake: 0,
    // Camera
    cameraX: 0, cameraY: 0, cameraZoom: 1,
    // Idle engine charge
    engineCharge: 0,
    // Post-crash silence timer
    silenceTimer: 0,
  });

  const [uiState, setUiState] = useState({
    multiplier: 1.0, crashed: false, cashedOut: false,
    cashoutAmount: 0, phase: "idle" as "idle" | "flying" | "crashed" | "cashedout",
  });

  const currentUser = useTradingStore(s => s.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const onLiveTickRef = useRef(onLiveTick);
  useEffect(() => { onLiveTickRef.current = onLiveTick; }, [onLiveTick]);

  // ─── Init Stars ───────────────────────────────────────────
  const initStars = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 350; i++) {
      stars.push({
        x: Math.random() * w * 3 - w, // wider than screen for camera pan
        y: Math.random() * h * 3 - h,
        size: Math.random() * 2 + 0.4,
        speed: 0.3 + Math.random() * 2,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    stateRef.current.stars = stars;
  }, []);

  // ─── Spawn Particles ──────────────────────────────────────
  const spawnParticles = (x: number, y: number, type: Particle["type"], color: string, count: number, spread = 1) => {
    const p = stateRef.current.particles;
    for (let i = 0; i < count; i++) {
      const angle = type === "exhaust"
        ? Math.PI * 0.5 + (Math.random() - 0.5) * 0.8  // downward cone
        : Math.random() * Math.PI * 2;
      const speed = type === "explosion" ? 2 + Math.random() * 10 * spread
        : type === "shockwave" ? 5 + Math.random() * 3
        : type === "cashout" ? 2 + Math.random() * 6
        : 0.5 + Math.random() * 3 * spread;
      p.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, size: type === "explosion" ? 3 + Math.random() * 8 : type === "shockwave" ? 2 : 1.5 + Math.random() * 3,
        color, type,
      });
    }
    if (p.length > 600) p.splice(0, p.length - 600);
  };

  // ─── Draw Ship ────────────────────────────────────────────
  const drawShip = (ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, mult: number, tier: ReturnType<typeof getTier>) => {
    const scale = 1 + Math.min(0.3, mult * 0.003); // slight grow at high mult
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // ── Engine exhaust flame ──
    const flameLen = 25 + mult * 1.5 + Math.sin(stateRef.current.tick * 0.3) * 8;
    const flameWidth = 14 + mult * 0.3;
    // Outer flame (orange/yellow)
    const outerFlame = ctx.createRadialGradient(0, 34, 2, 0, 34 + flameLen * 0.6, flameLen);
    outerFlame.addColorStop(0, "rgba(255,200,50,0.95)");
    outerFlame.addColorStop(0.3, "rgba(255,100,20,0.7)");
    outerFlame.addColorStop(0.7, tier.glow.replace(/[\d.]+\)$/, "0.3)"));
    outerFlame.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = outerFlame;
    ctx.beginPath();
    ctx.ellipse(0, 34 + flameLen * 0.4, flameWidth, flameLen, 0, 0, Math.PI * 2);
    ctx.fill();
    // Core flame (white)
    const coreFlame = ctx.createRadialGradient(0, 34, 1, 0, 34 + flameLen * 0.3, flameLen * 0.5);
    coreFlame.addColorStop(0, "rgba(255,255,255,0.95)");
    coreFlame.addColorStop(0.5, "rgba(200,220,255,0.5)");
    coreFlame.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = coreFlame;
    ctx.beginPath();
    ctx.ellipse(0, 34 + flameLen * 0.2, flameWidth * 0.4, flameLen * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Ship Body ──
    // Fuselage glow
    ctx.shadowBlur = 15 + mult * 0.3;
    ctx.shadowColor = tier.glow;
    // Main body
    const bodyG = ctx.createLinearGradient(-16, -36, 16, 36);
    bodyG.addColorStop(0, "#e2e8f0");
    bodyG.addColorStop(0.3, "#94a3b8");
    bodyG.addColorStop(0.7, "#475569");
    bodyG.addColorStop(1, "#1e293b");
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.bezierCurveTo(18, -14, 16, 14, 12, 34);
    ctx.lineTo(-12, 34);
    ctx.bezierCurveTo(-16, 14, -18, -14, 0, -36);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Accent stripe
    ctx.fillStyle = tier.color + "88";
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(6, -12, 5, 8, 4, 28);
    ctx.lineTo(-4, 28);
    ctx.bezierCurveTo(-5, 8, -6, -12, 0, -28);
    ctx.closePath();
    ctx.fill();

    // Cockpit window
    const cockG = ctx.createRadialGradient(-3, -20, 0, 0, -18, 10);
    cockG.addColorStop(0, "rgba(140,220,255,0.95)");
    cockG.addColorStop(0.5, "rgba(40,120,200,0.7)");
    cockG.addColorStop(1, "rgba(10,30,60,0.4)");
    ctx.fillStyle = cockG;
    ctx.beginPath();
    ctx.ellipse(0, -18, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cockpit shine
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.ellipse(-2, -22, 3, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = "#334155";
    ctx.beginPath(); ctx.moveTo(12, 12); ctx.lineTo(32, 34); ctx.lineTo(12, 30); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, 12); ctx.lineTo(-32, 34); ctx.lineTo(-12, 30); ctx.closePath(); ctx.fill();
    // Wing accent
    ctx.fillStyle = tier.color + "55";
    ctx.beginPath(); ctx.moveTo(14, 18); ctx.lineTo(28, 32); ctx.lineTo(14, 28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14, 18); ctx.lineTo(-28, 32); ctx.lineTo(-14, 28); ctx.closePath(); ctx.fill();

    // Engine nozzle
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(-8, 28, 16, 8, 2);
    ctx.fill();
    ctx.fillStyle = tier.color + "cc";
    ctx.beginPath();
    ctx.roundRect(-6, 30, 12, 4, 1);
    ctx.fill();

    ctx.restore();
  };

  // ─── Main Canvas Renderer ─────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const s = stateRef.current;
    const tier = getTier(s.multiplier);
    const t = Date.now() * 0.001;

    // ── Camera System ──────────────────────────────────────
    let targetCamX = 0, targetCamY = 0, targetZoom = 1;
    if (s.isPlaying && !s.crashed) {
      // Camera follows ship, keeping it at ~35% from left, ~55% from top
      targetCamX = s.shipWorldX - W * 0.35;
      targetCamY = s.shipWorldY - H * 0.55;
      // Dynamic zoom based on multiplier — zooms out as it climbs
      targetZoom = Math.max(0.55, 1.0 - Math.log10(Math.max(1, s.multiplier)) * 0.18);
    } else if (s.crashed) {
      // Hold on crash position, zoom in slightly
      targetCamX = s.shipWorldX - W * 0.5;
      targetCamY = s.shipWorldY - H * 0.45;
      targetZoom = 0.9;
    }
    // Smooth camera interpolation
    s.cameraX += (targetCamX - s.cameraX) * 0.06;
    s.cameraY += (targetCamY - s.cameraY) * 0.06;
    s.cameraZoom += (targetZoom - s.cameraZoom) * 0.04;

    // Camera shake
    let shakeX = 0, shakeY = 0;
    if (s.cameraShake > 0) {
      shakeX = (Math.random() - 0.5) * s.cameraShake;
      shakeY = (Math.random() - 0.5) * s.cameraShake;
      s.cameraShake *= 0.88;
      if (s.cameraShake < 0.1) s.cameraShake = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // ══════════════════════════════════════════════════════════
    // BACKGROUND LAYER
    // ══════════════════════════════════════════════════════════
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.5, Math.max(W, H));
    const bgIntensity = tier.intensity;
    bgGrad.addColorStop(0, `rgba(${10 + bgIntensity * 30},${4 + bgIntensity * 8},${25 + bgIntensity * 25},1)`);
    bgGrad.addColorStop(0.5, "rgba(4,2,18,1)");
    bgGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Nebula clouds — react to multiplier
    const nebulaAlpha = 0.04 + bgIntensity * 0.08;
    for (let i = 0; i < 3; i++) {
      const nx = W * (0.2 + i * 0.3) + Math.sin(t * 0.05 + i * 2) * 60;
      const ny = H * (0.3 + i * 0.15) + Math.cos(t * 0.04 + i * 1.5) * 40;
      const nr = W * 0.35;
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      const nebulaColors = [
        `rgba(100,20,150,${nebulaAlpha})`,
        `rgba(20,80,140,${nebulaAlpha})`,
        `rgba(140,30,80,${nebulaAlpha})`,
      ];
      ng.addColorStop(0, nebulaColors[i]);
      ng.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Stars with parallax & speed streaks ──
    const starSpeedMult = s.isPlaying && !s.crashed ? Math.min(8, 1 + (s.multiplier - 1) * 0.3) : 0;
    s.stars.forEach(star => {
      // Parallax: stars move opposite to camera
      let drawX = star.x - s.cameraX * star.speed * 0.03;
      let drawY = star.y - s.cameraY * star.speed * 0.03;
      // Wrap
      drawX = ((drawX % (W * 2)) + W * 2) % (W * 2) - W * 0.5;
      drawY = ((drawY % (H * 2)) + H * 2) % (H * 2) - H * 0.5;

      // Speed streaks at high multiplier
      if (starSpeedMult > 2 && star.speed > 1) {
        const streakLen = Math.min(40, starSpeedMult * star.speed * 2);
        ctx.strokeStyle = `rgba(255,255,255,${star.brightness * 0.5})`;
        ctx.lineWidth = star.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        ctx.lineTo(drawX - streakLen * 0.3, drawY + streakLen);
        ctx.stroke();
      } else {
        const twinkle = 0.5 + 0.5 * Math.sin(t * (1.5 + star.speed) + star.x);
        ctx.fillStyle = `rgba(255,255,255,${star.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // ── Environment reactions at high multipliers ──
    // 25x+: passing asteroids
    if (s.multiplier >= 25 && s.isPlaying && !s.crashed) {
      const asteroidCount = Math.min(4, Math.floor((s.multiplier - 25) / 15) + 1);
      for (let i = 0; i < asteroidCount; i++) {
        const ax = (W * 0.8 + Math.sin(t * 0.4 + i * 3) * W * 0.5 - s.cameraX * 0.02) % W;
        const ay = (t * 80 * (i + 1) + i * 300) % (H + 200) - 100;
        const aSize = 8 + i * 5;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(t * (0.5 + i * 0.3));
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "rgba(100,116,139,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let j = 0; j < 7; j++) {
          const a = (j / 7) * Math.PI * 2;
          const r = aSize + Math.sin(a * 3 + i) * aSize * 0.3;
          j === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 50x+: space distortion rings
    if (s.multiplier >= 50 && s.isPlaying && !s.crashed) {
      const distortAlpha = Math.min(0.3, (s.multiplier - 50) / 200);
      for (let ring = 0; ring < 3; ring++) {
        const r = 100 + ring * 80 + Math.sin(t * 2 + ring) * 30;
        ctx.strokeStyle = tier.glow.replace(/[\d.]+\)$/, `${distortAlpha})`);
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.4, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 100x+: reality fracture
    if (s.multiplier >= 100 && s.isPlaying && !s.crashed) {
      ctx.save();
      ctx.globalAlpha = 0.08 + Math.sin(t * 4) * 0.04;
      ctx.fillStyle = tier.color;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // ══════════════════════════════════════════════════════════
    // WORLD-SPACE CONTENT (Camera transformed)
    // ══════════════════════════════════════════════════════════
    ctx.save();
    // Apply camera zoom from center
    ctx.translate(W / 2, H / 2);
    ctx.scale(s.cameraZoom, s.cameraZoom);
    ctx.translate(-W / 2, -H / 2);
    // Apply camera pan
    ctx.translate(-s.cameraX, -s.cameraY);

    // ── Plasma Trail ──
    if (s.trailPoints.length > 1) {
      const pts = s.trailPoints;
      // Outer glow trail
      ctx.save();
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = tier.glow.replace(/[\d.]+\)$/, "0.12)");
      ctx.shadowBlur = 35;
      ctx.shadowColor = tier.glow;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // Core energy ribbon
      const tGrad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
      tGrad.addColorStop(0, "rgba(255,255,255,0.02)");
      tGrad.addColorStop(0.6, tier.secondary + "88");
      tGrad.addColorStop(1, tier.color);
      ctx.strokeStyle = tGrad;
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = tier.glow;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.restore();
    }

    // ── Particles (world-space) ──
    s.particles = s.particles.filter(p => p.life > 0.01);
    s.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === "exhaust") { p.vy += 0.02; p.vx *= 0.98; }
      else if (p.type === "shockwave") { p.vx *= 1.01; p.vy *= 1.01; } // expand
      else { p.vy += 0.05; p.vx *= 0.97; p.vy *= 0.97; }
      p.life -= p.type === "explosion" ? 0.018 : p.type === "shockwave" ? 0.025 : 0.035;

      ctx.save();
      ctx.globalAlpha = p.life;
      if (p.type === "shockwave") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1 - p.life) * 80, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.shadowBlur = p.type === "explosion" ? 12 : 6;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // ── Ship ──
    if (s.isPlaying && !s.crashed) {
      let angle = -Math.PI * 0.25; // default upward-right tilt
      if (s.trailPoints.length > 3) {
        const prev = s.trailPoints[s.trailPoints.length - 3];
        const curr = s.trailPoints[s.trailPoints.length - 1];
        angle = Math.atan2(curr.y - prev.y, curr.x - prev.x) - Math.PI / 2;
      }
      drawShip(ctx, s.shipWorldX, s.shipWorldY, angle, s.multiplier, tier);

      // Exhaust particles
      if (s.tick % 2 === 0) {
        const exhaustAngle = angle + Math.PI;
        const ex = s.shipWorldX + Math.cos(exhaustAngle) * 38;
        const ey = s.shipWorldY + Math.sin(exhaustAngle) * 38;
        spawnParticles(ex, ey, "exhaust", tier.color, 2);
      }
      if (s.tick % 4 === 0 && s.multiplier > 3) {
        spawnParticles(s.shipWorldX + (Math.random() - 0.5) * 30, s.shipWorldY + (Math.random() - 0.5) * 30, "spark", tier.secondary, 1);
      }
    }

    // ── Crash explosion (world-space) ──
    if (s.crashed && s.explosionTime < 80) {
      const et = s.explosionTime / 80;
      const ex = s.shipWorldX, ey = s.shipWorldY;
      // Expanding rings
      for (let ring = 0; ring < 4; ring++) {
        const r = et * 200 * (ring + 1) * 0.5;
        const alpha = (1 - et) * (0.9 - ring * 0.2);
        ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
        ctx.lineWidth = 4 - ring;
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(239,68,68,0.8)";
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      // Core flash
      if (et < 0.15) {
        const flashR = et * 300;
        const fg = ctx.createRadialGradient(ex, ey, 0, ex, ey, flashR);
        fg.addColorStop(0, `rgba(255,255,255,${(0.15 - et) * 7})`);
        fg.addColorStop(0.3, `rgba(255,120,20,${(0.15 - et) * 4})`);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(ex, ey, flashR, 0, Math.PI * 2);
        ctx.fill();
      }
      s.explosionTime++;
    }

    ctx.restore(); // end world-space

    // ══════════════════════════════════════════════════════════
    // HUD LAYER (screen-space, always on top)
    // ══════════════════════════════════════════════════════════

    // ── Multiplier display ──
    if (s.isPlaying || s.crashed || s.cashedOut) {
      const multText = s.multiplier.toFixed(2) + "×";
      const baseFontSize = Math.min(W * 0.14, 100);
      // Dynamic size — pulses with multiplier growth
      const growPulse = s.isPlaying && !s.crashed && !s.cashedOut
        ? 1 + Math.sin(t * (2 + s.multiplier * 0.03)) * 0.03
        : 1;
      const fontSize = baseFontSize * growPulse;

      ctx.save();
      ctx.font = `900 ${fontSize}px 'Inter', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const multX = W / 2;
      const multY = s.crashed ? H * 0.38 : H * 0.22; // higher when flying so ship has room

      if (s.crashed) {
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 60;
        ctx.shadowColor = "rgba(239,68,68,0.9)";
        ctx.fillText(multText, multX, multY);
        // CRASHED label
        ctx.font = `800 ${fontSize * 0.3}px 'Inter', sans-serif`;
        ctx.fillStyle = "#f87171";
        ctx.shadowBlur = 30;
        ctx.fillText("CRASHED", multX, multY + fontSize * 0.6);
      } else if (s.cashedOut) {
        ctx.fillStyle = "#10b981";
        ctx.shadowBlur = 60;
        ctx.shadowColor = "rgba(16,185,129,0.9)";
        ctx.fillText(multText, multX, multY);
        ctx.font = `800 ${fontSize * 0.28}px 'Inter', sans-serif`;
        ctx.fillStyle = "#34d399";
        ctx.shadowBlur = 20;
        ctx.fillText(`₹${(betAmount * s.multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })} SECURED`, multX, multY + fontSize * 0.6);
      } else {
        // Active — breathing glow
        const glowIntensity = 30 + tier.intensity * 50;
        ctx.fillStyle = tier.color;
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = tier.glow;
        ctx.fillText(multText, multX, multY);
      }
      ctx.restore();

      // CRASH X label (subtle, only when flying)
      if (s.isPlaying && !s.crashed && !s.cashedOut) {
        ctx.save();
        ctx.font = `700 ${Math.min(W * 0.025, 16)}px 'Inter', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillText("CRASH X", W / 2, H * 0.22 - baseFontSize * 0.6);
        ctx.restore();
      }
    }

    // ── Idle state: "waiting to launch" ──
    if (!s.isPlaying && !s.crashed && !s.cashedOut) {
      // Engine charge animation
      s.engineCharge = (s.engineCharge + 0.015) % 1;
      const chargeRadius = 40 + Math.sin(s.engineCharge * Math.PI * 2) * 8;

      // Ship silhouette at center
      drawShip(ctx, W / 2, H * 0.52, -Math.PI * 0.25, 1, getTier(1));

      // Charging circle
      ctx.strokeStyle = "rgba(16,185,129,0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.52, chargeRadius, 0, s.engineCharge * Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Text
      ctx.save();
      ctx.font = `700 ${Math.min(W * 0.04, 22)}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillText("READY TO LAUNCH", W / 2, H * 0.72);
      ctx.font = `600 ${Math.min(W * 0.028, 14)}px 'Inter', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillText("Place a bet to begin", W / 2, H * 0.77);
      ctx.restore();
    }

    // ── Edge vignette ──
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // ── Speed lines at edges (10x+) ──
    if (s.multiplier >= 10 && s.isPlaying && !s.crashed) {
      const lineCount = Math.min(12, Math.floor(s.multiplier / 5));
      ctx.save();
      for (let i = 0; i < lineCount; i++) {
        const ly = (t * 200 * (i + 1) + i * 100) % H;
        const side = i % 2 === 0 ? 0 : W;
        const len = 40 + Math.random() * 60;
        ctx.strokeStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.06})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(side, ly);
        ctx.lineTo(side + (side === 0 ? len : -len), ly + len * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore(); // camera shake restore
    s.tick++;
    animFrameRef.current = requestAnimationFrame(render);
  }, [betAmount]);

  // ─── Resize Handler ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      initStars(canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    animFrameRef.current = requestAnimationFrame(render);
    return () => { ro.disconnect(); cancelAnimationFrame(animFrameRef.current); };
  }, [render, initStars]);

  // ─── Cashout Handler ─────────────────────────────────────
  const handleCashout = useCallback(async (cashoutMult?: number) => {
    const s = stateRef.current;
    if (s.crashed || s.cashedOut || !s.isPlaying || !s.sessionId) return;
    const targetMult = cashoutMult ?? s.multiplier;
    s.cashedOut = true;
    stopCrashAudio(false);
    // Gold celebration burst
    spawnParticles(s.shipWorldX, s.shipWorldY, "cashout", "#fbbf24", 40, 1.5);
    spawnParticles(s.shipWorldX, s.shipWorldY, "cashout", "#34d399", 25, 1.2);
    setUiState(prev => ({ ...prev, cashedOut: true, cashoutAmount: betAmount * targetMult, phase: "cashedout" }));
    try {
      const res = await fetch("/api/casino/mines/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cashout", email, sessionId: s.sessionId, clientMultiplier: targetMult }),
      });
      const data = await res.json();
      if (res.ok && data.success && !data.isBust) {
        onCompleteRef.current(targetMult, true);
      } else {
        onCompleteRef.current(0, false);
      }
    } catch { onCompleteRef.current(0, false); }
  }, [betAmount, email]);

  const handleCashoutRef = useRef(handleCashout);
  useEffect(() => { handleCashoutRef.current = handleCashout; }, [handleCashout]);

  // ─── Game Loop ────────────────────────────────────────────
  useEffect(() => {
    const s = stateRef.current;
    if (!isPlaying) {
      s.isPlaying = false;
      s.multiplier = 1.0;
      s.crashed = false;
      s.cashedOut = false;
      s.trailPoints = [];
      s.particles = [];
      s.explosionTime = 0;
      s.sessionId = null;
      s.tick = 0;
      s.cameraX = 0; s.cameraY = 0; s.cameraZoom = 1;
      s.shipWorldX = 0; s.shipWorldY = 0;
      stopCrashAudio(false);
      setUiState({ multiplier: 1.0, crashed: false, cashedOut: false, cashoutAmount: 0, phase: "idle" });
      return;
    }

    s.isPlaying = true;
    s.crashed = false;
    s.cashedOut = false;
    s.trailPoints = [];
    s.particles = [];
    s.explosionTime = 0;
    s.multiplier = 1.0;
    s.cameraX = 0; s.cameraY = 0; s.cameraZoom = 1;
    startCrashAudio();
    setUiState({ multiplier: 1.0, crashed: false, cashedOut: false, cashoutAmount: 0, phase: "flying" });

    let active = true;
    let interval: NodeJS.Timeout | null = null;

    const executeBet = async () => {
      try {
        const res = await fetch("/api/casino/bet", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, gameId: "orig-1", gameTitle: "Crash", betAmount }),
        });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.success) {
          s.sessionId = data.sessionId;
          const target = data.crashPoint;
          let current = 1.0;
          let tick = 0;

          // Starting position
          const canvas = canvasRef.current;
          const startX = canvas ? canvas.width * 0.15 : 100;
          const startY = canvas ? canvas.height * 0.85 : 500;
          s.shipWorldX = startX;
          s.shipWorldY = startY;

          interval = setInterval(() => {
            if (!active) return;
            tick++;
            current += 0.01 + current * 0.015;
            updateCrashPitch(current);
            s.multiplier = current;

            // ── Flight path: accelerating arc upward-right ──
            const speed = 1.5 + current * 0.5;
            // Angle: starts shallow (~10°), steepens as multiplier grows
            const baseAngle = -0.15 - Math.min(0.5, Math.log10(Math.max(1.01, current)) * 0.25);
            s.shipWorldX += Math.cos(baseAngle) * speed;
            s.shipWorldY += Math.sin(baseAngle) * speed;

            s.trailPoints.push({ x: s.shipWorldX, y: s.shipWorldY, mult: current, time: tick });
            if (s.trailPoints.length > 400) s.trailPoints.shift();

            // Camera shake increases with multiplier
            if (current > 8) s.cameraShake = Math.min(12, (current - 8) * 0.12);

            onLiveTickRef.current?.(current);
            setUiState(prev => ({ ...prev, multiplier: current }));

            if (current >= target) {
              if (interval) clearInterval(interval);
              s.multiplier = target;
              s.crashed = true;
              s.isPlaying = false;
              s.explosionTime = 0;
              stopCrashAudio(true);
              // Massive explosion
              spawnParticles(s.shipWorldX, s.shipWorldY, "explosion", "#ef4444", 60, 1.5);
              spawnParticles(s.shipWorldX, s.shipWorldY, "explosion", "#fbbf24", 30, 1);
              spawnParticles(s.shipWorldX, s.shipWorldY, "shockwave", "rgba(239,68,68,0.6)", 3);
              s.cameraShake = 25;
              setUiState({ multiplier: target, crashed: true, cashedOut: false, cashoutAmount: 0, phase: "crashed" });
              if (!s.cashedOut) onCompleteRef.current(target, false);
            } else if (autoCashout && current >= autoCashout && !s.cashedOut) {
              if (interval) clearInterval(interval);
              handleCashoutRef.current(current);
            }
          }, 55);
        } else {
          onCompleteRef.current(0, false);
        }
      } catch { onCompleteRef.current(0, false); }
    };

    executeBet();
    return () => { active = false; if (interval) clearInterval(interval); stopCrashAudio(false); };
  }, [isPlaying, betAmount, autoCashout, email]);

  // ─── Event listeners ──────────────────────────────────────
  useEffect(() => {
    const onCashout = () => {
      if (stateRef.current.isPlaying && !stateRef.current.crashed && !stateRef.current.cashedOut)
        handleCashoutRef.current();
    };
    window.addEventListener("trigger-cashout", onCashout);
    window.addEventListener("sidebar-trigger-cashout", onCashout);
    return () => {
      window.removeEventListener("trigger-cashout", onCashout);
      window.removeEventListener("sidebar-trigger-cashout", onCashout);
    };
  }, []);

  const tier = getTier(uiState.multiplier);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[420px] overflow-hidden bg-black rounded-xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── Floating Cashout Button ── */}
      <AnimatePresence>
        {isPlaying && !uiState.crashed && !uiState.cashedOut && (
          <motion.div
            key="cashout-btn"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              onClick={() => handleCashout()}
              className="group relative overflow-hidden flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider text-black transition-all active:scale-95 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, #10b981, #059669)`,
                boxShadow: `0 0 30px rgba(16,185,129,0.5), 0 8px 25px rgba(0,0,0,0.4)`,
              }}
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="absolute inset-0 bg-white/15 rounded-2xl"
              />
              <span className="relative">CASHOUT</span>
              <span className="relative bg-black/20 px-3 py-1 rounded-xl text-sm font-black">
                ₹{(betAmount * uiState.multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cashed out celebration ── */}
      <AnimatePresence>
        {uiState.phase === "cashedout" && (
          <motion.div
            key="cashedout-badge"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          >
            <div className="px-10 py-6 rounded-3xl border text-center backdrop-blur-xl"
              style={{ background: "rgba(0,0,0,0.7)", borderColor: "rgba(16,185,129,0.5)", boxShadow: "0 0 80px rgba(16,185,129,0.35)" }}>
              <div className="text-[11px] font-black uppercase tracking-widest text-emerald-400/80 mb-2">Secured at</div>
              <div className="text-6xl sm:text-8xl font-black font-mono text-emerald-400 leading-none"
                style={{ textShadow: "0 0 50px rgba(16,185,129,0.8)" }}>
                {uiState.multiplier.toFixed(2)}×
              </div>
              <div className="text-3xl font-black text-white mt-3 font-mono">
                ₹{uiState.cashoutAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tier indicator (top-right, subtle) ── */}
      {isPlaying && !uiState.crashed && !uiState.cashedOut && uiState.multiplier > 2 && (
        <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl border backdrop-blur-sm pointer-events-none"
          style={{ background: "rgba(0,0,0,0.5)", borderColor: tier.glow.replace(/[\d.]+\)$/, "0.3)") }}>
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: tier.color }}>
            {tier.name}
          </span>
        </div>
      )}
    </div>
  );
}
