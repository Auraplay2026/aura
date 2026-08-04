"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, History, Gift, Shield, ArrowLeft, Wallet, FileText, Activity, PieChart, Menu, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BackToTop } from "@/components/ui/BackToTop";
import { useTradingStore, calculateVipLevel } from "@/lib/store";

const NAV_ITEMS = [
  { name: "My Profile", href: "/account", icon: User },
  { name: "Balance & Funds", href: "/account/balance", icon: Wallet },
  { name: "Account Statement", href: "/account/statement", icon: FileText },
  { name: "My Bets", href: "/account/bets", icon: History },
  { name: "Profit & Loss", href: "/account/pnl", icon: PieChart },
  { name: "Activity Log", href: "/account/activity", icon: Activity },
  { name: "Refer & Earn", href: "/refer", icon: Gift },
  { name: "Safe Play", href: "/rg", icon: Shield },
];

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useTradingStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const username = currentUser?.username || "PlayerOne";
  const vipLevel = currentUser ? calculateVipLevel(currentUser.totalWagered || 0, currentUser.manualVipLevel) : "Gold";

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8 md:p-6 lg:p-10 md:pt-8">
      <BackToTop />
      
      {/* Mobile Top Header with 3-Line Menu Trigger */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-slate-200 bg-white sticky top-0 z-30 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100/60 active:scale-95 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="font-black text-slate-900 text-sm uppercase tracking-widest">
            {NAV_ITEMS.find(i => pathname.startsWith(i.href))?.name || "Dashboard"}
          </span>
        </div>

        <Link href="/" className="p-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Mobile Left Drawer Navigation */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[70]"
            />

            {/* Left Slide Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-[70] flex flex-col shadow-2xl border-r border-slate-200 overflow-y-auto custom-scrollbar touch-pan-y"
            >
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-400 p-0.5 shadow-sm">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-800" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm leading-none">{username}</h3>
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mt-1 block">
                      VIP {vipLevel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items List */}
              <nav className="p-4 space-y-1.5 flex-1 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer",
                        isActive
                          ? "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 font-black"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isActive ? "text-yellow-600" : "text-slate-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {currentUser?.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 mt-4 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                    <span>Admin Hub</span>
                  </Link>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Dashboard Content Area */}
      <div className="flex-1 min-w-0 relative px-4 sm:px-6 md:px-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </div>

      {/* Secondary Dashboard Navigation (Right Sidebar) */}
      <div className="hidden lg:block w-64 shrink-0 mt-0">
        <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-4 backdrop-blur-2xl sticky top-24 shadow-2xl">
          <div className="flex items-center gap-4 mb-6 p-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-neon-purple to-neon-green p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-slate-700" />
              </div>
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight">{username}</h2>
              <span className="text-xs font-bold text-neon-yellow uppercase tracking-widest flex items-center gap-1">
                VIP {vipLevel}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all group relative overflow-hidden",
                  pathname === item.href 
                    ? "text-slate-900" 
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/50"
                )}
              >
                {pathname === item.href && (
                  <motion.div layoutId="user-nav-active" className="absolute inset-0 bg-slate-100 border border-slate-700 rounded-xl -z-10" />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-colors", 
                  pathname === item.href ? "text-neon-purple drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" : "text-slate-500 group-hover:text-slate-700"
                )} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </div>
  );
}
