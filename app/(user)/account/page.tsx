"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Smartphone, Key, ShieldCheck, CheckCircle2, Wallet, Activity, Trophy, ArrowRight, Camera, AlertCircle, TrendingUp, TrendingDown, Lock, Copy, X, LogOut } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import Link from "next/link";
import { KYCVerificationFlow } from "@/components/KYCVerificationFlow";
import { cn } from "@/lib/utils";

export default function AccountSettingsPage() {
  const { balance, positions, transactions, currentUser, updateProfile, changePassword, setup2fa, verifyAndEnable2fa, disable2fa, logout } = useTradingStore();
  const liveMarkets = useLiveMarkets('sports');

  // Hydration fix
  const [isClient, setIsClient] = useState(false);

  // Security modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2faModal, setShow2faModal] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA fields
  const [twoFactorStep, setTwoFactorStep] = useState<'intro' | 'setup' | 'disable'>('intro');
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorKeyUri, setTwoFactorKeyUri] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

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
      setFullName(currentUser.fullName || "");
      setDob(currentUser.dob || "");
      setAddress(currentUser.address || "");
    }
  }, [currentUser]);

  const [kycCountdown, setKycCountdown] = useState("");

  useEffect(() => {
    if (currentUser?.kycStatus !== 'PROCESSING' || !currentUser?.kycSubmittedAt) {
      setKycCountdown("");
      return;
    }

    const interval = setInterval(() => {
      const submittedAt = currentUser.kycSubmittedAt || 0;
      const elapsed = Date.now() - submittedAt;
      const remainingMs = 10 * 60 * 1000 - elapsed;

      if (remainingMs <= 0) {
        setKycCountdown("");
        clearInterval(interval);
        // Trigger verification immediately client-side
        useTradingStore.getState().setKycStatus('VERIFIED');
        // Dispatch verification success notification
        const newNotif = {
          id: `NOTIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          message: "Congratulations! Your Tier 2 KYC Identity Verification (PAN & Aadhaar) has been successfully verified. Your account limits have been upgraded.",
          timestamp: Date.now(),
          read: false
        };
        updateProfile({
          notifications: [...(currentUser?.notifications || []), newNotif]
        } as any);
      } else {
        const totalSecs = Math.floor(remainingMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setKycCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser?.kycStatus, currentUser?.kycSubmittedAt, currentUser?.notifications, updateProfile]);

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

  // HFT HUD Math
  const isReal = currentUser?.accountType === 'real';
  const baseline = isReal ? (totalDeposits || 10000) : 100000;
  const totalReturns = netWorth + totalWithdrawals;
  const overallPnL = totalReturns - (isReal ? totalDeposits : 100000);
  const roiPercentage = (overallPnL / baseline) * 100;

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
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 flex flex-col sm:flex-row sm:items-center gap-3 justify-center md:justify-start">
              <span>{currentUser?.username || "Player"}</span>
              <button 
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase text-red-600 bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer w-fit mx-auto sm:mx-0 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
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
              <p className="text-3xl font-black text-slate-900 font-mono tracking-tight font-bold">₹{netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Platform HFT HUD Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Wallet Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Available Balance</p>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">₹{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-slate-700" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Portfolio Value:</span>
            <span className="font-mono font-bold text-slate-750">₹{currentPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        </motion.div>

        {/* Net P&L Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Overall Net P&L</p>
              <h3 className={cn(
                "text-2xl font-black font-mono mt-1",
                overallPnL >= 0 ? "text-[#16A34A]" : "text-red-600"
              )}>
                {overallPnL >= 0 ? "+" : ""}₹{overallPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center border",
              overallPnL >= 0 ? "bg-green-50 border-green-100 text-[#16A34A]" : "bg-red-50 border-red-100 text-red-600"
            )}>
              {overallPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Status:</span>
            <span className={cn("font-bold", overallPnL >= 0 ? "text-[#16A34A]" : "text-red-600")}>
              {overallPnL >= 0 ? "IN PROFIT" : "IN LOSS"}
            </span>
          </div>
        </motion.div>

        {/* ROI Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Return on Capital (ROI)</p>
              <h3 className={cn(
                "text-2xl font-black font-mono mt-1",
                roiPercentage >= 0 ? "text-[#16A34A]" : "text-red-600"
              )}>
                {roiPercentage >= 0 ? "+" : ""}{roiPercentage.toFixed(2)}%
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Performance:</span>
            <span className="font-bold text-slate-755">Excellent</span>
          </div>
        </motion.div>

        {/* Turnover Ratio Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Deposits vs Withdrawals</p>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">₹{(totalDeposits + totalWithdrawals).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-500 font-bold">
              <span>DEP: ₹{totalDeposits.toLocaleString()}</span>
              <span>WIT: ₹{totalWithdrawals.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-650 h-full rounded-full" 
                style={{ width: `${totalDeposits + totalWithdrawals > 0 ? (totalDeposits / (totalDeposits + totalWithdrawals)) * 100 : 50}%` }}
              />
            </div>
          </div>
        </motion.div>
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
                  const ok = await updateProfile({ username, phoneNumber, upiId, gamingState, fullName, dob, address });
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
                <button 
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                    setPasswordSuccess(false);
                    setShowPasswordModal(true);
                  }}
                  className="text-xs font-black uppercase tracking-widest text-slate-950 bg-white px-5 py-2.5 rounded-lg hover:bg-slate-200 border border-slate-200 transition-colors w-full sm:w-auto cursor-pointer"
                >
                  Update
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/40 border border-slate-200 rounded-2xl group hover:border-slate-700 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border",
                    currentUser?.twoFactorEnabled 
                      ? "bg-neon-green/10 border-neon-green/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <Smartphone className={cn("w-5 h-5", currentUser?.twoFactorEnabled ? "text-neon-green" : "text-slate-600")} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Two-Factor Authentication</h3>
                    <p className={cn("text-xs mt-0.5 font-bold", currentUser?.twoFactorEnabled ? "text-neon-green" : "text-slate-500")}>
                      {currentUser?.twoFactorEnabled ? "Enabled via Authenticator App" : "Disabled"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setTwoFactorToken("");
                    setTwoFactorError("");
                    setTwoFactorSuccess(false);
                    if (currentUser?.twoFactorEnabled) {
                      setTwoFactorStep('disable');
                    } else {
                      setTwoFactorStep('intro');
                    }
                    setShow2faModal(true);
                  }}
                  className="text-xs font-black uppercase tracking-widest text-slate-600 border border-slate-700 px-5 py-2.5 rounded-lg hover:text-slate-900 hover:border-slate-500 transition-colors w-full sm:w-auto cursor-pointer"
                >
                  Manage
                </button>
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
                  {currentUser?.kycStatus === 'APPROVED' || currentUser?.kycStatus === 'VERIFIED' ? (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-widest">Verified</span>
                  ) : currentUser?.kycStatus === 'PENDING' || currentUser?.kycStatus === 'PROCESSING' ? (
                    <span className="text-[10px] font-black text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Processing</span>
                  ) : currentUser?.kycStatus === 'REJECTED' ? (
                    <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase tracking-widest">Rejected</span>
                  ) : (
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">Unverified</span>
                  )}
                </div>
                {currentUser?.kycStatus === 'APPROVED' || currentUser?.kycStatus === 'VERIFIED' ? (
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Tier 2 KYC Identity Verification completed successfully (Verified within 10 minutes of submission). Unlimited withdrawals and deposit matches are active.
                  </p>
                ) : currentUser?.kycStatus === 'PENDING' || currentUser?.kycStatus === 'PROCESSING' ? (
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Your document verification has been submitted successfully. It will be automatically verified in 10 minutes.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Unlock Fiat deposits and unlimited crypto withdrawals. Requires government ID verification.
                  </p>
                )}
                {currentUser?.kycStatus === 'APPROVED' || currentUser?.kycStatus === 'VERIFIED' ? (
                  <button 
                    disabled
                    className="w-full py-3 rounded-xl bg-emerald-100 text-xs font-black text-emerald-800 uppercase tracking-widest border border-emerald-300 cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verification Completed
                  </button>
                ) : currentUser?.kycStatus === 'PENDING' || currentUser?.kycStatus === 'PROCESSING' ? (
                  <button 
                    disabled
                    className="w-full py-3 rounded-xl bg-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Activity className="w-4 h-4 animate-pulse text-yellow-600" /> Under Review {kycCountdown ? `(${kycCountdown})` : ""}
                  </button>
                ) : currentUser?.kycStatus === 'REJECTED' ? (
                  <button 
                    onClick={() => setShowKYC(true)}
                    className="w-full py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-750 transition-colors border border-red-700 cursor-pointer"
                  >
                    Restart KYC Process
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowKYC(true)}
                    className="w-full py-3 rounded-xl bg-slate-100 text-xs font-black text-slate-900 uppercase tracking-widest hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
                  >
                    Begin KYC Process
                  </button>
                )}
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
              // Explicitly invoke status and timer actions in store
              const store = useTradingStore.getState();
              store.setKycStatus('PROCESSING');
              store.setKycSubmittedAt(Date.now());
            }} 
          />
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/70 backdrop-blur-md"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl z-10"
            >
              <button 
                onClick={() => setShowPasswordModal(false)} 
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                  <Key className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Security Center</h3>
                  <h2 className="text-base font-black text-slate-900">Change Password</h2>
                </div>
              </div>

              {passwordError && (
                <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess ? (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto text-neon-green">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900">Password Changed Successfully</h3>
                  <p className="text-xs text-slate-500">Your security settings have been updated. Please use your new password next time you sign in.</p>
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Current Password</label>
                    <input 
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">New Password</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Confirm New Password</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <button 
                    disabled={passwordLoading}
                    onClick={async () => {
                      if (!currentPassword || !newPassword || !confirmPassword) {
                        setPasswordError("All fields are required.");
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPasswordError("New passwords do not match.");
                        return;
                      }
                      if (newPassword.length < 6) {
                        setPasswordError("Password must be at least 6 characters.");
                        return;
                      }
                      setPasswordLoading(true);
                      setPasswordError("");
                      const res = await changePassword(currentPassword, newPassword);
                      setPasswordLoading(false);
                      if (res.success) {
                        setPasswordSuccess(true);
                      } else {
                        setPasswordError(res.error || "Failed to update password.");
                      }
                    }}
                    className="w-full py-3 bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {passwordLoading ? "Saving..." : "Change Password"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Two-Factor Authentication Modal */}
        {show2faModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/70 backdrop-blur-md"
              onClick={() => setShow2faModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl z-10 select-none"
            >
              <button 
                onClick={() => setShow2faModal(false)} 
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <Smartphone className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Security Center</h3>
                  <h2 className="text-base font-black text-slate-900">Two-Factor Authentication</h2>
                </div>
              </div>

              {twoFactorError && (
                <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{twoFactorError}</span>
                </div>
              )}

              {twoFactorSuccess ? (
                <div className="space-y-4 text-center py-6">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto border",
                    twoFactorStep === 'disable' ? "bg-red-50 border-red-100 text-red-650" : "bg-green-50 border-green-100 text-neon-green"
                  )}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900">
                    {twoFactorStep === 'disable' ? "2FA Disabled Successfully" : "2FA Activated Successfully"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {twoFactorStep === 'disable' 
                      ? "Your account is no longer protected by Two-Factor Authentication code requests." 
                      : "Your account is now fully secured with 2FA authenticator verification steps during sign-in."}
                  </p>
                  <button 
                    onClick={() => setShow2faModal(false)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {twoFactorStep === 'intro' && (
                    <div className="space-y-6">
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Add an extra layer of security. Logins will require a verification code from Google Authenticator, Microsoft Authenticator, or another compatible TOTP app.
                      </p>
                      <button 
                        disabled={twoFactorLoading}
                        onClick={async () => {
                          setTwoFactorLoading(true);
                          setTwoFactorError("");
                          const res = await setup2fa();
                          setTwoFactorLoading(false);
                          if (res.success && res.secret && res.keyUri) {
                            setTwoFactorSecret(res.secret);
                            setTwoFactorKeyUri(res.keyUri);
                            setTwoFactorStep('setup');
                          } else {
                            setTwoFactorError(res.error || "Failed to setup 2FA.");
                          }
                        }}
                        className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        {twoFactorLoading ? "Generating..." : "Enable 2FA"}
                      </button>
                    </div>
                  )}

                  {twoFactorStep === 'setup' && (
                    <div className="space-y-6">
                      <div className="flex justify-center py-2">
                        {/* Beautiful inhouse styled Mock QR Code SVG */}
                        <svg viewBox="0 0 100 100" className="w-40 h-40 border border-slate-200 p-2 rounded-2xl bg-white shadow-inner">
                          <rect x="0" y="0" width="100" height="100" fill="white" />
                          <rect x="10" y="10" width="25" height="25" fill="#4F46E5" />
                          <rect x="15" y="15" width="15" height="15" fill="white" />
                          <rect x="18" y="18" width="9" height="9" fill="#4F46E5" />
                          
                          <rect x="65" y="10" width="25" height="25" fill="#4F46E5" />
                          <rect x="70" y="15" width="15" height="15" fill="white" />
                          <rect x="73" y="18" width="9" height="9" fill="#4F46E5" />
                          
                          <rect x="10" y="65" width="25" height="25" fill="#4F46E5" />
                          <rect x="15" y="70" width="15" height="15" fill="white" />
                          <rect x="18" y="73" width="9" height="9" fill="#4F46E5" />
                          
                          <rect x="45" y="20" width="5" height="5" fill="#1E293B" />
                          <rect x="50" y="25" width="5" height="5" fill="#1E293B" />
                          <rect x="40" y="30" width="5" height="5" fill="#1E293B" />
                          <rect x="45" y="35" width="5" height="5" fill="#1E293B" />
                          <rect x="55" y="30" width="5" height="5" fill="#1E293B" />
                          
                          <rect x="65" y="45" width="5" height="5" fill="#1E293B" />
                          <rect x="70" y="50" width="5" height="5" fill="#1E293B" />
                          <rect x="60" y="55" width="5" height="5" fill="#1E293B" />
                          
                          <rect x="40" y="65" width="5" height="5" fill="#1E293B" />
                          <rect x="45" y="70" width="5" height="5" fill="#1E293B" />
                          <rect x="50" y="75" width="5" height="5" fill="#1E293B" />
                          <rect x="55" y="65" width="5" height="5" fill="#1E293B" />
                          
                          <rect x="65" y="65" width="5" height="5" fill="#1E293B" />
                          <rect x="75" y="70" width="5" height="5" fill="#1E293B" />
                          <rect x="70" y="75" width="5" height="5" fill="#1E293B" />
                          <rect x="80" y="80" width="5" height="5" fill="#4F46E5" />
                        </svg>
                      </div>

                      <div className="space-y-2 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Manual Account Secret Key</p>
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-mono text-slate-700">
                          <span>{twoFactorSecret}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(twoFactorSecret);
                              setCopiedSecret(true);
                              setTimeout(() => setCopiedSecret(false), 2000);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                          >
                            {copiedSecret ? "Copied!" : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Scan the QR code or enter this manual key into your authenticator app.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Authenticator Code</label>
                        <input 
                          type="text"
                          maxLength={6}
                          value={twoFactorToken}
                          onChange={e => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 123456"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-500 tracking-[0.2em] text-center"
                        />
                      </div>

                      <button 
                        disabled={twoFactorLoading || twoFactorToken.length !== 6}
                        onClick={async () => {
                          setTwoFactorLoading(true);
                          setTwoFactorError("");
                          const res = await verifyAndEnable2fa(twoFactorToken, twoFactorSecret);
                          setTwoFactorLoading(false);
                          if (res.success) {
                            setTwoFactorSuccess(true);
                          } else {
                            setTwoFactorError(res.error || "Incorrect code. Please try again.");
                          }
                        }}
                        className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {twoFactorLoading ? "Activating..." : "Activate 2FA"}
                      </button>
                    </div>
                  )}

                  {twoFactorStep === 'disable' && (
                    <div className="space-y-6">
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        To disable Two-Factor Authentication, please enter the current 6-digit code generated by your authenticator app.
                      </p>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Authenticator Code</label>
                        <input 
                          type="text"
                          maxLength={6}
                          value={twoFactorToken}
                          onChange={e => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 123456"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-red-600 tracking-[0.2em] text-center"
                        />
                      </div>

                      <button 
                        disabled={twoFactorLoading || twoFactorToken.length !== 6}
                        onClick={async () => {
                          setTwoFactorLoading(true);
                          setTwoFactorError("");
                          const res = await disable2fa(twoFactorToken);
                          setTwoFactorLoading(false);
                          if (res.success) {
                            setTwoFactorSuccess(true);
                          } else {
                            setTwoFactorError(res.error || "Incorrect code. Failed to disable 2FA.");
                          }
                        }}
                        className="w-full py-3 bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {twoFactorLoading ? "Deactivating..." : "Disable 2FA"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
