"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, X, CheckCircle2 } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { usePathname } from "next/navigation";

export function AIConcierge() {
  const pathname = usePathname();
  const isSportsbook = pathname?.startsWith("/sportsbook");
  const isCasinoGame = pathname?.startsWith("/casino/game");
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, deposit } = useTradingStore();
  const [claimed, setClaimed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      setClaimed(localStorage.getItem("vip_concierge_drop_claimed") === "true");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOpenConcierge = () => setIsOpen(true);
    window.addEventListener("open-ai-concierge", handleOpenConcierge);
    return () => window.removeEventListener("open-ai-concierge", handleOpenConcierge);
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
    <div className={`fixed ${isCasinoGame ? "bottom-24" : "bottom-20 md:bottom-6"} z-[42] flex flex-col items-end gap-4 transition-all duration-300 pointer-events-none ${isSportsbook ? "right-4 sm:right-6 lg:right-[344px]" : "right-4 sm:right-6"}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-80 bg-white/95 backdrop-blur-xl border border-red-200 rounded-2xl p-5 shadow-2xl origin-bottom-right pointer-events-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black tracking-wider text-sm">AURA</h3>
                  <p className="text-red-600 text-[9px] font-bold uppercase tracking-[0.2em]">VIP Concierge</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
              <p className="text-sm text-slate-700 leading-relaxed relative z-10">
                Welcome to <span className="text-slate-900 font-bold">AuraPlay Premium</span>. I noticed you enjoy high-volatility action. 
                <br/><br/>
                <span className="text-red-600 font-bold tracking-wide">Gates of Olympus</span> is currently hitting massive multipliers. Want me to load it up?
              </p>
            </div>
            
            <button 
              onClick={handleClaim}
              disabled={claimed}
              className={`w-full font-black tracking-widest uppercase text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 ${claimed ? 'bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-red-700 text-slate-900 shadow-md cursor-pointer'}`}
            >
              {claimed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Drop Claimed
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" /> Claim ₹4,000 VIP Drop
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center relative group shadow-xl pointer-events-auto ${isCasinoGame ? "hidden sm:flex" : "flex"}`}
      >
        {/* Pulsing Aura */}
        <div className="absolute inset-[-10px] rounded-full bg-red-100 blur-xl opacity-40 group-hover:opacity-80 transition-opacity animate-pulse pointer-events-none" />
        
        {/* Core Orb */}
        <div className="absolute inset-[2px] rounded-full bg-white border border-red-100 flex items-center justify-center z-10 overflow-hidden shadow-sm">
           <div className="absolute top-0 right-0 w-8 h-8 bg-red-50 blur-md rounded-full" />
           <Sparkles className="w-6 h-6 text-red-600" />
        </div>
      </button>
    </div>
  );
}
