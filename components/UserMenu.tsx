"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { User, Wallet, Settings, History, Activity, BarChart, LogOut, FileText, ChevronDown } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  onOpenCashier: () => void;
}

export function UserMenu({ onOpenCashier }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useTradingStore(state => state.currentUser);
  const logout = useTradingStore(state => state.logout);

  const getInitials = (name: string) => {
    if (!name) return "P1";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const MENU_ITEMS = [
    { label: "My Profile", icon: User, href: "/account" },
    { label: "Balance Overview", icon: Wallet, href: "/account/balance" },
    { label: "Account Statement", icon: FileText, href: "/account/statement" },
    { label: "My Bets", icon: Activity, href: "/account/bets" },
    { label: "Bets History", icon: History, href: "/history" },
    { label: "Profit & Loss", icon: BarChart, href: "/account/pnl" },
    { label: "Activity Log", icon: Settings, href: "/account/activity" },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-2 rounded-sm hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
          <span className="font-bold text-blue-600 text-xs">
            {currentUser ? getInitials(currentUser.username) : "P1"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 shadow-2xl z-50 py-1 rounded-sm"
            >
              <div className="px-4 py-2 border-b border-slate-200 mb-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {currentUser?.username || "PlayerOne"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {currentUser?.email || "demo@aurabet.io"}
                </p>
              </div>

              <div className="flex flex-col">
                {MENU_ITEMS.map((item) => (
                  item.href ? (
                    <Link 
                      key={item.label}
                      href={item.href} 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <item.icon className="w-3.5 h-3.5 text-slate-400" /> 
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                        onClick={() => {
                          setIsOpen(false);
                          if ('action' in item) (item as any).action?.();
                        }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left"
                    >
                      <item.icon className="w-3.5 h-3.5 text-slate-400" /> 
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
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
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
