"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, X, CheckCircle2 } from "lucide-react";
import { useTradingStore } from "@/lib/store";

export function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, deposit } = useTradingStore();
  const [claimed, setClaimed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setClaimed(localStorage.getItem("vip_concierge_drop_claimed") === "true");
  }, []);

  const handleClaim = () => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }));
      setIsOpen(false);
      return;
    }
    if (claimed) return;
    
    // Deposit ₹4,000 (~$50)
    deposit(4000, "AURA VIP Drop");
    localStorage.setItem("vip_concierge_drop_claimed", "true");
    setClaimed(true);
    alert("₹4,000 VIP Drop claimed successfully and credited to your wallet!");
  };

  if (!isClient) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-80 bg-[#0a0a0f]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 shadow-[0_0_50px_rgba(168,85,247,0.3)] origin-bottom-right"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  <Sparkles className="w-5 h-5 text-neon-purple" />
                </div>
                <div>
                  <h3 className="text-white font-black tracking-wider text-sm">AURA</h3>
                  <p className="text-neon-purple text-[9px] font-bold uppercase tracking-[0.2em]">VIP Concierge</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="bg-purple-900/10 border border-purple-500/10 rounded-xl p-4 mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
              <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                Welcome to <span className="text-white font-bold">AuraPlay Premium</span>. I noticed you enjoy high-volatility action. 
                <br/><br/>
                <span className="text-neon-yellow font-bold tracking-wide">Gates of Olympus</span> is currently hitting massive multipliers. Want me to load it up?
              </p>
            </div>
            
            <button 
              onClick={handleClaim}
              disabled={claimed}
              className={`w-full text-white font-black tracking-widest uppercase text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all transform hover:scale-[1.02] active:scale-95 ${claimed ? 'bg-slate-800 border border-white/5 text-slate-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] cursor-pointer'}`}
            >
              {claimed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Drop Claimed
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" /> Claim $50 VIP Drop
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-black border border-white/10 flex items-center justify-center relative group shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      >
        {/* Pulsing Aura */}
        <div className="absolute inset-[-10px] rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-xl opacity-40 group-hover:opacity-80 transition-opacity animate-pulse pointer-events-none" />
        
        {/* Core Orb */}
        <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-[#1a1a24] to-black border border-purple-500/30 flex items-center justify-center z-10 overflow-hidden">
           <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 blur-md rounded-full" />
           <Sparkles className="w-6 h-6 text-neon-purple drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        </div>
      </button>
    </div>
  );
}
