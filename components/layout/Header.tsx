"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Briefcase, Settings, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CashierModal } from "@/components/ui/CashierModal";
import { UserMenu } from "@/components/UserMenu";
import { useSidebarContext } from "@/components/layout/AppProviders";
import { useTradingStore } from "@/lib/store";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";
import { AuthModal } from "@/components/ui/AuthModal";

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

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
    
    syncFromServer();
    const interval = setInterval(() => {
      syncFromServer();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn, syncFromServer]);

  return (
    <header className="sticky top-0 z-30 shrink-0 h-14 w-full bg-exchange-surface border-b border-exchange-border flex items-center justify-between px-4 sm:px-6">
      
      {/* Search Area */}
      <div className="flex-1 flex items-center">
        <div 
          className={cn(
            "relative flex items-center rounded-sm overflow-hidden transition-all duration-200 border bg-slate-50",
            isSearchFocused ? "border-blue-500 w-64" : "border-exchange-border w-48 hover:border-slate-300"
          )}
        >
          <div className="pl-3 py-1.5">
            <Search className="w-4 h-4 text-exchange-muted" />
          </div>
          <input 
            type="text" 
            placeholder="Search markets..." 
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full bg-transparent border-none text-xs text-exchange-text placeholder:text-exchange-muted focus:outline-none focus:ring-0 px-2 py-1.5 font-medium"
          />
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {isLoggedIn ? (
          <>
            {/* Wallet Balance Widget */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-sm pl-3 pr-1 py-1 border border-exchange-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-exchange-muted uppercase tracking-wider">Bal:</span>
                <span className="text-sm font-bold text-exchange-text font-mono">
                  ${isClient && typeof balance === 'number' ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                </span>
              </div>
              
              <button 
                onClick={() => setIsCashierOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded-sm transition-colors ml-2"
              >
                Deposit
              </button>
            </div>

            {/* Positions Button */}
            <button 
              onClick={() => setIsPortfolioOpen(true)}
              className="relative flex items-center gap-1.5 text-exchange-muted hover:text-exchange-text transition-colors p-1.5"
            >
              <Briefcase className="w-5 h-5" />
              {isClient && positions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {positions.length}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "relative transition-colors p-1.5 rounded-sm",
                  isNotificationsOpen ? "bg-slate-100 text-exchange-text" : "text-exchange-muted hover:text-exchange-text hover:bg-slate-50"
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
                  <div className="absolute top-full mt-2 right-0 w-80 bg-exchange-surface border border-exchange-border rounded-sm shadow-xl z-50 overflow-hidden">
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
            <button className="p-1.5 text-exchange-muted hover:text-exchange-text hover:bg-slate-50 rounded-sm transition-colors">
              <Settings className="w-5 h-5" />
            </button>

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

      {/* Modals */}
      <CashierModal isOpen={isCashierOpen} onClose={() => setIsCashierOpen(false)} />
      <PortfolioSidebar isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialView={authView} />
    </header>
  );
}
