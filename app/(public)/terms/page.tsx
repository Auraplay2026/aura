"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1000px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50/30 border border-slate-200/50 rounded-3xl p-8 md:p-12"
      >
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-200/50">
          <div className="w-16 h-16 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30">
            <ShieldCheck className="w-8 h-8 text-neon-purple" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">Terms of Service</h1>
            <p className="text-slate-600 mt-2">Last updated: June 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using AuraPlay, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using or accessing this site.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Eligibility</h2>
            <p>You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to use our services. By using the platform, you represent and warrant that you meet this age requirement and have the legal capacity to enter into a binding contract.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Account Registration</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. AuraPlay reserves the right to suspend or terminate accounts suspected of fraudulent activity, money laundering, or multi-accounting.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Crypto Deposits and Withdrawals</h2>
            <p>AuraPlay operates exclusively using supported cryptocurrencies. You acknowledge that cryptocurrency transactions are irreversible. We are not responsible for funds sent to the wrong address or on the wrong network. Withdrawal limits and KYC checks may apply at the sole discretion of our compliance team.</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
