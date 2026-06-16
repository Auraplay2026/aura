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
          "flex flex-col w-[260px] bg-white border-r border-[#E2E8F0] h-[100dvh] sticky top-0 shrink-0 z-50 transition-transform duration-300",
          !isMobileMenuOpen && "max-lg:-translate-x-full max-lg:fixed max-lg:inset-y-0 max-lg:left-0",
          isMobileMenuOpen && "max-lg:translate-x-0 max-lg:fixed max-lg:inset-y-0 max-lg:left-0"
        )}>
        {/* Expanded Header / Logo */}
        <div className="h-14 lg:h-16 flex items-center justify-between px-6 border-b border-[#E2E8F0] shrink-0 bg-transparent">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-6 h-6 bg-[#000000] rounded-sm flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-[10px]">AP</span>
            </div>
            <span className="text-black font-black tracking-normal uppercase text-sm flex items-center select-none">
              AuraPlay<span className="text-slate-400 font-semibold ml-0.5">EX</span>
            </span>
          </Link>
          <button className="lg:hidden text-slate-500 hover:text-slate-900" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6 pb-24">
        
        {isLoggedIn && (
          <div 
            onClick={triggerRewardsModal}
            className="bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 rounded-sm p-4 cursor-pointer transition-all duration-300 group select-none relative overflow-hidden shrink-0"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex justify-between items-center mb-1 text-purple-200 text-xs font-mono">
              <span className="font-bold">Level {level}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-none overflow-hidden mb-1.5">
              <div 
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-purple-500 transition-all duration-500"
              />
            </div>
            <div className="text-[10px] text-purple-300 font-mono flex justify-between select-none">
              <span>{nextLevelXp} XP remaining</span>
              <span className="font-extrabold text-[8px] uppercase tracking-wider text-purple-400">Loyalty Status</span>
            </div>

            {/* Missions / Claim Indicators */}
            <div className="space-y-1.5 pt-2 mt-2 border-t border-purple-500/10">
              {!claimedToday && (
                <div className="flex items-center gap-1.5 text-[10px] text-yellow-300 font-bold animate-pulse">
                  <span>🎁</span> <span>Claim Daily Streak!</span>
                </div>
              )}
              {!spinWheelClaimedToday && (
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-bold animate-pulse">
                  <span>🎡</span> <span>Spin the Wheel!</span>
                </div>
              )}
              {claimedToday && spinWheelClaimedToday && (
                <div className="flex items-center gap-1.5 text-[9px] text-purple-200 font-bold">
                  <span>🚀</span> <span>All Dailies Claimed</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {NAV_SECTIONS.map((section, idx) => (
          <div 
            key={idx} 
            className={cn("flex flex-col w-full", idx < NAV_SECTIONS.length - 1 && "pb-2")}
          >
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">
              {section.title}
            </p>
            <div className="flex flex-col">
              {section.items.map((item: any) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                
                if (item.isSub) {
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between pl-4 pr-2 py-1.5 transition-colors text-xs border-b border-slate-100/50 last:border-b-0",
                        isActive ? "text-[#E11D48] font-bold" : "text-slate-650 hover:text-slate-900"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs shrink-0">{item.emoji}</span>
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                }

                return (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between p-2 transition-colors text-xs border-b border-slate-100/70 last:border-b-0",
                      isActive ? "text-[#E11D48] font-bold" : "text-slate-700 hover:text-slate-950"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className={cn("w-3.5 h-3.5 transition-all duration-200", isActive ? "text-[#E11D48]" : "text-slate-400")} />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[8px] font-bold tracking-wider text-white bg-[#E11D48] px-1 py-0.5 rounded-sm uppercase">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

      </div>
    </aside>
    </>
  );
}
