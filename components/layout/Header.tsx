"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Briefcase, Settings, Settings2, Menu, Wallet, FileText, Activity, BarChart, Gift, ShieldCheck } from "lucide-react";
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
    <header className="sticky top-0 z-30 shrink-0 h-14 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-4 sm:px-6 transition-all">
      
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
          <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center">
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
            isSearchFocused ? "border-slate-300 w-64 ring-2 ring-slate-100" : "border-slate-200/60 w-56 hover:border-slate-300 hover:bg-slate-50"
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
                <span className="text-xs sm:text-sm font-black text-slate-900 font-mono tracking-tight">
                  ${isClient && typeof balance === 'number' ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-slate-200 shrink-0" />
              <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Exposure</span>
                <span className="text-xs sm:text-sm font-black text-blue-600 font-mono tracking-tight">
                  ${isClient ? positions.reduce((acc, p) => acc + (p.investment || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>
              <button 
                onClick={() => setIsCashierOpen(true)}
                className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs font-black py-1.5 px-3 rounded-sm transition-colors ml-2 uppercase tracking-wider"
              >
                Deposit
              </button>
            </div>

            {/* Positions Button */}
            <button 
              onClick={() => setIsPortfolioOpen(true)}
              className="relative hidden sm:flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors p-1.5"
            >
              <Briefcase className="w-5 h-5" />
              {isClient && positions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {positions.length}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "relative transition-colors p-1.5 rounded-sm",
                  isNotificationsOpen ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Bell className="w-5 h-5" />
                {isClient && currentUser?.notifications && currentUser.notifications.some((n: any) => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute top-full mt-2 right-0 w-80 bg-white border border-slate-200 rounded-sm shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-exchange-border flex items-center justify-between bg-slate-50">
                      <h3 className="text-xs font-bold text-exchange-text uppercase tracking-wider">Notifications</h3>
                      {currentUser?.notifications && currentUser.notifications.some((n: any) => !n.read) && (
                        <button 
                          onClick={async () => {
                            if (!currentUser.notifications) return;
                            const updated = currentUser.notifications.map((n: any) => ({ ...n, read: true }));
                            useTradingStore.getState().updateProfile({ notifications: updated });
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {!currentUser?.notifications || currentUser.notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-exchange-muted italic">No notifications yet.</div>
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
                                "p-3 border-b border-exchange-border hover:bg-slate-50 cursor-pointer transition-colors relative",
                                !notif.read ? "bg-slate-50/50" : "opacity-70"
                              )}
                            >
                              {!notif.read && (
                                <div className="absolute left-0 top-0 w-0.5 h-full bg-blue-500" />
                              )}
                              <h4 className="text-xs font-bold text-exchange-text mb-1 pl-1">{notif.title || "Notification"}</h4>
                              <p className="text-[11px] text-exchange-muted pl-1 leading-relaxed">{notif.message}</p>
                              <span className="text-[9px] text-slate-600 font-bold block mt-1 pl-1">{timeDesc}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Settings Cog */}
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={cn(
                  "p-1.5 rounded-sm transition-colors flex items-center justify-center",
                  isSettingsOpen ? "bg-slate-100 text-slate-900" : "text-exchange-muted hover:text-exchange-text hover:bg-slate-50"
                )}
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-sm shadow-xl z-50 py-1 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Settings</h3>
                      </div>
                      <div className="flex flex-col py-1">
                        {[
                          { label: "Balance & Funds", icon: Wallet, href: "/account/balance" },
                          { label: "Account Statement", icon: FileText, href: "/account/statement" },
                          { label: "My Bets", icon: Activity, href: "/account/bets" },
                          { label: "Profit & Loss", icon: BarChart, href: "/account/pnl" },
                          { label: "Activity Log", icon: Settings2, href: "/account/activity" },
                          { label: "Refer & Earn", icon: Gift, href: "/refer" },
                          { label: "Safe Play", icon: ShieldCheck, href: "/rg" },
                        ].map((item) => (
                          <Link 
                            key={item.label}
                            href={item.href} 
                            onClick={() => setIsSettingsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          >
                            <item.icon className="w-3.5 h-3.5 text-slate-400" /> 
                            {item.label}
                          </Link>
                        ))}
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
              className="text-exchange-text hover:text-blue-600 font-bold text-xs px-3 py-1.5 transition-colors"
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
