"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AuthModal({ isOpen, onClose, initialView = 'login' }: { isOpen: boolean; onClose: () => void; initialView?: 'login' | 'signup' | 'forgot' | 'reset' }) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialView);
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

  // ── Sync initialView prop ─────────────────────────────────────────────────
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  // ── Read referral code ONCE on mount (not on every view change) ───────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setView('signup');
    }
  }, []); // intentionally empty — runs once

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "61951094794-rj86fgkpigssgt7j1j5psuptgloul2e9.apps.googleusercontent.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (view === 'login') {
        const res = await loginWithCredentials(email, password, twoFactorRequired ? otpCode : undefined);
        setIsLoading(false);
        if (res.success) {
          setTwoFactorRequired(false);
          setOtpCode("");
          onClose();
        } else if (res.twoFactorRequired) {
          setTwoFactorRequired(true);
          setError(null);
        } else {
          setError(res.error || "Login failed. Check your email and password.");
        }
      } else if (view === 'signup') {
        const res = await signUp(username, email, password, accountType, referralCode);
        setIsLoading(false);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Registration failed.");
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
      }
    } catch {
      setIsLoading(false);
      setError("Network error. Please check your connection and try again.");
    }
  };

  const handleSocialLoginFallback = () => {
    setError(null);
    const width  = 500, height = 650;
    const left   = window.screen.width  / 2 - width  / 2;
    const top    = window.screen.height / 2 - height / 2;
    window.open('/auth/google-popup', 'GoogleSignIn', `width=${width},height=${height},left=${left},top=${top},scrollbars=no,resizable=no`);
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = response.credential;
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const payload = JSON.parse(jsonPayload);
      if (payload?.email) {
        const res = await loginWithGoogle(payload.email, payload.name || payload.given_name || payload.email.split('@')[0], token);
        setIsLoading(false);
        if (res.success) { onClose(); } else { setError(res.error || "Google login failed."); }
      } else {
        setIsLoading(false);
        setError("Invalid token from Google.");
      }
    } catch {
      setIsLoading(false);
      setError("Failed to process Google sign-in.");
    }
  };

  // Google Identity Services script loader
  useEffect(() => {
    if (!isOpen) return;
    if (googleClientId && process.env.NEXT_PUBLIC_ALLOW_MOCK_GOOGLE_LOGIN !== 'true') {
      let script = document.getElementById("google-gsi-script") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.id = "google-gsi-script";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
      const initGoogleButton = () => {
        const win = window as any;
        if (win.google) {
          win.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredentialResponse });
          const container = document.getElementById("google-real-btn-container");
          if (container) {
            win.google.accounts.id.renderButton(container, { theme: "filled_blue", size: "large", width: 320, text: "continue_with", shape: "pill" });
          }
        }
      };
      if (script) script.onload = initGoogleButton;
      if ((window as any).google) initGoogleButton();
    }
  }, [isOpen, googleClientId]);

  // Google popup fallback listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { email: googleEmail, name: googleName } = event.data;
        setIsLoading(true);
        (async () => {
          try {
            const res = await loginWithGoogle(googleEmail, googleName);
            setIsLoading(false);
            if (res.success) { onClose(); } else { setError(res.error || "Google login failed."); }
          } catch { setIsLoading(false); setError("Google login failed."); }
        })();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loginWithGoogle, onClose]);

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

                      {/* Email / Username field */}
                      <div>
                        <label htmlFor="auth-email" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                          {view === 'login' ? 'Email or Username' : 'Email Address'}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            id="auth-email"
                            type={view === 'signup' ? 'email' : 'text'}
                            inputMode="email"
                            autoComplete={view === 'signup' ? 'email' : 'username email'}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={view === 'login' ? "Email or username" : "you@example.com"}
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

                      {/* Referral code (signup) */}
                      {view === 'signup' && (
                        <div>
                          <label htmlFor="referral" className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">
                            Referral Code <span className="text-slate-400 font-normal">(optional)</span>
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <input
                              id="referral"
                              type="text"
                              autoCapitalize="characters"
                              autoCorrect="off"
                              value={referralCode}
                              onChange={e => setReferralCode(e.target.value)}
                              placeholder="e.g. VIP2024"
                              className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all uppercase"
                            />
                          </div>
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
                      view === 'forgot' ? 'Send Reset Code' : 'Reset Password'
                    )}
                  </button>
                </form>

                {/* Social login */}
                {(view === 'login' || view === 'signup') && (
                  <>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-3">
                      {googleClientId && process.env.NEXT_PUBLIC_ALLOW_MOCK_GOOGLE_LOGIN !== 'true' ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <div id="google-real-btn-container" className="flex justify-center w-full min-h-[44px]" />
                          <span className="text-[10px] text-green-600 font-bold tracking-wider uppercase">
                            ● Secure Google Authentication
                          </span>
                        </div>
                      ) : (
                        <div className="w-full flex gap-3">
                          <button
                            type="button"
                            onClick={handleSocialLoginFallback}
                            disabled={isLoading}
                            className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm hover:bg-slate-50 active:bg-slate-100"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                          </button>
                          <button
                            type="button"
                            onClick={handleSocialLoginFallback}
                            disabled={isLoading}
                            className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm hover:bg-slate-50 active:bg-slate-100"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                            GitHub
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

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
                  ) : view === 'login' && (
                    <>
                      New here?{" "}
                      <button onClick={() => { setView('signup'); setError(null); setSuccessMessage(null); setDemoResetCode(null); }} className="text-yellow-500 font-bold hover:underline">
                        Create account
                      </button>
                    </>
                  )}
                  {!twoFactorRequired && view === 'signup' && (
                    <>
                      Already have an account?{" "}
                      <button onClick={() => { setView('login'); setError(null); setSuccessMessage(null); setDemoResetCode(null); }} className="text-yellow-500 font-bold hover:underline">
                        Sign in
                      </button>
                    </>
                  )}
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
