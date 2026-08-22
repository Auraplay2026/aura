"use client";

import { 
  Home, Trophy, Gamepad2, Gift, Shield, Zap, Percent, Crown, HeadphonesIcon, Sword, BarChart3, LineChart, X, Activity
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
      { name: "Sportsbook Exchange", href: "/sportsbook", icon: LineChart, color: "text-rose-500", badge: "" },
      { name: "Cricket (In-Play)", href: "/sportsbook/cricket", emoji: "🏏", isSub: true },
      { name: "Tennis (Sets)", href: "/sportsbook/tennis", emoji: "🎾", isSub: true },
      { name: "Football / Soccer (FIFA)", href: "/sportsbook/football", emoji: "⚽", isSub: true },
      { name: "Basketball (Full Time)", href: "/sportsbook/basketball", emoji: "🏀", isSub: true },
    ]
  },
  {
    title: "Prediction Markets",
    items: [
      { name: "Predictions Lobby", href: "/predictions", icon: Activity, color: "text-violet-500", badge: "NEW" },
      { name: "Predict Anything", href: "/predictions/predict-anything", emoji: "💡", isSub: true },
      { name: "Politics & Elections", href: "/predictions/politics", emoji: "🗳️", isSub: true },
      { name: "Crypto & Tech", href: "/predictions/crypto", emoji: "⚡", isSub: true },
      { name: "Culture & World", href: "/predictions/culture", emoji: "🌍", isSub: true },
    ]
  },
  {
    title: "Casino Nodes",
    items: [
      { name: "Live Studio (Dream Wheel)", href: "/casino/live-studio", icon: Gamepad2, color: "text-amber-500", badge: "LIVE" },
      { name: "Live Casino & Shows", href: "/casino/live", emoji: "🔴", isSub: true },
      { name: "Desi Live (Teen Patti)", href: "/casino/poker", emoji: "🇮🇳", isSub: true },
      { name: "Table Roulette", href: "/casino/roulette", emoji: "🎡", isSub: true },
      { name: "Live Blackjack", href: "/casino/blackjack", emoji: "🃏", isSub: true },
      { name: "Crash (Aviator)", href: "/casino/crash", emoji: "🚀", isSub: true },
      { name: "Slots & Drops", href: "/casino/slots", emoji: "🎰", isSub: true },
      { name: "Dice & Originals", href: "/casino/originals", emoji: "🎲", isSub: true },
    ]
  },
  {
    title: "Cloud Hub",
    items: [
      { name: "Game Library", href: "/casino/aaa", icon: Home, color: "text-sky-500", badge: "" },
      { name: "RPG & Adventure", href: "/casino/action", emoji: "⚔️", isSub: true },
      { name: "FPS & Shooters", href: "/casino/fps", emoji: "🔫", isSub: true },
      { name: "Racing & Simulators", href: "/casino/driving", emoji: "🏎️", isSub: true },
      { name: "Strategy & Coop", href: "/casino/puzzle", emoji: "🧩", isSub: true },
      { name: "Cozy & Chill", href: "/casino/boring", emoji: "🌾", isSub: true },
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
          className="fixed inset-0 bg-white/60 z-[48] lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      <aside 
        role="navigation"
        aria-label="Main navigation menu"
        className={cn(
          "flex flex-col w-[260px] bg-slate-50/90 backdrop-blur-md border-r border-slate-200/80 h-[100dvh] sticky top-0 shrink-0 z-50 transition-all duration-300 shadow-sm",
          !isMobileMenuOpen && "max-lg:-translate-x-full max-lg:fixed max-lg:inset-y-0 max-lg:left-0",
          isMobileMenuOpen && "max-lg:translate-x-0 max-lg:fixed max-lg:inset-y-0 max-lg:left-0"
        )}>
        
        {/* Expanded Header / Logo */}
        <div className="h-14 lg:h-16 flex items-center justify-between px-6 border-b border-slate-200/50 shrink-0 bg-transparent">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-white/10">
              <span className="text-slate-900 font-black text-xs tracking-wider">AP</span>
            </div>
            <span className="text-slate-900 font-black tracking-normal uppercase text-sm flex items-center select-none">
              AuraPlay<span className="text-purple-650 font-black ml-0.5">EX</span>
            </span>
          </Link>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100 cursor-pointer" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5 pb-24">
          
          {isLoggedIn && (
            <div 
              onClick={triggerRewardsModal}
              className="relative overflow-hidden bg-white border border-red-200/80 rounded-xl p-4 cursor-pointer transition-all duration-300 group hover:shadow-[0_0_15px_rgba(239,68,68,0.12)] hover:border-red-300 select-none shrink-0"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="flex justify-between items-center mb-1.5 text-slate-750 text-xs font-bold">
                <span className="font-mono">LEVEL {level}</span>
                <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">{Math.round(progressPercent)}%</span>
              </div>
              
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2 relative">
                <div 
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-red-500 to-emerald-500 transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.25)]"
                />
              </div>
              
              <div className="text-[10px] text-slate-500 font-medium flex justify-between select-none font-mono">
                <span>{nextLevelXp} XP remaining</span>
                <span className="font-extrabold text-[8px] uppercase tracking-wider text-red-650">Loyalty Status</span>
              </div>

              {/* Missions / Claim Indicators */}
              <div className="space-y-1.5 pt-2.5 mt-2.5 border-t border-slate-100">
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
                  <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold">
                    <span>🚀</span> <span>All Dailies Claimed</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {NAV_SECTIONS.map((section, idx) => (
            <div 
              key={idx} 
              className="flex flex-col w-full pb-1"
            >
              <div className="flex items-center justify-between px-2 mb-1.5 select-none">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  {section.title}
                </span>
              </div>
              <div className="bg-white/60 border border-slate-200/50 rounded-xl p-1.5 space-y-0.5 shadow-sm">
                {section.items.map((item: any) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  
                  if (item.isSub) {
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        className={cn(
                          "relative flex items-center justify-between pl-8 pr-2 py-2 transition-all text-xs rounded-lg hover:bg-slate-100/50",
                          isActive ? "text-slate-900 font-bold bg-slate-100/50" : "text-slate-600 hover:text-slate-900"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {/* Decorative Tree branch lines */}
                        <span className="absolute left-4 top-0 bottom-0 w-[1px] bg-slate-200" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-[1px] bg-slate-200" />
                        
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="text-xs shrink-0">{item.emoji}</span>
                          <span className="transition-transform duration-200">{item.name}</span>
                        </div>
                      </Link>
                    );
                  }

                  const getActiveColorClass = (href: string) => {
                    if (href.startsWith("/predictions")) return "bg-violet-500/10 text-violet-600 border-l-[3px] border-violet-500 font-bold";
                    if (href.startsWith("/sportsbook")) return "bg-rose-500/10 text-rose-600 border-l-[3px] border-rose-500 font-bold";
                    if (href.startsWith("/casino")) return "bg-indigo-500/10 text-indigo-600 border-l-[3px] border-indigo-500 font-bold";
                    return "bg-slate-100 text-slate-900 border-l-[3px] border-slate-600 font-bold";
                  };

                  return (
                    <Link 
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2.5 transition-all text-xs rounded-lg hover:translate-x-0.5",
                        isActive 
                          ? getActiveColorClass(item.href)
                          : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/40"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className={cn("w-4 h-4 transition-all duration-200 shrink-0", isActive ? "" : "text-slate-500 group-hover:text-slate-700")} />
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={cn(
                          "text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-sm uppercase shrink-0",
                          item.badge === "NEW" ? "bg-violet-600 text-slate-900 shadow-[0_0_8px_rgba(109,40,217,0.4)]" : "bg-rose-600 text-slate-900"
                        )}>
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
