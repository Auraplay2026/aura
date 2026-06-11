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
    { label: "Cashier", icon: Wallet, action: onOpenCashier, color: "text-green-600" },
    ...(currentUser?.role === 'admin' ? [
      { label: "Admin Deposits", icon: Settings, href: "/admin/deposits", color: "text-yellow-600 font-black" },
      { label: "RTP Live Monitor", icon: Shield, href: "/admin/rtp-monitor", color: "text-yellow-600 font-black" },
      { label: "AI Support Desk", icon: MessageSquare, href: "/admin/support", color: "text-yellow-600 font-black" }
    ] : []),
    { label: "Top 1% Portfolios", icon: Crown, href: "/vip/top-portfolios", color: "text-amber-500 font-black shadow-sm" },
    { label: "Account Settings", icon: Settings, href: "/account" },
    { label: "History", icon: History, href: "/history" },
    { label: "Refer & Earn", icon: Gift, href: "/refer" },
    { label: "VIP Club", icon: Crown, href: "/vip", color: "text-yellow-600" },
    { label: "Help Center", icon: HelpCircle, href: "/support" },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 hover:border-slate-300 transition-colors focus:outline-none overflow-hidden"
      >
        <span className="font-black text-slate-700 text-sm">
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
              className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-2xl shadow-xl rounded-2xl z-50 py-2 border border-slate-200 transform origin-top-right"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900 tracking-wide truncate">
                  {currentUser?.username || "PlayerOne"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                  {currentUser?.email || "demo@aurabet.io"}
                </p>
                <p className="text-xs text-blue-600 font-semibold mt-1">VIP Gold Tier</p>
              </div>

              {currentUser && (
                <div className="px-4 py-2.5 border-b border-slate-100 flex flex-col gap-2 bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Account Mode</p>
                  <div className="bg-white p-1 rounded-xl flex border border-slate-200 relative">
                    <button
                      onClick={() => switchAccountType('demo')}
                      className={cn(
                        "flex-1 py-1 text-center text-xs font-black rounded-lg transition-all",
                        currentUser.accountType === 'demo'
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      Demo
                    </button>
                    <button
                      onClick={() => switchAccountType('real')}
                      className={cn(
                        "flex-1 py-1 text-center text-xs font-black rounded-lg transition-all",
                        currentUser.accountType === 'real'
                          ? "bg-green-500 text-white shadow-md"
                          : "text-slate-500 hover:text-slate-900"
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
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group"
                    >
                      <item.icon className={`w-4 h-4 ${item.color || "text-slate-600 group-hover:text-slate-600 transition-colors"}`} /> 
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => {
                        setIsOpen(false);
                        item.action?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group"
                    >
                      <item.icon className={`w-4 h-4 ${item.color || "text-slate-600 group-hover:text-slate-600 transition-colors"}`} /> 
                      {item.label}
                    </button>
                  )
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
