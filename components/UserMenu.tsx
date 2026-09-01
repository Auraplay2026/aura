"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { User, Wallet, Settings, History, Activity, BarChart, LogOut, FileText, ChevronDown, Gift, Shield, Crown } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  onOpenCashier: () => void;
}

export function UserMenu({ onOpenCashier }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useTradingStore(state => state.currentUser);
  const switchAccountType = useTradingStore(state => state.switchAccountType);
  const logout = useTradingStore(state => state.logout);

  const getInitials = (name: string) => {
    if (!name) return "P1";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getVipRingStyles = (level: string) => {
    switch (level) {
      case 'Bronze':
        return {
          border: 'border-[2px] border-amber-600/90 shadow-[0_0_6px_rgba(217,119,6,0.25)]',
          bg: 'from-amber-50 to-amber-100/80',
          text: 'text-amber-800'
        };
      case 'Silver':
        return {
          border: 'border-[2px] border-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.25)]',
          bg: 'from-slate-50 to-slate-100/80',
          text: 'text-slate-600'
        };
      case 'Gold':
        return {
          border: 'border-[2px] border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.45)]',
          bg: 'from-yellow-50 to-yellow-100/80',
          text: 'text-yellow-800'
        };
      case 'Platinum':
        return {
          border: 'border-[2px] border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.45)]',
          bg: 'from-cyan-50 to-cyan-100/80',
          text: 'text-cyan-800'
        };
      case 'Diamond':
        return {
          border: 'border-[2px] border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.55)] animate-pulse',
          bg: 'from-purple-50 to-purple-100/80',
          text: 'text-purple-800'
        };
      default:
        return {
          border: 'border-[2px] border-rose-200/80',
          bg: 'from-rose-50 to-rose-100/80',
          text: 'text-rose-600'
        };
    }
  };

  const vipLevel = currentUser?.vipLevel || 'Bronze';
  const ring = getVipRingStyles(vipLevel);

  const MENU_ITEMS = [
    { label: "My Profile", icon: User, href: "/account" },
    { label: "Balance & Funds", icon: Wallet, href: "/account/balance" },
    { label: "Account Statement", icon: FileText, href: "/account/statement" },
    { label: "My Bets", icon: Activity, href: "/account/bets" },
    { label: "Bets History", icon: History, href: "/history" },
    { label: "Profit & Loss", icon: BarChart, href: "/account/pnl" },
    { label: "Activity Log", icon: Settings, href: "/account/activity" },
    { label: "VIP Rewards Hub", icon: Crown, action: () => { window.dispatchEvent(new CustomEvent("open-rewards-hub")); } },
    { label: "Refer & Earn", icon: Gift, href: "/refer" },
    { label: "Safe Play", icon: Shield, href: "/rg" },
  ];

  if (currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'twintubrovquattro@gmail.com' || currentUser?.username?.toLowerCase() === 'admin') {
    MENU_ITEMS.unshift({ label: "Admin Operations Core", icon: Shield, href: "/admin" });
  }

  return (
    <div className="relative z-[9999]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-2 rounded-sm hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all focus:outline-none"
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br shrink-0",
          ring.border,
          ring.bg
        )}>
          <span className={cn("font-bold text-xs", ring.text)}>
            {currentUser ? getInitials(currentUser.username) : "P1"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-1 w-60 bg-white border border-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.25)] z-[9999] py-1 rounded-xl"
            >
              <div className="px-4 py-2.5 border-b border-slate-200 mb-1 bg-gradient-to-r from-red-50 to-rose-50/50">
                <p className="text-sm font-black text-slate-900 truncate">
                  {currentUser?.username || "PlayerOne"}
                </p>
                <p className="text-[11px] font-semibold text-slate-600 truncate">
                  {currentUser?.email || "demo@aurabet.io"}
                </p>
              </div>

              {/* 1-Tap Active Mode Switcher Card */}
              <div className="mx-2 my-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex flex-col">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Account Mode</span>
                  <span className="text-[11px] font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      currentUser?.accountType === 'real' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    )} />
                    {currentUser?.accountType === 'real' ? "Real Money (₹)" : "Free Demo"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const nextType = currentUser?.accountType === 'real' ? 'demo' : 'real';
                    switchAccountType(nextType);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border shadow-xs transition-all active:scale-95 cursor-pointer",
                    currentUser?.accountType === 'real'
                      ? "bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400"
                      : "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500"
                  )}
                >
                  Switch to {currentUser?.accountType === 'real' ? "Demo" : "Real"}
                </button>
              </div>

              <div className="flex flex-col">
                {MENU_ITEMS.map((item) => (
                  item.href ? (
                    <Link 
                      key={item.label}
                      href={item.href} 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-red-50/60 transition-all border-l-2 border-transparent hover:border-red-500"
                    >
                      <item.icon className="w-4 h-4 text-slate-500" /> 
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => {
                        setIsOpen(false);
                        if ('action' in item) (item as any).action?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-red-50/60 transition-all border-l-2 border-transparent hover:border-red-500 text-left cursor-pointer"
                    >
                      <item.icon className="w-4 h-4 text-slate-500" /> 
                      {item.label}
                    </button>
                  )
                ))}
              </div>

              <div className="mt-1 pt-1 border-t border-slate-200">
                <button 
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50/80 transition-all border-l-2 border-transparent hover:border-red-500 text-left"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
