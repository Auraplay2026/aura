"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { User, Wallet, Settings, History, Gift, Crown, HelpCircle, MessageSquare, LogOut, Shield } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  onOpenCashier: () => void;
}

export function UserMenu({ onOpenCashier }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useTradingStore(state => state.currentUser);
  const logout = useTradingStore(state => state.logout);
  const switchAccountType = useTradingStore(state => state.switchAccountType);

  const getInitials = (name: string) => {
    if (!name) return "P1";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const MENU_ITEMS = [
    { label: "Cashier", icon: Wallet, action: onOpenCashier, color: "text-[#22c55e]" },
    ...(currentUser?.role === 'admin' ? [
      { label: "Admin Deposits", icon: Settings, href: "/admin/deposits", color: "text-yellow-500 font-black" },
      { label: "RTP Live Monitor", icon: Shield, href: "/admin/rtp-monitor", color: "text-yellow-500 font-black" },
      { label: "AI Support Desk", icon: MessageSquare, href: "/admin/support", color: "text-yellow-500 font-black" }
    ] : []),
    { label: "Top 1% Portfolios", icon: Crown, href: "/vip/top-portfolios", color: "text-amber-400 font-black drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" },
    { label: "Account Settings", icon: Settings, href: "/account" },
    { label: "History", icon: History, href: "/history" },
    { label: "Refer & Earn", icon: Gift, href: "/refer" },
    { label: "VIP Club", icon: Crown, href: "/vip", color: "text-[#eab308]" },
    { label: "Help Center", icon: HelpCircle, href: "/support" },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 hover:border-slate-500 transition-colors focus:outline-none overflow-hidden"
      >
        <span className="font-black text-slate-300 text-sm">
          {currentUser ? getInitials(currentUser.username) : "P1"}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-64 bg-slate-950/90 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-2xl z-50 py-2 border border-slate-800/80 transform origin-top-right ring-1 ring-white/5"
            >
              <div className="px-4 py-3 border-b border-slate-800/50">
                <p className="text-sm font-bold text-white tracking-wide truncate">
                  {currentUser?.username || "PlayerOne"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {currentUser?.email || "demo@aurabet.io"}
                </p>
                <p className="text-xs text-[#a855f7] font-semibold mt-1">VIP Gold Tier</p>
              </div>

              {currentUser && (
                <div className="px-4 py-2.5 border-b border-slate-800/50 flex flex-col gap-2 bg-black/10">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Account Mode</p>
                  <div className="bg-black/60 p-1 rounded-xl flex border border-white/5 relative">
                    <button
                      onClick={() => switchAccountType('demo')}
                      className={cn(
                        "flex-1 py-1 text-center text-xs font-black rounded-lg transition-all",
                        currentUser.accountType === 'demo'
                          ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      Demo
                    </button>
                    <button
                      onClick={() => switchAccountType('real')}
                      className={cn(
                        "flex-1 py-1 text-center text-xs font-black rounded-lg transition-all",
                        currentUser.accountType === 'real'
                          ? "bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      Real
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col mt-1">
                {MENU_ITEMS.map((item) => (
                  item.href ? (
                    <Link 
                      key={item.label}
                      href={item.href} 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors group"
                    >
                      <item.icon className={`w-4 h-4 ${item.color || "text-slate-500 group-hover:text-slate-300 transition-colors"}`} /> 
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => {
                        setIsOpen(false);
                        item.action?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors group"
                    >
                      <item.icon className={`w-4 h-4 ${item.color || "text-slate-500 group-hover:text-slate-300 transition-colors"}`} /> 
                      {item.label}
                    </button>
                  )
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/50">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
