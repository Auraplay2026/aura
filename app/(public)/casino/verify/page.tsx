"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, AlertTriangle, Key, Cpu, HelpCircle } from "lucide-react";

export default function VerifyPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState(0);
  const [gameType, setGameType] = useState("SLOTS");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverSeed || !clientSeed) {
      setError("Please fill out both seeds.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/casino/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverSeed, clientSeed, nonce: Number(nonce), gameType })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Failed to verify outcome.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-start py-20 px-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto z-10 flex flex-col gap-8">
        
        {/* Header section */}
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">Verifiably Fair Gaming</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Provably Fair Ledger Validator
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
            Verify the mathematical fairness of any game outcome. Enter the seeds and nonce of your session to audit the SHA-256 generation ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form section */}
          <div className="lg:col-span-6 bg-[#0d121f]/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 border-b border-slate-800/60 pb-4">
              <Key className="w-5 h-5 text-indigo-400" /> Session Seed Parameters
            </h2>

            <form onSubmit={handleVerify} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Server Seed (Hex)</label>
                <input
                  type="text"
                  placeholder="Paste hexadecimal server seed"
                  value={serverSeed}
                  onChange={(e) => setServerSeed(e.target.value)}
                  className="w-full bg-[#12192c] border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 placeholder-slate-600 font-mono"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Seed</label>
                <input
                  type="text"
                  placeholder="Enter custom client seed"
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  className="w-full bg-[#12192c] border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 placeholder-slate-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Round Nonce</label>
                  <input
                    type="number"
                    min="0"
                    value={nonce}
                    onChange={(e) => setNonce(Number(e.target.value))}
                    className="w-full bg-[#12192c] border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Game Category</label>
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="w-full bg-[#12192c] border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 cursor-pointer"
                  >
                    <option value="SLOTS">Slots (Classic/Cascade)</option>
                    <option value="CRASH">Crash (Neon Horizon/Aviator)</option>
                    <option value="TABLE">Tables (Wheel/Blackjack)</option>
                    <option value="ORIGINAL">Originals (Coinflip/Mines)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-slate-900 font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Cpu className="w-5 h-5" /> Calculate Cryptographic Proof
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Results display */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-[#0d121f]/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Verification Result
                    </h2>
                    <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      VERIFIED FAIR
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col bg-[#12192c]/50 border border-slate-800/50 rounded-2xl p-4 gap-1.5">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Calculated Roll Hash</span>
                      <span className="text-xs md:text-sm font-mono break-all text-indigo-300 font-semibold select-all">
                        {result.hash}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col bg-[#12192c]/30 border border-slate-800/50 rounded-2xl p-4 gap-1">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hex Bytes Sample</span>
                        <span className="text-sm md:text-base font-bold font-mono text-slate-900">
                          0x{result.hexSlice}
                        </span>
                      </div>
                      <div className="flex flex-col bg-[#12192c]/30 border border-slate-800/50 rounded-2xl p-4 gap-1">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fair Float Value</span>
                        <span className="text-sm md:text-base font-bold font-mono text-emerald-400">
                          {result.roll.toFixed(8)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/20 border border-slate-800/40 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Outcome Multiplier</span>
                      <span className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400">
                        {result.multiplier}x
                      </span>
                      <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1">
                        {result.details}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full border border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[350px]">
                  <HelpCircle className="w-12 h-12 text-slate-700" />
                  <h3 className="text-slate-400 font-bold text-base mt-2">Awaiting Parameters</h3>
                  <p className="text-slate-600 text-xs max-w-xs leading-relaxed">
                    Input your active server seed, client seed, and nonces from the betting menu to run the cryptographic proof algorithm.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
