"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Sparkles } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AuthModal({ isOpen, onClose, initialView = 'login' }: { isOpen: boolean; onClose: () => void; initialView?: 'login' | 'signup' | 'forgot' | 'reset' }) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialView);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose]);
  const signUp = useTradingStore(state => state.signUp);
  const loginWithCredentials = useTradingStore(state => state.loginWithCredentials);
  const loginWithGoogle = useTradingStore(state => state.loginWithGoogle);
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [accountType, setAccountType] = useState<'demo' | 'real'>('demo');
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [demoResetCode, setDemoResetCode] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setTwoFactorRequired(false);
    setOtpCode("");
    setError(null);
    setSuccessMessage(null);
    setDemoResetCode(null);
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      if (initialView !== 'signup') {
        setView('signup'); // Default to signup if referred
      }
    }
  }, [initialView, view]);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "61951094794-rj86fgkpigssgt7j1j5psuptgloul2e9.apps.googleusercontent.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (view === 'login') {
        console.log('[AuthModal] submitting login', { email, passwordLength: password.length, twoFactorRequired, otpCode });
        const res = await loginWithCredentials(email, password, twoFactorRequired ? otpCode : undefined);
        console.log('[AuthModal] login result', res);
        if (typeof window !== 'undefined') {
          (window as any).__AURA_AUTH_DEBUG__ = { event: 'auth-modal-login-result', payload: res, ts: Date.now() };
        }
        setIsLoading(false);
        if (res.success) {
          setTwoFactorRequired(false);
          setOtpCode("");
          onClose();
        } else if (res.twoFactorRequired) {
          setTwoFactorRequired(true);
          setError(null);
        } else {
          setError(res.error || "Login failed.");
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
          setSuccessMessage(data.message || "Reset code has been generated.");
          if (data.debugCode) {
            setDemoResetCode(data.debugCode);
          }
        } else {
          setError(data.error || "Failed to process forgot password request.");
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
          setSuccessMessage("Password reset successfully! Redirecting to login...");
          setDemoResetCode(null);
          setResetCode("");
          setNewPassword("");
          setTimeout(() => {
            setView('login');
            setSuccessMessage(null);
            setError(null);
          }, 2000);
        } else {
          setError(data.error || "Failed to reset password.");
        }
      }
    } catch (err) {
      setIsLoading(false);
      setError("An unexpected authentication error occurred.");
    }
  };

  const handleSocialLoginFallback = () => {
    setError(null);
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      '/auth/google-popup',
      'GoogleSignIn',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=no,resizable=no`
    );
  };

  // Callback to handle credential token from Google Identity Services
  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = response.credential;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      if (payload && payload.email) {
        const res = await loginWithGoogle(
          payload.email, 
          payload.name || payload.given_name || payload.email.split('@')[0],
          token
        );
        setIsLoading(false);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Google login failed.");
        }
      } else {
        setIsLoading(false);
        setError("Invalid token payload received from Google.");
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Google authentication error:", err);
      setError("Failed to process Google sign-in response.");
    }
  };

  // Load Google Identity Services script and initialize button
  useEffect(() => {
    if (!isOpen) return;

    // Load script if client ID exists
    if (googleClientId) {
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
          win.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
          });

          const container = document.getElementById("google-real-btn-container");
          if (container) {
            win.google.accounts.id.renderButton(container, {
              theme: "filled_blue",
              size: "large",
              width: 320,
              text: "continue_with",
              shape: "pill"
            });
          }
        }
      };

      if (script) {
        script.onload = initGoogleButton;
      }
      if ((window as any).google) {
        initGoogleButton();
      }
    }
  }, [isOpen, googleClientId]);

  // Listen for callback messages from mock sandbox popup fallback
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
            if (res.success) {
              onClose();
            } else {
              setError(res.error || "Google login failed.");
            }
          } catch (err) {
            setIsLoading(false);
            setError("Google login failed.");
          }
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/85 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            tabIndex={-1}
            className="fixed bottom-0 top-auto left-0 translate-y-0 translate-x-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-none sm:max-w-md z-[9999] p-0 sm:p-4 outline-none max-h-[90dvh] sm:max-h-none flex flex-col"
          >
            <div className="bg-white border-t sm:border border-slate-200 rounded-t-[2rem] sm:rounded-2xl shadow-2xl overflow-hidden relative flex flex-col flex-1 min-h-0">
              {/* Glow effects */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-yellow-500/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-center p-6 border-b border-slate-200 shrink-0">
                <h2 id="auth-modal-title" className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  {view === 'login' && 'Welcome Back'}
                  {view === 'signup' && 'Create Account'}
                  {view === 'forgot' && 'Reset Password'}
                  {view === 'reset' && 'Create New Password'}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close authentication modal"
                  className="text-slate-600 hover:text-slate-900 bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {successMessage}
                  </motion.div>
                )}

                {demoResetCode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 text-slate-900 rounded-xl text-xs font-bold flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                      <span>DEMO ENVIRONMENT SIMULATION</span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                      A password reset request was initiated. Copy your simulated 6-digit code below and click the "Next (Enter Code)" button to proceed:
                    </p>
                    <div className="bg-white border border-yellow-500/20 rounded-lg p-2.5 flex items-center justify-between mt-1 select-all font-mono text-center text-sm font-black text-yellow-600 tracking-wider">
                      {demoResetCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setView('reset');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="mt-1 w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2 rounded-lg text-[10px] uppercase transition-all flex justify-center items-center gap-1 shadow-sm"
                    >
                      Next (Enter Code) →
                    </button>
                  </motion.div>
                )}

                {view === 'login' && !error && !successMessage && (
                  <div className="mb-4"></div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {twoFactorRequired ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">2FA Verification Code</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input 
                          type="text" 
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors tracking-[0.5em] text-center font-black"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 ml-1 leading-normal font-semibold">
                        Enter the 6-digit verification code from your authenticator app to complete signing in.
                      </p>
                    </div>
                  ) : view === 'forgot' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input 
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 ml-1 leading-normal font-semibold">
                        Enter your account email address and we will generate a recovery verification code.
                      </p>
                    </div>
                  ) : view === 'reset' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Verification Code</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            required
                            maxLength={6}
                            value={resetCode}
                            onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors tracking-widest text-center font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">New Password</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input 
                            type="password" 
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {view === 'signup' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Username</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                              <User className="w-4 h-4" />
                            </div>
                            <input 
                              type="text" 
                              required
                              value={username}
                              onChange={e => setUsername(e.target.value)}
                              placeholder="johndoe123"
                              className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Email Address</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input 
                            type="text"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={view === 'login' ? "Username or email" : "john@example.com"}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 flex justify-between">
                          Password
                          {view === 'login' && (
                            <span 
                              onClick={() => {
                                setView('forgot');
                                setError(null);
                                setSuccessMessage(null);
                                setDemoResetCode(null);
                              }}
                              className="text-yellow-500 hover:underline cursor-pointer"
                            >
                              Forgot?
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors"
                          />
                        </div>
                      </div>

                      {view === 'signup' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Referral Code (Optional)</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <input 
                              type="text" 
                              value={referralCode}
                              onChange={e => setReferralCode(e.target.value)}
                              placeholder="e.g. VIP2024"
                              className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors uppercase"
                            />
                          </div>
                        </div>
                      )}

                      {view === 'signup' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">Account Mode</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setAccountType('demo')}
                              className={cn(
                                "py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                                accountType === 'demo'
                                  ? "bg-purple-600/15 border-purple-500 text-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                  : "bg-white border-slate-300 text-slate-600 hover:border-slate-700"
                              )}
                            >
                              <span className="text-xs font-black">DEMO WALLET</span>
                              <span className="text-[9px] opacity-75">₹100,000 Practice Credits</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccountType('real')}
                              className={cn(
                                "py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                                accountType === 'real'
                                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                  : "bg-white border-slate-300 text-slate-600 hover:border-slate-700"
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

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.02] flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:scale-100 mt-2"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-slate-200/30 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      view === 'login' ? (twoFactorRequired ? 'Verify & Sign In' : 'Sign In') :
                      view === 'signup' ? 'Create Account' :
                      view === 'forgot' ? 'Send Reset Code' : 'Reset Password'
                    )}
                  </button>
                </form>

                {(view === 'login' || view === 'signup') && (
                  <>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Or</span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-3">
                      {googleClientId ? (
                        /* Real production Google Sign-In SDK button container */
                        <div className="flex flex-col items-center gap-2 w-full">
                          <div id="google-real-btn-container" className="flex justify-center w-full min-h-[44px]"></div>
                          <span className="text-[10px] text-green-500 font-bold tracking-wider uppercase flex items-center gap-1">
                            ● Secure Google Authentication Active
                          </span>
                        </div>
                      ) : (
                        /* Sandbox fallback Google and GitHub login triggers */
                        <div className="w-full flex flex-col gap-2">
                          <div className="flex gap-3 w-full">
                            <button 
                              type="button"
                              onClick={handleSocialLoginFallback}
                              disabled={isLoading}
                              className="flex-1 bg-white/5 hover:bg-white/10 border border-slate-200 text-slate-900 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                              Google
                            </button>
                            <button 
                              type="button"
                              onClick={handleSocialLoginFallback}
                              disabled={isLoading}
                              className="flex-1 bg-white/5 hover:bg-white/10 border border-slate-200 text-slate-900 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                              </svg>
                              GitHub
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <p className="mt-8 text-center text-sm text-slate-600">
                  {view === 'login' && (
                    <>
                      Don't have an account?{" "}
                      <button 
                        onClick={() => {
                          setView('signup');
                          setError(null);
                          setSuccessMessage(null);
                          setDemoResetCode(null);
                        }}
                        className="text-yellow-500 font-bold hover:underline font-black"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                  {view === 'signup' && (
                    <>
                      Already have an account?{" "}
                      <button 
                        onClick={() => {
                          setView('login');
                          setError(null);
                          setSuccessMessage(null);
                          setDemoResetCode(null);
                        }}
                        className="text-yellow-500 font-bold hover:underline font-black"
                      >
                        Log In
                      </button>
                    </>
                  )}
                  {(view === 'forgot' || view === 'reset') && (
                    <button 
                      onClick={() => {
                        setView('login');
                        setError(null);
                        setSuccessMessage(null);
                        setDemoResetCode(null);
                      }}
                      className="text-yellow-500 font-bold hover:underline font-black"
                    >
                      ← Back to Log In
                    </button>
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
