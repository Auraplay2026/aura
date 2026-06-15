"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Smartphone, Key, ShieldCheck, CheckCircle2, Wallet, Activity, Trophy, ArrowRight, Camera, AlertCircle } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import Link from "next/link";
import { KYCVerificationFlow } from "@/components/KYCVerificationFlow";

export default function AccountSettingsPage() {
  const { balance, positions, transactions, currentUser, updateProfile } = useTradingStore();
  const liveMarkets = useLiveMarkets('sports');

  // Hydration fix
  const [isClient, setIsClient] = useState(false);

  // Local editable states
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [gamingState, setGamingState] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showKYC, setShowKYC] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setPhoneNumber(currentUser.phoneNumber || "");
      setUpiId(currentUser.upiId || "");
      setGamingState(currentUser.gamingState || "");
      setFullName((currentUser as any).fullName || "Aarav Sharma");
      setDob((currentUser as any).dob || "15/08/1990");
      setAddress((currentUser as any).address || "42, Residency Road, Bangalore, 560025");
    }
  }, [currentUser]);

  if (!isClient) return null;

  // Calculate logic resources
  const totalDeposits = transactions.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + tx.amount, 0);
  const totalWithdrawals = transactions.filter(tx => tx.type === 'withdraw').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
  
  const currentPortfolioValue = positions.reduce((acc, pos) => {
    const liveMarket = liveMarkets.find(m => m.id === pos.marketId);
    const livePrice = liveMarket ? (pos.side === 'yes' ? liveMarket.yes : liveMarket.no) : pos.buyPrice;
    return acc + (pos.shares * (livePrice / 100));
  }, 0);

  const netWorth = balance + currentPortfolioValue;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Profile Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative bg-slate-50 border border-slate-200 rounded-[2rem] p-8 overflow-hidden"
      >
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 via-blue-600/10 to-transparent" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-purple/20 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="relative group cursor-pointer shrink-0">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-b from-neon-purple to-slate-800">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                <User className="w-12 h-12 text-slate-500" />
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-slate-900" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-50 border border-slate-200 rounded-xl p-2 shadow-xl">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              {currentUser?.username || "Player"}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold">
              {currentUser?.kycStatus === 'APPROVED' || currentUser?.kycStatus === 'VERIFIED' ? (
                <span className="flex items-center gap-1.5 text-neon-green bg-neon-green/10 px-3 py-1 rounded-full border border-neon-green/20">
                  <CheckCircle2 className="w-4 h-4" /> KYC Verified
                </span>
              ) : currentUser?.kycStatus === 'PENDING' || currentUser?.kycStatus === 'PROCESSING' ? (
                <span className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  <Activity className="w-4 h-4 animate-pulse" /> KYC Pending
                </span>
              ) : currentUser?.kycStatus === 'REJECTED' ? (
                <span className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  <AlertCircle className="w-4 h-4" /> KYC Rejected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-600 bg-slate-500/10 px-3 py-1 rounded-full border border-slate-700">
                  <Shield className="w-4 h-4" /> KYC Unverified
                </span>
              )}
              <span className="text-slate-600">Account Active</span>
              <span className="text-neon-purple px-3 py-1 rounded-full border border-neon-purple/20 bg-neon-purple/10">
                {currentUser?.role === 'admin' ? "Platform Admin" : `VIP ${currentUser?.accountType === 'real' ? (currentUser?.vipLevel || 'Bronze') : 'Guest'}`}
              </span>
              {(currentUser?.kycStatus === 'VERIFIED' || currentUser?.kycStatus === 'APPROVED') && (
                <span className="text-emerald-600 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10">
                  Tier 2 Verified
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 shrink-0 mt-6 md:mt-0">
            <div className="text-center md:text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Net Worth</p>
              <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">₹{netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Logical Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available Balance", value: `₹${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Wallet, color: "text-slate-900" },
          { label: "Active Positions", value: positions.length.toString(), icon: Activity, color: "text-neon-green" },
          { label: "Total Deposits", value: `₹${totalDeposits.toLocaleString()}`, icon: ArrowRight, color: "text-slate-700" },
          { label: "Total Withdrawals", value: `₹${totalWithdrawals.toLocaleString()}`, icon: ShieldCheck, color: "text-slate-700" },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-slate-50/40 border border-slate-200/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className={`w-12 h-12 ${stat.color}`} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 relative z-10">{stat.label}</p>
            <p className={`text-2xl font-black font-mono relative z-10 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Personal Details */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-slate-50/60 border border-slate-200 rounded-[2rem] p-8 backdrop-blur-2xl relative overflow-hidden"
          >
            <div className="absolute -left-32 top-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <User className="w-5 h-5 text-red-600" />
              </div>
              Personal Details
            </h2>

            {saveSuccess && (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 text-neon-green rounded-xl p-4 flex items-center gap-3 text-sm font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5" />
                Profile changes saved successfully!
              </div>
            )}
            {saveError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl p-4 flex items-center gap-3 text-sm font-bold animate-fade-in">
                <AlertCircle className="w-5 h-5" />
                {saveError}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Date of Birth</label>
                <input 
                  type="text" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Residential Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address (Read-Only)</label>
                <div className="relative">
                  <input 
                    type="email" 
                    defaultValue={currentUser?.email || ""}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3.5 text-slate-500 font-bold focus:outline-none cursor-not-allowed"
                  />
                  <CheckCircle2 className="w-5 h-5 text-neon-green absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +91 99999 99999"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">State / Region</label>
                <input 
                  type="text" 
                  value={gamingState}
                  onChange={(e) => setGamingState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Wallet Address / UPI ID</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. UPI ID or Crypto Address"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors font-mono"
                  />
                  <Shield className="w-5 h-5 text-neon-purple absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end relative z-10">
              <button 
                onClick={async () => {
                  setIsSaving(true);
                  setSaveSuccess(false);
                  setSaveError("");
                  const ok = await updateProfile({ username, phoneNumber, upiId, gamingState });
                  if (ok) {
                    setSaveSuccess(true);
                  } else {
                    setSaveError("Failed to save changes. Please try again.");
                  }
                  setIsSaving(false);
                }}
                disabled={isSaving}
                className="bg-red-600 text-white font-black py-3 px-8 rounded-xl hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-slate-50/60 border border-slate-200 rounded-[2rem] p-8 backdrop-blur-2xl"
          >
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-neon-green/20 flex items-center justify-center border border-neon-green/30">
                <Shield className="w-5 h-5 text-neon-green" />
              </div>
              Security Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/40 border border-slate-200 rounded-2xl group hover:border-slate-700 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Key className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Change Password</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Last changed 3 months ago</p>
                  </div>
                </div>
                <button className="text-xs font-black uppercase tracking-widest text-slate-950 bg-white px-5 py-2.5 rounded-lg hover:bg-slate-200 transition-colors w-full sm:w-auto">Update</button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/40 border border-slate-200 rounded-2xl group hover:border-slate-700 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-12 h-12 rounded-full bg-neon-green/10 border border-neon-green/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <Smartphone className="w-5 h-5 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Two-Factor Authentication</h3>
                    <p className="text-xs text-neon-green mt-0.5">Enabled via Authenticator App</p>
                  </div>
                </div>
                <button className="text-xs font-black uppercase tracking-widest text-slate-600 border border-slate-700 px-5 py-2.5 rounded-lg hover:text-slate-900 hover:border-slate-500 transition-colors w-full sm:w-auto">Manage</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Verification & Status */}
        <div className="space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-slate-50/60 border border-slate-200 rounded-[2rem] p-8 backdrop-blur-2xl relative overflow-hidden"
          >
            <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-yellow-500/10 blur-[60px] rounded-full pointer-events-none" />

            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                <ShieldCheck className="w-5 h-5 text-yellow-500" />
              </div>
              Verification
            </h2>
            
            <div className="space-y-6 relative z-10">
              <div className="bg-white/40 border border-neon-green/30 rounded-2xl p-5 relative overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <div className="absolute top-0 right-0 w-16 h-16 bg-neon-green/10 rounded-bl-full" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-900 font-black">Level 1 (Basic)</span>
                  <span className="text-[10px] font-black text-neon-green uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Deposit and withdraw crypto up to ₹1,50,000 per day. Trade on all sports markets instantly.</p>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-px h-6 bg-slate-100" />
              </div>

              <div className="bg-slate-900/20 border border-slate-200 border-dashed rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-700 font-bold">Level 2 (Advanced)</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100">Pending</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">Unlock Fiat deposits and unlimited crypto withdrawals. Requires official government ID verification.</p>
                <button 
                  onClick={() => setShowKYC(true)}
                  className="w-full py-3 rounded-xl bg-slate-100 text-xs font-black text-slate-900 uppercase tracking-widest hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  Begin KYC Process
                </button>
              </div>
            </div>
          </motion.div>

          {/* Admin Control Center Section (Only visible to verified Administrators) */}
          {currentUser?.role === 'admin' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="bg-slate-50/60 border border-yellow-500/30 rounded-[2rem] p-8 backdrop-blur-2xl relative overflow-hidden"
            >
              <div className="absolute -left-32 top-0 w-64 h-64 bg-yellow-500/5 blur-[80px] rounded-full pointer-events-none" />
              
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30">
                  <ShieldCheck className="w-5 h-5 text-yellow-500" />
                </div>
                Platform Admin
              </h2>

              <p className="text-xs text-slate-600 mb-6 relative z-10 leading-relaxed font-semibold">
                As a verified administrator, you have permission to manage financial receipts and access platform metrics.
              </p>
              
              <div className="flex flex-col gap-3 relative z-10">
                <Link 
                  href="/admin/deposits"
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-3 px-4 rounded-xl text-center text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                >
                  Manage Deposits
                </Link>
                <Link 
                  href="/admin/rtp-monitor"
                  className="bg-slate-100 hover:bg-slate-750 text-slate-900 border border-slate-700 font-black py-3 px-4 rounded-xl text-center text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                >
                  Live RTP Monitor
                </Link>
              </div>
              {/* Mobile Spacer */}
              <div className="h-24 md:hidden" />
            </motion.div>
          )}

        </div>

      </div>

      <AnimatePresence>
        {showKYC && (
          <KYCVerificationFlow 
            onCancel={() => setShowKYC(false)} 
            onComplete={() => {
              setShowKYC(false);
              // In real implementation, this would make an API call to update the user's KYC status
              if (currentUser) {
                useTradingStore.getState().updateProfile({ kycStatus: 'APPROVED' } as any);
              }
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
