"use client";

import { useEffect, useState } from "react";
import { Shield, Activity, CreditCard, BarChart3, LogOut, ArrowDownLeft, Bell, Users, Sliders, ShieldAlert, Coins, MessageSquare, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useTradingStore(state => state.currentUser);
  const isLoggedIn = useTradingStore(state => state.isLoggedIn);

  const [pendingCount, setPendingCount] = useState(0);

  // 1. Enforce Role-Based Access Control (RBAC)
  useEffect(() => {
    if (isLoggedIn && currentUser && currentUser.role !== 'admin') {
      router.push("/");
    }
  }, [isLoggedIn, currentUser, router]);

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

  // 2. Poll pending transactions count & alert the admin
  useEffect(() => {
    if (!isLoggedIn || !currentUser || currentUser.role !== 'admin') return;

    const fetchPending = async () => {
      try {
        const res = await fetch(`/api/admin/deposits?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const currentCount = (data.pending || []).length;
          
          // Trigger audio chime if new requests arrived
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
  }, [isLoggedIn, currentUser, pendingCount]);

  const menuItems = [
    {
      name: "Operations Center",
      href: "/admin",
      icon: Activity,
      color: "from-indigo-500 to-cyan-500",
      glowColor: "rgba(99, 102, 241, 0.15)",
    },
    {
      name: "Manual Deposits",
      href: "/admin/deposits",
      icon: ArrowDownLeft,
      color: "from-emerald-500 to-teal-500",
      glowColor: "rgba(16, 185, 129, 0.15)",
    },
    {
      name: "Withdrawals Queue",
      href: "/admin/withdrawals",
      icon: CreditCard,
      color: "from-pink-500 to-rose-500",
      glowColor: "rgba(236, 72, 153, 0.15)",
    },
    {
      name: "Player Intelligence",
      href: "/admin/analytics",
      icon: Users,
      color: "from-violet-500 to-indigo-500",
      glowColor: "rgba(139, 92, 246, 0.15)",
    },
    {
      name: "System Controls (RTP)",
      href: "/admin/rtp-monitor",
      icon: Sliders,
      color: "from-amber-500 to-orange-500",
      glowColor: "rgba(245, 158, 11, 0.15)",
    },
    {
      name: "Affiliate Analytics",
      href: "/admin/affiliate",
      icon: Users,
      color: "from-fuchsia-500 to-purple-500",
      glowColor: "rgba(217, 70, 239, 0.15)",
    },
    {
      name: "Security Audit",
      href: "/admin/audit",
      icon: Shield,
      color: "from-red-500 to-rose-500",
      glowColor: "rgba(239, 68, 68, 0.15)",
    },
    {
      name: "Gateway Settings",
      href: "/admin/payment-settings",
      icon: Coins,
      color: "from-teal-500 to-emerald-500",
      glowColor: "rgba(20, 184, 166, 0.15)",
    },
    {
      name: "WhatsApp Automation",
      href: "/admin/whatsapp-settings",
      icon: MessageCircle,
      color: "from-emerald-500 to-teal-650",
      glowColor: "rgba(16, 185, 129, 0.15)",
    },
    {
      name: "AI Support Desk",
      href: "/admin/support",
      icon: MessageSquare,
      color: "from-yellow-500 to-amber-500",
      glowColor: "rgba(245, 158, 11, 0.15)",
    },
  ];

  // While redirecting, show loading or dark shell
  if (isLoggedIn && currentUser && currentUser.role !== 'admin') {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50 w-full text-slate-800 font-sans antialiased selection:bg-indigo-500/30 selection:text-slate-900">
      {/* Background cyber grid and radial ambient lights */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Premium Sidebar */}
      <aside className="w-68 border-r border-slate-200 bg-white/45 flex flex-col shrink-0 relative overflow-hidden backdrop-blur-2xl z-20">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        {/* Admin Sidebar Branding */}
        <div className="h-20 border-b border-slate-200 flex items-center justify-between px-6 relative z-10 w-full">
          <div className="flex items-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 opacity-60 blur-md group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-indigo-600 group-hover:text-slate-900 transition-colors duration-300" />
              </div>
            </div>
            <div className="ml-4">
              <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 uppercase text-sm block">Aura Core</span>
              <span className="text-[9px] text-indigo-600 font-extrabold tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-glow" />
                L5 CLEARANCE
              </span>
            </div>
          </div>

          {/* Admin Alerts Bell */}
          <div className="relative group cursor-pointer" title={`${pendingCount} Pending Requests Pending Review`}>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 hover:border-white/15 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-300">
              <Bell className={`w-4 h-4 ${pendingCount > 0 && 'text-yellow-600 animate-bounce'}`} />
            </div>
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-500 text-[8px] font-black text-white flex items-center justify-center shadow-[0_0_8px_#ef4444]">
                {pendingCount}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 z-10 relative mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="relative block group">
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
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-br ${item.color} text-white shadow-[0_0_12px_${item.glowColor}]`
                        : "bg-slate-900/5 text-slate-600 group-hover:bg-slate-900/10 group-hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1">{item.name}</span>
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

        {/* Bottom Panel */}
        <div className="p-4 z-10 relative border-t border-slate-200">
          <Link href="/" className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 font-bold tracking-widest text-xs uppercase transition-all duration-300 border border-transparent hover:border-rose-500/10">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Exit Admin</span>
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-slate-100/60">
        {children}
      </main>
    </div>
  );
}
