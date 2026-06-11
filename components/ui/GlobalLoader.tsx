"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function GlobalLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide the loader after the app has mounted (simulating hydration)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          id="loader" 
          role="alert" 
          aria-busy="true" 
          aria-label="Loading..." 
          className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Ambient Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative flex flex-col items-center justify-center">
            {/* Outer Rotating Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute w-32 h-32 rounded-full border-[1px] border-dashed border-amber-500/30"
            />
            
            {/* Inner Fast Rotating Gradient Ring */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute w-24 h-24 rounded-full border-2 border-transparent border-t-amber-500 border-r-violet-600"
            />

            {/* Central Brand Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.05, 0.8], opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-16 h-16 bg-white rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center border border-slate-100"
            >
              <Sparkles className="w-8 h-8 text-amber-500" />
            </motion.div>
          </div>

          {/* Typography */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-14 flex flex-col items-center gap-3 relative z-10"
          >
            <h2 className="text-slate-900 font-black text-2xl tracking-[0.2em] uppercase">
              AuraPlay <span className="text-amber-500">Exchange</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
