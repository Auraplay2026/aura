"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTutorialForGame } from "@/lib/gameTutorials";
import { CheckCircle2, Play } from "lucide-react";

interface GameTutorialOverlayProps {
  categories: string[];
  gameTitle: string;
  onDismiss: () => void;
}

export function GameTutorialOverlay({ categories, gameTitle, onDismiss }: GameTutorialOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [mounted, setMounted] = useState(false);

  const tutorial = getTutorialForGame(categories);
  const storageKey = `tutorial_hidden_${tutorial.id}`;

  useEffect(() => {
    setMounted(true);
    const isHidden = localStorage.getItem(storageKey);
    if (!isHidden) {
      setIsVisible(true);
    } else {
      // If already hidden via local storage, immediately dismiss
      onDismiss();
    }
  }, [storageKey, onDismiss]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(storageKey, "true");
    }
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow exit animation to finish
  };

  if (!mounted || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#0a0f1a] rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
        >
          {/* Neon Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-neon-green to-teal-500" />
          
          <div className="p-8 md:p-10">
            {/* Title Section */}
            <div className="mb-8">
              <p className="text-neon-green font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                Smart Onboarding
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                {tutorial.title}
              </h2>
              <p className="text-slate-400 font-medium text-lg">
                {tutorial.description}
              </p>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-6 mb-10">
              {tutorial.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500/80" />
                  </div>
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {/* Emphasize the ₹ symbol if present */}
                    {step.split('₹').map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && <span className="text-emerald-400 font-bold">₹</span>}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-slate-600 group-hover:border-slate-400'}`}>
                  {dontShowAgain && <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={4} />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={dontShowAgain} 
                  onChange={(e) => setDontShowAgain(e.target.checked)} 
                />
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                  Don't show this again for {gameTitle}
                </span>
              </label>

              <button
                onClick={handleDismiss}
                className="w-full flex items-center justify-center gap-3 bg-neon-green hover:bg-emerald-500 text-black px-8 py-4 rounded-xl font-black text-xl tracking-wide uppercase transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(34,197,94,0.3)]"
              >
                <span>Play Now</span>
                <Play className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
