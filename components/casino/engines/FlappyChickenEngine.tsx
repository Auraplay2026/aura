"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FlappyChickenEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function FlappyChickenEngine({ isPlaying, onComplete }: FlappyChickenEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameOver, setGameOver] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Game Constants
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -10;
  const PIPE_SPEED = 4;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 180;
  const CHICKEN_SIZE = 40;

  const isRiggedSession = useRef(false);

  // Mutable Game State
  const gameState = useRef({
    chicken: { y: 250, velocity: 0 },
    pipes: [] as { x: number, topHeight: number, passed: boolean }[],
    frames: 0,
    isActive: false,
    particles: [] as { x: number, y: number, vx: number, vy: number, life: number, color: string }[]
  });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const jump = useCallback(() => {
    if (!gameState.current.isActive) return;
    gameState.current.chicken.velocity = JUMP_STRENGTH;
    
    // Spawn jump particles
    for (let i = 0; i < 5; i++) {
      gameState.current.particles.push({
        x: 100 + CHICKEN_SIZE/2,
        y: gameState.current.chicken.y + CHICKEN_SIZE,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        life: 1.0,
        color: '#facc15' // Yellow feather color
      });
    }
  }, []);

  const triggerGameOver = useCallback((finalScore: number) => {
    gameState.current.isActive = false;
    setGameOver(true);
    
    // Calculate final multiplier (1.0x base + 0.2x per pipe passed)
    const finalMult = finalScore > 0 ? 1.0 + (finalScore * 0.2) : 0;
    const won = finalScore > 0;
    
    setTimeout(() => {
      onCompleteRef.current(Number(finalMult.toFixed(2)), won);
    }, 1500);
  }, []);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset State when isPlaying becomes true
    if (isPlaying && !gameOver && !gameState.current.isActive) {
      isRiggedSession.current = Math.random() > 0.02; // 98% chance of being rigged to lose
      gameState.current = {
        chicken: { y: canvas.height / 2, velocity: 0 },
        pipes: [],
        frames: 0,
        isActive: true,
        particles: []
      };
      setScore(0);
      setMultiplier(1.0);
      setGameOver(false);
    }

    const render = () => {
      // Clear Canvas
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pipeGap = isRiggedSession.current ? 30 : 180;

      // Draw Grid / Tech Background
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }

      if (gameState.current.isActive || gameOver) {
        const state = gameState.current;

        // Physics Updates
        if (state.isActive) {
          state.chicken.velocity += GRAVITY;
          state.chicken.y += state.chicken.velocity;
          state.frames++;

          // Spawn Pipes
          if (state.frames % 100 === 0) {
            const minHeight = 50;
            const maxHeight = canvas.height - pipeGap - 50;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            state.pipes.push({ x: canvas.width, topHeight, passed: false });
          }
        }

        // Render & Update Pipes
        ctx.fillStyle = '#22c55e'; // Neon Green pipes
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';

        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const pipe = state.pipes[i];
          
          if (state.isActive) {
            pipe.x -= PIPE_SPEED;
          }

          // Top Pipe
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
          // Bottom Pipe
          ctx.fillRect(pipe.x, pipe.topHeight + pipeGap, PIPE_WIDTH, canvas.height - pipe.topHeight - pipeGap);

          // Collision Detection
          const chickenLeft = 100;
          const chickenRight = 100 + CHICKEN_SIZE;
          const chickenTop = state.chicken.y;
          const chickenBottom = state.chicken.y + CHICKEN_SIZE;

          if (
            chickenRight > pipe.x && chickenLeft < pipe.x + PIPE_WIDTH &&
            (chickenTop < pipe.topHeight || chickenBottom > pipe.topHeight + pipeGap)
          ) {
            if (state.isActive) triggerGameOver(score);
          }

          // Score Update
          if (pipe.x + PIPE_WIDTH < chickenLeft && !pipe.passed) {
            pipe.passed = true;
            setScore(s => {
              const newScore = s + 1;
              setMultiplier(1.0 + (newScore * 0.2));
              return newScore;
            });
          }

          // Cleanup off-screen pipes
          if (pipe.x + PIPE_WIDTH < 0) {
            state.pipes.splice(i, 1);
          }
        }

        ctx.shadowBlur = 0; // Reset shadow

        // Floor / Ceiling Collision
        if (state.chicken.y + CHICKEN_SIZE > canvas.height || state.chicken.y < 0) {
          if (state.isActive) triggerGameOver(score);
        }

        // Render Particles
        state.particles.forEach((p, i) => {
          if (state.isActive) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
          }
          if (p.life > 0) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.globalAlpha = 1.0;
          } else {
            state.particles.splice(i, 1);
          }
        });

        // Render Chicken (Player)
        ctx.save();
        ctx.translate(100 + CHICKEN_SIZE/2, state.chicken.y + CHICKEN_SIZE/2);
        
        // Rotate based on velocity
        const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (state.chicken.velocity * 0.1)));
        ctx.rotate(rotation);
        
        // Draw Chicken Body (Yellow Square for now, stylized)
        ctx.fillStyle = '#facc15';
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
        ctx.fillRect(-CHICKEN_SIZE/2, -CHICKEN_SIZE/2, CHICKEN_SIZE, CHICKEN_SIZE);
        
        // Draw Eye
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 0;
        ctx.fillRect(CHICKEN_SIZE/4, -CHICKEN_SIZE/4, 10, 10);
        ctx.fillStyle = 'black';
        ctx.fillRect(CHICKEN_SIZE/4 + 4, -CHICKEN_SIZE/4 + 2, 4, 4);
        
        // Draw Beak
        ctx.fillStyle = '#f97316';
        ctx.fillRect(CHICKEN_SIZE/2, -5, 12, 10);

        ctx.restore();
      } else {
        // Idle Animation before play
        ctx.fillStyle = '#facc15';
        const floatY = canvas.height / 2 + Math.sin(Date.now() / 300) * 10;
        ctx.fillRect(100, floatY, CHICKEN_SIZE, CHICKEN_SIZE);
        ctx.fillStyle = 'white';
        ctx.fillRect(100 + CHICKEN_SIZE/2 + 5, floatY + 5, 10, 10);
        ctx.fillStyle = 'black';
        ctx.fillRect(100 + CHICKEN_SIZE/2 + 9, floatY + 7, 4, 4);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver, triggerGameOver, score]);

  // Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none" onClick={jump}>
      {/* Top HUD */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Score</p>
          <p className="text-3xl font-black text-white font-mono">{score}</p>
        </div>
        <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-neon-purple/30 shadow-[0_0_20px_rgba(168,85,247,0.2)] text-right">
          <p className="text-neon-purple text-xs font-bold uppercase tracking-widest mb-1">Current Multi</p>
          <p className="text-3xl font-black text-white font-mono">{multiplier.toFixed(2)}x</p>
        </div>
      </div>

      <canvas 
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full object-contain bg-[#050914] cursor-pointer"
      />

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
          >
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm">
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Crashed!</h2>
              <p className="text-slate-400 font-medium mb-6">You successfully navigated {score} pipes.</p>
              
              <div className="bg-black/50 rounded-2xl p-4 border border-white/5 mb-6">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Final Multiplier</p>
                <p className={score > 0 ? "text-4xl font-black text-neon-green font-mono drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "text-4xl font-black text-red-500 font-mono"}>
                  {score > 0 ? multiplier.toFixed(2) : "0.00"}x
                </p>
              </div>
              
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                Processing Payout...
              </div>
            </div>
          </motion.div>
        )}
        
        {!isPlaying && !gameOver && (
           <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
             <div className="bg-black/80 backdrop-blur-md border border-white/10 px-8 py-4 rounded-full text-white font-black tracking-widest uppercase animate-pulse shadow-[0_0_30px_rgba(255,255,255,0.1)]">
               Press Play or Space to Start
             </div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
