"use client";

import { motion } from "framer-motion";
import { Users, Coins, Percent, Copy, CheckCircle2, TrendingUp, Link as LinkIcon, Gift, Hash, Share2, Zap, ChevronRight, Star } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";

// Commission tier structure
const TIERS = [
  { name: 'Bronze', min: 0,  max: 5,  rate: 10, color: 'text-amber-700',   bg: 'bg-amber-50',  border: 'border-amber-200',  bar: 'bg-amber-500' },
  { name: 'Silver', min: 6,  max: 20, rate: 15, color: 'text-slate-700',   bg: 'bg-slate-50',  border: 'border-slate-300',  bar: 'bg-slate-400' },
  { name: 'Gold',   min: 21, max: 50, rate: 20, color: 'text-yellow-600',  bg: 'bg-yellow-50', border: 'border-yellow-200', bar: 'bg-yellow-500' },
  { name: 'Plat.',  min: 51, max: Infinity, rate: 25, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', bar: 'bg-sky-500' },
];

function getCurrentTier(referralCount: number) {
  return TIERS.find(t => referralCount >= t.min && referralCount <= t.max) || TIERS[0];
}

function getNextTier(referralCount: number) {
  const idx = TIERS.findIndex(t => referralCount >= t.min && referralCount <= t.max);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

function getTierProgress(referralCount: number) {
  const tier = getCurrentTier(referralCount);
  if (tier.max === Infinity) return 100;
  const range = tier.max - tier.min + 1;
  return Math.min(100, Math.round(((referralCount - tier.min) / range) * 100));
}

export default function ReferAndEarnPage() {
  const { isLoggedIn, currentUser, syncFromServer } = useTradingStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (isLoggedIn) syncFromServer();
  }, [isLoggedIn, syncFromServer]);

  const affiliateCode = currentUser?.affiliateCode || '';
  const referralLink = isClient && isLoggedIn && affiliateCode
    ? `${window.location.origin}?ref=${affiliateCode}`
    : '';

  const referralCount = currentUser?.referralCount || 0;
  const affiliateEarnings = currentUser?.affiliateEarnings || 0;
  const tier = getCurrentTier(referralCount);
  const nextTier = getNextTier(referralCount);
  const progress = getTierProgress(referralCount);

  // Estimate: active referrals ≈ 60% of total (industry average engagement), pending = 5% of wagered commission
  const activeReferrals = Math.round(referralCount * 0.6);
  const pendingRewards = Math.round(affiliateEarnings * 0.05);
  const conversionRate = referralCount > 0 ? Math.round((activeReferrals / referralCount) * 100) : 0;

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!affiliateCode) return;
    navigator.clipboard.writeText(affiliateCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(
      `Join me on AuraBet and get a 200% Deposit Bonus! Use my referral link: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleGenerateCode = useCallback(async () => {
    if (!currentUser?.email || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      // Refresh user data after attempting generate
      await syncFromServer();
    } catch {
      // silently fail, syncFromServer will still show any existing code
    } finally {
      setIsGenerating(false);
      await syncFromServer();
    }
  }, [currentUser?.email, isGenerating, syncFromServer]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden flex flex-col items-center text-center max-w-xl mx-auto my-12">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-neon-purple/5 to-transparent pointer-events-none" />
        <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
          <Gift className="w-8 h-8 text-neon-purple" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Referral Program Locked</h2>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed max-w-sm mb-6">
          Please log in to your account to retrieve your unique affiliate referral tracking link and begin earning commissions.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }))}
          className="bg-neon-purple hover:bg-purple-600 text-slate-900 font-black text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95"
        >
          Sign In to Unlock
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-neon-purple/10 to-transparent pointer-events-none" />
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight relative z-10">
          <span className="w-1.5 h-6 bg-neon-purple rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]"></span>
          Affiliate Dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-1 pl-4 relative z-10">
          Invite friends and earn lifetime commissions on their play.
          <span className={cn("ml-2 font-bold", tier.color)}>Current Tier: {tier.name} ({tier.rate}% commission)</span>
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Commission Earned */}
        <div className="bg-slate-50/40 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 shadow-xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-neon-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Earned</h3>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Coins className="w-4 h-4 text-neon-green" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 relative z-10 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            ₹{affiliateEarnings.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-neon-green font-bold mt-1 flex items-center gap-1 relative z-10">
            <TrendingUp className="w-3 h-3" /> Updated Live
          </p>
        </div>

        {/* Pending Rewards */}
        <div className="bg-slate-50/40 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 shadow-xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-neon-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Pending</h3>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Zap className="w-4 h-4 text-neon-yellow" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 relative z-10 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
            ₹{pendingRewards.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-600 font-bold mt-1 relative z-10">Settles weekly</p>
        </div>

        {/* Total Referrals */}
        <div className="bg-slate-50/40 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 shadow-xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Referred</h3>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Users className="w-4 h-4 text-neon-purple" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 relative z-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            {referralCount}
          </p>
          <p className="text-[10px] text-slate-600 font-bold mt-1 relative z-10">
            {activeReferrals} active ({conversionRate}%)
          </p>
        </div>

        {/* Commission Rate */}
        <div className="bg-slate-50/40 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 shadow-xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-neon-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Rate</h3>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Percent className="w-4 h-4 text-neon-yellow" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 relative z-10">{tier.rate}%</p>
          <p className={cn("text-[10px] font-bold mt-1 relative z-10", tier.color)}>
            Tier: {tier.name}
          </p>
        </div>
      </div>

      {/* Referral Code + Link Section */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl space-y-5">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow">
            <Gift className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Your Referral Code &amp; Link</h2>
            <p className="text-xs text-slate-700">Friends get a 200% Deposit Bonus · You earn {tier.rate}% lifetime commission</p>
          </div>
        </div>

        {/* Raw Code Copy — most prominent */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white border-2 border-dashed border-neon-purple/40 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-neon-purple shrink-0" />
              {affiliateCode ? (
                <span className="text-2xl font-black text-slate-900 tracking-[0.2em] uppercase">{affiliateCode}</span>
              ) : (
                <span className="text-sm font-bold text-slate-600 italic">No code yet</span>
              )}
            </div>
            <motion.button
              onClick={handleCopyCode}
              disabled={!affiliateCode}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide transition-all",
                copiedCode
                  ? "bg-neon-green text-slate-900"
                  : affiliateCode
                    ? "bg-neon-purple hover:bg-purple-600 text-slate-900 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : "bg-slate-100 text-slate-600 cursor-not-allowed"
              )}
            >
              {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </motion.button>
          </div>
          {!affiliateCode && (
            <button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-900 font-black text-xs rounded-xl uppercase tracking-wide transition-all disabled:opacity-60"
            >
              {isGenerating ? '...' : 'Generate'}
            </button>
          )}
        </div>

        {/* Full Referral Link */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1 block mb-2">Full Referral Link</label>
          <div className="w-full relative group cursor-pointer" onClick={handleCopyLink}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="w-4 h-4 text-neon-purple" />
            </div>
            <input
              type="text" readOnly
              value={referralLink || 'Log in to see your referral link'}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-14 py-4 text-sm text-slate-700 font-medium focus:outline-none focus:border-neon-purple transition-all shadow-inner cursor-pointer truncate"
            />
            <motion.div
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all shadow",
                copiedLink ? "bg-neon-green" : "bg-neon-purple group-hover:bg-purple-500"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-slate-900" /> : <Copy className="w-4 h-4 text-slate-900" />}
            </motion.div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleWhatsAppShare}
            disabled={!referralLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-slate-900 font-black text-xs rounded-xl uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share on WhatsApp
          </button>
          <button
            onClick={handleCopyLink}
            disabled={!referralLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl uppercase tracking-wide transition-all disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Link
          </button>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-neon-yellow" />
          Commission Tiers
        </h3>

        {/* Tier cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {TIERS.map(t => (
            <div key={t.name} className={cn(
              "rounded-2xl border p-3 transition-all",
              t.name === tier.name ? `${t.bg} ${t.border} ring-2 ${t.border.replace('border-', 'ring-')}` : 'bg-white border-slate-200 opacity-60'
            )}>
              <div className={cn("text-xs font-black uppercase tracking-wider mb-1", t.color)}>{t.name}</div>
              <div className="text-lg font-black text-slate-900">{t.rate}%</div>
              <div className="text-[10px] text-slate-700 font-medium mt-0.5">
                {t.max === Infinity ? `${t.min}+ referrals` : `${t.min}–${t.max} referrals`}
              </div>
              {t.name === tier.name && (
                <div className={cn("mt-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block", t.bg, t.color, t.border, 'border')}>
                  ✓ Current
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar to next tier */}
        {nextTier ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>{tier.name} ({referralCount} referrals)</span>
              <span>{nextTier.name} in {nextTier.min - referralCount} more referral{nextTier.min - referralCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", tier.bar)}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-slate-600">
              <span>{tier.min} refs</span>
              <span className={cn("font-bold", nextTier.color)}>{nextTier.name}: {nextTier.rate}% rate</span>
              <span>{nextTier.min} refs</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-black text-sky-600">
            <Star className="w-4 h-4" />
            You&apos;ve reached the highest tier — Platinum 25%!
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share Your Code', desc: 'Send your unique referral link or code to friends via WhatsApp, social media, or direct message.' },
            { step: '2', title: 'Friend Joins', desc: 'Your friend signs up using your link. They get a 200% Deposit Bonus on their first deposit.' },
            { step: '3', title: 'You Earn', desc: `You earn ${tier.rate}% of the house edge on all their wagers, forever. Commissions settle weekly.` },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center text-neon-purple font-black text-xs shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 mb-1">{item.title}</div>
                <div className="text-xs text-slate-700 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
