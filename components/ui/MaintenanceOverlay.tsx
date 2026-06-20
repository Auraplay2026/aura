"use client";

import { useEffect, useState } from "react";
import { useTradingStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Lock, Activity } from "lucide-react";

export default function MaintenanceOverlay() {
  const currentUser = useTradingStore(state => state.currentUser);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/system-status");
        if (res.ok) {
          const data = await res.json();
          setMaintenanceActive(!!data.maintenanceMode);
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    };

    checkStatus();
    // Poll every 15 seconds to sync dynamically
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!maintenanceActive) return null;

  if (isAdmin) {
    // Floating badge for administrators showing bypass mode
    return (
      <div className="fixed bottom-6 left-6 z-[9999] bg-amber-500 border border-amber-400 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-wider animate-pulse select-none">
        <ShieldAlert className="w-4 h-4 text-slate-950" />
        <span>Bypass Active · Maintenance Enabled</span>
      </div>
    );
  }

  // Full-screen overlay blocking standard users
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center p-4 overflow-hidden select-none"
      >
        {/* Glowing decorative background rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 w-full max-w-md bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center gap-6">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border-2 border-rose-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-dashed border-rose-500/40 animate-[spin_8s_linear_infinite]" />
            <div className="relative w-14 h-14 bg-rose-600/10 border border-rose-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-rose-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-slate-900 font-black text-2xl uppercase tracking-wider leading-none">
              Optimization in Progress
            </h1>
            <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 mt-2">
              <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              Platform Lock Engaged
            </p>
          </div>

          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Our systems are currently undergoing core database and settlement engine optimizations. 
            All wagers, balances, and deposits are completely secure. Normal operations will resume shortly.
          </p>

          <div className="w-full border-t border-white/5 pt-4 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            Thank you for your patience · AuraPlay Security Ops
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
