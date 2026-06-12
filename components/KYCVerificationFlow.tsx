"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ScanFace, 
  IdCard, 
  FileText, 
  CheckCircle2, 
  Camera,
  X,
  UploadCloud,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KYCProps {
  onComplete: () => void;
  onCancel: () => void;
}

type KYCStep = "SELECTION" | "DOCUMENT_SCAN" | "SELFIE_CHECK" | "PROCESSING" | "SUCCESS";

export function KYCVerificationFlow({ onComplete, onCancel }: KYCProps) {
  const [step, setStep] = useState<KYCStep>("SELECTION");
  const [docType, setDocType] = useState<"PASSPORT" | "ID" | "LICENSE" | null>(null);
  
  // Simulation states
  const [scanProgress, setScanProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("Analyzing Security Features...");

  // Handle Scanning Simulation
  useEffect(() => {
    if (step === "DOCUMENT_SCAN" || step === "SELFIE_CHECK") {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              if (step === "DOCUMENT_SCAN") setStep("SELFIE_CHECK");
              if (step === "SELFIE_CHECK") setStep("PROCESSING");
            }, 600);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Handle Processing Simulation
  useEffect(() => {
    if (step === "PROCESSING") {
      const steps = [
        "Verifying Document Holograms...",
        "Cross-Referencing Global Watchlists...",
        "Extracting MRZ Data...",
        "Validating Biometric Match...",
        "Finalizing Tier 2 Status..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i >= steps.length) {
          clearInterval(interval);
          setStep("SUCCESS");
        } else {
          setProcessingStatus(steps[i]);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Identity Verification</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tier 2 Access Upgrade</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="pt-24 pb-8 px-6 sm:px-10 min-h-[500px] flex flex-col relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SELECTION */}
            {step === "SELECTION" && (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black text-white mb-2">Select Document Type</h3>
                  <p className="text-slate-400 text-sm">Please choose a valid government-issued document.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: "PASSPORT", icon: FileText, label: "Passport", desc: "Fastest Verification" },
                    { id: "ID", icon: IdCard, label: "National ID Card", desc: "Front & Back Required" },
                    { id: "LICENSE", icon: IdCard, label: "Driver's License", desc: "Front & Back Required" }
                  ].map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setDocType(doc.id as any);
                        setStep("DOCUMENT_SCAN");
                      }}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-cyan-500/50 transition-all group relative overflow-hidden text-left"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center relative z-10 border border-slate-700 group-hover:border-cyan-500/50 shrink-0">
                        <doc.icon className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <div className="flex flex-col items-start relative z-10">
                        <span className="text-white font-bold">{doc.label}</span>
                        <span className="text-slate-500 text-xs">{doc.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-auto pt-8 flex items-start gap-3 bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your data is securely encrypted. We never store your raw documents. Biometric data is purged immediately after verification completes.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DOCUMENT SCAN */}
            {step === "DOCUMENT_SCAN" && (
              <motion.div 
                key="doc_scan"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-white mb-2">Scanning {docType}</h3>
                  <p className="text-slate-400 text-sm">Please hold your document steady within the frame.</p>
                </div>

                <div className="relative w-full max-w-sm aspect-[1.6] rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                    <IdCard className="w-16 h-16 mb-2 opacity-50" />
                    <span className="text-xs font-bold uppercase tracking-widest">Document Viewfinder</span>
                  </div>

                  {/* Laser Scan Animation */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-10"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  />
                  
                  {/* Grid overlay */}
                  <div className="absolute inset-0 opacity-10 mix-blend-overlay" />
                  
                  {/* Corner guides */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                </div>

                <div className="w-full max-w-sm mt-8">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    <span>Scanning Quality</span>
                    <span className="text-cyan-400">{scanProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-cyan-400"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SELFIE CHECK */}
            {step === "SELFIE_CHECK" && (
              <motion.div 
                key="selfie_check"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-white mb-2">Biometric Liveness</h3>
                  <p className="text-slate-400 text-sm">
                    {scanProgress < 30 ? "Position your face in the oval..." :
                     scanProgress < 60 ? "Look slightly to the left..." :
                     "Look slightly to the right..."}
                  </p>
                </div>

                <div className="relative w-48 h-64 rounded-[100px] overflow-hidden border-4 border-purple-500/50 bg-slate-800 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-600 mb-4" />
                  
                  {/* Face mapping mesh overlay */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#a855f7_100%)] opacity-20 mix-blend-screen"
                  />
                  
                  {/* Reticle */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, ease: "linear", repeat: Infinity }}
                    className="absolute inset-2 border-2 border-dashed border-purple-400/30 rounded-[100px]"
                  />
                </div>

                <div className="w-full max-w-sm mt-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border border-purple-500/20">
                    <ScanFace className="w-4 h-4" />
                    Analyzing Facial Geometry
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PROCESSING */}
            {step === "PROCESSING" && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                  />
                  <ShieldCheck className="w-12 h-12 text-cyan-500" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-2">Finalizing Verification</h3>
                <p className="text-cyan-400 font-mono text-xs uppercase tracking-widest bg-cyan-500/10 px-4 py-2 rounded-full border border-cyan-500/20 text-center max-w-[280px]">
                  {processingStatus}
                </p>
              </motion.div>
            )}

            {/* STEP 5: SUCCESS */}
            {step === "SUCCESS" && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/50"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </motion.div>
                
                <h3 className="text-3xl font-black text-white mb-2">Verified!</h3>
                <p className="text-slate-400 text-center max-w-sm mb-8">
                  Your identity has been successfully verified. Your account has been upgraded to <strong className="text-emerald-400">Tier 2</strong>.
                </p>

                <button 
                  onClick={onComplete}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Continue to Platform
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
