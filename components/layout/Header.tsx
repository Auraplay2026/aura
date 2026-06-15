"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Briefcase, Menu } from "lucide-react";
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

  const { balance, positions, isLoggedIn, currentUser } = useTradingStore();
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
    <header className="sticky top-0 z-[45] shrink-0 h-14 w-full bg-white/85 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 sm:px-6 transition-all">
      
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
          <div className="w-6 h-6 bg-red-600 rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-[10px]">AP</span>
          </div>
          <span className="text-slate-900 font-black tracking-widest uppercase text-xs hidden sm:block">AuraPlay</span>
        </div>

        <button 
          onClick={() => setIsSearchModalOpen(true)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "relative hidden md:flex items-center rounded-lg overflow-hidden transition-all duration-300 border bg-slate-50/50 cursor-pointer shadow-sm group",
            isSearchFocused ? "border-slate-300 w-72 ring-2 ring-slate-100" : "border-slate-200/60 w-56 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <div className="pl-3 py-1.5 transition-colors group-hover:text-slate-600">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
          </div>
          <span className="w-full text-left text-[13px] text-slate-400 group-hover:text-slate-500 font-medium px-2 py-1.5 transition-colors">
            Search games & markets...
          </span>
          <div className="hidden lg:flex items-center gap-0.5 pr-2">
            <kbd className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 shadow-sm">⌘</kbd>
            <kbd className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 shadow-sm">K</kbd>
          </div>
        </button>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {isLoggedIn ? (
          <>
            {/* Wallet Balance Widget */}
            <div className="flex items-center gap-2 sm:gap-4 pr-1 sm:pr-2">
              <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Balance</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-mono tabular-nums tracking-tight">
                  ${isClient ? (typeof balance === 'number' ? balance : parseFloat(String(balance)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-slate-200 shrink-0" />
              <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Exposure</span>
                <span className="text-xs sm:text-sm font-black text-red-600 font-mono tabular-nums tracking-tight">
                  ${isClient ? positions.reduce((acc, p) => acc + (p.investment || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>
              <button 
                onClick={() => setIsCashierOpen(true)}
                className="hidden sm:block bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white text-[10px] sm:text-xs font-black py-1.5 px-3 rounded-md transition-all ml-2 uppercase tracking-wider shadow-md active:scale-95 shadow-red-500/10"
              >
                Deposit
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
            <div className="relative hidden sm:block">
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
    </header>
  );
}
