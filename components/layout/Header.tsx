"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Briefcase, Menu, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CashierModal } from "@/components/ui/CashierModal";
import { UserMenu } from "@/components/UserMenu";
import { useSidebarContext } from "@/components/layout/AppProviders";
import { useTradingStore } from "@/lib/store";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";
import { AuthModal } from "@/components/ui/AuthModal";
import { SearchModal } from "@/components/ui/SearchModal";
import Link from "next/link";

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const { balance, positions, isLoggedIn, currentUser, xp } = useTradingStore();

  // IST digital clock time string
  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hours = istTime.getHours().toString().padStart(2, '0');
      const minutes = istTime.getMinutes().toString().padStart(2, '0');
      const seconds = istTime.getSeconds().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Flashing states for balance and exposure changes
  const [prevBalance, setPrevBalance] = useState(balance);
  const [balanceFlash, setBalanceFlash] = useState<"up" | "down" | null>(null);

  const currentExposure = positions.reduce((acc, p) => acc + (p.investment || 0), 0);
  const [prevExposure, setPrevExposure] = useState(currentExposure);
  const [exposureFlash, setExposureFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (balance > prevBalance) {
      setBalanceFlash("up");
      const timer = setTimeout(() => setBalanceFlash(null), 1000);
      return () => clearTimeout(timer);
    } else if (balance < prevBalance) {
      setBalanceFlash("down");
      const timer = setTimeout(() => setBalanceFlash(null), 1000);
      return () => clearTimeout(timer);
    }
    setPrevBalance(balance);
  }, [balance, prevBalance]);

  useEffect(() => {
    if (currentExposure > prevExposure) {
      setExposureFlash("up");
      const timer = setTimeout(() => setExposureFlash(null), 1000);
      return () => clearTimeout(timer);
    } else if (currentExposure < prevExposure) {
      setExposureFlash("down");
      const timer = setTimeout(() => setExposureFlash(null), 1000);
      return () => clearTimeout(timer);
    }
    setPrevExposure(currentExposure);
  }, [currentExposure, prevExposure]);
  const syncFromServer = useTradingStore(state => state.syncFromServer);
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebarContext();
  
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const handleOpenCashier = () => setIsCashierOpen(true);
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      setAuthView(customEvent.detail?.view || 'login');
      setIsAuthOpen(true);
    };
    window.addEventListener("open-cashier", handleOpenCashier);
    window.addEventListener("open-auth", handleOpenAuth);
    return () => {
      window.removeEventListener("open-cashier", handleOpenCashier);
      window.removeEventListener("open-auth", handleOpenAuth);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    
    syncFromServer();
  }, [isLoggedIn, syncFromServer]);

  return (
    <header className="sticky top-0 z-[45] shrink-0 h-14 w-full bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 transition-all relative">
      
      {/* Mobile Menu Toggle */}
      <div className="flex items-center lg:hidden mr-3">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-slate-500 hover:text-slate-900 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Logo & Search Area */}
      <div className="flex-1 flex items-center gap-4">
        {/* Mobile Logo (Only visible when sidebar is hidden) */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="text-slate-900 font-black tracking-widest uppercase text-xs">AuraPlay</span>
        </div>

        <button 
          onClick={() => setIsSearchModalOpen(true)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "relative hidden md:flex items-center rounded-sm overflow-hidden transition-all duration-300 border bg-slate-50/50 cursor-pointer group",
            isSearchFocused ? "border-slate-300 w-72" : "border-slate-200/60 w-56 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <div className="pl-3 py-1.5 transition-colors group-hover:text-slate-600">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
          </div>
          <span className="w-full text-left text-[13px] text-slate-400 group-hover:text-slate-500 font-medium px-2 py-1.5 transition-colors">
            Search games & markets...
          </span>
          <div className="hidden lg:flex items-center gap-0.5 pr-2">
            <kbd className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-sm px-1.5 py-0.5">⌘</kbd>
            <kbd className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-sm px-1.5 py-0.5">K</kbd>
          </div>
        </button>

        {/* IST Digital Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[11px] font-bold text-slate-700 font-mono select-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-650"></span>
          </span>
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {isLoggedIn ? (
          <>
            {/* Wallet Balance Widget */}
            <div className="flex items-center gap-2 sm:gap-4 pr-1 sm:pr-2">
              <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-1">Balance</span>
                <span className={cn(
                  "text-xs sm:text-sm font-bold font-mono tabular-nums tracking-tight transition-all duration-300",
                  balanceFlash === "up" ? "text-emerald-600 scale-105" :
                  balanceFlash === "down" ? "text-rose-600 scale-95" : "text-[#1E293B]"
                )}>
                  ₹{isClient ? (typeof balance === 'number' ? balance : parseFloat(String(balance)) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-slate-200 shrink-0" />
              <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-1">Exposure</span>
                <span className={cn(
                  "text-xs sm:text-sm font-bold font-mono tabular-nums tracking-tight transition-all duration-300",
                  exposureFlash === "up" ? "text-red-500 scale-105" :
                  exposureFlash === "down" ? "text-emerald-650 scale-95" : "text-[#E11D48]"
                )}>
                  ₹{isClient ? currentExposure.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>

              {/* VIP Level Badge HUD */}
              <div className="hidden sm:flex flex-col items-start leading-none pl-1">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-1">VIP Tier</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-sm uppercase tracking-wider select-none">
                  LVL {Math.floor((xp || 0) / 1000) + 1}
                </span>
              </div>

              <button 
                onClick={() => setIsCashierOpen(true)}
                className="bg-[#E11D48] hover:bg-[#C0123C] text-white font-bold px-4 py-2 uppercase tracking-wide rounded-sm ml-2 text-xs transition-all"
              >
                DEPOSIT
              </button>
            </div>

            {/* Positions Button */}
            <button 
              onClick={() => setIsPortfolioOpen(true)}
              className="relative hidden sm:flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors p-1.5 group"
            >
              <Briefcase className="w-5 h-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" />
              {isClient && positions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {positions.length}
                </span>
              )}
            </button>
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "relative transition-colors p-2 rounded-full group cursor-pointer",
                  isNotificationsOpen ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Bell className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200" />
                {isClient && currentUser?.notifications && currentUser.notifications.some((n: any) => !n.read) && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-bounce">
                    {currentUser.notifications.filter((n: any) => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="absolute top-full mt-2 right-0 w-80 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                          <span>🔔</span> Notifications
                        </h3>
                        {currentUser?.notifications && currentUser.notifications.some((n: any) => !n.read) && (
                          <button 
                            onClick={async () => {
                              if (!currentUser.notifications) return;
                              const updated = currentUser.notifications.map((n: any) => ({ ...n, read: true }));
                              useTradingStore.getState().updateProfile({ notifications: updated });
                            }}
                            className="text-[10px] font-black text-red-600 hover:text-red-500 cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[320px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                        {!currentUser?.notifications || currentUser.notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 italic">No notifications yet.</div>
                        ) : (
                          currentUser.notifications.map((notif: any) => {
                            const timeDesc = new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const msgLower = notif.message.toLowerCase();
                            let categoryIcon = "🔔";
                            if (msgLower.includes("streak") || msgLower.includes("daily")) categoryIcon = "📅";
                            else if (msgLower.includes("achievement") || msgLower.includes("unlocked")) categoryIcon = "🏆";
                            else if (msgLower.includes("deposit") || msgLower.includes("payout") || msgLower.includes("won")) categoryIcon = "💰";

                            return (
                              <div 
                                key={notif.id} 
                                onClick={async () => {
                                  if (!notif.read && currentUser?.notifications) {
                                    const updated = currentUser.notifications.map((n: any) => n.id === notif.id ? { ...n, read: true } : n);
                                    useTradingStore.getState().updateProfile({ notifications: updated });
                                  }
                                }}
                                className={cn(
                                  "p-3.5 hover:bg-slate-50/80 cursor-pointer transition-all relative flex gap-3",
                                  !notif.read ? "bg-slate-50/30" : "opacity-60"
                                )}
                              >
                                {!notif.read && (
                                  <div className="absolute left-0 top-0 w-1 h-full bg-red-500" />
                                )}
                                <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center text-sm">
                                  {categoryIcon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-black text-slate-800 truncate">{notif.title || "Notification"}</h4>
                                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5 break-words">{notif.message}</p>
                                  <span className="text-[9px] text-slate-400 font-extrabold block mt-1">{timeDesc}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>


            {/* User Profile Dropdown */}
            <UserMenu onOpenCashier={() => setIsCashierOpen(true)} />
          </>
        ) : (
          /* Logged Out State UI */
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setAuthView('login'); setIsAuthOpen(true); }}
              className="text-exchange-text hover:text-red-600 font-bold text-xs px-3 py-1.5 transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={() => { setAuthView('signup'); setIsAuthOpen(true); }}
              className="bg-exchange-text hover:bg-slate-100 text-slate-900 font-bold text-xs px-4 py-1.5 rounded-sm transition-colors"
            >
              Sign Up
            </button>
          </div>
        )}

      </div>

      {/* Global Modals & Sidebars */}
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <CashierModal isOpen={isCashierOpen} onClose={() => setIsCashierOpen(false)} />
      <PortfolioSidebar isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialView={authView} />

      {/* Bottom Level Progress bar */}
      {isLoggedIn && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-yellow-500 transition-all duration-500"
            style={{ width: `${((xp || 0) % 1000) / 10}%` }}
          />
        </div>
      )}
    </header>
  );
}
