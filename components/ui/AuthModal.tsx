"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AuthModal({ isOpen, onClose, initialView = 'login' }: { isOpen: boolean; onClose: () => void; initialView?: 'login' | 'signup' | 'forgot' | 'reset' | 'forceReset' }) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'forceReset'>(initialView);
  const modalRef = useRef<HTMLDivElement>(null);

  // ── TRAP FOCUS (keyboard only — NOT called on mobile to prevent jump) ──────
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab" && modalRef.current) {
        const focusableEls = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], input:not([disabled]), button:not([disabled]), [tabindex="0"]'
        );
        if (focusableEls.length === 0) return;
        const first = focusableEls[0];
        const last  = focusableEls[focusableEls.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { last.focus(); e.preventDefault(); } }
        else            { if (document.activeElement === last)  { first.focus(); e.preventDefault(); } }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── DO NOT auto-focus inputs — this causes keyboard jump on iOS ───────────
  // Instead, the modal itself gets focus for screen-reader accessibility only.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (modalRef.current) modalRef.current.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const signUp               = useTradingStore(state => state.signUp);
  const loginWithCredentials = useTradingStore(state => state.loginWithCredentials);
  const loginWithGoogle      = useTradingStore(state => state.loginWithGoogle);

  const [username,          setUsername]          = useState("");
  const [email,             setEmail]             = useState("");
  const [password,          setPassword]          = useState("");
  const [showPassword,      setShowPassword]      = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [otpCode,           setOtpCode]           = useState("");
  const [accountType,       setAccountType]       = useState<'demo' | 'real'>('demo');
  const [referralCode,      setReferralCode]      = useState("");
  const [isLoading,         setIsLoading]         = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [successMessage,    setSuccessMessage]    = useState<string | null>(null);
  const [resetCode,         setResetCode]         = useState("");
  const [newPassword,       setNewPassword]       = useState("");
  const [showNewPassword,   setShowNewPassword]   = useState(false);
  const [demoResetCode,     setDemoResetCode]     = useState<string | null>(null);
  const [referralStatus,    setReferralStatus]    = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [referrerName,      setReferrerName]      = useState<string | null>(null);
  const [mounted,           setMounted]           = useState(false);

  // ── Mount + reset state on open, ONCE. No view in deps (prevents jump loop) ─
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Reset transient state whenever modal opens or view changes ────────────
  useEffect(() => {
    if (!isOpen) return;
    setTwoFactorRequired(false);
    setOtpCode("");
    setError(null);
    setSuccessMessage(null);
    setDemoResetCode(null);
  }, [isOpen, view]);

  // ── Sync initialView prop ──────────────────────────────────────────────
  useEffect(() => {
    setView(initialView || 'login');
  }, [initialView]);

  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const verifyReferralCode = async () => {
    if (!referralCode.trim()) return;
    setReferralStatus('loading');
    try {
      const res = await fetch(`/api/auth/verify-referral?code=${referralCode.trim()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReferralStatus('valid');
        setReferrerName(data.referrer);
      } else {
        setReferralStatus('invalid');
        setReferrerName(null);
      }
    } catch (err) {
      setReferralStatus('invalid');
      setReferrerName(null);
    }
  };

  const refreshCaptcha = async () => {
    try {
      const res = await fetch("/api/auth/captcha", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setCaptchaCode(data.code);
      }
    } catch (e) {
      console.error("Failed to load captcha", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCaptcha();
      setCaptchaInput("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (view === 'login') {
        const res = await loginWithCredentials(email, password, twoFactorRequired ? otpCode : undefined, captchaInput, referralCode.trim());
        setIsLoading(false);
        if (res.success) {
          setTwoFactorRequired(false);
          setOtpCode("");
          onClose();
        } else if (res.twoFactorRequired) {
          setTwoFactorRequired(true);
          setError(null);
        } else if (res.requirePasswordChange) {
          setView('forceReset');
          setError(null);
        } else {
          setError(res.error || "Login failed. Check your email and password.");
          refreshCaptcha();
          setCaptchaInput("");
        }
      } else if (view === 'signup') {
        const signupRes = await useTradingStore.getState().signUp(username, email, password, accountType, referralCode.trim());
        setIsLoading(false);
        if (signupRes.success) {
          onClose();
        } else {
          setError(signupRes.error || "Failed to create account.");
        }
      } else if (view === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        setIsLoading(false);
        if (res.ok && data.success) {
          setSuccessMessage(data.message || "Reset code generated.");
          if (data.debugCode) {
            setDemoResetCode(data.debugCode);
          } else {
            // Automatically switch to the enter code view after 1.8 seconds
            setTimeout(() => {
              setView('reset');
              setSuccessMessage(null);
            }, 1800);
          }
        } else {
          setError(data.error || "Failed to process request.");
        }
      } else if (view === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: resetCode, newPassword })
        });
        const data = await res.json();
        setIsLoading(false);
        if (res.ok && data.success) {
          setSuccessMessage("Password reset! Redirecting to login...");
          setDemoResetCode(null);
          setResetCode("");
          setNewPassword("");
          setTimeout(() => { setView('login'); setSuccessMessage(null); setError(null); }, 2000);
        } else {
          setError(data.error || "Failed to reset password.");
        }
      } else if (view === 'forceReset') {
        const res = await fetch('/api/auth/force-change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, currentPassword: password, newPassword })
        });
        const data = await res.json();
        setIsLoading(false);
        if (res.ok && data.success) {
          setSuccessMessage("Password updated! Logging in...");
          setTimeout(() => {
            // Re-login using the new password automatically
            setPassword(newPassword);
            setView('login');
            setSuccessMessage(null);
            setError(null);
            handleSubmit(new Event('submit') as any);
          }, 1500);
        } else {
          setError(data.error || "Failed to update password.");
        }
      }
    } catch {
      setIsLoading(false);
      setError("Network error. Please check your connection and try again.");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />

          {/* Modal — anchors to bottom on mobile, centered on desktop */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            tabIndex={-1}
            className="fixed bottom-0 left-0 right-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-md z-[9999] outline-none"
          >
            <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh]">
              {/* Drag handle (mobile only) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
                <h2 id="auth-modal-title" className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  {view === 'login'  && (twoFactorRequired ? 'Two-Factor Auth' : 'Welcome Back')}
                  {view === 'signup' && 'Create Account'}
                  {view === 'forgot' && 'Reset Password'}
                  {view === 'reset'  && 'New Password'}
                  {view === 'forceReset' && 'Change Password Required'}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="p-6 overflow-y-auto flex-1">

                {/* Error banner */}
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                    {error}
                  </motion.div>
                )}

                {/* Success banner */}
                {successMessage && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    {successMessage}
                  </motion.div>
                )}

                 {/* Demo code box */}
                 {demoResetCode && (
                   <motion.div
                     key="demo-code"
                     initial={{ opacity: 0, y: -8 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm flex flex-col gap-2"
                   >
                     <div className="flex items-center gap-2 font-bold text-slate-800">
                       <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                       Demo Environment — Your Reset Code
                     </div>
                     <div className="bg-white border border-yellow-300 rounded-lg py-2.5 text-center font-mono text-lg font-black text-yellow-600 tracking-[0.4em]">
                       {demoResetCode}
                     </div>
                     {view === 'forgot' && (
                       <button
                         type="button"
                         onClick={() => { setView('reset'); setError(null); setSuccessMessage(null); }}
                         className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2 rounded-lg text-xs uppercase transition-all"
                       >
                         Enter Code →
                       </button>
                     )}
                   </motion.div>
                 )}

                {/* ── FORM ─────────────────────────────────────────────── */}
                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                  {/* 2FA screen */}
                  {twoFactorRequired ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                        2FA Verification Code
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all tracking-[0.5em] text-center font-black text-lg"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 ml-1">
                        Enter the 6-digit code from your authenticator app.
                      </p>
                    </div>

                  ) : view === 'forgot' ? (
                    <div>
                      <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="forgot-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                        />
                      </div>
                    </div>

                  ) : view === 'reset' ? (
                    <>
                      <div>
                        <label htmlFor="reset-code" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                          Verification Code
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <input
                            id="reset-code"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                            maxLength={6}
                            value={resetCode}
                            onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all tracking-widest text-center font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="new-password" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowNewPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : view === 'forceReset' ? (
                    <>
                      <div>
                        <div className="mb-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <strong>Admin action required:</strong> Your account was created manually by an administrator. Please set a new password to continue.
                        </div>
                        <label htmlFor="force-new-password" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                          Create New Password
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="force-new-password"
                            type={showNewPassword ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter a secure password"
                            className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowNewPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Login / Signup fields */
                    <>
                      {view === 'signup' && (
                        <div>
                          <label htmlFor="username" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                            Username
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                              <User className="w-4 h-4" />
                            </div>
                            <input
                              id="username"
                              type="text"
                              autoComplete="username"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              required
                              value={username}
                              onChange={e => setUsername(e.target.value)}
                              placeholder="johndoe123"
                              className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* Username field (Strictly Username) */}
                      <div>
                        <label htmlFor="auth-login-username" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                          Username
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            id="auth-login-username"
                            name="auth-login-username"
                            type="text"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Username"
                            className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Password field */}
                      <div>
                        <label htmlFor="auth-password" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 flex justify-between items-center">
                          <span>Password</span>
                          {view === 'login' && (
                            <button
                              type="button"
                              onClick={() => { setView('forgot'); setError(null); setSuccessMessage(null); setDemoResetCode(null); }}
                              className="text-yellow-500 hover:underline text-xs font-bold"
                            >
                              Forgot?
                            </button>
                          )}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="auth-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={view === 'login' ? "current-password" : "new-password"}
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Captcha validation code box */}
                      {view === 'login' && (
                        <div>
                          <label htmlFor="auth-captcha" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                            Validation Code
                          </label>
                          <div className="flex gap-3">
                            <input
                              id="auth-captcha"
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              required
                              maxLength={4}
                              value={captchaInput}
                              onChange={e => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="Validation Code"
                              className="flex-1 bg-white border border-slate-300 rounded-xl py-3.5 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all font-mono font-bold text-sm"
                            />
                            <div 
                              onClick={refreshCaptcha}
                              title="Click to refresh validation code"
                              className="w-32 bg-slate-900 border border-slate-700 text-white rounded-xl flex items-center justify-center font-mono font-black text-xl tracking-[0.2em] cursor-pointer select-none relative overflow-hidden group py-3 px-4 shadow-sm hover:shadow active:scale-95 transition-all shrink-0"
                            >
                              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(45deg,#fff_25%,transparent_25%,transparent_50%,#fff_50%,#fff_75%,transparent_75%,transparent)] bg-[length:12px_12px]" />
                              <span className="relative z-10 text-yellow-500 font-sans tracking-widest rotate-[-3deg] group-hover:rotate-[3deg] transition-transform select-none">
                                {captchaCode || "••••"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Referral code (signup & login) */}
                      {(view === 'signup' || view === 'login') && (
                        <div>
                          <label htmlFor="referral" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 flex justify-between">
                            <span>Referral Code <span className="text-slate-400 font-normal">(optional)</span></span>
                          </label>
                          <div className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <input
                                id="referral"
                                type="text"
                                autoCapitalize="characters"
                                autoCorrect="off"
                                value={referralCode}
                                onChange={e => {
                                  setReferralCode(e.target.value);
                                  setReferralStatus('idle');
                                  setReferrerName(null);
                                }}
                                placeholder="e.g. VIP2024"
                                className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all uppercase"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={verifyReferralCode}
                              disabled={!referralCode.trim() || referralStatus === 'loading'}
                              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {referralStatus === 'loading' ? 'Checking...' : 'Verify'}
                            </button>
                          </div>
                          {referralStatus === 'valid' && (
                            <p className="text-emerald-600 text-xs font-semibold mt-2 ml-1">
                              ✓ Valid code! Referred by {referrerName}
                            </p>
                          )}
                          {referralStatus === 'invalid' && (
                            <p className="text-red-500 text-xs font-semibold mt-2 ml-1">
                              ✗ Invalid referral code
                            </p>
                          )}
                        </div>
                      )}

                      {/* Account type (signup) */}
                      {view === 'signup' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">Account Mode</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setAccountType('demo')}
                              className={cn(
                                "py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                                accountType === 'demo'
                                  ? "bg-purple-50 border-purple-400 text-purple-700 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                              )}
                            >
                              <span className="text-xs font-black">DEMO WALLET</span>
                              <span className="text-[9px] opacity-75">₹100,000 Practice Credits</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccountType('real')}
                              className={cn(
                                "py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                                accountType === 'real'
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                              )}
                            >
                              <span className="text-xs font-black">REAL WALLET</span>
                              <span className="text-[9px] opacity-75">₹0 Starting Balance</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-slate-950 font-black py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 text-base"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      view === 'login'  ? (twoFactorRequired ? 'Verify & Sign In' : 'Sign In') :
                      view === 'signup' ? 'Create Account' :
                      view === 'forgot' ? 'Send Reset Code' : 
                      view === 'forceReset' ? 'Update Password & Sign In' : 'Reset Password'
                    )}
                  </button>
                </form>



                {/* View switch links */}
                <p className="mt-6 text-center text-sm text-slate-500 pb-2">
                  {twoFactorRequired ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorRequired(false);
                        setOtpCode("");
                        setError(null);
                      }}
                      className="text-yellow-500 font-bold hover:underline"
                    >
                      ← Back to Login Credentials
                    </button>
                  ) : null}
                  {!twoFactorRequired && (view === 'forgot' || view === 'reset') && (
                    <span className="flex flex-col items-center gap-2">
                      {view === 'forgot' && (
                        <button
                          type="button"
                          onClick={() => { setView('reset'); setError(null); setSuccessMessage(null); }}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline transition-colors mb-1"
                        >
                          Already have a reset code? Enter code
                        </button>
                      )}
                      <button onClick={() => { setView('login'); setError(null); setSuccessMessage(null); setDemoResetCode(null); }} className="text-yellow-500 font-bold hover:underline">
                        ← Back to Sign In
                      </button>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
