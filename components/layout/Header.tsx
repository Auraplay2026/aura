"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Gift, MessageSquare, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { CashierModal } from "@/components/ui/CashierModal";
import { UserMenu } from "@/components/UserMenu";
import { VIPProgressBar } from "@/components/ui/VIPProgressBar";
import { useSidebarContext } from "@/components/layout/AppProviders";
import { useTradingStore } from "@/lib/store";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";
import { AuthModal } from "@/components/ui/AuthModal";
import Link from "next/link";

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  const { isChatOpen, setIsChatOpen } = useSidebarContext();
  const { balance, positions, isLoggedIn, currentUser } = useTradingStore();
  const syncFromServer = useTradingStore(state => state.syncFromServer);
  
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
    
    // Initial sync
    syncFromServer();
    
    // Poll every 10 seconds to keep notifications, balances and wagers live
    const interval = setInterval(() => {
      syncFromServer();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn, syncFromServer]);

  return (
    <header className="sticky top-0 z-30 shrink-0 h-16 w-full bg-[#020205]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      
      {/* Search Area */}
      <div className="flex-1 flex items-center">
        <motion.div 
          initial={false}
          animate={{ 
            width: isSearchFocused 
              ? (isClient && window.innerWidth < 640 ? 140 : 320) 
              : (isClient && window.innerWidth < 640 ? 100 : 200),
            backgroundColor: isSearchFocused ? "rgba(15, 23, 42, 0.8)" : "rgba(0,0,0,0.4)"
          }}
          className={cn(
            "relative flex items-center rounded-full overflow-hidden transition-all duration-300 border backdrop-blur-md",
            isSearchFocused ? "border-neon-cyan shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-white/10 hover:border-white/20"
          )}
        >
          <div className="pl-3 py-2">
            <Search className={cn("w-4 h-4 transition-colors", isSearchFocused ? "text-neon-cyan" : "text-slate-400")} />
          </div>
          <input 
            type="text" 
            placeholder="Search games..." 
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full bg-transparent border-none text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-0 px-3 py-2"
          />
        </motion.div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {isLoggedIn ? (
          <>
            <VIPProgressBar />
            
            {/* Rewards Button */}
            <Link 
              href="/rewards"
              className="hidden sm:flex items-center gap-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all border border-white/5 hover:border-neon-purple hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              <Gift className="w-4 h-4 text-neon-purple animate-pulse" />
              <span className="text-sm font-bold tracking-wide">Rewards</span>
            </Link>

            {/* Premium Wallet & Deposit */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/60 backdrop-blur-xl rounded-full pl-2 sm:pl-4 pr-1 py-1 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
              <div className="flex items-center px-1 sm:px-2 gap-2 group cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.5)] group-hover:scale-110 transition-transform">
                  <span className="text-[11px] text-slate-950 font-black">₹</span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight font-mono group-hover:text-emerald-400 transition-colors">
                  {isClient && typeof balance === 'number' ? balance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "---"}
                </span>
              </div>
              
              {isClient && currentUser && (
                <span className={cn(
                  "hidden sm:inline text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shrink-0 select-none",
                  currentUser.accountType === 'real'
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                    : "bg-purple-500/20 text-neon-purple border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                )}>
                  {currentUser.accountType === 'real' ? "Real" : "Demo"}
                </span>
              )}

              <button 
                onClick={() => setIsCashierOpen(true)}
                className="relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-slate-950 text-xs sm:text-sm font-black py-1.5 px-5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all transform hover:scale-105 active:scale-95 group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-glare mix-blend-overlay" />
                Deposit
              </button>
            </div>

            {/* Positions Button */}
            <button 
              onClick={() => setIsPortfolioOpen(true)}
              className="relative flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-neon-purple text-white px-3 py-1.5 rounded-full transition-all group"
            >
              <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-neon-purple transition-colors" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">Positions</span>
              {isClient && positions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-green rounded-full text-[10px] font-black text-slate-950 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                  {positions.length}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "relative text-slate-400 hover:text-white transition-colors p-2 rounded-full",
                  isNotificationsOpen ? "bg-slate-800 text-white" : "hover:bg-slate-900"
                )}
              >
                <Bell className="w-5 h-5" />
                {isClient && currentUser?.notifications && currentUser.notifications.some((n: any) => !n.read) && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                    {currentUser.notifications.filter((n: any) => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute top-full mt-2 right-0 w-80 bg-[#1a1b2a] border border-[#25273c] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-[#25273c] flex items-center justify-between bg-black/20">
                      <h3 className="font-bold text-white">Notifications</h3>
                      {currentUser?.notifications && currentUser.notifications.some((n: any) => !n.read) && (
                        <button 
                          onClick={async () => {
                            if (!currentUser.notifications) return;
                            const updated = currentUser.notifications.map((n: any) => ({ ...n, read: true }));
                            useTradingStore.getState().updateProfile({ notifications: updated });
                          }}
                          className="text-xs font-bold text-yellow-500 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {!currentUser?.notifications || currentUser.notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500 italic">No notifications yet.</div>
                      ) : (
                        currentUser.notifications.map((notif: any) => {
                          const timeDesc = new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                                "p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors relative",
                                !notif.read ? "bg-slate-900/40" : "opacity-75"
                              )}
                            >
                              {!notif.read && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-500 rounded-r-full" />
                              )}
                              <h4 className="text-xs font-bold text-white mb-1 pl-2">{notif.title || "Notification"}</h4>
                              <p className="text-[11px] text-slate-400 pl-2 leading-relaxed">{notif.message}</p>
                              <span className="text-[9px] text-slate-500 font-bold block mt-2 pl-2">{timeDesc}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Chat Toggle */}
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={cn(
                "relative transition-colors p-2 rounded-full hidden lg:block",
                isChatOpen ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* User Profile Dropdown */}
            <UserMenu onOpenCashier={() => setIsCashierOpen(true)} />
          </>
        ) : (
          /* Logged Out State UI */
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setAuthView('login'); setIsAuthOpen(true); }}
              className="text-slate-300 hover:text-white font-bold text-sm px-4 py-2 transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={() => { setAuthView('signup'); setIsAuthOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-sm px-5 py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)] hover:scale-105"
            >
              Sign Up
            </button>
          </div>
        )}

      </div>

      {/* Modals */}
      <CashierModal isOpen={isCashierOpen} onClose={() => setIsCashierOpen(false)} />
      <PortfolioSidebar isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialView={authView} />
    </header>
  );
}
