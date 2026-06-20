"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Wallet, Volume2, VolumeX, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { calculateGameOutcome } from "@/lib/casino-math";

interface NeonHorizon3DEngineProps {
  isPlaying: boolean;
  betAmount: number;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

type Lane = 0 | 1 | 2; // Left, Center, Right

interface Obstacle {
  id: number;
  lane: Lane;
  z: number; // 3D distance from screen (higher means further away)
  color: string;
  passed: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number;
}

export function NeonHorizon3DEngine({ isPlaying, betAmount, onLiveTick, onComplete }: NeonHorizon3DEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "crashed" | "cashed_out">("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [playerLane, setPlayerLane] = useState<Lane>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [nearMissActive, setNearMissActive] = useState(false);

  // Math variables
  const crashPointRef = useRef<number>(1.0);
  const currentMultiplierRef = useRef<number>(1.0);
  const onCompleteRef = useRef(onComplete);

  // 3D Game parameters
  const playerLaneRef = useRef<Lane>(1);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const gameSpeedRef = useRef<number>(5.0);
  const frameCountRef = useRef<number>(0);
  const crashTriggeredRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);

  // Sync references
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    playerLaneRef.current = playerLane;
  }, [playerLane]);

  // Sound Synthesizer (Zero asset dependencies)
  const audioContextRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);

  const initAudio = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Create engine noise/hum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      
      // Filter for deep rumble
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(150, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(0);
      engineOscRef.current = osc;
      engineGainRef.current = gain;
    } catch (e) {
      console.warn("Audio initialization failed", e);
    }
  }, [isMuted]);

  const stopAudio = useCallback(() => {
    try {
      if (engineOscRef.current) {
        engineOscRef.current.stop();
        engineOscRef.current.disconnect();
        engineOscRef.current = null;
      }
      if (engineGainRef.current) {
        engineGainRef.current.disconnect();
        engineGainRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const playSound = useCallback((type: "dodge" | "crash" | "cashout" | "nearmiss") => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (type === "dodge") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "nearmiss") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "crash") {
        // Noise buffer for explosion
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.8);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 0.8);
      } else if (type === "cashout") {
        // Upward chord chime
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.3);
          osc.start(ctx.currentTime + idx * 0.05);
          osc.stop(ctx.currentTime + idx * 0.05 + 0.3);
        });
      }
    } catch (e) {
      console.warn("Synth trigger failed", e);
    }
  }, [isMuted]);

  // Adjust engine frequency based on multiplier
  useEffect(() => {
    if (engineOscRef.current && audioContextRef.current) {
      const targetFreq = Math.min(220, 60 + multiplier * 15);
      engineOscRef.current.frequency.setTargetAtTime(targetFreq, audioContextRef.current.currentTime, 0.2);
    }
  }, [multiplier]);

  // Steer controls
  const steerLeft = useCallback(() => {
    if (gameState !== "playing") return;
    setPlayerLane(prev => {
      const next: Lane = prev === 2 ? 1 : 0;
      if (next !== prev) playSound("dodge");
      return next;
    });
  }, [gameState, playSound]);

  const steerRight = useCallback(() => {
    if (gameState !== "playing") return;
    setPlayerLane(prev => {
      const next: Lane = prev === 0 ? 1 : 2;
      if (next !== prev) playSound("dodge");
      return next;
    });
  }, [gameState, playSound]);

  // Setup Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        steerLeft();
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        steerRight();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steerLeft, steerRight]);

  // Canvas Core loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localAnimationFrameId: number;

    const render = (time: number) => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.height = canvas.parentElement?.clientHeight || 600;

      // Draw starry galaxy background
      ctx.fillStyle = "#020308";
      ctx.fillRect(0, 0, width, height);

      // Star management (3D warp field)
      if (starsRef.current.length === 0) {
        for (let i = 0; i < 150; i++) {
          starsRef.current.push({
            x: (Math.random() - 0.5) * 1000,
            y: (Math.random() - 0.5) * 1000,
            z: Math.random() * 1000
          });
        }
      }

      // Render stars
      const starSpeed = gameState === "cashed_out" ? gameSpeedRef.current * 4 : gameSpeedRef.current;
      starsRef.current.forEach(star => {
        star.z -= starSpeed;
        if (star.z <= 0) {
          star.z = 1000;
          star.x = (Math.random() - 0.5) * 1000;
          star.y = (Math.random() - 0.5) * 1000;
        }

        const k = 400 / star.z;
        const sx = width / 2 + star.x * k;
        const sy = height / 2 + star.y * k;
        
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const starSize = Math.max(1, (1 - star.z / 1000) * 3);
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - star.z / 1000})`;
          if (gameState === "cashed_out") {
            // Motion streaks
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 * (1 - star.z / 1000)})`;
            ctx.lineWidth = starSize;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx - star.x * k * 0.2, sy - star.y * k * 0.2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(sx, sy, starSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Camera Perspective Vanishing point
      const vanishX = width / 2;
      const vanishY = height * 0.45;
      const horizonY = vanishY;

      // Horizon glow line
      ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      // Highway Lanes (3D perspective grid)
      const laneWidths = [
        { l: -250, r: -80 },  // Left Lane
        { l: -80, r: 80 },    // Center Lane
        { l: 80, r: 250 }     // Right Lane
      ];

      // Screen shake modifier
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current *= 0.9; // decay
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Render grid gridlines moving backwards to simulate high motion speed
      const offset = (frameCountRef.current * gameSpeedRef.current) % 100;
      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 2;
      for (let z = 1000; z > 10; z -= 80) {
        const adjustedZ = z - offset;
        if (adjustedZ <= 0) continue;
        const k = 400 / adjustedZ;
        const y = vanishY + 300 * k;
        if (y < horizonY) continue;

        // Render crosswise line
        const leftLimit = vanishX - 400 * k;
        const rightLimit = vanishX + 400 * k;
        ctx.beginPath();
        ctx.moveTo(leftLimit, y);
        ctx.lineTo(rightLimit, y);
        ctx.stroke();
      }

      // Draw 3D road border perspective lines
      ctx.strokeStyle = "#f43f5e"; // hot neon pink
      ctx.lineWidth = 4;
      
      const drawPerspectiveLine = (xOffsetStart: number) => {
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        const bottomK = 400 / 50;
        const bottomX = vanishX + xOffsetStart * bottomK;
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      };

      // Draw boundaries
      drawPerspectiveLine(-250);
      drawPerspectiveLine(-80);
      drawPerspectiveLine(80);
      drawPerspectiveLine(250);

      // Obstacle management & rendering
      const currentMulti = currentMultiplierRef.current;
      const crashPoint = crashPointRef.current;

      // Obstacle spawning
      if (gameState === "playing") {
        frameCountRef.current++;
        gameSpeedRef.current = 5.0 + currentMulti * 1.5;

        // Near-crash trigger logic
        const isNearCrash = currentMulti >= crashPoint * 0.94;
        
        if (isNearCrash && !crashTriggeredRef.current) {
          crashTriggeredRef.current = true;
          obstaclesRef.current.push(
            { id: Date.now() + 1, lane: 0, z: 1000, color: "#ef4444", passed: false },
            { id: Date.now() + 2, lane: 1, z: 1000, color: "#ef4444", passed: false },
            { id: Date.now() + 3, lane: 2, z: 1000, color: "#ef4444", passed: false }
          );
        } else if (frameCountRef.current % 90 === 0 && !isNearCrash) {
          const blockedLanes: Lane[] = [];
          const numObstacles = Math.random() > 0.6 ? 2 : 1;
          while (blockedLanes.length < numObstacles) {
            const lane = Math.floor(Math.random() * 3) as Lane;
            if (!blockedLanes.includes(lane)) {
              blockedLanes.push(lane);
            }
          }
          blockedLanes.forEach((lane, idx) => {
            obstaclesRef.current.push({
              id: Date.now() + idx,
              lane,
              z: 1000,
              color: "#f43f5e",
              passed: false
            });
          });
        }
      }

      // Update & render obstacles
      obstaclesRef.current.forEach(obs => {
        if (gameState !== "cashed_out") {
          obs.z -= gameSpeedRef.current;
        }

        // Draw Obstacle 3D Cube outline
        if (obs.z > 20) {
          const k = 400 / obs.z;
          const laneCenter = (laneWidths[obs.lane].l + laneWidths[obs.lane].r) / 2;
          const ox = vanishX + laneCenter * k;
          const oy = vanishY + 300 * k;

          const cubeWidth = 140 * k;
          const cubeHeight = 90 * k;

          if (oy - cubeHeight >= horizonY) {
            ctx.fillStyle = obs.color === "#ef4444" ? "rgba(239, 68, 68, 0.4)" : "rgba(244, 63, 94, 0.3)";
            ctx.strokeStyle = obs.color;
            ctx.lineWidth = Math.max(1, 4 * k);
            
            const backZ = obs.z + 50;
            const bk = 400 / backZ;
            const boxX = vanishX + laneCenter * bk;
            const boxY = vanishY + 300 * bk;
            const backW = 140 * bk;
            const backH = 90 * bk;

            ctx.beginPath();
            ctx.rect(boxX - backW / 2, boxY - backH, backW, backH);
            ctx.stroke();

            const connectCorners = (fx: number, fy: number, bx: number, by: number) => {
              ctx.beginPath();
              ctx.moveTo(fx, fy);
              ctx.lineTo(bx, by);
              ctx.stroke();
            };

            connectCorners(ox - cubeWidth / 2, oy - cubeHeight, boxX - backW / 2, boxY - backH);
            connectCorners(ox + cubeWidth / 2, oy - cubeHeight, boxX + backW / 2, boxY - backH);
            connectCorners(ox - cubeWidth / 2, oy, boxX - backW / 2, boxY);
            connectCorners(ox + cubeWidth / 2, oy, boxX + backW / 2, boxY);

            ctx.fillRect(ox - cubeWidth / 2, oy - cubeHeight, cubeWidth, cubeHeight);
            ctx.beginPath();
            ctx.rect(ox - cubeWidth / 2, oy - cubeHeight, cubeWidth, cubeHeight);
            ctx.stroke();

            if (obs.z > 600 && obs.lane === playerLaneRef.current) {
              ctx.font = "bold 10px monospace";
              ctx.fillStyle = "#f59e0b";
              ctx.fillText("⚠️ OBSTACLE AHEAD", ox - 45, oy - cubeHeight - 10);
            }
          }
        }

        // Collision Check
        if (obs.z < 75 && obs.z > 35 && !obs.passed) {
          const isPlayerHit = obs.lane === playerLaneRef.current;
          if (isPlayerHit) {
            setGameState("crashed");
            stopAudio();
            playSound("crash");
            screenShakeRef.current = 30;
            obs.passed = true;
          } else {
            const isNear = Math.abs(obs.lane - playerLaneRef.current) === 1;
            if (isNear) {
              setNearMissActive(true);
              playSound("nearmiss");
              screenShakeRef.current = 6;
              setTimeout(() => setNearMissActive(false), 500);
            }
            obs.passed = true;
          }
        }
      });

      obstaclesRef.current = obstaclesRef.current.filter(obs => obs.z > 20);

      // Render Player Vehicle
      if (gameState !== "crashed") {
        const laneIdx = playerLaneRef.current;
        const targetX = vanishX + ((laneWidths[laneIdx].l + laneWidths[laneIdx].r) / 2) * (400 / 55);
        const shipY = height - 100;
        
        ctx.save();
        ctx.translate(targetX, shipY);

        const tilt = Math.sin(time * 0.007) * 4;
        ctx.rotate((tilt * Math.PI) / 180);

        const gradient = ctx.createLinearGradient(-30, 0, 30, 0);
        gradient.addColorStop(0, "#00f2fe");
        gradient.addColorStop(0.5, "#4facfe");
        gradient.addColorStop(1, "#00f2fe");

        ctx.fillStyle = gradient;
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-25, 10);
        ctx.lineTo(-10, 5);
        ctx.lineTo(0, 15);
        ctx.lineTo(10, 5);
        ctx.lineTo(25, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const flameHeight = 15 + Math.random() * 15;
        const flameGrad = ctx.createLinearGradient(0, 15, 0, 15 + flameHeight);
        flameGrad.addColorStop(0, "rgba(244, 63, 94, 1)");
        flameGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.8)");
        flameGrad.addColorStop(1, "rgba(253, 224, 71, 0)");
        
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-8, 10);
        ctx.lineTo(0, 15 + flameHeight);
        ctx.lineTo(8, 10);
        ctx.closePath();
        ctx.fill();

        if (Math.random() > 0.5) {
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc((Math.random() - 0.5) * 6, 12 + Math.random() * 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      } else {
        for (let i = 0; i < 25; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 80 * (1 - screenShakeRef.current / 30);
          const px = vanishX + Math.cos(angle) * dist + ((laneWidths[playerLaneRef.current].l + laneWidths[playerLaneRef.current].r) / 2) * (400 / 55);
          const py = height - 100 + Math.sin(angle) * dist;
          ctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#f59e0b";
          ctx.beginPath();
          ctx.arc(px, py, Math.random() * 12 + 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      ctx.fillStyle = "rgba(2, 5, 10, 0.05)";
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1.5);
      }

      localAnimationFrameId = requestAnimationFrame(render);
    };

    localAnimationFrameId = requestAnimationFrame(render);
    animationFrameIdRef.current = localAnimationFrameId;

    return () => {
      cancelAnimationFrame(localAnimationFrameId);
    };
  }, [gameState, playSound, stopAudio]);

  // Manage multipliers & tick
  useEffect(() => {
    if (gameState !== "playing") return;

    const startTime = Date.now();
    
    const tickInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawMulti = 1.00 + Math.pow(elapsed / 1000, 1.2) * 0.15;
      const roundedMulti = parseFloat(rawMulti.toFixed(2));
      currentMultiplierRef.current = roundedMulti;
      setMultiplier(roundedMulti);

      if (roundedMulti >= crashPointRef.current) {
        clearInterval(tickInterval);
        setGameState("crashed");
        stopAudio();
        playSound("crash");
        screenShakeRef.current = 30;
        
        setTimeout(() => {
          onCompleteRef.current(0, false);
        }, 1500);
      }
    }, 50);

    return () => clearInterval(tickInterval);
  }, [gameState, playSound, stopAudio]);

  const handleStartRun = () => {
    if (gameState === "playing" || gameState === "crashed" || gameState === "cashed_out") return;

    const outcome = calculateGameOutcome("CRASH");
    crashPointRef.current = parseFloat(outcome.multiplier.toFixed(2));
    currentMultiplierRef.current = 1.00;
    
    crashTriggeredRef.current = false;
    obstaclesRef.current = [];
    setPlayerLane(1);
    setMultiplier(1.00);
    gameSpeedRef.current = 6.0;

    setGameState("playing");
    initAudio();
  };

  const handleCashoutClick = () => {
    if (gameState !== "playing") return;

    const finalClaim = currentMultiplierRef.current;
    setGameState("cashed_out");
    stopAudio();
    playSound("cashout");

    setTimeout(() => {
      onCompleteRef.current(finalClaim, true);
    }, 1800);
  };

  useEffect(() => {
    if (gameState === "playing") {
      onLiveTick?.(multiplier);
    } else {
      onLiveTick?.(1.0);
    }
  }, [multiplier, gameState, onLiveTick]);

  useEffect(() => {
    const handleTriggerCashout = () => {
      if (gameState === "playing") {
        handleCashoutClick();
      }
    };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout", handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [gameState]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) {
        stopAudio();
      } else {
        if (gameState === "playing") initAudio();
      }
      return next;
    });
  };

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-[#02050a] rounded-[2.5rem] border-4 border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative flex flex-col items-center overflow-hidden font-sans select-none">
      
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block" />

      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.45)_95%)]" />

      <AnimatePresence>
        {nearMissActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none border-4 border-yellow-500/50 flex items-center justify-center bg-yellow-500/5"
          >
            <div className="bg-yellow-500/20 backdrop-blur-md px-6 py-2 rounded-xl border border-yellow-500/40 text-yellow-400 font-mono font-black text-xl tracking-wider uppercase animate-pulse">
              ⚡ CLOSE CALL! +WARP SPEED ⚡
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 w-full flex justify-between items-center p-6 bg-gradient-to-b from-black/85 to-transparent">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-white/80 border border-slate-700/60 rounded-xl px-4 py-1.5 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-slate-900 font-black text-sm uppercase tracking-widest leading-none">Neon Horizon 3D</h2>
          </div>
          {gameState === "playing" && (
            <span className="text-[10px] text-cyan-400 font-mono font-bold tracking-widest pl-2">
              🏎️ SPEED: {Math.round(gameSpeedRef.current * 18)} KM/H
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleMute}
            className="w-10 h-10 rounded-xl bg-white/60 border border-slate-700/60 flex items-center justify-center text-slate-650 hover:text-slate-900 transition-colors backdrop-blur-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="bg-white/80 backdrop-blur-md border border-slate-700/50 px-5 py-2.5 rounded-2xl flex flex-col items-end shadow-lg shadow-black/40 min-w-[120px]">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Multiplier</span>
            <span className={`text-2xl font-mono font-black tabular-nums transition-all ${
              gameState === "crashed" ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
              gameState === "cashed_out" ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.7)]" :
              gameState === "playing" ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse" : "text-slate-600"
            }`}>
              {multiplier.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-20">
        
        <AnimatePresence>
          {gameState === "idle" && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-700/50 p-8 rounded-3xl text-center max-w-sm mx-4 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Zap className="w-8 h-8 text-slate-900 stroke-[2.5]" />
              </div>
              <h3 className="text-slate-900 font-black text-xl uppercase tracking-widest">Manual Drive Mode</h3>
              <p className="text-slate-650 text-xs font-semibold leading-relaxed">
                Steer using <kbd className="bg-white border border-slate-700 px-1 py-0.5 rounded text-[10px]">A</kbd> / <kbd className="bg-white border border-slate-700 px-1 py-0.5 rounded text-[10px]">D</kbd> or <kbd className="bg-white border border-slate-700 px-1 py-0.5 rounded text-[10px]">←</kbd> / <kbd className="bg-white border border-slate-700 px-1 py-0.5 rounded text-[10px]">→</kbd> on keyboard. Dodge neon blockades. Cashout before crashing!
              </p>
              
              {!isPlaying ? (
                <div className="mt-2 text-yellow-400 font-mono text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full">
                  ⚠️ Place Bet to Enable Ignition
                </div>
              ) : (
                <button
                  onClick={handleStartRun}
                  className="w-full mt-2 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
                >
                  🚀 Launch Engine
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameState === "crashed" && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 bg-white/60 backdrop-blur-sm px-10 py-6 rounded-3xl border border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.35)]"
            >
              <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
              <span className="text-red-500 font-mono font-black text-4xl uppercase tracking-widest leading-none drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                COLLISION!
              </span>
              <span className="text-slate-650 text-xs font-bold font-mono tracking-wider mt-1">
                Wreckage multiplier locked at 0.00x
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameState === "cashed_out" && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2 bg-white/65 backdrop-blur-md px-12 py-8 rounded-3xl border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.35)] rotate-3"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md">
                <Wallet className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-emerald-400 font-mono font-black text-3xl uppercase tracking-widest leading-none drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                WARP CASHED
              </span>
              <span className="text-slate-900 font-mono font-black text-4xl tracking-tighter mt-1">
                {multiplier.toFixed(2)}x
              </span>
              <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest mt-0.5">
                + ₹{(betAmount * multiplier).toFixed(2)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {gameState === "playing" && (
        <div className="absolute inset-x-0 bottom-6 z-30 flex justify-between px-6 pointer-events-none md:hidden">
          <button 
            onTouchStart={steerLeft}
            onClick={steerLeft}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-slate-900 active:bg-white/35 active:scale-90 transition-all pointer-events-auto backdrop-blur-sm"
          >
            <ArrowLeft className="w-8 h-8 stroke-[3]" />
          </button>

          <button 
            onTouchStart={steerRight}
            onClick={steerRight}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-slate-900 active:bg-white/35 active:scale-90 transition-all pointer-events-auto backdrop-blur-sm"
          >
            <ArrowRight className="w-8 h-8 stroke-[3]" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {gameState === "playing" && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="hidden md:block absolute bottom-8 z-30 w-full max-w-sm px-6"
          >
            <button 
              onClick={handleCashoutClick}
              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-slate-955 font-black text-xl py-4 rounded-2xl shadow-[0_8px_0_rgba(6,95,70,1),0_15px_25px_rgba(16,185,129,0.4)] active:translate-y-2 active:shadow-[0_0_0_rgba(6,95,70,1),0_5px_10px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-3 border-2 border-emerald-300"
            >
              CASHOUT MULTIPLIER <Wallet className="w-6 h-6 stroke-[3]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
