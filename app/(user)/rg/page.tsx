"use client";

import { useState } from "react";
import { Shield, AlertTriangle, Info, CheckCircle2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type LimitType = "Wager" | "Loss";
type Timeframe = "Daily" | "Weekly" | "Monthly";

export default function ResponsibleGamingPage() {
  const [activeTab, setActiveTab] = useState<LimitType>("Wager");
  
  // State for the limits
  const [limits, setLimits] = useState({
    Wager: { Daily: "", Weekly: "", Monthly: "" },
    Loss: { Daily: "", Weekly: "", Monthly: "" }
  });

  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const handleSave = () => {
    setSavedStatus("Limits updated securely.");
    setTimeout(() => setSavedStatus(null), 3000);
  };

  const handleInputChange = (timeframe: Timeframe, value: string) => {
    setLimits(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [timeframe]: value
      }
    }));
  };

  return (
    <div className="flex h-full w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-10 justify-center items-start pt-12 md:pt-20">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-800/50 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-neon-yellow/10 rounded-2xl flex items-center justify-center border border-neon-yellow/20">
              <Shield className="w-6 h-6 text-neon-yellow" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Play Safely</h1>
              <p className="text-sm text-slate-400 mt-1">Configure your personal betting limits.</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Custom Tabs */}
          <div className="flex p-1 bg-slate-950/50 border border-slate-800 rounded-xl relative">
            <button
              onClick={() => setActiveTab("Wager")}
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-lg transition-colors relative z-10",
                activeTab === "Wager" ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Wager Limits
            </button>
            <button
              onClick={() => setActiveTab("Loss")}
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-lg transition-colors relative z-10",
                activeTab === "Loss" ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Loss Limits
            </button>
            
            {/* Sliding Tab Indicator */}
            <motion.div
              layoutId="rg-tab-indicator"
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-sm border border-slate-700"
              initial={false}
              animate={{
                left: activeTab === "Wager" ? "4px" : "calc(50% + 0px)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200/70 leading-relaxed">
              {activeTab === "Wager" 
                ? "Wager limits restrict the total amount you can bet within a specific timeframe, regardless of your wins or losses. Once reached, you will not be able to place new bets until the period resets."
                : "Loss limits restrict the total amount of net losses you can incur. This is calculated as (Total Wagers - Total Winnings). Once reached, you cannot play until the period resets."}
            </p>
          </div>

          {/* Form Inputs */}
          <div className="space-y-6">
            {(["Daily", "Weekly", "Monthly"] as Timeframe[]).map((timeframe) => (
              <div key={timeframe} className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  {timeframe} Limit
                  {limits[activeTab][timeframe] && (
                    <span className="text-[10px] text-neon-green flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-white transition-colors">₹</span>
                  <input
                    type="number"
                    placeholder="No limit set"
                    value={limits[activeTab][timeframe]}
                    onChange={(e) => handleInputChange(timeframe, e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all shadow-inner placeholder:font-normal placeholder:text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 border-t border-slate-800/50 bg-slate-900/30 flex items-center justify-between">
          <div className="flex-1">
            <AnimatePresence>
              {savedStatus && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-neon-green font-bold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> {savedStatus}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={handleSave}
            className="bg-white hover:bg-slate-200 text-slate-950 font-black py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" />
            Save {activeTab} Limits
          </button>
        </div>

      </motion.div>
    </div>
  );
}
