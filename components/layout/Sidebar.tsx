"use client";

import { 
  Home, Trophy, Gamepad2, Gift, Shield, Zap, Percent, Crown, HeadphonesIcon, Sword
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    title: "Cloud Game Library",
    items: [
      { name: "Home Lobby", href: "/", icon: Home, color: "text-white", badge: "" },
      { name: "AAA Cloud Gaming", href: "/casino/aaa", emoji: "⚡", isSub: true },
      { name: "RPG & Adventure", href: "/casino/action", emoji: "⚔️", isSub: true },
      { name: "FPS & Shooters", href: "/casino/fps", emoji: "🔫", isSub: true },
      { name: "Racing & Simulators", href: "/casino/driving", emoji: "🏎️", isSub: true },
      { name: "Strategy & Coop", href: "/casino/puzzle", emoji: "🧩", isSub: true },
      { name: "Cozy & Chill", href: "/casino/boring", emoji: "🌾", isSub: true },
    ]
  },
  {
    title: "Casino & Betting",
    items: [
      { name: "Casino Lobby", href: "/casino", icon: Gamepad2, color: "text-yellow-500", badge: "HOT" },
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
    title: "Sports & Markets",
    items: [
      { name: "Sportsbook", href: "/sportsbook", icon: Trophy, color: "text-purple-500", badge: "" },
      { name: "Cricket (IPL)", href: "/sportsbook?sport=cricket", emoji: "🏏", isSub: true },
      { name: "Predictions Hub", href: "/predictions", icon: Zap, color: "text-indigo-400", badge: "" },
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
    title: "Personal",
    items: [
      { name: "My Profile", href: "/account", icon: Zap, color: "text-blue-400" },
      { name: "Safe Play", href: "/rg", icon: Shield, color: "text-slate-400" },
      { name: "Support Desk", href: "/support", icon: HeadphonesIcon, color: "text-slate-400" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] bg-[#05050a]/90 backdrop-blur-3xl border-r border-white/5 h-screen sticky top-0 shrink-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Expanded Header / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0 bg-transparent">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <img src="/logo.png" alt="AuraPlay Logo" className="w-8 h-8 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-shadow" />
          <span className="text-white font-black tracking-widest uppercase text-lg">Aura<span className="text-neon-purple">Play</span></span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6 pb-24">
        
        {NAV_SECTIONS.map((section, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-1 w-full"
          >
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 select-none">{section.title}</p>
            {section.items.map((item: any) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              
              if (item.isSub) {
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between pl-8 pr-3 py-2.5 rounded-xl transition-all duration-300 relative group",
                      isActive ? "bg-white/10 text-white font-bold shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
                    )}
                  >
                    <div className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300",
                      isActive ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] scale-125" : "bg-slate-700 group-hover:bg-yellow-500/50"
                    )} />
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none filter drop-shadow-md">{item.emoji}</span>
                      <span className="text-sm font-medium tracking-wide">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-black tracking-widest text-slate-950 bg-gradient-to-r from-yellow-400 to-yellow-600 px-1.5 py-0.5 rounded uppercase shadow-[0_0_8px_rgba(234,179,8,0.4)]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <Link 
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all duration-300 relative overflow-hidden group",
                    isActive ? "bg-slate-800/80 border border-white/10 text-white shadow-[0_8px_20px_rgba(0,0,0,0.4)]" : "hover:bg-white/5 border border-transparent text-slate-300 hover:translate-x-1"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />}
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner", 
                      item.color,
                      isActive && "bg-black/60 drop-shadow-[0_0_8px_currentColor]"
                    )}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold tracking-wide">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="relative z-10 text-[9px] font-black tracking-widest text-slate-950 bg-gradient-to-r from-yellow-400 to-yellow-600 px-1.5 py-0.5 rounded uppercase shadow-[0_0_8px_rgba(234,179,8,0.4)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </motion.div>
        ))}

      </div>
    </aside>
  );
}
