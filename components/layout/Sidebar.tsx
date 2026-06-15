"use client";

import { 
  Home, Trophy, Gamepad2, Gift, Shield, Zap, Percent, Crown, HeadphonesIcon, Sword, BarChart3, LineChart, X
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/components/layout/AppProviders";
import { useTradingStore } from "@/lib/store";

const NAV_SECTIONS = [
  {
    title: "Exchange Markets",
    items: [
      { name: "Sportsbook Exchange", href: "/sportsbook", icon: LineChart, color: "text-exchange-text", badge: "" },
      { name: "Cricket (In-Play)", href: "/sportsbook?sport=cricket", emoji: "🏏", isSub: true },
      { name: "Tennis (Sets)", href: "/sportsbook?sport=tennis", emoji: "🎾", isSub: true },
      { name: "Soccer (1X2)", href: "/sportsbook?sport=soccer", emoji: "⚽", isSub: true },
      { name: "Basketball (Full Time)", href: "/sportsbook?sport=basketball", emoji: "🏀", isSub: true },
    ]
  },
  {
    title: "Casino Nodes",
    items: [
      { name: "Casino Lobby", href: "/casino", icon: Gamepad2, color: "text-exchange-text", badge: "HOT" },
      { name: "Slots & Drops", href: "/casino/slots", emoji: "🎰", isSub: true },
      { name: "Live Dealers", href: "/casino/live", emoji: "🔴", isSub: true },
      { name: "Crash Games", href: "/casino/crash", emoji: "🚀", isSub: true },
      { name: "Dice & Originals", href: "/casino/originals", emoji: "🎲", isSub: true },
      { name: "Table Roulette", href: "/casino/roulette", emoji: "🎡", isSub: true },
      { name: "Blackjack", href: "/casino/blackjack", emoji: "🃏", isSub: true },
      { name: "Poker Heads Up", href: "/casino/poker", emoji: "♠️", isSub: true },
    ]
  },
  {
    title: "Cloud Hub",
    items: [
      { name: "Game Library", href: "/casino/aaa", icon: Home, color: "text-exchange-text", badge: "" },
      { name: "RPG & Adventure", href: "/casino/action", emoji: "⚔️", isSub: true },
      { name: "FPS & Shooters", href: "/casino/fps", emoji: "🔫", isSub: true },
      { name: "Racing & Simulators", href: "/casino/driving", emoji: "🏎️", isSub: true },
      { name: "Strategy & Coop", href: "/casino/puzzle", emoji: "🧩", isSub: true },
      { name: "Cozy & Chill", href: "/casino/boring", emoji: "🌾", isSub: true },
    ]
  },
  {
    title: "Tournaments & VIP",
    items: [
      { name: "Top Streamers", href: "/vip/top-portfolios", icon: Crown, color: "text-amber-400" },
      { name: "Arena Tournaments", href: "/tournaments", icon: Sword, color: "text-amber-500" },
      { name: "Active Promotions", href: "/promotions", icon: Zap, color: "text-emerald-400" },
      { name: "Gaming Rewards", href: "/rewards", icon: Gift, color: "text-yellow-400" },
    ]
  },
  {
    title: "Account & Data",
    items: [
      { name: "My Profile", href: "/account", icon: Zap, color: "text-exchange-muted" },
      { name: "Balance & Funds", href: "/account/balance", icon: BarChart3, color: "text-exchange-muted" },
      { name: "Account Statement", href: "/account/statement", icon: BarChart3, color: "text-exchange-muted" },
      { name: "My Bets", href: "/account/bets", icon: Sword, color: "text-exchange-muted" },
      { name: "Profit & Loss", href: "/account/pnl", icon: LineChart, color: "text-exchange-muted" },
      { name: "Activity Log", href: "/account/activity", icon: Zap, color: "text-exchange-muted" },
      { name: "Refer & Earn", href: "/refer", icon: Gift, color: "text-exchange-muted" },
      { name: "Safe Play", href: "/rg", icon: Shield, color: "text-slate-400" },
      { name: "Support Desk", href: "/support", icon: HeadphonesIcon, color: "text-exchange-muted" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebarContext();
  const isLoggedIn = useTradingStore(state => state.isLoggedIn);
  const xp = useTradingStore(state => state.xp || 0);
  const claimedToday = useTradingStore(state => state.claimedToday);
  const spinWheelClaimedToday = useTradingStore(state => state.spinWheelClaimedToday);

  const level = Math.floor(xp / 1000) + 1;
  const progressPercent = (xp % 1000) / 10;
  const nextLevelXp = 1000 - (xp % 1000);

  const triggerRewardsModal = () => {
    const event = new CustomEvent("open-daily-reward");
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[48] lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      <aside 
        className={cn(
          "flex flex-col w-[260px] bg-exchange-surface border-r border-exchange-border h-[100dvh] sticky top-0 shrink-0 z-50 transition-transform duration-300",
          !isMobileMenuOpen && "max-lg:-translate-x-full max-lg:fixed max-lg:inset-y-0 max-lg:left-0",
          isMobileMenuOpen && "max-lg:translate-x-0 max-lg:fixed max-lg:inset-y-0 max-lg:left-0"
        )}>
        {/* Expanded Header / Logo */}
        <div className="h-14 lg:h-16 flex items-center justify-between px-6 border-b border-exchange-border shadow-sm shrink-0 bg-transparent">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-6 h-6 bg-exchange-text rounded-sm flex items-center justify-center">
              <span className="text-slate-900 font-black text-xs">AP</span>
            </div>
            <span className="text-exchange-text font-black tracking-widest uppercase text-sm">AuraPlay<span className="text-slate-600 font-normal ml-1">EX</span></span>
          </Link>
          <button className="lg:hidden text-exchange-muted hover:text-exchange-text" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-8 pb-24">
        
        {isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={triggerRewardsModal}
            className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-purple-500/20 rounded-2xl p-4 shadow-xl cursor-pointer hover:border-purple-500/50 hover:shadow-purple-900/10 transition-all duration-300 group select-none relative overflow-hidden shrink-0"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-[#a855f7] tracking-widest uppercase">Loyalty Status</span>
              <span className="bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#c084fc] text-[9px] font-bold px-2 py-0.5 rounded-full">
                Level {level}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span>Progress to Lvl {level + 1}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950/60 border border-slate-800 rounded-full overflow-hidden p-0.5">
                <div 
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-[#a855f7] to-pink-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all duration-500"
                />
              </div>
              <div className="text-[9px] text-right text-slate-500 font-medium">{nextLevelXp} XP remaining</div>
            </div>

            {/* Missions / Claim Indicators */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              {!claimedToday && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold animate-pulse">
                  <span>🎁</span> <span>Claim Daily Streak!</span>
                </div>
              )}
              {!spinWheelClaimedToday && (
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold animate-pulse">
                  <span>🎡</span> <span>Spin the Wheel!</span>
                </div>
              )}
              {claimedToday && spinWheelClaimedToday && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                  <span>🚀</span> <span>All Dailies Claimed</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {NAV_SECTIONS.map((section, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3, ease: "easeOut" }}
            className={cn("flex flex-col w-full", idx < NAV_SECTIONS.length - 1 && "border-b border-slate-100 pb-6")}
          >
            <p className="px-4 text-[10px] font-bold text-exchange-muted uppercase tracking-widest mb-3 select-none">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item: any) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                
                if (item.isSub) {
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between pl-8 pr-3 py-2 rounded-md transition-colors relative group",
                        isActive ? "bg-red-50/30 text-exchange-text font-bold before:absolute before:left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-red-500 before:rounded-full" : "text-exchange-muted hover:bg-red-50/40 hover:text-exchange-text"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm leading-none opacity-80">{item.emoji}</span>
                        <span className="text-xs font-medium">{item.name}</span>
                      </div>
                    </Link>
                  );
                }

                return (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-md transition-colors relative group",
                      isActive ? "bg-red-50/30 text-exchange-text font-bold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:bg-red-600 before:rounded-full" : "hover:bg-red-50/40 text-exchange-muted hover:text-exchange-text"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4 transition-all duration-200", isActive ? "text-red-600" : "text-exchange-muted")} />
                      <span className="text-sm font-semibold">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold tracking-wider text-white bg-gradient-to-r from-red-600 to-rose-600 px-1.5 py-0.5 rounded-sm uppercase shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}

      </div>
    </aside>
    </>
  );
}
