"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Dices, TrendingUp, Wallet, User, ShieldCheck } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isLoggedIn, currentUser } = useTradingStore();

  const handleCashierClick = () => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: "login" } }));
      return;
    }
    window.dispatchEvent(new CustomEvent("open-cashier"));
  };

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Casino",
      href: "/casino",
      icon: Dices,
      isActive: pathname.startsWith("/casino"),
    },
    {
      label: "Bets",
      href: "/history",
      icon: TrendingUp,
      isActive: pathname === "/history" || pathname.startsWith("/predictions"),
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
    <div className="fixed bottom-0 left-0 right-0 z-[40] md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)] transition-all">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all active:scale-95",
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
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 text-slate-950 flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(245,158,11,0.35)] border-2 border-white active:scale-95 transition-all cursor-pointer"
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
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all active:scale-95",
              item.isActive
                ? "text-yellow-600 font-extrabold"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("w-5 h-5 mb-0.5 transition-transform", item.isActive && "scale-110 text-yellow-600")} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
