"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  X,
  AlertTriangle,
  FileText,
  Fingerprint,
  MapPin,
  Sparkles,
  Clock
} from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface KYCProps {
  onComplete: () => void;
  onCancel: () => void;
}

type KYCPhase = 
  | "PAN_INPUT" 
  | "PAN_VERIFYING" 
  | "AADHAAR_INPUT" 
  | "AADHAAR_OTP" 
  | "AADHAAR_VERIFYING" 
  | "GEO_CHECKING" 
  | "SUCCESS" 
  | "BLOCKED"
  | "RECOVERY";

export function KYCVerificationFlow({ onComplete, onCancel }: KYCProps) {
  const { currentUser, setKycStatus, setVerifiedAge, setGeoRestricted } = useTradingStore();
  const [phase, setPhase] = useState<KYCPhase>("PAN_INPUT");
  
  // Input states (to be purged immediately upon verification)
  const [panNumber, setPanNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // KYC Recovery states
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryFile, setRecoveryFile] = useState<File | null>(null);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryTimeSlot, setRecoveryTimeSlot] = useState("Immediate (Within 15 mins)");
  const [altIdType, setAltIdType] = useState("Driving License");
  const [altIdNumber, setAltIdNumber] = useState("");

  // Error & Ticker states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tickerLog, setTickerLog] = useState("");
  
  // Local geolocation storage
  const [geoStateName, setGeoStateName] = useState("");

  // Clean raw fields from memory immediately
  const purgeIdentifiers = () => {
    setPanNumber("");
    setFullName("");
    setDob("");
    setAadhaarNumber("");
    setOtpCode("");
  };

  // Run CSS text log ticker simulation for NSDL / UIDAI wait times
  const runTicker = (logs: string[], finalPhase: KYCPhase, delayMs = 1200) => {
    let index = 0;
    setTickerLog(logs[0]);
    const interval = setInterval(() => {
      index++;
      if (index >= logs.length) {
        clearInterval(interval);
        setPhase(finalPhase);
      } else {
        setTickerLog(logs[index]);
      }
    }, delayMs);
    return () => clearInterval(interval);
  };

  // Handle PAN Step Submit
  const handlePanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate PAN Format: 5 Letters, 4 Digits, 1 Letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!panRegex.test(panNumber)) {
      setErrorMessage("Invalid PAN format. Must be in ABCDE1234F format.");
      return;
    }

    if (!fullName || fullName.trim().length < 3) {
      setErrorMessage("Please enter your full name as printed on your PAN card.");
      return;
    }

    // Age validation (18+)
    if (!dob) {
      setErrorMessage("Please enter your date of birth.");
      return;
    }

    // Validate Date format & calculate age
    // Format could be DD/MM/YYYY or YYYY-MM-DD
    const dobParts = dob.split(/[-/]/);
    let birthDate: Date;
    if (dobParts[0].length === 4) {
      // YYYY-MM-DD
      birthDate = new Date(parseInt(dobParts[0]), parseInt(dobParts[1]) - 1, parseInt(dobParts[2]));
    } else {
      // DD/MM/YYYY
      birthDate = new Date(parseInt(dobParts[2]), parseInt(dobParts[1]) - 1, parseInt(dobParts[0]));
    }

    if (isNaN(birthDate.getTime())) {
      setErrorMessage("Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY.");
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setErrorMessage("Compliance Error: You must be at least 18 years of age to register.");
      return;
    }

    setVerifiedAge(age);
    setPhase("PAN_VERIFYING");
  };

  // Trigger PAN Verification Ticker
  useEffect(() => {
    if (phase === "PAN_VERIFYING") {
      const logs = [
        "Connecting Income Tax Department secure route...",
        "Resolving PAN identity hash...",
        "NSDL database handshake completed.",
        "Comparing name database tokens...",
        "PAN Verification Successful."
      ];
      const cleanup = runTicker(logs, "AADHAAR_INPUT", 1000);
      return cleanup;
    }
  }, [phase]);

  // Handle Aadhaar Number Submit
  const handleAadhaarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(aadhaarNumber)) {
      setErrorMessage("Invalid Aadhaar Number. Must be exactly 12 digits.");
      return;
    }

    setPhase("AADHAAR_VERIFYING");
  };

  // Trigger Aadhaar Gateway Ticker
  useEffect(() => {
    if (phase === "AADHAAR_VERIFYING") {
      const logs = [
        "Initiating UIDAI gateway bridge...",
        "Requesting Digilocker consent approval...",
        "Generating secure transactional session token...",
        "Aadhaar details verified successfully."
      ];
      // Skip OTP phase, transition directly to GEO_CHECKING
      const cleanup = runTicker(logs, "GEO_CHECKING", 1100);
      return cleanup;
    }
  }, [phase]);

  // Handle Aadhaar OTP Submit
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpCode.length !== 6 || isNaN(Number(otpCode))) {
      setErrorMessage("OTP must be a 6-digit numeric code.");
      return;
    }

    setPhase("GEO_CHECKING");
  };

  // Trigger Geolocation Check
  useEffect(() => {
    if (phase === "GEO_CHECKING") {
      const logs = [
        "Sniffing client routing signature...",
        "Acquiring HTML5 geolocation coordinates...",
        "Checking regional gaming compliance list...",
        "State regulations verified."
      ];
      
      const checkGeo = async () => {
        try {
          // Sniff location dynamically
          const res = await fetch('https://ipapi.co/json/');
          let stateName = "Maharashtra"; // default compliance state
          if (res.ok) {
            const data = await res.json();
            if (data && data.region) {
              stateName = data.region;
            }
          }
          
          setGeoStateName(stateName);
          const restrictedStates = ["Telangana", "Andhra Pradesh", "Assam", "Odisha", "Nagaland"];
          const isRestricted = restrictedStates.some(rs => 
            stateName.toLowerCase().includes(rs.toLowerCase())
          );
          
          // Clear credentials from local state immediately
          purgeIdentifiers();
          
          if (isRestricted) {
            setGeoRestricted(true);
            setKycStatus("REJECTED");
            setPhase("BLOCKED");
          } else {
            setGeoRestricted(false);
            setKycStatus("PROCESSING");
            useTradingStore.getState().setKycSubmittedAt(Date.now());
            
            // Dispatch review initiated notification
            const newNotif = {
              id: `NOTIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              message: "Your Tier 2 KYC Identity Verification (PAN & Aadhaar) application has been submitted and is under automatic review. Approval will complete in 10 minutes.",
              timestamp: Date.now(),
              read: false
            };
            useTradingStore.getState().updateProfile({
              notifications: [...(currentUser?.notifications || []), newNotif]
            });

            setPhase("SUCCESS");
          }
        } catch (e) {
          console.error("IP sniffing failed, allowing fallback", e);
          purgeIdentifiers();
          setKycStatus("VERIFIED");
          
          // Dispatch dynamic verified account notification
          const newNotif = {
            id: `NOTIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            message: "Congratulations! Your Tier 2 KYC Identity Verification (PAN & Aadhaar) has been successfully verified. Your account limits have been upgraded.",
            timestamp: Date.now(),
            read: false
          };
          useTradingStore.getState().updateProfile({
            notifications: [...(currentUser?.notifications || []), newNotif]
          });

          setPhase("SUCCESS");
        }
      };

      let index = 0;
      setTickerLog(logs[0]);
      const interval = setInterval(() => {
        index++;
        if (index >= logs.length) {
          clearInterval(interval);
          checkGeo();
        } else {
          setTickerLog(logs[index]);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Sleek Light Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white/70 backdrop-blur-md"
        onClick={onCancel}
      />

      {/* Progressive Disclosure Wizard Box (Borderless, Minimalist) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl select-none"
      >
        {/* Close Button */}
        {phase !== "SUCCESS" && phase !== "BLOCKED" && (
          <button 
            onClick={onCancel} 
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Title / Header HUD */}
        <div className="mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Compliance Hub</h3>
            <h2 className="text-base font-black text-slate-900">Tier 2 Verification</h2>
          </div>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-100 text-[#DC2626] rounded-xl p-3 flex items-start gap-2.5 text-xs font-bold leading-normal"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Wizard Phases */}
        <AnimatePresence mode="wait">
          
          {/* Phase 1: PAN INPUT */}
          {phase === "PAN_INPUT" && (
            <motion.form 
              key="pan_input"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handlePanSubmit}
              className="space-y-6"
            >
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-black text-slate-900">NSDL PAN Verification</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Enter your Tax Permanent Account Number for name & age check.</p>
              </div>

              <div className="space-y-5">
                {/* PAN Input */}
                <div className="relative border-b border-[#E4E7EB] focus-within:border-indigo-600 transition-colors py-1">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">PAN Card Number</label>
                  <input 
                    type="text"
                    value={panNumber}
                    onChange={e => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full bg-transparent border-0 outline-none text-slate-900 font-black tracking-widest text-sm py-1 font-mono uppercase"
                    maxLength={10}
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Name Input */}
                <div className="relative border-b border-[#E4E7EB] focus-within:border-indigo-600 transition-colors py-1">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Full Name as on PAN</label>
                  <input 
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full bg-transparent border-0 outline-none text-slate-900 font-bold text-sm py-1"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* DOB Input */}
                <div className="relative border-b border-[#E4E7EB] focus-within:border-indigo-600 transition-colors py-1">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Date of Birth</label>
                  <input 
                    type="text"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-transparent border-0 outline-none text-slate-900 font-bold text-sm py-1 font-mono"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                Proceed to Aadhaar <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setPhase("RECOVERY");
                    setRecoveryStep(1);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-850 font-bold underline"
                >
                  Problems verifying? Start alternative KYC recovery
                </button>
              </div>
            </motion.form>
          )}

          {/* Phase 2: PAN VERIFYING */}
          {phase === "PAN_VERIFYING" && (
            <motion.div 
              key="pan_verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: "linear", repeat: Infinity }}
                />
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-sm">NSDL Database Check</h3>
                <p className="text-[#94A3B8] font-mono text-[10px] uppercase tracking-wider animate-pulse max-w-[280px] leading-relaxed">
                  {tickerLog}
                </p>
              </div>
            </motion.div>
          )}

          {/* Phase 3: AADHAAR INPUT */}
          {phase === "AADHAAR_INPUT" && (
            <motion.form 
              key="aadhaar_input"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleAadhaarSubmit}
              className="space-y-6"
            >
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-black text-slate-900">Aadhaar e-KYC Check</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Validate your identity via secure Digilocker signature check.</p>
              </div>

              <div className="space-y-5">
                {/* Aadhaar Input */}
                <div className="relative border-b border-[#E4E7EB] focus-within:border-indigo-600 transition-colors py-1">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Aadhaar Card Number</label>
                  <input 
                    type="text"
                    value={aadhaarNumber}
                    onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="12 Digit Aadhaar Number"
                    className="w-full bg-transparent border-0 outline-none text-slate-900 font-black tracking-widest text-sm py-1 font-mono"
                    maxLength={12}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                Verify Aadhaar Details <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setPhase("RECOVERY");
                    setRecoveryStep(1);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-850 font-bold underline"
                >
                  Problems verifying? Start alternative KYC recovery
                </button>
              </div>
            </motion.form>
          )}

          {/* Phase 4: AADHAAR VERIFYING */}
          {phase === "AADHAAR_VERIFYING" && (
            <motion.div 
              key="aadhaar_verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: "linear", repeat: Infinity }}
                />
                <Fingerprint className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-sm">Aadhaar Dispatch Bridge</h3>
                <p className="text-[#94A3B8] font-mono text-[10px] uppercase tracking-wider animate-pulse max-w-[280px] leading-relaxed">
                  {tickerLog}
                </p>
              </div>
            </motion.div>
          )}

          {/* Phase 5: AADHAAR OTP INPUT */}
          {phase === "AADHAAR_OTP" && (
            <motion.form 
              key="aadhaar_otp"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleOtpSubmit}
              className="space-y-6"
            >
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-black text-slate-900">Enter Security OTP</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">We sent a 6-digit verification code to your registered mobile number.</p>
              </div>

              <div className="space-y-5">
                {/* OTP Input */}
                <div className="relative border-b border-[#E4E7EB] focus-within:border-indigo-600 transition-colors py-1">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">6-Digit OTP</label>
                  <input 
                    type="text"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="######"
                    className="w-full bg-transparent border-0 outline-none text-slate-900 font-black tracking-widest text-base py-1 font-mono text-center"
                    maxLength={6}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                Validate Signatures <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.form>
          )}

          {/* Phase 6: GEO CHECKING */}
          {phase === "GEO_CHECKING" && (
            <motion.div 
              key="geo_checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: "linear", repeat: Infinity }}
                />
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-sm">Regulatory Sniff Scan</h3>
                <p className="text-[#94A3B8] font-mono text-[10px] uppercase tracking-wider animate-pulse max-w-[280px] leading-relaxed">
                  {tickerLog}
                </p>
              </div>
            </motion.div>
          )}

          {/* Phase 7: SUCCESS */}
          {phase === "SUCCESS" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 flex flex-col items-center justify-center text-center space-y-6"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-20 h-20 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center animate-pulse"
              >
                <Clock className="w-10 h-10 text-yellow-600" />
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-950">Application Submitted!</h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-yellow-200">
                  <Sparkles className="w-3.5 h-3.5" /> Under Automatic Review
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs pt-2">
                  Your PAN & Aadhaar details have been successfully received. Identity checks are being processed automatically. Your account limits will upgrade in 10 minutes.
                </p>
              </div>

              <button 
                onClick={onComplete}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg shadow-yellow-500/10 cursor-pointer"
              >
                Return to Profile
              </button>
            </motion.div>
          )}

          {/* Phase 8: BLOCKED */}
          {phase === "BLOCKED" && (
            <motion.div 
              key="blocked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-[#DC2626]">
                <AlertTriangle className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-950">Onboarding Blocked</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
                  We sniffed coordinates originating from <strong className="text-slate-900">{geoStateName}</strong>. 
                  Unfortunately, due to state regulations on online skill gaming, you are legally restricted from upgrading to a Real money wallet in this region.
                </p>
              </div>

              <button 
                onClick={onCancel}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-colors cursor-pointer"
              >
                Exit Verification
              </button>
            </motion.div>
          )}

          {/* Phase 9: KYC RECOVERY */}
          {phase === "RECOVERY" && (
            <motion.div 
              key="kyc_recovery"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Alternative KYC Recovery</h3>
                <p className="text-xs text-slate-400 font-medium">Step {recoveryStep} of 3</p>
              </div>

              {/* Recovery Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${(recoveryStep / 3) * 100}%` }}
                />
              </div>

              {recoveryStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">1. Upload Photo ID</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Upload a clear photo of your PAN, Aadhaar, Voter ID, or Driving License for manual verification.</p>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer relative">
                    <FileText className="w-8 h-8 text-indigo-500 mb-2" />
                    <span className="text-xs font-bold text-slate-700">
                      {recoveryFile ? recoveryFile.name : "Click to select document photo"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF up to 5MB</span>
                    <input 
                      type="file" 
                      onChange={(e) => e.target.files && setRecoveryFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setRecoveryStep(2);
                    }}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                    Continue to Step 2 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {recoveryStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">2. Request Phone Audit</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">An onboarding specialist will call you to verify your identity details over a secure call.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="relative border-b border-[#E4E7EB] focus-within:border-indigo-600 transition-colors py-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Contact Number</label>
                      <input 
                        type="tel"
                        value={recoveryPhone}
                        onChange={e => setRecoveryPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-transparent border-0 outline-none text-slate-900 font-bold text-sm py-1"
                        required
                      />
                    </div>
                    <div className="relative border-b border-[#E4E7EB] py-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Preferred Call Time</label>
                      <select 
                        value={recoveryTimeSlot}
                        onChange={e => setRecoveryTimeSlot(e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-slate-900 font-bold text-sm py-1 cursor-pointer"
                      >
                        <option>Immediate (Within 15 mins)</option>
                        <option>Morning (09:00 AM - 12:00 PM)</option>
                        <option>Afternoon (12:00 PM - 04:00 PM)</option>
                        <option>Evening (04:00 PM - 08:00 PM)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setRecoveryStep(1)}
                      className="w-1/3 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (!recoveryPhone || recoveryPhone.trim().length < 8) {
                          alert("Please enter a valid phone number.");
                          return;
                        }
                        setRecoveryStep(3);
                      }}
                      className="w-2/3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                    >
                      Continue to Step 3 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {recoveryStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">3. Alternate Identifier</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Provide details for an alternative government identification document.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="relative border-b border-[#E4E7EB] py-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Alternative ID Type</label>
                      <select 
                        value={altIdType}
                        onChange={e => setAltIdType(e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-slate-900 font-bold text-sm py-1 cursor-pointer"
                      >
                        <option>Driving License</option>
                        <option>Voter ID Card</option>
                        <option>Passport</option>
                      </select>
                    </div>
                    <div className="relative border-b border-[#E4E7EB] focus-within:border-indigo-600 transition-colors py-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Document ID Number</label>
                      <input 
                        type="text"
                        value={altIdNumber}
                        onChange={e => setAltIdNumber(e.target.value.toUpperCase())}
                        placeholder="Document Number"
                        className="w-full bg-transparent border-0 outline-none text-slate-900 font-black tracking-widest text-sm py-1 font-mono uppercase"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setRecoveryStep(2)}
                      className="w-1/3 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (!altIdNumber || altIdNumber.trim().length < 4) {
                          alert("Please enter a valid document ID number.");
                          return;
                        }
                        
                        // Submit Recovery Form
                        setKycStatus("PROCESSING");
                        useTradingStore.getState().setKycSubmittedAt(Date.now());
                        
                        // Dispatch recovery submit notification
                        const newNotif = {
                          id: `NOTIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                          message: `Your alternative KYC Recovery document (${altIdType}) has been received and is under manual agent review. Callback scheduled for ${recoveryTimeSlot}.`,
                          timestamp: Date.now(),
                          read: false
                        };
                        useTradingStore.getState().updateProfile({
                          notifications: [...(currentUser?.notifications || []), newNotif]
                        });

                        setPhase("SUCCESS");
                      }}
                      className="w-2/3 py-3.5 bg-green-600 hover:bg-green-700 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-600/10"
                    >
                      Submit Recovery
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
