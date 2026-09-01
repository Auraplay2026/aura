"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle2, AlertCircle, ShieldAlert, KeyRound } from "lucide-react";
import { useTradingStore } from "@/lib/store";

export function ForcePasswordChangeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentUser = useTradingStore(state => state.currentUser);
  const syncFromServer = useTradingStore(state => state.syncFromServer);

  useEffect(() => {
    const handleTrigger = (e: any) => {
      const targetEmail = e.detail?.email || currentUser?.email || currentUser?.username || "";
      setEmail(targetEmail);
      setIsOpen(true);
    };

    window.addEventListener("open-force-password-change", handleTrigger);
    return () => window.removeEventListener("open-force-password-change", handleTrigger);
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || currentUser?.email || currentUser?.username,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        await syncFromServer();
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      } else {
        setError(data.error || "Failed to update password.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden"
        >
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Password Updated!</h3>
              <p className="text-xs text-slate-600">Your permanent password has been set. Welcome to AuraPlay!</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 mx-auto border border-amber-300 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-black text-slate-900 text-center mb-1">
                Set Your Permanent Password
              </h2>
              <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                Your account was provisioned by an administrator with a temporary password. Please establish a secure password to unlock full account access.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? "Updating Credentials..." : "Confirm & Access Account"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}