"use client";

import { motion } from "framer-motion";
import { 
  Users, DollarSign, MousePointerClick, Copy, CheckCircle2, 
  TrendingUp, BarChart3, Lock, Plus, Link2, Sparkles, AlertCircle 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTradingStore } from "@/lib/store";

interface Campaign {
  code: string;
  link: string;
  type: string;
  clicks: number;
  signups: number;
  earnings: number;
  status: "Active" | "Paused";
}

export default function AffiliatePage() {
  const { isLoggedIn } = useTradingStore();
  const [isClient, setIsClient] = useState(false);
  
  // Input states
  const [customCode, setCustomCode] = useState("");
  const [commissionType, setCommissionType] = useState("revshare");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Campaigns list
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      code: "VIP2026",
      link: "https://AuraBet.io/r/VIP2026",
      type: "Revenue Share (35%)",
      clicks: 4592,
      signups: 128,
      earnings: 450000,
      status: "Active"
    },
    {
      code: "CRASHPLAY",
      link: "https://AuraBet.io/r/CRASHPLAY",
      type: "CPA (₹1,500 / User)",
      clicks: 842,
      signups: 34,
      earnings: 51000,
      status: "Active"
    }
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) return;

    const code = customCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) return;

    // Check if campaign already exists
    if (campaigns.some(c => c.code === code)) {
      alert("This campaign code already exists.");
      return;
    }

    const typeLabel = 
      commissionType === "revshare" ? "Revenue Share (35%)" :
      commissionType === "cpa" ? "CPA (₹1,500 / User)" : "Hybrid (20% + ₹500)";

    const newCampaign: Campaign = {
      code,
      link: `https://AuraBet.io/r/${code}`,
      type: typeLabel,
      clicks: 0,
      signups: 0,
      earnings: 0,
      status: "Active"
    };

    setCampaigns([newCampaign, ...campaigns]);
    setCustomCode("");
  };

  const totalEarnings = campaigns.reduce((acc, c) => acc + c.earnings, 0);
  const totalSignups = campaigns.reduce((acc, c) => acc + c.signups, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const avgConversion = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) + "%" : "0.0%";

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render Logged Out Locked State
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full bg-slate-950/80 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-2xl relative overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.1)] flex flex-col items-center text-center">
          {/* Glowing background shapes */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-neon-purple/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.25)] mb-6">
            <Lock className="w-10 h-10 text-neon-purple" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 uppercase tracking-tight">Partner Dashboard</h1>
          <p className="text-slate-400 text-lg mb-8 max-w-lg">
            Access the AuraBet B2B portal. Log in to your player account to track your referrals, monitor real-time commissions, and create custom tracking URLs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }))}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-8 py-4 rounded-xl text-lg tracking-wide uppercase transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] transform hover:scale-[1.02] active:scale-95"
            >
              Sign In to Partner Account
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'signup' } }))}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold px-8 py-4 rounded-xl text-lg tracking-wide uppercase transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Logged In Affiliate Portal
  return (
    <div className="flex min-h-full w-full max-w-[1400px] mx-auto text-slate-200 p-4 sm:p-6 lg:p-8 flex-col space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <BarChart3 className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white flex items-center gap-4 tracking-tight mb-2">
              <span className="w-2 h-10 bg-neon-purple rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]"></span>
              Affiliate Partner Lobby
            </h1>
            <p className="text-slate-400 max-w-xl text-lg">Your B2B portal. Track your referrals, analyze your campaign performance, and withdraw commissions.</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Earnings", value: `₹ ${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-neon-green" },
          { label: "Active Players", value: totalSignups.toString(), icon: Users, color: "text-blue-500" },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-neon-purple" },
          { label: "Conversion Rate", value: avgConversion, icon: TrendingUp, color: "text-neon-yellow" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 opacity-5">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 mb-4">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Splitted Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Campaign generator & lists */}
        <div className="lg:col-span-2 space-y-8 flex flex-col">
          
          {/* Campaign Generator Form */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-neon-yellow" /> Create Campaign Link
            </h3>
            <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Campaign Code</label>
                <input 
                  type="text" 
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="e.g. BLOGPOST"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-purple transition-all font-mono uppercase"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Commission Plan</label>
                <select 
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple transition-all"
                >
                  <option value="revshare">Revenue Share (35%)</option>
                  <option value="cpa">CPA (₹1,500 / Signup)</option>
                  <option value="hybrid">Hybrid (20% + ₹500)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button 
                  type="submit"
                  className="bg-neon-purple hover:bg-purple-600 text-white font-black uppercase text-xs tracking-wider px-6 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Generate URL
                </button>
              </div>
            </form>
          </div>

          {/* Active Campaigns Table */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md flex-1">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-5 h-5 text-neon-purple" /> Active Campaigns
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="pb-3 pl-2">Campaign</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Clicks</th>
                    <th className="pb-3 text-right">Signups</th>
                    <th className="pb-3 text-right">Earnings</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {campaigns.map((camp) => (
                    <tr key={camp.code} className="hover:bg-white/[0.01]">
                      <td className="py-4 pl-2 font-mono font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {camp.code}
                      </td>
                      <td className="py-4 text-slate-400 font-medium">{camp.type}</td>
                      <td className="py-4 text-right font-mono font-bold text-slate-300">{camp.clicks.toLocaleString()}</td>
                      <td className="py-4 text-right font-mono font-bold text-slate-300">{camp.signups}</td>
                      <td className="py-4 text-right font-mono font-black text-emerald-400">₹{camp.earnings.toLocaleString()}</td>
                      <td className="py-4 pr-2 text-right">
                        <button 
                          onClick={() => handleCopy(camp.link)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto border ${copiedLink === camp.link ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'}`}
                        >
                          {copiedLink === camp.link ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Analytics chart and payments */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md flex flex-col space-y-6">
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-neon-green" /> Weekly Commission Trend
          </h3>
          
          {/* Glassmorphic SVG Area Chart */}
          <div className="h-56 relative w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-inner">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-neon-purple/10 blur-[50px] rounded-full pointer-events-none" />
            
            {/* SVG Plot */}
            <div className="absolute inset-0 top-6 bottom-8 left-4 right-4 z-10">
              <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                
                {/* Area under curve */}
                <path 
                  d="M 0 50 L 0 35 L 16.6 25 L 33.3 40 L 50 20 L 66.6 15 L 83.3 8 L 100 5 L 100 50 Z" 
                  fill="url(#chartGrad)" 
                />
                {/* Curve Line */}
                <path 
                  d="M 0 35 L 16.6 25 L 33.3 40 L 50 20 L 66.6 15 L 83.3 8 L 100 5" 
                  fill="none" 
                  stroke="#a855f7" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                />
                
                {/* Data Points circles */}
                <circle cx="0" cy="35" r="1.5" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                <circle cx="16.6" cy="25" r="1.5" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                <circle cx="33.3" cy="40" r="1.5" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                <circle cx="50" cy="20" r="1.5" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                <circle cx="66.6" cy="15" r="1.5" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                <circle cx="83.3" cy="8" r="1.5" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                <circle cx="100" cy="5" r="1.5" fill="#a855f7" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>
            
            {/* Axis Y Values */}
            <div className="flex flex-col justify-between text-[8px] font-mono text-slate-600 h-full pb-6 z-20 pointer-events-none">
              <span>₹100k</span>
              <span>₹50k</span>
              <span>₹10k</span>
              <span>₹0</span>
            </div>
            
            {/* Axis X Values */}
            <div className="flex justify-between text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-900 z-20 pointer-events-none">
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
            </div>
          </div>

          {/* Payment Activity */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Payout History</h4>
            <div className="space-y-3">
              {[
                { date: "June 01, 2026", amount: "₹3,10,000", method: "Bank Transfer", status: "Paid" },
                { date: "May 01, 2026", amount: "₹1,40,000", method: "Crypto BTC", status: "Paid" }
              ].map((payout, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <div>
                    <p className="text-sm font-bold text-white">{payout.amount}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{payout.date} • {payout.method}</p>
                  </div>
                  <span className="text-[9px] font-black tracking-widest text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded uppercase">
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
