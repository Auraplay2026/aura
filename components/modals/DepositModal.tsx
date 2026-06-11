"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, QrCode, CreditCard, Bitcoin } from "lucide-react";
import { useState } from "react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CRYPTOS = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", color: "bg-[#F7931A]/20 text-[#F7931A]" },
  { id: "eth", name: "Ethereum", symbol: "ETH", color: "bg-[#627EEA]/20 text-[#627EEA]" },
  { id: "usdt", name: "Tether", symbol: "USDT", color: "bg-slate-50/20 text-[#26A17B]" },
];

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [activeTab, setActiveTab] = useState<"crypto" | "fiat">("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTOS[0]);
  const [copied, setCopied] = useState(false);

  const walletAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-neon-green rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                Deposit Funds
              </h2>
              <button 
                onClick={onClose}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Tabs */}
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab("crypto")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "crypto" ? "bg-slate-100 text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Bitcoin className="w-4 h-4" /> Crypto
                </button>
                <button 
                  onClick={() => setActiveTab("fiat")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "fiat" ? "bg-slate-100 text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <CreditCard className="w-4 h-4" /> Buy Crypto
                </button>
              </div>

              {activeTab === "crypto" ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Crypto Selector */}
                  <div className="grid grid-cols-3 gap-3">
                    {CRYPTOS.map((c) => (
                      <button 
                        key={c.id}
                        onClick={() => setSelectedCrypto(c)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          selectedCrypto.id === c.id 
                          ? "bg-slate-50 border-neon-green shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                          : "border-slate-200 hover:border-slate-700 bg-white"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.color}`}>
                          <span className="font-bold text-xs">{c.symbol.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{c.symbol}</span>
                      </button>
                    ))}
                  </div>

                  {/* Network Warning */}
                  <div className="p-3 rounded-xl bg-neon-yellow/10 border border-neon-yellow/20 text-neon-yellow text-xs font-medium text-center">
                    Send only {selectedCrypto.name} ({selectedCrypto.symbol}) to this address. Sending any other coins may result in permanent loss.
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="flex justify-center">
                    <div className="w-40 h-40 bg-white p-2 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                      <QrCode className="w-32 h-32 text-black" />
                    </div>
                  </div>

                  {/* Address Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Your Deposit Address</label>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <input 
                        type="text" 
                        readOnly 
                        value={walletAddress}
                        className="flex-1 bg-transparent border-none text-sm text-slate-700 font-mono focus:ring-0 px-2 truncate"
                      />
                      <button 
                        onClick={handleCopy}
                        className={`p-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${copied ? "bg-neon-green text-slate-950" : "bg-slate-100 text-slate-900 hover:bg-slate-700"}`}
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-neon-purple/20 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="w-8 h-8 text-neon-purple" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Buy Crypto with Fiat</h3>
                  <p className="text-sm text-slate-600 max-w-[250px] mx-auto mb-6">
                    Use your Credit Card, Apple Pay, or Google Pay to purchase crypto instantly via MoonPay.
                  </p>
                  <button className="w-full bg-neon-purple hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
                    Purchase via MoonPay
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
