"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Dices, TrendingUp, Wallet, User, Target, Zap } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ActivePositionsDrawer } from "@/components/sportsbook/ActivePositionsDrawer";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isLoggedIn, currentUser, positions } = useTradingStore();

  const handleCashierClick = () => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: "login" } }));
      return;
    }
    window.dispatchEvent(new CustomEvent("open-cashier"));
  };

  const handleBetsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: "login" } }));
      return;
    }
    // Open Active Positions Drawer with 1-tap Cash Out
    window.dispatchEvent(new CustomEvent("open-positions-drawer"));
  };

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Live Casino",
      href: "/casino/live",
      icon: Dices,
      isActive: pathname.startsWith("/casino"),
    },
    {
      label: "Positions",
      href: "#",
      icon: Target,
      isActive: pathname === "/history" || positions.length > 0,
      badge: positions.length > 0 ? positions.length : null,
      onClick: handleBetsClick,
    },
    {
      label: "Account",
      href: isLoggedIn ? "/account" : "#",
      icon: User,
      isActive: pathname.startsWith("/account"),
      onClick: (e: React.MouseEvent) => {
        if (!isLoggedIn) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: "login" } }));
        }
      },
    },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[40] md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] transition-all select-none">
        <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all active:scale-95 touch-manipulation min-h-[44px]",
                item.isActive
                  ? "text-yellow-600 font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 mb-0.5 transition-transform", item.isActive && "scale-110 text-yellow-600")} />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Center Deposit / Cashier Action Button */}
          <div className="relative -top-3 flex justify-center items-center px-1">
            <button
              onClick={handleCashierClick}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 text-slate-950 flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(245,158,11,0.35)] border-2 border-white active:scale-90 transition-all cursor-pointer touch-manipulation"
              aria-label="Deposit or Withdraw"
            >
              <Wallet className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">Cashier</span>
            </button>
          </div>

          {navItems.slice(2).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all active:scale-95 touch-manipulation min-h-[44px]",
                item.isActive
                  ? "text-yellow-600 font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-5 h-5 mb-0.5 transition-transform", item.isActive && "scale-110 text-yellow-600")} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse border border-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Global Active Positions Bottom Drawer */}
      <ActivePositionsDrawer />
    </>
  );
}
