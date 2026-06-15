"use client";

import { useEffect, useState } from "react";
import { Users, Coins, Trophy, RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getAffiliateLeaderboardAction } from "./actions";

interface Promoter {
  username: string;
  email: string;
  affiliateCode: string;
  referralCount: number;
  affiliateEarnings: number;
}

interface AffiliateStats {
  totalAffiliates: number;
  totalCommissions: number;
  totalSignups: number;
}

export default function ClientAffiliateDashboard() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAffiliateLeaderboardAction();
      if (res.success && res.promoters && res.stats) {
        setPromoters(res.promoters);
        setStats(res.stats);
      } else {
        setError(res.error || "Failed to load leaderboard.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex justify-between items-center">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-neon-purple/10 to-transparent pointer-events-none" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight relative z-10">
            <span className="w-1.5 h-6 bg-neon-purple rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]"></span>
            Affiliate Network Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1 pl-4 relative z-10">Track your best promoters and their referral performance.</p>
        </div>
        <button 
          onClick={fetchLeaderboard}
          className="bg-slate-100 hover:bg-slate-700 text-slate-900 p-3 rounded-xl transition-colors border border-slate-700 relative z-10"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200/80 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-neon-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Total Affiliates</h3>
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-neon-green" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 relative z-10">{stats.totalAffiliates}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200/80 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Total Network Signups</h3>
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-neon-purple" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 relative z-10">{stats.totalSignups}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200/80 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Total Commissions</h3>
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Coins className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 relative z-10">₹ {stats.totalCommissions.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 backdrop-blur-xl">
        <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-wider">Top Promoters Leaderboard</h2>
        
        {promoters.length === 0 ? (
          <div className="text-center py-12 text-slate-600 font-medium">
            No affiliate data found. Users need to refer others first!
          </div>
        ) : (
          <div className="overflow-x-auto">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="pb-4 pl-4 font-bold">Rank</th>
                  <th className="pb-4 font-bold">Promoter</th>
                  <th className="pb-4 font-bold">Affiliate Code</th>
                  <th className="pb-4 font-bold text-right">Referral Count</th>
                  <th className="pb-4 font-bold text-right pr-4">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {promoters.map((promoter, idx) => (
                  <tr key={promoter.username} className="group hover:bg-slate-100/30 transition-colors">
                    <td className="py-4 pl-4 text-sm font-bold text-slate-600">
                      #{idx + 1}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center text-neon-purple font-black text-xs uppercase">
                          {promoter.username.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {promoter.username}
                            {idx === 0 && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
                          </div>
                          <div className="text-[10px] text-slate-600">{promoter.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <code className="bg-white border border-slate-200 px-2 py-1 rounded text-xs text-neon-green font-mono">
                        {promoter.affiliateCode}
                      </code>
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-900">
                        {promoter.referralCount}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <span className="font-black text-yellow-500 font-mono text-sm">
                        ₹ {promoter.affiliateEarnings.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

    </div>
  );
}
