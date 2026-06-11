"use client";

import { 
  Home, Trophy, Gamepad2, Gift, Shield, Zap, Percent, Crown, HeadphonesIcon, Sword, BarChart3, LineChart, X
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/components/layout/AppProviders";

const NAV_SECTIONS = [
  {
    title: "Exchange Markets",
    items: [
      { name: "Sportsbook Exchange", href: "/sportsbook", icon: LineChart, color: "text-exchange-text", badge: "" },
      { name: "Cricket (In-Play)", href: "/sportsbook?sport=cricket", emoji: "🏏", isSub: true },
      { name: "Tennis (Sets)", href: "/sportsbook?sport=tennis", emoji: "🎾", isSub: true },
      { name: "Soccer (1X2)", href: "/sportsbook?sport=soccer", emoji: "⚽", isSub: true },
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
      { name: "Safe Play", href: "/rg", icon: Shield, color: "text-slate-400" },
      { name: "Statements", href: "/account/statements", icon: BarChart3, color: "text-exchange-muted" },
      { name: "Support Desk", href: "/support", icon: HeadphonesIcon, color: "text-exchange-muted" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebarContext();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      <aside className={cn(
        "flex flex-col w-[260px] bg-exchange-surface border-r border-exchange-border h-screen sticky top-0 shrink-0 z-50 transition-transform duration-300",
        "fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Expanded Header / Logo */}
        <div className="h-14 lg:h-16 flex items-center justify-between px-6 border-b border-exchange-border shrink-0 bg-transparent">
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
        
        {NAV_SECTIONS.map((section, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3, ease: "easeOut" }}
            className="flex flex-col w-full"
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
                        isActive ? "bg-slate-100 text-exchange-text font-bold" : "text-exchange-muted hover:bg-slate-50 hover:text-exchange-text"
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
                      isActive ? "bg-slate-100 text-exchange-text font-bold" : "hover:bg-slate-50 text-exchange-muted hover:text-exchange-text"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4", isActive ? "text-exchange-text" : "text-exchange-muted")} />
                      <span className="text-sm font-semibold">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold tracking-wider text-slate-900 bg-blue-600 px-1.5 py-0.5 rounded-sm uppercase">
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
