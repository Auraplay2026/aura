"use client";

import { useEffect, useState } from "react";
import { 
  Shield, Activity, CreditCard, BarChart3, LogOut, ArrowDownLeft, 
  Bell, Users, Sliders, ShieldAlert, Coins, MessageSquare, 
  MessageCircle, Menu, X, Crown, LayoutDashboard, Wallet, UserCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";
import { useAdminStore } from "@/lib/adminStore";

function AdminSignInCard({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [adminIdentity, setAdminIdentity] = useState("twintubrovquattro@gmail.com");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      setError("Please enter your administrator password.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Authenticate directly via unified login pipeline
      const res = await useTradingStore.getState().loginWithCredentials(
        adminIdentity.trim(),
        password
      );

      if (res.success) {
        useAdminStore.getState().setAdminSession(adminIdentity.trim(), "admin-session-active", "admin-hw-verified");
        onAuthenticated();
      } else {
        setError(res.error || "Authentication failed. Invalid administrator credentials.");
      }
    } catch (err: any) {
      setError(err?.message || "Authentication error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      
      <div className="relative max-w-md w-full bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col gap-5 text-white">
        
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.25)]">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="mt-2">
            <h1 className="text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-300 uppercase">
              AURA OPERATIONS CORE
            </h1>
            <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mt-1 block">
              MASTER ADMINISTRATOR ACCESS
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center font-medium leading-relaxed">
          Authorized Master Administrator access only. Authenticate with your administrator credentials to unlock the operations dashboard.
        </p>

        <form onSubmit={handleSignIn} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-300 uppercase">Master Admin Account</label>
            <input
              type="text"
              readOnly
              value={adminIdentity}
              className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-indigo-300 focus:outline-none cursor-not-allowed select-none"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-300 uppercase">Administrator Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isLoading ? "Authenticating..." : "Unlock Admin Dashboard"}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider p-2.5 rounded text-center">
            ⚠️ {error}
          </div>
        )}

      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useTradingStore(state => state.currentUser);
  const isLoggedIn = useTradingStore(state => state.isLoggedIn);

  // Sandboxed Admin state imports
  const isAuthenticated = useAdminStore(state => state.isAuthenticated);
  const setAdminSession = useAdminStore(state => state.setAdminSession);
  const clearAdminSession = useAdminStore(state => state.clearAdminSession);

  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isLoggedIn && currentUser) {
      const isOwnerAdmin = 
        currentUser.role === 'admin' || 
        currentUser.username?.toLowerCase() === 'admin' || 
        currentUser.email?.toLowerCase() === 'twintubrovquattro@gmail.com';
      if (isOwnerAdmin && !isAuthenticated) {
        setAdminSession(currentUser.email || 'twintubrovquattro@gmail.com', 'admin-session-active', 'admin-hw-verified');
      }
    }
  }, [isLoggedIn, currentUser, isAuthenticated, setAdminSession]);

  // 2. Sandboxed activity listeners to track idle duration (300 seconds lockdown)
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateActivity = useAdminStore.getState().updateActivity;

    const handleActivity = () => {
      updateActivity();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Run interval checks every 5 seconds
    const checkIdleTimeout = useAdminStore.getState().checkIdleTimeout;
    const interval = setInterval(checkIdleTimeout, 5000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Audio synthesizer ping chime (Browser-native Web Audio API)
  const playPingChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Play double chime
      playTone(659.25, audioCtx.currentTime, 0.4); // E5
      playTone(880.00, audioCtx.currentTime + 0.12, 0.5); // A5
    } catch (e) {
      console.error("Audio Context playback failed", e);
    }
  };

  // 3. Poll pending transactions count & alert the admin
  useEffect(() => {
    if (!isLoggedIn || !currentUser || currentUser.role !== 'admin' || !isAuthenticated) return;

    const fetchPending = async () => {
      try {
        const res = await fetch(`/api/admin/deposits?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const currentCount = (data.pending || []).length;
          
          if (currentCount > pendingCount && pendingCount !== 0) {
            playPingChime();
          }
          setPendingCount(currentCount);
        }
      } catch (err) {
        console.error("Audit alert system polling failed:", err);
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser, pendingCount, isAuthenticated]);

  // 4. Synchronize cookie clearing on logout or timeout
  useEffect(() => {
    if (!isAuthenticated) {
      fetch("/api/admin/auth/logout", { method: "POST" }).catch(err => {
        console.error("Failed to clear admin cookies on server:", err);
      });
    }
  }, [isAuthenticated]);

  const menuItems = [
    {
      name: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      color: "from-indigo-500 to-cyan-500",
      glowColor: "rgba(99, 102, 241, 0.15)",
    },
    {
      name: "Deposits",
      href: "/admin/deposits",
      icon: ArrowDownLeft,
      color: "from-emerald-500 to-teal-500",
      glowColor: "rgba(16, 185, 129, 0.15)",
    },
    {
      name: "Withdrawals",
      href: "/admin/withdrawals",
      icon: CreditCard,
      color: "from-pink-500 to-rose-500",
      glowColor: "rgba(236, 72, 153, 0.15)",
    },
    {
      name: "Players",
      href: "/admin/analytics",
      icon: Users,
      color: "from-violet-500 to-indigo-500",
      glowColor: "rgba(139, 92, 246, 0.15)",
    },
    {
      name: "Game Win Rates",
      href: "/admin/rtp-monitor",
      icon: Sliders,
      color: "from-amber-500 to-orange-500",
      glowColor: "rgba(245, 158, 11, 0.15)",
    },
    {
      name: "VIP Rewards",
      href: "/admin/vip",
      icon: Crown,
      color: "from-purple-500 to-pink-500",
      glowColor: "rgba(168, 85, 247, 0.15)",
    },
    {
      name: "Affiliates & Partners",
      href: "/admin/affiliate",
      icon: UserCheck,
      color: "from-fuchsia-500 to-purple-500",
      glowColor: "rgba(217, 70, 239, 0.15)",
    },
    {
      name: "Payment Setup",
      href: "/admin/payment-settings",
      icon: Coins,
      color: "from-teal-500 to-emerald-500",
      glowColor: "rgba(20, 184, 166, 0.15)",
    },
    {
      name: "Support Desk",
      href: "/admin/support",
      icon: MessageSquare,
      color: "from-yellow-500 to-amber-500",
      glowColor: "rgba(245, 158, 11, 0.15)",
    },
    {
      name: "Security Logs",
      href: "/admin/audit",
      icon: Shield,
      color: "from-red-500 to-rose-500",
      glowColor: "rgba(239, 68, 68, 0.15)",
    },
  ];

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Securing Session...</span>
        </div>
      </div>
    );
  }

  const isAuthorized = 
    isAuthenticated || 
    (isLoggedIn && currentUser && (
      currentUser.role === 'admin' || 
      currentUser.username?.toLowerCase() === 'admin' || 
      currentUser.email?.toLowerCase() === 'twintubrovquattro@gmail.com'
    ));

  if (!isAuthorized) {
    return (
      <AdminSignInCard 
        onAuthenticated={() => {
          router.refresh();
        }} 
      />
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50 w-full text-slate-800 font-sans antialiased selection:bg-indigo-500/30 selection:text-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-68 border-r border-slate-200 bg-white/45 flex flex-col shrink-0 overflow-hidden backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:relative lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        <div className="h-20 border-b border-slate-200 flex items-center justify-between px-6 relative z-10 w-full shrink-0">
          <div className="flex items-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 opacity-60 blur-md group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-indigo-600 group-hover:text-slate-900 transition-colors duration-300" />
              </div>
            </div>
            <div className="ml-4">
              <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 uppercase text-sm block">Aura Core</span>
              <span className="text-[9px] text-indigo-600 font-extrabold tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-glow" />
                L5 CLEARANCE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group cursor-pointer" title={`${pendingCount} Pending Requests Pending Review`}>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 hover:border-white/15 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-300">
                <Bell className={`w-4 h-4 ${pendingCount > 0 && 'text-yellow-600 animate-bounce'}`} />
              </div>
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-500 text-[8px] font-black text-slate-900 flex items-center justify-center shadow-[0_0_8px_#ef4444]">
                  {pendingCount}
                </span>
              )}
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 z-10 relative mt-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="relative block group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 rounded-xl bg-white/[0.03] border border-slate-200 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold tracking-wider text-xs uppercase transition-all duration-300 relative ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/[0.02]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 ${
                      isActive
                        ? `bg-gradient-to-br ${item.color} text-slate-900 shadow-[0_0_12px_${item.glowColor}]`
                        : "bg-white/5 text-slate-600 group-hover:bg-white/10 group-hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-dot"
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 z-10 relative border-t border-slate-200 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <button 
            onClick={() => {
              clearAdminSession();
              router.push("/");
            }} 
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 font-bold tracking-widest text-xs uppercase transition-all duration-300 border border-transparent hover:border-rose-500/10 text-left min-h-[44px]"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative z-10 bg-slate-100/60">
        <div className="h-16 lg:hidden border-b border-slate-200 bg-white/60 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span className="font-black tracking-widest text-slate-800 uppercase text-sm">Aura Core</span>
            </div>
          </div>
          
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
              <Bell className={`w-5 h-5 ${pendingCount > 0 && 'text-yellow-600 animate-bounce'}`} />
            </div>
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-[9px] font-black text-slate-900 flex items-center justify-center shadow-[0_0_8px_#ef4444]">
                {pendingCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
