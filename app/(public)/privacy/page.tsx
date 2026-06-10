"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1000px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-8 md:p-12"
      >
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-800/50">
          <div className="w-16 h-16 bg-neon-green/20 rounded-2xl flex items-center justify-center border border-neon-green/30">
            <Shield className="w-8 h-8 text-neon-green" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Privacy Policy</h1>
            <p className="text-slate-400 mt-2">Protecting your data is our priority.</p>
          </div>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Data Collection</h2>
            <p>We collect information necessary to provide a secure and regulatory-compliant gambling environment. This includes account details, IP addresses, betting history, and blockchain transaction records.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">How We Use Your Data</h2>
            <p>Your data is strictly used for account management, security monitoring, anti-fraud measures, and providing personalized customer support. We do not sell your personal data to third-party marketers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Security</h2>
            <p>AuraPlay employs enterprise-grade encryption and secure socket layer (SSL) technology to protect all data transmitted between your device and our servers. Cryptocurrency wallets are stored securely using cold-storage architecture.</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
