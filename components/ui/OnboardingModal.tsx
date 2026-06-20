"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Trophy, 
  BadgeCheck, 
  Smartphone, 
  MapPin, 
  CreditCard, 
  Check, 
  HelpCircle,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function OnboardingModal() {
  const isLoggedIn = useTradingStore(state => state.isLoggedIn);
  const currentUser = useTradingStore(state => state.currentUser);
  const switchAccountType = useTradingStore(state => state.switchAccountType);
  const completeOnboarding = useTradingStore(state => state.completeOnboarding);
  const setGeoRestricted = useTradingStore(state => state.setGeoRestricted);
  const geoRestricted = useTradingStore(state => state.geoRestricted);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); 
  // Steps: 
  // 0: Welcome / Intro
  // 1: Choose Account (Demo vs Real)
  // 2: Account Setup Details (KYC for Real, simulator rules for Demo)
  // 3: Interactive Walkthrough Tour
  // 4: Completion & Rewards Claim

  const [selectedType, setSelectedType] = useState<'demo' | 'real'>('demo');
  
  // Real account setup details
  const [phone, setPhone] = useState("");
  const [stateName, setStateName] = useState("Maharashtra");
  const [upiId, setUpiId] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Demo account setup details
  const [agreedDemo, setAgreedDemo] = useState(false);
  
  const [formError, setFormError] = useState<string | null>(null);

  // Trigger modal if logged in but onboarding is not completed
  useEffect(() => {
    if (isLoggedIn && currentUser && !currentUser.hasCompletedOnboarding) {
      if (!isOpen) {
        setSelectedType(currentUser.accountType || 'demo');
        setIsOpen(true);
        setStep(0);
        setPhone(currentUser.phoneNumber || "");
        setStateName(currentUser.gamingState || "Maharashtra");
        setUpiId(currentUser.upiId || "");
      }
    } else {
      setIsOpen(false);
    }
  }, [isLoggedIn, currentUser, isOpen]);

  // Sniff geolocation via IP
  useEffect(() => {
    async function sniffLocation() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data && data.region) {
            const region = data.region;
            const restrictedStates = ["Telangana", "Andhra Pradesh", "Assam", "Odisha", "Nagaland"];
            const isRestricted = restrictedStates.some(rs => 
              region.toLowerCase().includes(rs.toLowerCase())
            );
            
            const matchedState = INDIAN_STATES.find(s => s.toLowerCase() === region.toLowerCase()) || region;
            setStateName(matchedState);
            setGeoRestricted(isRestricted);
          }
        }
      } catch (e) {
        console.error("IP sniffing failed, using default state", e);
      }
    }
    if (isOpen && selectedType === 'real') {
      sniffLocation();
    }
  }, [isOpen, selectedType]);

  const INDIAN_STATES = [
    "Maharashtra", "Delhi", "Goa", "Karnataka", "Haryana", 
    "West Bengal", "Tamil Nadu", "Gujarat", "Rajasthan", "Punjab",
    "Telangana", "Andhra Pradesh", "Assam", "Odisha", "Nagaland"
  ];

  const handleStateChange = (selectedState: string) => {
    setStateName(selectedState);
    const restrictedStates = ["Telangana", "Andhra Pradesh", "Assam", "Odisha", "Nagaland"];
    const isRestricted = restrictedStates.some(rs => 
      selectedState.toLowerCase().includes(rs.toLowerCase())
    );
    setGeoRestricted(isRestricted);
  };

  const handleNext = async () => {
    setFormError(null);

    // Validation for Step 2
    if (step === 2) {
      if (selectedType === 'real') {
        const restrictedStates = ["Telangana", "Andhra Pradesh", "Assam", "Odisha", "Nagaland"];
        const isRestricted = restrictedStates.some(rs => 
          stateName.toLowerCase().includes(rs.toLowerCase())
        );
        if (isRestricted) {
          setFormError(`Live trading is legally unavailable in ${stateName} due to local state regulations.`);
          return;
        }
        if (!phone || phone.trim().length < 10) {
          setFormError("Please enter a valid 10-digit phone number.");
          return;
        }
        if (!upiId || !upiId.includes("@")) {
          setFormError("Please enter a valid UPI ID (e.g., name@upi).");
          return;
        }
        if (!agreedToTerms) {
          setFormError("You must certify you are 18+ and accept the terms of live trading.");
          return;
        }
      } else {
        if (!agreedDemo) {
          setFormError("Please acknowledge the simulated nature of the practice wallet.");
          return;
        }
      }
    }

    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      // Apply selected type on state and proceed
      await switchAccountType(selectedType);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else {
      // Step 4: Complete onboarding, syncing KYC details to server database
      if (selectedType === 'real') {
        await completeOnboarding(phone, stateName, upiId);
      } else {
        await completeOnboarding();
      }
      setIsOpen(false);
    }
  };

  const handleBack = () => {
    setFormError(null);
    if (step > 0) setStep(step - 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with advanced glassmorphism blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 backdrop-blur-md z-[98]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[99] p-4"
          >
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative p-8">
              
              {/* Dynamic Glow Background responsive to step/mode selection */}
              <div className={cn(
                "absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full blur-[90px] pointer-events-none transition-colors duration-500",
                step === 1 || step === 2
                  ? (selectedType === 'real' ? 'bg-emerald-500/10' : 'bg-purple-500/10')
                  : (step === 4 ? 'bg-yellow-500/10' : 'bg-[#a855f7]/10')
              )} />

              {/* Header Step Counter */}
              <div className="flex justify-between items-center mb-6 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#a855f7]">
                  Setup Wizard
                </span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-2.5 h-1 rounded-full transition-all duration-300",
                        i === step 
                          ? "w-6 bg-yellow-500" 
                          : (i < step ? "bg-emerald-500" : "bg-slate-100")
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Error Alert Box */}
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/15 border border-red-500/30 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2 relative z-10"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {formError}
                </motion.div>
              )}

              {/* Step Content */}
              <div className="min-h-[280px] flex flex-col justify-center relative z-10">
                
                {/* STEP 0: Welcome / Intro */}
                {step === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                      <Sparkles className="w-8 h-8 text-[#a855f7] animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Initialize Trading Engine</h1>
                      <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                        Welcome to AuraPlay Premium. Let's configure your account portfolios and guide you through standard setups.
                      </p>
                    </div>
                    
                    <div className="w-full grid grid-cols-2 gap-3 text-left">
                      <div className="p-3.5 bg-slate-50/40 border border-slate-200/60 rounded-2xl">
                        <TrendingUp className="w-4 h-4 text-purple-600 mb-1" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase">Predictions</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Trade on Yes/No options in news & events.</p>
                      </div>
                      <div className="p-3.5 bg-slate-50/40 border border-slate-200/60 rounded-2xl">
                        <Trophy className="w-4 h-4 text-yellow-500 mb-1" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase">Live iGaming</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Originals, Sportsbook, and casino slots.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: Select Wallet Mode */}
                {step === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 flex flex-col items-center"
                  >
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">Choose Account Type</h2>
                      <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                        Select your initial trading environment. You can switch wallets instantly in your profile.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {/* Demo Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedType('demo')}
                        className={cn(
                          "p-5 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer relative overflow-hidden group",
                          selectedType === 'demo'
                            ? "bg-purple-100 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                            : "bg-slate-50/20 border-slate-200 hover:border-slate-700"
                        )}
                      >
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider w-fit select-none",
                          selectedType === 'demo' ? "bg-purple-500/20 text-[#a855f7]" : "bg-slate-100 text-slate-600"
                        )}>
                          Practice Mode
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase">Demo Wallet</h3>
                          <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                            Loaded with ₹100,000 practice power. Perfect to learn, simulate, and test strategies.
                          </p>
                        </div>
                      </button>

                      {/* Real Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedType('real')}
                        className={cn(
                          "p-5 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer relative overflow-hidden group",
                          selectedType === 'real'
                            ? "bg-emerald-100 border-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                            : "bg-slate-50/20 border-slate-200 hover:border-slate-700"
                        )}
                      >
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider w-fit select-none",
                          selectedType === 'real' ? "bg-emerald-500/20 text-emerald-600" : "bg-slate-100 text-slate-600"
                        )}>
                          Live Mode
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase">Real Wallet</h3>
                          <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                            Funded at ₹0 starting. Connect your UPI, make deposits, and play for withdrawable profit.
                          </p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Setup Details (Conditional) */}
                {step === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {selectedType === 'demo' ? (
                      /* Demo Setup Details */
                      <div className="space-y-4">
                        <div className="text-center space-y-1">
                          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Demo Account Configuration</h2>
                          <p className="text-xs text-slate-600">Initialize your ₹100,000 virtual balance.</p>
                        </div>
                        
                        <div className="bg-slate-50/30 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-[#a855f7]" />
                            </span>
                            <span className="text-xs text-slate-800">Simulated wallet isolate active.</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-[#a855f7]" />
                            </span>
                            <span className="text-xs text-slate-800">Real-time live feeds and game results enabled.</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-[#a855f7]" />
                            </span>
                            <span className="text-xs text-slate-800">Restore or recharge practice power at any time.</span>
                          </div>
                        </div>

                        <label className="flex items-start gap-3 p-3 bg-purple-100 border border-purple-500/20 rounded-xl cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={agreedDemo}
                            onChange={(e) => setAgreedDemo(e.target.checked)}
                            className="mt-0.5 rounded border-slate-700 bg-white text-[#a855f7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-[11px] text-slate-700 leading-tight">
                            I understand that all funds inside my Demo Wallet are mock virtual credits and cannot be withdrawn as real money.
                          </span>
                        </label>
                      </div>
                    ) : (
                      /* Real Account KYC Setup Details */
                      <div className="space-y-4">
                        <div className="text-center space-y-1">
                          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Real Wallet Setup</h2>
                          <p className="text-xs text-slate-600">Complete mock KYC compliance to enable live deposits.</p>
                        </div>

                        <div className="space-y-3">
                          {/* Phone Number */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Phone Number</label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <Smartphone className="w-4 h-4" />
                              </div>
                              <input 
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                                placeholder="9876543210"
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                              />
                            </div>
                          </div>

                          {/* Indian State Dropdown */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Gaming Jurisdiction State</label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <select
                                value={stateName}
                                onChange={e => handleStateChange(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                              >
                                {INDIAN_STATES.map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </div>
                            {geoRestricted && (
                              <div className="bg-red-50/50 border border-red-200/50 rounded-xl p-4 mt-3 flex items-start gap-3 text-left">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-red-700 font-bold text-xs uppercase tracking-wider">Jurisdiction Restricted</h4>
                                  <p className="text-slate-700 text-[10px] mt-1 leading-normal">
                                    Online gaming is restricted in <strong className="text-red-700 font-black">{stateName}</strong>. Real Money accounts are blocked in this region.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* UPI ID */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Mock UPI ID (For Cashouts)</label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <input 
                                type="text"
                                value={upiId}
                                onChange={e => setUpiId(e.target.value)}
                                placeholder="name@upi"
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <label className="flex items-start gap-3 p-3 bg-emerald-100 border border-emerald-500/20 rounded-xl cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-0.5 rounded border-slate-700 bg-white text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-700 leading-tight">
                            I certify that I am 18+ years of age, residing in an eligible state, and accept the compliance terms.
                          </span>
                        </label>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 3: Interactive Walkthrough Tour */}
                {step === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Interface Walkthrough</h2>
                      <p className="text-xs text-slate-600">Learn how to manage your wallets on the platform.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50/40 border border-slate-200/80 rounded-2xl flex gap-3.5 items-start">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase">Top Balance Display</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Your active balance shows in the website header. Next to it, a tag indicates <span className="text-[#a855f7] font-bold">DEMO</span> or <span className="text-emerald-600 font-bold">REAL</span> mode.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50/40 border border-slate-200/80 rounded-2xl flex gap-3.5 items-start">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <HelpCircle className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase">Instant Wallet Toggle</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Click your profile picture in the upper-right corner. Use the sliding selector to toggle between Demo (Practice) and Real (Live) accounts instantly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Complete & Claim Reward */}
                {step === 4 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                      <BadgeCheck className="w-10 h-10 text-emerald-500 animate-bounce" />
                    </div>
                    
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Onboarding Completed!</h2>
                      <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                        Your setup is fully synced with the backend in <span className={cn("font-bold capitalize", selectedType === 'real' ? "text-emerald-600" : "text-[#a855f7]")}>{selectedType}</span> mode.
                      </p>
                    </div>

                    {/* Reward Claim Card */}
                    <div className="w-full bg-gradient-to-r from-[#17112c] to-[#0d091e] border border-[#3c1d6b]/40 rounded-2xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-[#a855f7]/5 blur-xl rounded-full" />
                      <div className="text-left">
                        <p className="text-[8px] font-black text-[#a855f7] tracking-widest uppercase">Welcome Reward</p>
                        <h4 className="text-sm font-black text-slate-900 uppercase mt-0.5">
                          {selectedType === 'real' ? "100% Deposit Match Activated" : "VIP Practice Medal Granted"}
                        </h4>
                        <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                          {selectedType === 'real' ? "Make your first deposit to get up to ₹10,000 extra balance match." : "Enjoy risk-free trading simulator mode with zero limits."}
                        </p>
                      </div>
                      <span className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      </span>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200/60 relative z-10">
                {step > 0 && step < 4 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {step === 4 ? 'Get Trading' : (step === 2 ? 'Confirm Config' : 'Continue')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
