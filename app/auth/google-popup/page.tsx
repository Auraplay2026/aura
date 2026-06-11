"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function GoogleMockPopup() {
  const [status, setStatus] = useState("Connecting to Google Services...");

  useEffect(() => {
    // Simulate OAuth delay
    const timer1 = setTimeout(() => {
      setStatus("Authenticating Sandbox User...");
    }, 800);

    const timer2 = setTimeout(() => {
      setStatus("Success! Redirecting...");
      
      // Send message to opener
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          email: 'guest@auraplay.demo',
          name: 'Aura Guest'
        }, window.location.origin);
      }
      
      // Close popup
      setTimeout(() => {
        window.close();
      }, 500);
      
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6">
        <svg className="w-8 h-8" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      </div>
      <h1 className="text-xl font-bold mb-2">Google Sign-In (Sandbox)</h1>
      <div className="flex items-center gap-3 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p className="text-sm font-medium">{status}</p>
      </div>
    </div>
  );
}
