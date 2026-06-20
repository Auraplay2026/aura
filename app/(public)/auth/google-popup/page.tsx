"use client";

import { useState, useEffect } from "react";
import { Sparkles, User, Mail, ShieldCheck } from "lucide-react";

export default function GooglePopup() {
  const [step, setStep] = useState<'chooser' | 'custom' | 'loading'>('chooser');
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<{ name: string; email: string } | null>(null);

  const MOCK_ACCOUNTS = [
    { name: "Demo Player", email: "demo@aurabet.io" },
    { name: "Alex Carter", email: "alex.carter@gmail.com" },
    { name: "Jane Doe", email: "jane.doe@gmail.com" },
  ];

  const handleSelect = (account: { name: string; email: string }) => {
    setSelectedAccount(account);
    setStep('loading');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setSelectedAccount({ name, email });
    setStep('loading');
  };

  useEffect(() => {
    if (step === 'loading' && selectedAccount) {
      const timer = setTimeout(() => {
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_SUCCESS',
              email: selectedAccount.email,
              name: selectedAccount.name,
            },
            window.location.origin
          );
          window.close();
        } else {
          alert("Parent window not found. Please log in directly.");
          setStep('chooser');
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [step, selectedAccount]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Google Logo Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <svg className="w-12 h-12 mb-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sign in with Google</h1>
          <p className="text-sm text-slate-600 mt-1">to continue to <span className="text-yellow-500 font-extrabold">AuraPlay</span></p>
        </div>

        {/* Dynamic Steps */}
        {step === 'chooser' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Choose an account</p>
            
            <div className="space-y-2.5">
              {MOCK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleSelect(acc)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-50/60 border border-slate-200 hover:border-slate-700 rounded-2xl text-left transition-all group"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-yellow-500 transition-colors">{acc.name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{acc.email}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                    {acc.name.split(" ").map(n => n[0]).join("")}
                  </div>
                </button>
              ))}

              <button
                onClick={() => setStep('custom')}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-dashed border-slate-200 hover:border-slate-600 rounded-2xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-900 transition-colors">
                  +
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Use another account</span>
              </button>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Google protects your data securely</span>
            </div>
          </div>
        )}

        {step === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add Google Account</p>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><User className="w-4 h-4" /></span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="E.g., John Smith"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Google Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Mail className="w-4 h-4" /></span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep('chooser')}
                className="flex-1 bg-slate-50 hover:bg-slate-50/60 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-slate-900 font-bold py-3 rounded-xl transition-colors"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-900">Connecting Google Account...</p>
            <p className="text-xs text-slate-600 mt-1">{selectedAccount?.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}
