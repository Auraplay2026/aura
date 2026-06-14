"use client";

import { motion } from "framer-motion";
import { User, History, Gift, Shield, ArrowLeft, Wallet, FileText, Activity, PieChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-8 md:p-6 lg:p-10 md:pt-8">
      
      {/* Mobile Back Header */}
      <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-slate-200 bg-white sticky top-0 z-30 shrink-0 shadow-sm">
        <Link href="/" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <span className="font-bold text-slate-800 text-sm uppercase tracking-widest">
          {NAV_ITEMS.find(i => pathname.startsWith(i.href))?.name || "Dashboard"}
        </span>
      </div>

      {/* Secondary Dashboard Navigation */}
      <div className="w-full md:w-64 shrink-0 px-4 sm:px-6 md:px-0 mt-4 md:mt-0">
        <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-4 backdrop-blur-2xl sticky top-24 shadow-2xl">
          <div className="flex items-center gap-4 mb-6 p-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-neon-purple to-neon-green p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-slate-700" />
              </div>
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight">PlayerOne</h2>
              <span className="text-xs font-bold text-neon-yellow uppercase tracking-widest flex items-center gap-1">
                VIP Gold
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

      {/* Main Dashboard Content Area */}
      <div className="flex-1 min-w-0 relative">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </div>

    </div>
  );
}
