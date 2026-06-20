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
  color: string; type: "exhaust" | "spark" | "explosion" | "streak" | "shockwave" | "cashout" | "smoke";
}
interface Star { x: number; y: number; size: number; speed: number; brightness: number; }
interface TrailPoint { x: number; y: number; mult: number; time: number; }
interface Debris { x: number; y: number; size: number; vx: number; vy: number; rot: number; rotSpeed: number; color: string; }
interface WreckagePiece { x: number; y: number; vx: number; vy: number; angle: number; vAngle: number; size: number; type: string; }

// ─── Multiplier → Tier System ────────────────────────────────
function getTier(m: number): { name: string; color: string; glow: string; secondary: string; intensity: number } {
  if (m >= 100) return { name: "mythic",       color: "#f43f5e", glow: "rgba(244,63,94,0.95)", secondary: "#fda4af", intensity: 1.0 };   // Rose Red
  if (m >= 50)  return { name: "legendary",    color: "#fbbf24", glow: "rgba(251,191,36,0.9)",  secondary: "#f59e0b", intensity: 0.88 };  // Gold Solar
  if (m >= 25)  return { name: "hyperspace",   color: "#a78bfa", glow: "rgba(167,139,250,0.85)", secondary: "#c4b5fd", intensity: 0.75 };  // Purple Warp
  if (m >= 10)  return { name: "escape",       color: "#3b82f6", glow: "rgba(59,130,246,0.7)",  secondary: "#60a5fa", intensity: 0.6 };   // Blue Atmospheric
  if (m >= 5)   return { name: "danger",       color: "#ef4444", glow: "rgba(239,68,68,0.7)",   secondary: "#f87171", intensity: 0.45 };  // Red Warning
  if (m >= 2)   return { name: "acceleration", color: "#06b6d4", glow: "rgba(6,182,212,0.6)",   secondary: "#22d3ee", intensity: 0.3 };   // Cyan Flare
  return { name: "launch", color: "#10b981", glow: "rgba(16,185,129,0.4)", secondary: "#6ee7b7", intensity: 0.15 };   // Green Ignition
}

export function CrashEngine({ isPlaying, betAmount = 10, autoCashout, onLiveTick, onComplete }: CrashEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const stateRef = useRef({
    multiplier: 1.0,
    crashed: false,
    cashedOut: false,
    cashoutMultiplier: 1.0,
    isPlaying: false,
    sessionId: null as string | null,
    tick: 0,
    // Ship position in WORLD space (camera offsets applied during render)
    shipWorldX: 0,
    shipWorldY: 0,
    trailPoints: [] as TrailPoint[],
    particles: [] as Particle[],
    stars: [] as Star[],
    debrisList: [] as Debris[],
    wreckagePieces: [] as WreckagePiece[],
    explosionTime: 0,
    cameraShake: 0,
    // Camera
    cameraX: 0, cameraY: 0, cameraZoom: 1.25,
    // Cashout camera effect
    cashoutZoomTimer: 0,
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
        x: Math.random() * w * 4 - w * 1.5,
        y: Math.random() * h * 4 - h * 1.5,
        size: Math.random() * 2 + 0.4,
        speed: 0.3 + Math.random() * 2.5,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    stateRef.current.stars = stars;

    // Initialize flying debris/asteroids
    const debrisList: Debris[] = [];
    for (let i = 0; i < 20; i++) {
      debrisList.push({
        x: Math.random() * w * 3 - w,
        y: Math.random() * h * 3 - h,
        size: 4 + Math.random() * 12,
        vx: -6 - Math.random() * 8,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        color: `hsl(${20 + Math.random() * 15}, 15%, ${30 + Math.random() * 20}%)`
      });
    }
    stateRef.current.debrisList = debrisList;
  }, []);

  // ─── Spawn Particles ──────────────────────────────────────
  const spawnParticles = (x: number, y: number, type: Particle["type"], color: string, count: number, spread = 1) => {
    const p = stateRef.current.particles;
    for (let i = 0; i < count; i++) {
      const angle = type === "exhaust"
        ? Math.PI * 0.75 + (Math.random() - 0.5) * 0.5  // thrust angle backwards
        : Math.random() * Math.PI * 2;
      const speed = type === "explosion" ? 3 + Math.random() * 12 * spread
        : type === "shockwave" ? 7 + Math.random() * 4
        : type === "cashout" ? 2 + Math.random() * 6
        : type === "smoke" ? 0.4 + Math.random() * 1.5
        : 0.5 + Math.random() * 4 * spread;
      p.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, size: type === "explosion" ? 4 + Math.random() * 8 : type === "shockwave" ? 2 : type === "smoke" ? 6 + Math.random() * 12 : 1.5 + Math.random() * 3,
        color, type,
      });
    }
    if (p.length > 700) p.splice(0, p.length - 700);
  };

  // ─── Draw Ship Wreckage Piece ──────────────────────────────
  const drawWreckagePiece = (ctx: CanvasRenderingContext2D, piece: WreckagePiece) => {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.angle);
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (piece.type === "nose") {
      ctx.moveTo(0, -12); ctx.lineTo(6, 6); ctx.lineTo(-6, 6);
    } else if (piece.type === "wingLeft" || piece.type === "wingRight") {
      ctx.moveTo(-10, 0); ctx.lineTo(10, 8); ctx.lineTo(0, -8);
    } else {
      ctx.rect(-piece.size/2, -piece.size/2, piece.size, piece.size);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  // ─── Draw Ship ────────────────────────────────────────────
  const drawShip = (ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, mult: number, tier: ReturnType<typeof getTier>) => {
    const scale = 1 + Math.min(0.25, mult * 0.002);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // ── Engine exhaust flame ──
    const flameLen = 22 + mult * 2.2 + Math.sin(stateRef.current.tick * 0.45) * 9;
    const flameWidth = 12 + mult * 0.4;
    // Outer flame (orange/yellow)
    const outerFlame = ctx.createRadialGradient(0, 32, 2, 0, 32 + flameLen * 0.6, flameLen);
    outerFlame.addColorStop(0, "rgba(255,190,40,0.95)");
    outerFlame.addColorStop(0.35, "rgba(255,90,15,0.7)");
    outerFlame.addColorStop(0.7, tier.glow.replace(/[\d.]+\)$/, "0.2)"));
    outerFlame.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = outerFlame;
    ctx.beginPath();
    ctx.ellipse(0, 32 + flameLen * 0.4, flameWidth, flameLen, 0, 0, Math.PI * 2);
    ctx.fill();

    // Core flame (white-blue warp)
    const coreFlame = ctx.createRadialGradient(0, 32, 1, 0, 32 + flameLen * 0.35, flameLen * 0.45);
    coreFlame.addColorStop(0, "rgba(255,255,255,0.95)");
    coreFlame.addColorStop(0.4, "rgba(180,240,255,0.6)");
    coreFlame.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = coreFlame;
    ctx.beginPath();
    ctx.ellipse(0, 32 + flameLen * 0.18, flameWidth * 0.45, flameLen * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Ship Body ──
    ctx.shadowBlur = 12 + mult * 0.4;
    ctx.shadowColor = tier.glow;
    const bodyG = ctx.createLinearGradient(-15, -34, 15, 34);
    bodyG.addColorStop(0, "#f1f5f9");
    bodyG.addColorStop(0.4, "#cbd5e1");
    bodyG.addColorStop(0.8, "#475569");
    bodyG.addColorStop(1, "#0f172a");
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.bezierCurveTo(16, -12, 14, 12, 10, 32);
    ctx.lineTo(-10, 32);
    ctx.bezierCurveTo(-16, 12, -14, -12, 0, -34);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Accent stripes
    ctx.fillStyle = tier.color + "99";
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.bezierCurveTo(5, -10, 4, 8, 3, 26);
    ctx.lineTo(-3, 26);
    ctx.bezierCurveTo(-5, 8, -6, -10, 0, -26);
    ctx.closePath();
    ctx.fill();

    // Cockpit window
    const cockG = ctx.createRadialGradient(-2, -18, 0, 0, -16, 8);
    cockG.addColorStop(0, "rgba(160,245,255,0.95)");
    cockG.addColorStop(0.6, "rgba(30,140,225,0.85)");
    cockG.addColorStop(1, "rgba(8,20,50,0.5)");
    ctx.fillStyle = cockG;
    ctx.beginPath();
    ctx.ellipse(0, -16, 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = "#1e293b";
    ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(30, 32); ctx.lineTo(10, 28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(-30, 32); ctx.lineTo(-10, 28); ctx.closePath(); ctx.fill();
    // Wing accent glow strip
    ctx.fillStyle = tier.color + "77";
    ctx.beginPath(); ctx.moveTo(12, 16); ctx.lineTo(26, 30); ctx.lineTo(12, 26); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, 16); ctx.lineTo(-26, 30); ctx.lineTo(-12, 26); ctx.closePath(); ctx.fill();

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

    // ── Camera Physics Rebuild ──────────────────────────────
    let targetCamX = 0, targetCamY = 0, targetZoom = 1.15;
    if (s.isPlaying && !s.crashed) {
      // Acceleration camera zoom pull-back
      targetZoom = Math.max(0.48, 1.25 - Math.log10(s.multiplier) * 0.32);

      // Camera drift lag under high-G acceleration
      const lag = Math.min(W * 0.16, (s.multiplier - 1) * 7.5);
      targetCamX = s.shipWorldX - (W * 0.33 - lag);
      targetCamY = s.shipWorldY - (H * 0.58 + lag * 0.4);

      // If user cashed out, do a dramatic cinematic snap zoom
      if (s.cashedOut && s.cashoutZoomTimer > 0) {
        targetZoom = 1.6; // Dramatic zoom in
        targetCamX = s.shipWorldX - W * 0.5;
        targetCamY = s.shipWorldY - H * 0.5;
        s.cashoutZoomTimer--;
      }
    } else if (s.crashed) {
      // Lock onto wreckage site, slow cinematic pull-back
      targetCamX = s.shipWorldX - W * 0.5;
      targetCamY = s.shipWorldY - H * 0.48;
      targetZoom = 0.85;
    }

    // Smooth camera interpolation
    s.cameraX += (targetCamX - s.cameraX) * 0.065;
    s.cameraY += (targetCamY - s.cameraY) * 0.065;
    s.cameraZoom += (targetZoom - s.cameraZoom) * 0.055;

    // Camera shake based on flight speed & warp progression
    let currentShake = s.cameraShake;
    if (s.isPlaying && !s.crashed) {
      const flightJitter = Math.min(6, (s.multiplier - 1) * 0.3);
      currentShake = Math.max(currentShake, flightJitter);
    }
    let shakeX = 0, shakeY = 0;
    if (currentShake > 0) {
      shakeX = (Math.random() - 0.5) * currentShake;
      shakeY = (Math.random() - 0.5) * currentShake;
      s.cameraShake *= 0.86;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // ══════════════════════════════════════════════════════════
    // BACKGROUND & ENVIRONMENT LAYERS (Every second feels different)
    // ══════════════════════════════════════════════════════════
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H));
    const bgIntensity = tier.intensity;
    // Stage color transforms: green -> cyan -> crimson -> deep space purple -> golden solar wind -> reality fracture
    bgGrad.addColorStop(0, `rgba(${10 + bgIntensity * 40},${3 + bgIntensity * 10},${22 + bgIntensity * 28},1)`);
    bgGrad.addColorStop(0.55, "rgba(3,1,16,1)");
    bgGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Nebula dust shifts based on warp progression
    const nebulaAlpha = 0.03 + bgIntensity * 0.06;
    for (let i = 0; i < 3; i++) {
      const nx = W * (0.25 + i * 0.3) + Math.sin(t * 0.06 + i) * 80;
      const ny = H * (0.35 + i * 0.15) + Math.cos(t * 0.05 + i) * 60;
      const nr = W * 0.38;
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      const colors = [
        `rgba(90,15,140,${nebulaAlpha})`,
        `rgba(15,70,120,${nebulaAlpha})`,
        `rgba(120,20,70,${nebulaAlpha})`
      ];
      ng.addColorStop(0, colors[i]);
      ng.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Stars and Space Dust parallax lines ──
    const starSpeedMult = s.isPlaying && !s.crashed ? Math.min(15, 1 + (s.multiplier - 1) * 0.45) : 0;
    s.stars.forEach(star => {
      let drawX = star.x - s.cameraX * star.speed * 0.025;
      let drawY = star.y - s.cameraY * star.speed * 0.025;
      drawX = ((drawX % (W * 3.5)) + W * 3.5) % (W * 3.5) - W * 1.25;
      drawY = ((drawY % (H * 3.5)) + H * 3.5) % (H * 3.5) - H * 1.25;

      // Speed streak warping
      if (starSpeedMult > 1.8 && star.speed > 0.8) {
        const streakLen = Math.min(55, starSpeedMult * star.speed * 2.8);
        ctx.strokeStyle = `rgba(255,255,255,${star.brightness * 0.6})`;
        ctx.lineWidth = star.size * 0.4;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        // Streak vectors matching diagonal forward flight path
        ctx.lineTo(drawX - streakLen * 0.65, drawY + streakLen * 0.55);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(255,255,255,${star.brightness * (0.3 + Math.sin(t * 3 + star.x) * 0.2)})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // ── Obstacles & Space Debris flying past (parallax speed indicators) ──
    s.debrisList.forEach(deb => {
      // Move debris relative to flight vector
      let dx = deb.x - s.cameraX * 0.035;
      let dy = deb.y - s.cameraY * 0.035;

      // Add relative flight velocity
      dx += deb.vx * starSpeedMult * 0.3;
      dy += deb.vy * starSpeedMult * 0.3;

      // Wrap around grid boundaries
      dx = ((dx % (W * 3)) + W * 3) % (W * 3) - W;
      dy = ((dy % (H * 3)) + H * 3) % (H * 3) - H;

      deb.rot += deb.rotSpeed;

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(deb.rot);
      ctx.fillStyle = deb.color;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      
      // Draw simple rocky debris geometry
      ctx.beginPath();
      ctx.moveTo(0, -deb.size);
      ctx.lineTo(deb.size * 0.8, -deb.size * 0.5);
      ctx.lineTo(deb.size, deb.size * 0.6);
      ctx.lineTo(-deb.size * 0.4, deb.size * 0.8);
      ctx.lineTo(-deb.size, -deb.size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // ══════════════════════════════════════════════════════════
    // WORLD-SPACE CONTENT (Warp Trails, Ship, Shockwaves)
    // ══════════════════════════════════════════════════════════
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(s.cameraZoom, s.cameraZoom);
    ctx.translate(-W / 2, -H / 2);
    ctx.translate(-s.cameraX, -s.cameraY);

    // ── No Chart feeling: dynamic ribbon plasma exhaust warp trail ──
    if (s.trailPoints.length > 1) {
      const pts = s.trailPoints;
      
      // Outer warp exhaust ribbon
      ctx.save();
      ctx.lineWidth = 14 + bgIntensity * 10;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = tier.glow.replace(/[\d.]+\)$/, "0.14)");
      ctx.shadowBlur = 40;
      ctx.shadowColor = tier.glow;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        // Add waving exhaust plasma turbulence
        const wave = Math.sin(i * 0.2 - t * 12) * (3 + i * 0.05);
        ctx.lineTo(pts[i].x + wave * 0.4, pts[i].y + wave * 0.4);
      }
      ctx.stroke();

      // Energetic core trail ribbon
      const tGrad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
      tGrad.addColorStop(0, "rgba(255,255,255,0.0)");
      tGrad.addColorStop(0.55, tier.secondary + "99");
      tGrad.addColorStop(1, tier.color);
      ctx.strokeStyle = tGrad;
      ctx.lineWidth = 4 + bgIntensity * 4;
      ctx.shadowBlur = 24;
      ctx.shadowColor = tier.glow;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const wave = Math.sin(i * 0.15 - t * 18) * (2 + i * 0.03);
        ctx.lineTo(pts[i].x + wave * 0.3, pts[i].y + wave * 0.3);
      }
      ctx.stroke();
      ctx.restore();
    }

    // ── Particles update ──
    s.particles = s.particles.filter(p => p.life > 0.01);
    s.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === "exhaust") { p.vy += 0.015; p.vx *= 0.985; }
      else if (p.type === "smoke") { p.vy -= 0.05; p.vx *= 0.98; }
      else if (p.type === "shockwave") { p.vx *= 1.015; p.vy *= 1.015; }
      else { p.vy += 0.04; p.vx *= 0.975; p.vy *= 0.975; }
      p.life -= p.type === "explosion" ? 0.015 : p.type === "shockwave" ? 0.022 : p.type === "smoke" ? 0.014 : 0.032;

      ctx.save();
      ctx.globalAlpha = p.life;
      if (p.type === "shockwave") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1 - p.life) * 140, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.shadowBlur = p.type === "explosion" ? 14 : 6;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // ── Ship / Wreckage pieces render ──
    if (s.isPlaying || s.crashed) {
      let angle = -Math.PI * 0.25;
      if (s.trailPoints.length > 3) {
        const prev = s.trailPoints[s.trailPoints.length - 3];
        const curr = s.trailPoints[s.trailPoints.length - 1];
        angle = Math.atan2(curr.y - prev.y, curr.x - prev.x) - Math.PI / 2;
      }

      if (s.crashed) {
        // Physical wreckage tumbling simulation
        if (s.wreckagePieces.length > 0) {
          s.wreckagePieces.forEach(piece => {
            piece.x += piece.vx;
            piece.y += piece.vy;
            piece.angle += piece.vAngle;
            // Gravity pulls pieces down
            piece.vy += 0.15;
            piece.vx *= 0.99;
            piece.vy *= 0.99;

            // Emit wreckage trails
            if (s.tick % 4 === 0 && s.explosionTime < 70) {
              spawnParticles(piece.x, piece.y, "smoke", "#1e293b", 1); // black smoke
              spawnParticles(piece.x, piece.y, "spark", "#f97316", 1, 0.5); // orange sparks
            }

            drawWreckagePiece(ctx, piece);
          });
        }
      } else {
        // Ship Engine micro-vibrations
        const vib = Math.min(3.5, (s.multiplier - 1) * 0.14 + 0.2);
        const vx = (Math.random() - 0.5) * vib;
        const vy = (Math.random() - 0.5) * vib;

        drawShip(ctx, s.shipWorldX + vx, s.shipWorldY + vy, angle, s.multiplier, tier);

        // Friction nose-cone glow at danger threshold (5x+)
        if (s.multiplier >= 5) {
          ctx.save();
          ctx.translate(s.shipWorldX, s.shipWorldY);
          ctx.rotate(angle);
          const fGlow = ctx.createRadialGradient(0, -32, 0, 0, -32, 14 + s.multiplier * 0.5);
          fGlow.addColorStop(0, "rgba(255,90,30,0.85)");
          fGlow.addColorStop(0.5, "rgba(255,20,0,0.35)");
          fGlow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = fGlow;
          ctx.beginPath();
          ctx.arc(0, -32, 14 + s.multiplier * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Exhaust smoke plumes
        if (s.tick % 2 === 0) {
          const exhaustAngle = angle + Math.PI;
          const ex = s.shipWorldX + Math.cos(exhaustAngle) * 32;
          const ey = s.shipWorldY + Math.sin(exhaustAngle) * 32;
          spawnParticles(ex, ey, "exhaust", tier.color, 2);
        }
        if (s.tick % 4 === 0 && s.multiplier > 5) {
          spawnParticles(s.shipWorldX + (Math.random() - 0.5) * 25, s.shipWorldY + (Math.random() - 0.5) * 25, "spark", tier.secondary, 1);
        }
      }
    }

    // ── Crash Explosion visualizer ring ──
    if (s.crashed && s.explosionTime < 75) {
      const et = s.explosionTime / 75;
      const ex = s.shipWorldX, ey = s.shipWorldY;
      
      ctx.save();
      // Multi-layer shockwave expands outward
      for (let ring = 0; ring < 3; ring++) {
        const r = et * 220 * (ring + 1) * 0.55;
        const alpha = (1 - et) * (0.9 - ring * 0.28);
        ctx.strokeStyle = `rgba(244,63,94,${alpha})`;
        ctx.lineWidth = 5 - ring;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "rgba(244,63,94,0.85)";
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      s.explosionTime++;
    }

    ctx.restore(); // end camera projection
    ctx.restore(); // end world space shake

    // ══════════════════════════════════════════════════════════
    // SCREEN SPACE HUD LAYER (UI Dominance Rebuild)
    // ══════════════════════════════════════════════════════════
    if (s.isPlaying || s.crashed || s.cashedOut) {
      const multText = s.multiplier.toFixed(2) + "×";
      const baseFontSize = Math.min(W * 0.16, 90);
      const pulse = s.isPlaying && !s.crashed && !s.cashedOut
        ? 1 + Math.sin(t * (2.5 + s.multiplier * 0.045)) * 0.025
        : 1;
      const fontSize = baseFontSize * pulse;

      ctx.save();
      ctx.font = `900 ${fontSize}px 'Outfit', 'Inter', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const multX = W / 2;
      const multY = H * 0.23;

      if (s.crashed) {
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 45;
        ctx.shadowColor = "rgba(239,68,68,0.9)";
        ctx.fillText(multText, multX, multY);
        // CRASHED status
        ctx.font = `800 ${fontSize * 0.28}px 'Outfit', sans-serif`;
        ctx.fillStyle = "#fecaca";
        ctx.shadowBlur = 12;
        ctx.fillText("CRASHED", multX, multY + fontSize * 0.65);
      } else {
        // Multiplier glow changes based on stages
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 24 + s.multiplier * 0.5;
        ctx.shadowColor = tier.glow;
        ctx.fillText(multText, multX, multY);

        // Stage Title status HUD
        ctx.font = `700 10px 'Outfit', sans-serif`;
        ctx.fillStyle = tier.color;
        ctx.shadowBlur = 5;
        ctx.fillText(tier.name.toUpperCase() + " PHASE", multX, multY - fontSize * 0.55);
      }
      ctx.restore();
    }

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
    s.cashoutMultiplier = targetMult;
    s.cashoutZoomTimer = 35; // Trigger cinematic camera snap
    stopCrashAudio(false);
    // Gold celebration particles
    spawnParticles(s.shipWorldX, s.shipWorldY, "cashout", "#fbbf24", 50, 1.6);
    spawnParticles(s.shipWorldX, s.shipWorldY, "cashout", "#34d399", 30, 1.3);
    setUiState(prev => ({ ...prev, cashedOut: true, cashoutAmount: betAmount * targetMult, phase: "cashedout" }));
    try {
      await fetch("/api/casino/mines/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cashout", email, sessionId: s.sessionId, clientMultiplier: targetMult }),
      });
    } catch (e) {
      console.warn("Cashout API sync error:", e);
    }
  }, [betAmount, email]);

  const handleCashoutRef = useRef(handleCashout);
  useEffect(() => { handleCashoutRef.current = handleCashout; }, [handleCashout]);

  // ─── Game Loop ────────────────────────────────────────────
  useEffect(() => {
    const s = stateRef.current;
    if (!isPlaying) {
      // Reset only if not in active flight/crash review
      if (uiState.phase === "idle" || (!s.isPlaying && !s.crashed)) {
        s.isPlaying = false;
        s.multiplier = 1.0;
        s.crashed = false;
        s.cashedOut = false;
        s.cashoutMultiplier = 1.0;
        s.trailPoints = [];
        s.particles = [];
        s.wreckagePieces = [];
        s.explosionTime = 0;
        s.sessionId = null;
        s.tick = 0;
        s.cameraX = 0; s.cameraY = 0; s.cameraZoom = 1.25;
        s.shipWorldX = 0; s.shipWorldY = 0;
        stopCrashAudio(false);
        setUiState({ multiplier: 1.0, crashed: false, cashedOut: false, cashoutAmount: 0, phase: "idle" });
      }
      return;
    }

    s.isPlaying = true;
    s.crashed = false;
    s.cashedOut = false;
    s.trailPoints = [];
    s.particles = [];
    s.wreckagePieces = [];
    s.explosionTime = 0;
    s.multiplier = 1.0;
    s.cameraX = 0; s.cameraY = 0; s.cameraZoom = 1.25;
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

          // Compute starting coords based on canvas size
          const canvas = canvasRef.current;
          const startX = canvas ? canvas.width * 0.12 : 90;
          const startY = canvas ? canvas.height * 0.88 : 500;
          s.shipWorldX = startX;
          s.shipWorldY = startY;

          interval = setInterval(() => {
            if (!active) return;
            tick++;
            // Accelerating game loop tick multiplier increments
            current += 0.008 + current * 0.014;
            updateCrashPitch(current);
            s.multiplier = current;

            // Flight path: accelerating dynamic arc (upward-right)
            const speed = 2.0 + current * 0.72;
            const baseAngle = -0.15 - Math.min(0.55, Math.log10(Math.max(1.01, current)) * 0.28);
            s.shipWorldX += Math.cos(baseAngle) * speed;
            s.shipWorldY += Math.sin(baseAngle) * speed;

            s.trailPoints.push({ x: s.shipWorldX, y: s.shipWorldY, mult: current, time: tick });
            if (s.trailPoints.length > 500) s.trailPoints.shift();

            // Camera shake scaling with G-force / speed threshold
            if (current > 5) s.cameraShake = Math.min(10, (current - 5) * 0.16);

            onLiveTickRef.current?.(current);
            setUiState(prev => ({ ...prev, multiplier: current }));

            if (current >= target) {
              if (interval) clearInterval(interval);
              s.multiplier = target;
              s.crashed = true;
              s.isPlaying = false;
              s.explosionTime = 0;
              stopCrashAudio(true); // Sudden mute silence

              // Spawn physical ship wreckage pieces for dramatic destruction
              const crashAngle = -Math.PI * 0.25;
              s.wreckagePieces = [
                { x: s.shipWorldX, y: s.shipWorldY, vx: Math.cos(crashAngle - 0.45) * speed * 0.3, vy: Math.sin(crashAngle - 0.45) * speed * 0.3, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 8, type: "nose" },
                { x: s.shipWorldX, y: s.shipWorldY, vx: Math.cos(crashAngle + 0.45) * speed * 0.3, vy: Math.sin(crashAngle + 0.45) * speed * 0.3, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 6, type: "wingLeft" },
                { x: s.shipWorldX, y: s.shipWorldY, vx: Math.cos(crashAngle + Math.PI - 0.3) * speed * 0.25, vy: Math.sin(crashAngle + Math.PI - 0.3) * speed * 0.25, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 6, type: "wingRight" },
                { x: s.shipWorldX, y: s.shipWorldY, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.3, size: 10, type: "core" },
                { x: s.shipWorldX, y: s.shipWorldY, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.4, size: 5, type: "thruster" }
              ];

              // Spawn massive explosion particles & shockwaves
              spawnParticles(s.shipWorldX, s.shipWorldY, "explosion", "#f43f5e", 70, 1.6);
              spawnParticles(s.shipWorldX, s.shipWorldY, "explosion", "#fbbf24", 40, 1.1);
              spawnParticles(s.shipWorldX, s.shipWorldY, "shockwave", "rgba(244,63,94,0.65)", 3);
              s.cameraShake = 28;

              setUiState(prev => ({
                ...prev,
                multiplier: target,
                crashed: true,
                phase: "crashed"
              }));

              // Wait 3 seconds for the player to review the wreckage and final outcome
              setTimeout(() => {
                if (active) {
                  onCompleteRef.current(s.cashedOut ? s.cashoutMultiplier : target, s.cashedOut);
                }
              }, 3000);
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

  const tier = getTier(uiState.multiplier);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[420px] overflow-hidden bg-black rounded-2xl border border-slate-900 shadow-3xl select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* ── Floating Cashout HUD button ── */}
      <AnimatePresence>
        {uiState.phase === "flying" && !uiState.cashedOut && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-[220px]"
          >
            <button
              onClick={() => handleCashout()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black font-black text-xs uppercase tracking-widest shadow-[0_0_35px_rgba(52,211,153,0.55)] border border-emerald-300/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span>💰 CASHOUT</span>
              <span className="font-mono text-sm font-black bg-black/10 px-2 py-0.5 rounded-md">
                ₹{(betAmount * uiState.multiplier).toFixed(2)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cashout Success celebration banner ── */}
      <AnimatePresence>
        {uiState.phase === "cashedout" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none"
          >
            <div className="bg-slate-950/80 border border-emerald-500/30 px-6 py-5 rounded-2xl text-center shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">CASHOUT SUCCESSFUL</span>
              <span className="text-3xl font-black text-white font-mono mt-1 block">
                {stateRef.current.cashoutMultiplier.toFixed(2)}x
              </span>
              <span className="text-xs font-black text-emerald-300 mt-2 block">
                Won: ₹{uiState.cashoutAmount.toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Takeoff phase countdown HUD ── */}
      {uiState.phase === "idle" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-transparent pointer-events-none">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block animate-pulse">SYSTEM ENGINES READY</span>
            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mt-1 block">PLACE BET TO INITIATE TAKEOFF</span>
          </div>
        </div>
      )}
    </div>
  );
}
