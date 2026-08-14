"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  Bitcoin, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  Upload, 
  Check, 
  AlertTriangle,
  Landmark,
  Copy,
  Trash2,
  Info
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CashierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashierModal({ isOpen, onClose }: CashierModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusableEls = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        if (focusableEls.length === 0) return;
        const firstFocusable = focusableEls[0] as HTMLElement;
        const lastFocusable = focusableEls[focusableEls.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstInput = modalRef.current.querySelector('input') as HTMLElement;
        if (firstInput) {
          firstInput.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 100);

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const [activeTab, setActiveTab] = useState("deposit");
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [amount, setAmount] = useState<number>(1000);
  const [isOneClickEnabled, setIsOneClickEnabled] = useState(false);
  
  // Real account deposit states
  const [depositStep, setDepositStep] = useState<'amount' | 'transfer' | 'verify'>('amount');
  const [utr, setUtr] = useState("");
  const [senderUpi, setSenderUpi] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

interface BtcAddressConfig {
  id: string;
  label: string;
  address: string;
  qrImageUrl?: string;
  isActive: boolean;
}

interface PaymentSettingsState {
  upiId: string;
  gpayId: string;
  phonepeId: string;
  upiQrType?: 'dynamic' | 'custom';
  upiQrImageUrl?: string;
  btcAddress?: string;
  btcAddresses?: BtcAddressConfig[];
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankHolderName: string;
}

  // Dynamic payment settings loaded from admin configs
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsState>({
    upiId: "aurabet@okaxis",
    gpayId: "aurabet.gpay@okaxis",
    phonepeId: "aurabet.ybl@okaxis",
    upiQrType: "dynamic",
    upiQrImageUrl: "",
    btcAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    btcAddresses: [
      {
        id: "btc_1",
        label: "Primary Cold Storage Wallet",
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        isActive: true
      }
    ],
    bankName: "State Bank of India",
    bankAccountNo: "999888777666",
    bankIfsc: "SBIN0001234",
    bankHolderName: "AuraBet Operations Pvt Ltd"
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/payment-settings')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.settings) {
            setPaymentSettings(data.settings);
          }
        })
        .catch(err => console.error("Error loading payment settings:", err));
    }
  }, [isOpen]);

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const currentUser = useTradingStore(state => state.currentUser);
  const { balance: rawBalance, deposit, switchAccountType } = useTradingStore();
  const balance = typeof rawBalance === 'number' ? rawBalance : (parseFloat(String(rawBalance)) || 0);

  const [demoRentalsCount, setDemoRentalsCount] = useState(0);
  const isDemo = !currentUser || currentUser.accountType === 'demo';

  useEffect(() => {
    if (isOpen) {
      const count = parseInt(localStorage.getItem("demo_rentals_count") || "0");
      setDemoRentalsCount(count);
    }
  }, [isOpen]);

  const activeBtcAddress: BtcAddressConfig = paymentSettings.btcAddresses?.find((addr) => addr.isActive)
    || paymentSettings.btcAddresses?.[0]
    || { id: "btc_fallback", address: paymentSettings.btcAddress || "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", label: "Primary Cold Storage Wallet", isActive: true };

  const TABS = [
    { id: "deposit", label: "Deposit", icon: ArrowDownLeft },
    { id: "withdraw", label: "Withdraw", icon: ArrowUpRight },
    { id: "buy", label: "Buy Crypto", icon: Bitcoin },
  ];

  // Reset steps and states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handleReset = () => {
    setDepositStep('amount');
    setUtr("");
    setSenderUpi("");
    setScreenshot(null);
    setScreenshotName(null);
    setVerificationError(null);
    setIsSuccess(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 1200;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setVerificationError("Screenshot size exceeds 15MB limit.");
      return;
    }

    setScreenshotName(file.name);
    setVerificationError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        setScreenshot(compressed);
      } catch (err) {
        console.error("Compression error:", err);
        setVerificationError("Failed to process image. Please try another screenshot.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Removed handleCopyUPI in favor of handleCopyText

  const handleRealRequestSubmit = async (type: 'deposit' | 'withdraw') => {
    if (amount <= 0) return;
    
    if (type === 'deposit') {
      if (selectedMethod === 'upi') {
        if (!utr || utr.trim().length !== 12 || isNaN(Number(utr))) {
          setVerificationError("Please enter a valid 12-digit UTR transaction ID.");
          return;
        }
      } else {
        if (!utr || utr.trim().length < 4) {
          setVerificationError("Please enter a valid Transaction / Reference ID.");
          return;
        }
      }
      if (!screenshot) {
        setVerificationError("Please upload a payment screenshot receipt.");
        return;
      }
    }

    if (type === 'withdraw' && amount > balance) {
      setVerificationError("Withdrawal amount exceeds your real balance.");
      return;
    }

    if (!senderUpi || (selectedMethod === 'upi' && !senderUpi.includes("@"))) {
      setVerificationError(selectedMethod === 'upi' ? "Please enter your valid UPI ID." : "Please enter your valid payment details.");
      return;
    }

    setVerificationError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/deposit/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email,
          amount,
          utr: type === 'deposit' ? utr : undefined,
          upiId: senderUpi,
          screenshot: type === 'deposit' ? screenshot : undefined,
          type,
          method: selectedMethod,
          destinationAddress: selectedMethod === 'crypto' ? activeBtcAddress.address : (selectedMethod === 'upi' ? paymentSettings.upiId : paymentSettings.bankAccountNo)
        })
      });

      const data = await res.json();
      setIsProcessing(false);

      if (res.ok && data.success) {
        setIsSuccess(true);
        // Clear states
        setUtr("");
        setSenderUpi("");
        setScreenshot(null);
        setScreenshotName(null);
        setDepositStep('amount');
        
        // Let the global polling fetch the new balance instantly
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2500);
      } else {
        setVerificationError(data.error || "Submission failed.");
      }
    } catch (err) {
      setIsProcessing(false);
      setVerificationError("Network error. Please try again.");
    }
  };

  const handleTransaction = (instantAmount?: number) => {
    const finalAmount = instantAmount || amount;
    if (finalAmount <= 0) return;

    // Stricter Real User checks: Never simulate deposits or withdrawals for real accounts.
    if (currentUser?.accountType === 'real') {
      if (activeTab === "deposit") {
        if (depositStep === 'amount') {
          setDepositStep('transfer');
        }
        return;
      } else if (activeTab === "withdraw") {
        handleRealRequestSubmit('withdraw');
        return;
      }
    }

    // Practice (Demo) account flow remains simulated
    if (activeTab === "withdraw" && finalAmount > balance) return;
    if (instantAmount) setAmount(instantAmount);

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Update global balance for practice only
      if (activeTab === "deposit") {
        deposit(finalAmount, selectedMethod);
      } else if (activeTab === "withdraw") {
        deposit(-finalAmount, "Bank Transfer");
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 1500);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-white/80 z-[9990] backdrop-blur-md flex items-end justify-center sm:items-center p-0 sm:p-6"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cashier-modal-title"
              tabIndex={-1}
              className="bg-white w-full max-w-xl rounded-t-[2rem] sm:rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.15)] border-t sm:border border-slate-200 flex flex-col max-h-[95dvh] sm:max-h-[90vh] ring-1 ring-white/5 outline-none"
            >
              {/* Header & Tabs */}
              <div className="bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="flex items-center justify-between p-4 pb-2.5">
                  <div className="flex items-center gap-1.5 text-[#22c55e]">
                    <ShieldCheck className="w-5 h-5" />
                    <h2 id="cashier-modal-title" className="text-base font-black text-slate-900 tracking-tight">
                      {currentUser?.accountType === 'real' ? "Secure Real Cashier" : "Practice Cashier"}
                    </h2>
                  </div>
                  <button 
                    onClick={handleClose}
                    aria-label="Close cashier modal"
                    className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex px-4 overflow-x-auto custom-scrollbar">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setAmount(tab.id === 'deposit' ? 1000 : 0);
                        handleReset();
                      }}
                      className={`pb-2 px-3 font-bold text-xs whitespace-nowrap transition-colors relative flex items-center gap-1.5 ${
                        activeTab === tab.id ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full shadow-[0_-2px_10px_rgba(220,38,38,0.5)]"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                
                {/* Trial Limit Upgrade Banner */}
                {isDemo && demoRentalsCount >= 3 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-gradient-to-r from-yellow-500/10 to-amber-500/15 border border-yellow-500/30 text-yellow-500 rounded-3xl space-y-4 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 font-sans">Trial Limit Reached (3 of 3)</h4>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed font-sans font-medium">
                          You have used all 3 free trials in Demo mode. To continue playing premium cloud rentals or betting custom amounts, please switch to your Real Account and deposit funds.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await switchAccountType('real');
                        setActiveTab("deposit");
                        setAmount(1000);
                        setDepositStep('transfer');
                      }}
                      className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-slate-950 font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(234,179,8,0.2)] hover:scale-[1.02] active:scale-[0.98] font-sans"
                    >
                      ⚡ Switch to Real Account & Pay
                    </button>
                  </motion.div>
                )}

                {/* Error Banner */}
                {verificationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/15 border border-red-500/30 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {verificationError}
                  </motion.div>
                )}

                {/* Deposit View Content */}
                {activeTab === "deposit" && !isSuccess && (
                  <>
                    {/* Sleek Step Indicator */}
                    {currentUser?.accountType === 'real' && (
                      <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 mb-2">
                        <div className="flex items-center justify-between relative">
                          {/* Background Line */}
                          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-100/80 -z-10" />
                          {/* Active Fill Line */}
                          <div 
                            className="absolute top-4 left-6 right-6 h-0.5 bg-gradient-to-r from-emerald-500 via-red-500 to-amber-500 origin-left transition-all duration-500 -z-10" 
                            style={{
                              transform: `scaleX(${depositStep === 'amount' ? 0 : depositStep === 'transfer' ? 0.5 : 1})`
                            }}
                          />
                          
                          {/* Step 1 */}
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border font-black text-xs transition-all duration-300",
                              depositStep === 'amount' 
                                ? "bg-white border-emerald-500 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/10" 
                                : "bg-emerald-500 border-emerald-500 text-slate-950"
                            )}>
                              {depositStep === 'amount' ? "1" : <Check className="w-4 h-4 stroke-[3]" />}
                            </div>
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider transition-colors", depositStep === 'amount' ? "text-slate-900" : "text-slate-500")}>1. Setup</span>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border font-black text-xs transition-all duration-300",
                              depositStep === 'amount' 
                                ? "bg-white border-slate-200 text-slate-500" 
                                : depositStep === 'transfer'
                                ? "bg-white border-red-500 text-red-600 shadow-[0_0_12px_rgba(220,38,38,0.3)] ring-2 ring-red-500/10" 
                                : "bg-red-500 border-red-500 text-slate-900"
                            )}>
                              {depositStep === 'verify' ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
                            </div>
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider transition-colors", depositStep === 'transfer' ? "text-slate-900" : "text-slate-500")}>2. Pay</span>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border font-black text-xs transition-all duration-300",
                              depositStep === 'verify' 
                                ? "bg-white border-amber-500 text-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-2 ring-amber-500/10" 
                                : "bg-white border-slate-200 text-slate-500"
                            )}>
                              3
                            </div>
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider transition-colors", depositStep === 'verify' ? "text-slate-900" : "text-slate-500")}>3. Confirm</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentUser?.accountType === 'real' && depositStep === 'transfer' ? (
                      /* STEP 2: TRANSFER FUNDS (Scan QR / Bank Transfer details) */
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }} 
                        className="space-y-5"
                      >
                        {selectedMethod === "upi" && (
                          <>
                            <div className="text-center space-y-1">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Scan & Pay via UPI</h3>
                              <p className="text-[11px] text-slate-600">Scan this QR or copy UPI ID using GPay, PhonePe, or Paytm.</p>
                            </div>

                            {/* QR Code and Copy UPI Box */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 bg-slate-50/60 p-5 border border-slate-200 rounded-2xl shadow-inner">
                              <div className="bg-white p-2.5 rounded-2xl shrink-0 flex items-center justify-center shadow-lg border border-slate-200 w-36 h-36 overflow-hidden">
                                {paymentSettings.upiQrType === 'custom' && paymentSettings.upiQrImageUrl ? (
                                  <img 
                                    src={paymentSettings.upiQrImageUrl}
                                    alt="Custom Deposit UPI QR Code"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${paymentSettings.upiId}&pn=AuraBet&am=${amount}&cu=INR`)}`}
                                    alt="Deposit UPI QR Code"
                                    className="w-full h-full"
                                  />
                                )}
                              </div>
                              <div className="text-center sm:text-left space-y-3 min-w-0 flex-1">
                                <div>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Amount Due</p>
                                  <p className="text-2xl font-black text-[#22c55e] font-mono">₹{amount.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1.5">
                                  <div>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Default UPI ID</p>
                                    <div className="flex items-center justify-between bg-white/40 border border-slate-200 px-2.5 py-1.5 rounded-xl gap-2 mt-0.5">
                                      <span className="font-mono text-xs text-emerald-600 font-bold truncate">{paymentSettings.upiId}</span>
                                      <button 
                                        onClick={() => handleCopyText(paymentSettings.upiId, 'upiId')}
                                        className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-900 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                                      >
                                        {copiedField === 'upiId' ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            <span className="text-emerald-600">Copied</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-2.5 h-2.5 text-slate-600" />
                                            <span>Copy</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">GPay UPI</p>
                                      <div className="flex items-center justify-between bg-white/40 border border-slate-200 px-2 py-1 rounded-lg gap-1.5 mt-0.5">
                                        <span className="font-mono text-[9px] text-slate-700 font-bold truncate">{paymentSettings.gpayId}</span>
                                        <button 
                                          onClick={() => handleCopyText(paymentSettings.gpayId, 'gpayId')}
                                          className="text-[8px] font-black uppercase text-slate-900 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                                        >
                                          {copiedField === 'gpayId' ? 'Copied' : 'Copy'}
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">PhonePe UPI</p>
                                      <div className="flex items-center justify-between bg-white/40 border border-slate-200 px-2 py-1 rounded-lg gap-1.5 mt-0.5">
                                        <span className="font-mono text-[9px] text-slate-700 font-bold truncate">{paymentSettings.phonepeId}</span>
                                        <button 
                                          onClick={() => handleCopyText(paymentSettings.phonepeId, 'phonepeId')}
                                          className="text-[8px] font-black uppercase text-slate-900 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                                        >
                                          {copiedField === 'phonepeId' ? 'Copied' : 'Copy'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 1-Tap App Launcher Row */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-emerald-600" />
                                1-Tap Direct Pay (Instant App Launcher):
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <a
                                  href={`phonepe://pay?pa=${paymentSettings.phonepeId || paymentSettings.upiId}&pn=AuraBet&am=${amount}&cu=INR`}
                                  className="px-2.5 py-2 bg-[#5f259f]/10 hover:bg-[#5f259f]/20 text-[#5f259f] border border-[#5f259f]/30 rounded-xl text-[10px] font-black text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                                >
                                  <span>🟣 PhonePe</span>
                                </a>
                                <a
                                  href={`tez://upi/pay?pa=${paymentSettings.gpayId || paymentSettings.upiId}&pn=AuraBet&am=${amount}&cu=INR`}
                                  className="px-2.5 py-2 bg-[#4285F4]/10 hover:bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/30 rounded-xl text-[10px] font-black text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                                >
                                  <span>🔵 GPay</span>
                                </a>
                                <a
                                  href={`paytmmp://pay?pa=${paymentSettings.upiId}&pn=AuraBet&am=${amount}&cu=INR`}
                                  className="px-2.5 py-2 bg-[#00BAF2]/10 hover:bg-[#00BAF2]/20 text-[#002e6e] border border-[#00BAF2]/30 rounded-xl text-[10px] font-black text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                                >
                                  <span>🔷 Paytm</span>
                                </a>
                                <a
                                  href={`upi://pay?pa=${paymentSettings.upiId}&pn=AuraBet&am=${amount}&cu=INR`}
                                  className="px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 rounded-xl text-[10px] font-black text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                                >
                                  <span>⚡ Any UPI</span>
                                </a>
                              </div>
                            </div>

                            {/* Instruction Card */}
                            <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-emerald-600" />
                                UPI Transfer Instructions
                              </h4>
                              <ol className="space-y-1.5 text-[11px] text-slate-600 font-medium">
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">1</span>
                                  <span>Open GPay, PhonePe, Paytm, or your mobile banking application.</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">2</span>
                                  <span>Scan the QR code, or copy one of the UPI IDs listed above.</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">3</span>
                                  <span>Transfer exactly <strong className="text-slate-900 font-mono">₹{amount.toLocaleString()}</strong>. Next, keep the window open to confirm verification.</span>
                                </li>
                              </ol>
                            </div>
                          </>
                        )}

                        {selectedMethod === "crypto" && (
                          <>
                            <div className="text-center space-y-1">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Bitcoin Wallet Deposit</h3>
                              <p className="text-[11px] text-slate-600">Scan this QR or copy BTC address to send equivalent funds.</p>
                            </div>

                            {/* BTC QR Code and Copy Box */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 bg-slate-50/60 p-5 border border-slate-200 rounded-2xl shadow-inner">
                              <div className="bg-white p-2.5 rounded-2xl shrink-0 flex items-center justify-center shadow-lg border border-slate-200 w-36 h-36 overflow-hidden">
                                {activeBtcAddress.qrImageUrl ? (
                                  <img 
                                    src={activeBtcAddress.qrImageUrl}
                                    alt="Bitcoin QR Code"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(activeBtcAddress.address)}`}
                                    alt="Bitcoin QR Code"
                                    className="w-full h-full"
                                  />
                                )}
                              </div>
                              <div className="text-center sm:text-left space-y-3 min-w-0 flex-1">
                                <div>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Equivalent INR Value</p>
                                  <p className="text-xl font-black text-[#f59e0b] font-mono">₹{amount.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">BTC Wallet ({activeBtcAddress.label || "Active"})</p>
                                  <div className="flex items-center gap-2 bg-white/40 border border-slate-200 px-2.5 py-1.5 rounded-xl mt-0.5">
                                    <span className="font-mono text-[10px] text-amber-600 font-bold truncate">{activeBtcAddress.address}</span>
                                    <button 
                                      onClick={() => handleCopyText(activeBtcAddress.address, 'btcAddress')}
                                      className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-900 hover:text-amber-600 transition-colors shrink-0 cursor-pointer"
                                    >
                                      {copiedField === 'btcAddress' ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-amber-600" />
                                          <span className="text-amber-600">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-2.5 h-2.5 text-slate-600" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Instruction Card */}
                            <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-amber-600" />
                                Bitcoin Transfer Instructions
                              </h4>
                              <ol className="space-y-1.5 text-[11px] text-slate-600 font-medium">
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">1</span>
                                  <span>Open your personal crypto exchange or wallet app.</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">2</span>
                                  <span>Scan the QR code, or copy the active wallet address.</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">3</span>
                                  <span>Transfer equivalent BTC funds. Verification will occur after 1 network confirmation.</span>
                                </li>
                              </ol>
                            </div>
                          </>
                        )}

                        {selectedMethod === "card" && (
                          <>
                            <div className="text-center space-y-1">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Direct Bank Transfer</h3>
                              <p className="text-[11px] text-slate-600">Transfer funds to the bank account listed below via IMPS / NEFT.</p>
                            </div>

                            {/* Bank Details Table Box */}
                            <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4.5 space-y-2.5 text-xs font-mono shadow-inner">
                              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                                <span className="text-slate-500 text-[9px] uppercase font-bold">Bank Name</span>
                                <span className="text-slate-800 font-bold">{paymentSettings.bankName}</span>
                              </div>
                              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                                <span className="text-slate-500 text-[9px] uppercase font-bold">Account Holder</span>
                                <span className="text-slate-800 font-bold">{paymentSettings.bankHolderName}</span>
                              </div>
                              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                                <span className="text-slate-500 text-[9px] uppercase font-bold">Account Number</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-900 font-bold">{paymentSettings.bankAccountNo}</span>
                                  <button 
                                    onClick={() => handleCopyText(paymentSettings.bankAccountNo, 'bankAccount')} 
                                    className="text-[9px] font-black uppercase text-red-600 hover:text-red-700 cursor-pointer"
                                  >
                                    {copiedField === 'bankAccount' ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-[9px] uppercase font-bold">IFSC Code</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-900 font-bold">{paymentSettings.bankIfsc}</span>
                                  <button 
                                    onClick={() => handleCopyText(paymentSettings.bankIfsc, 'bankIfsc')} 
                                    className="text-[9px] font-black uppercase text-red-600 hover:text-red-700 cursor-pointer"
                                  >
                                    {copiedField === 'bankIfsc' ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Instruction Card */}
                            <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-red-600" />
                                Bank Wire Instructions
                              </h4>
                              <ol className="space-y-1.5 text-[11px] text-slate-600 font-medium">
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">1</span>
                                  <span>Log in to your banking app or internet portal.</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">2</span>
                                  <span>Transfer exactly <strong className="text-slate-900 font-mono">₹{amount.toLocaleString()}</strong> using IMPS/NEFT.</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="w-4 h-4 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full flex items-center justify-center shrink-0 font-black text-[9px]">3</span>
                                  <span>Save the official bank transaction receipt image. Proceed to verify details next.</span>
                                </li>
                              </ol>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ) : currentUser?.accountType === 'real' && depositStep === 'verify' ? (
                      /* STEP 3: SUBMIT VERIFICATION DETAILS */
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }} 
                        className="space-y-5"
                      >
                        {/* KYC Declaration Details */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200 pb-2">Verification Declaration</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Account/ID used to Pay */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                {selectedMethod === "crypto" ? "Your BTC Wallet Address" : selectedMethod === "card" ? "Your Bank Account/UPI Name" : "Your UPI ID (Used to pay)"}
                              </label>
                              <input 
                                type="text"
                                value={senderUpi}
                                onChange={e => setSenderUpi(e.target.value)}
                                placeholder={selectedMethod === "crypto" ? "e.g. bc1q..." : selectedMethod === "card" ? "e.g. John Doe / Bank Acc" : "sender@upi"}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                              />
                            </div>

                            {/* UTR / Tx ID reference number */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                {selectedMethod === "crypto" ? "Blockchain Tx Hash ID" : selectedMethod === "card" ? "Ref / Transaction ID" : "12-Digit UTR Transaction ID"}
                              </label>
                              <input 
                                type="text"
                                value={utr}
                                onChange={e => {
                                  if (selectedMethod === "upi") {
                                    setUtr(e.target.value.replace(/\D/g, '').substring(0, 12));
                                  } else {
                                    setUtr(e.target.value);
                                  }
                                }}
                                placeholder={selectedMethod === "upi" ? "12-digit number" : "Transaction Reference ID"}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                              />
                            </div>
                          </div>

                          {/* Screenshot File Upload */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Payment Receipt Screenshot</label>
                            {screenshot ? (
                              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-inner relative group/image">
                                <div className="w-14 h-14 rounded-xl bg-white overflow-hidden border border-slate-200 shrink-0 relative">
                                  <img 
                                    src={screenshot} 
                                    alt="Receipt thumbnail" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{screenshotName || "receipt_screenshot.png"}</p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Ready to Verify</span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => {
                                    setScreenshot(null);
                                    setScreenshotName(null);
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500/40 rounded-2xl py-6 px-4 bg-slate-50/10 hover:bg-slate-50/30 transition-all cursor-pointer group">
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="hidden"
                                />
                                <Upload className="w-6 h-6 text-slate-500 group-hover:text-emerald-600 transition-colors mb-2" />
                                <span className="text-xs text-slate-600 group-hover:text-slate-700 font-bold">Click to upload image receipt</span>
                                <span className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-wider">PNG, JPG up to 15MB (Auto-compressed)</span>
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Fraud Warning Banner */}
                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl text-[10px] font-semibold text-yellow-500/80 leading-relaxed flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>WARNING: Our audit center manual checks every single transaction ID against incoming bank logs. Fake, empty, or duplicate screenshots result in direct account blacklist and balance lock.</span>
                        </div>
                      </motion.div>
                    ) : (
                      /* CHOOSE DEPOSIT AMOUNT STEP (Demo/Real initial Step 1) */
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }} 
                        className="space-y-5"
                      >
                        <section>
                          <div className="flex justify-between items-center mb-2.5">
                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Amount to Deposit</h3>
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <Wallet className="w-3 h-3"/> Bal: ₹{balance.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="relative mb-3">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-500">₹</span>
                            <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-10 pr-4 text-2xl font-black font-mono text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {[1000, 5000, 10000, 50000].map((amt) => (
                              <button 
                                key={amt} 
                                onClick={() => {
                                  if (isOneClickEnabled && currentUser?.accountType !== 'real') {
                                    handleTransaction(amt);
                                  } else {
                                    setAmount(amt);
                                  }
                                }}
                                className={cn(
                                  "font-bold py-2 rounded-xl transition-all font-mono text-xs cursor-pointer",
                                  isOneClickEnabled && currentUser?.accountType !== 'real' 
                                    ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/50' 
                                    : 'bg-slate-100 hover:bg-slate-100 text-slate-700'
                                )}
                              >
                                +₹{(amt/1000)}k {isOneClickEnabled && currentUser?.accountType !== 'real' && <Zap className="w-3.5 h-3.5 inline-block ml-1" />}
                              </button>
                            ))}
                          </div>
                          
                          {/* 1-Click Toggle (Practice Mode Only) */}
                          {currentUser?.accountType !== 'real' && (
                            <div className="mt-3 flex items-center justify-between bg-slate-50/50 border border-slate-200 p-2.5 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Zap className={`w-3.5 h-3.5 ${isOneClickEnabled ? 'text-amber-500' : 'text-slate-500'}`} />
                                <span className="text-xs font-bold text-slate-700">1-Click Fast Deposit</span>
                              </div>
                              <button 
                                onClick={() => setIsOneClickEnabled(!isOneClickEnabled)}
                                className={`w-9 h-4.5 rounded-full relative transition-colors ${isOneClickEnabled ? 'bg-amber-500' : 'bg-slate-100'}`}
                              >
                                <div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-1 transition-transform ${isOneClickEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                              </button>
                            </div>
                          )}
                        </section>

                        <section>
                          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Payment Method</h3>
                          <div className="grid grid-cols-3 gap-3">
                            <button 
                              onClick={() => setSelectedMethod("upi")} 
                              className={cn(
                                "p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group cursor-pointer",
                                selectedMethod === "upi" 
                                  ? "bg-emerald-500/10 border-emerald-500/50 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.03]" 
                                  : "bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-700 hover:text-slate-700 hover:scale-[1.01]"
                              )}
                            >
                              <Smartphone className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", selectedMethod === "upi" ? "text-emerald-600" : "text-slate-500")} />
                              <span className="text-xs font-black uppercase tracking-wider">UPI</span>
                              {selectedMethod === "upi" && (
                                <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] border border-slate-300" />
                              )}
                            </button>
                            
                            <button 
                              onClick={() => setSelectedMethod("card")} 
                              className={cn(
                                "p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group cursor-pointer",
                                selectedMethod === "card" 
                                  ? "bg-red-500/10 border-red-500/50 text-slate-900 shadow-[0_0_20px_rgba(220,38,38,0.15)] scale-[1.03]" 
                                  : "bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-700 hover:text-slate-700 hover:scale-[1.01]"
                              )}
                            >
                              <Landmark className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", selectedMethod === "card" ? "text-red-600" : "text-slate-500")} />
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-center leading-tight">IMPS<br className="sm:hidden"/>/RTGS</span>
                              {selectedMethod === "card" && (
                                <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.8)] border border-slate-300" />
                              )}
                            </button>

                            <button 
                              onClick={() => setSelectedMethod("crypto")} 
                              className={cn(
                                "p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group cursor-pointer",
                                selectedMethod === "crypto" 
                                  ? "bg-amber-500/10 border-amber-500/50 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.03]" 
                                  : "bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-700 hover:text-slate-700 hover:scale-[1.01]"
                              )}
                            >
                              <Bitcoin className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", selectedMethod === "crypto" ? "text-amber-600" : "text-slate-500")} />
                              <span className="text-xs font-black uppercase tracking-wider">Crypto</span>
                              {selectedMethod === "crypto" && (
                                <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] border border-slate-300" />
                              )}
                            </button>
                          </div>
                        </section>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Withdraw View Content */}
                {activeTab === "withdraw" && !isSuccess && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <section>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center mb-4">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Available Balance</p>
                        <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">₹{balance.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2.5">
                        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Amount to Withdraw</h3>
                        <button onClick={() => setAmount(balance)} className="text-[10px] font-black text-[#22c55e] bg-slate-50/10 px-2 py-0.5 rounded hover:bg-slate-50/20 transition-colors uppercase">Max</button>
                      </div>
                      <div className="relative mb-3">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-500">₹</span>
                        <input 
                          type="number" 
                          value={amount}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-10 pr-4 text-2xl font-black font-mono outline-none transition-all ${amount > balance ? 'border-red-500 text-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'}`} 
                        />
                      </div>
                      {amount > balance && (
                        <p className="text-red-500 text-xs font-bold text-center mt-2 flex items-center justify-center gap-1"><X className="w-3 h-3"/> Exceeds available balance</p>
                      )}

                      {currentUser?.accountType === 'real' && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Receiving UPI ID</label>
                          <input 
                            type="text"
                            value={senderUpi}
                            onChange={e => setSenderUpi(e.target.value)}
                            placeholder="yourname@bank"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      )}
                    </section>
                  </motion.div>
                )}

                {/* Success State Screen */}
                {isSuccess && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-50/20 flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 bg-slate-50/20 rounded-full animate-ping" />
                      <CheckCircle2 className="w-10 h-10 text-[#22c55e] relative z-10" />
                    </div>
                    
                    {currentUser?.accountType === 'real' ? (
                      <>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{activeTab === 'deposit' ? 'Deposit Request Received!' : 'Withdrawal Request Submitted!'}</h3>
                        <p className="text-slate-600 font-medium max-w-sm mx-auto leading-relaxed text-xs">
                          {activeTab === 'deposit' 
                            ? 'Your deposit request has been submitted to our audit logs. Admin will verify your UTR and credit your balance within 5-15 minutes.'
                            : 'Your withdrawal request has been received. Our admins will verify and transfer funds to your UPI ID within 24 hours.'}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Transaction Successful!</h3>
                        <p className="text-slate-600 font-medium">Your balance has been updated.</p>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Other Tabs */}
                {activeTab !== "deposit" && activeTab !== "withdraw" && !isSuccess && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <p>Coming Soon</p>
                  </div>
                )}

              </div>

              {/* Actions Footer */}
              {!isSuccess && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/80 shrink-0 backdrop-blur-xl flex gap-2.5">
                  {currentUser?.accountType === 'real' && activeTab === 'deposit' ? (
                    /* Real account deposit stepper buttons */
                    <>
                      {depositStep === 'amount' ? (
                        <button
                          onClick={() => setDepositStep('transfer')}
                          disabled={isProcessing || amount <= 0}
                          className={cn(
                            "flex-1 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider relative overflow-hidden group cursor-pointer",
                            selectedMethod === 'upi' 
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                              : selectedMethod === 'crypto'
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                              : 'bg-red-500 hover:bg-red-400 text-slate-900 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]'
                          )}
                        >
                          <div className="absolute inset-0 bg-white/25 w-full h-full -translate-x-full group-hover:translate-x-full skew-x-12 transition-transform duration-700" />
                          Continue to Payment <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : depositStep === 'transfer' ? (
                        <>
                          <button
                            onClick={() => setDepositStep('amount')}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => setDepositStep('verify')}
                            disabled={isProcessing || amount <= 0}
                            className={cn(
                              "flex-1 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider relative overflow-hidden group cursor-pointer",
                              selectedMethod === 'upi' 
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                                : selectedMethod === 'crypto'
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                                : 'bg-red-500 hover:bg-red-400 text-slate-900 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]'
                            )}
                          >
                            <div className="absolute inset-0 bg-white/25 w-full h-full -translate-x-full group-hover:translate-x-full skew-x-12 transition-transform duration-700" />
                            I Have Sent the Funds <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setDepositStep('transfer')}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => handleRealRequestSubmit('deposit')}
                            disabled={isProcessing || amount <= 0 || !utr || !senderUpi || !screenshot}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-100 text-slate-950 disabled:text-slate-500 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
                          >
                            {isProcessing ? (
                              <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                Submit Deposit Verification <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    /* Default flow buttons (Demo deposit or Withdrawals) */
                    <button 
                      onClick={() => {
                        if (currentUser?.accountType === 'real' && activeTab === 'withdraw') {
                          handleRealRequestSubmit('withdraw');
                        } else {
                          handleTransaction();
                        }
                      }}
                      disabled={isProcessing || amount <= 0 || (activeTab === "withdraw" && amount > balance) || (currentUser?.accountType === 'real' && activeTab === 'withdraw' && !senderUpi)}
                      className={`flex-1 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden uppercase tracking-wider ${activeTab === 'withdraw' ? 'bg-red-600 hover:bg-red-500 text-slate-900 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]' : 'bg-slate-50 hover:bg-green-500 text-slate-950'}`}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full group-hover:translate-x-full skew-x-12 transition-transform duration-700" />
                      {isProcessing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className={`w-4 h-4 border-2 border-t-transparent rounded-full ${activeTab === 'withdraw' ? 'border-white' : 'border-slate-300'}`}
                        />
                      ) : (
                        <>
                          {activeTab === 'withdraw' ? 'Confirm Withdrawal' : 'Continue to Payment'} <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
