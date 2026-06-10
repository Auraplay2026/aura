import Link from "next/link";
import { Shield, Mail, MessageSquare, Globe, MessageCircle, ShieldCheck, Bitcoin, CreditCard, Coins, Landmark } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-900 bg-slate-950/50 backdrop-blur-md pt-16 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        


        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6 mb-16">
          
          <div className="space-y-4">
            <h3 className="text-white font-black text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-neon-green" />
              AuraPlay
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed pr-4">
              The premier destination for crypto casino gaming and global sportsbook trading.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <button className="text-slate-400 hover:text-neon-purple transition-colors"><MessageCircle className="w-5 h-5" /></button>
              <button className="text-slate-400 hover:text-neon-purple transition-colors"><Globe className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-wide">Casino</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/casino/slots" className="hover:text-neon-purple transition-colors">Slots</Link></li>
              <li><Link href="/casino/live" className="hover:text-neon-purple transition-colors">Live Casino</Link></li>
              <li><Link href="/casino/originals" className="hover:text-neon-purple transition-colors">Originals</Link></li>
              <li><Link href="/casino/rtp" className="hover:text-neon-purple transition-colors">Live RTP</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-wide">Sports</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/sportsbook" className="hover:text-neon-purple transition-colors">Live Sports</Link></li>
              <li><Link href="/sportsbook/soccer" className="hover:text-neon-purple transition-colors">Soccer</Link></li>
              <li><Link href="/sportsbook/esports" className="hover:text-neon-purple transition-colors">Esports</Link></li>
              <li><Link href="/predictions/politics" className="hover:text-neon-purple transition-colors">Predictions</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-wide">About</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/rg" className="hover:text-neon-purple transition-colors">Responsible Gaming</Link></li>
              <li><Link href="/terms" className="hover:text-neon-purple transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-neon-purple transition-colors">Privacy Policy</Link></li>
              <li><Link href="/support" className="hover:text-neon-purple transition-colors flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Live Support</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-wide">Promotions</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/vip" className="hover:text-neon-purple transition-colors">VIP Club</Link></li>
              <li><Link href="/affiliate" className="hover:text-neon-purple transition-colors">Affiliates</Link></li>
              <li><Link href="/promotions" className="hover:text-neon-purple transition-colors">Giveaways</Link></li>
              <li><Link href="/tournaments" className="hover:text-neon-purple transition-colors">Races</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-wide">Community</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-neon-purple transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-neon-purple transition-colors">Telegram</a></li>
              <li><a href="#" className="hover:text-neon-purple transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-neon-purple transition-colors">Instagram</a></li>
            </ul>
          </div>

        </div>

        {/* Brand Logos Sections (Moved Below Footer Links) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 mb-8 pt-16 border-t border-slate-900">
          
          {/* Game Providers */}
          <div className="space-y-6">
            <h4 className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neon-purple" />
              Premium Providers
            </h4>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {["Pragmatic Play", "Evolution", "Hacksaw", "Nolimit City"].map((provider) => (
                <div key={provider} className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800/80 px-5 py-3 rounded-2xl shadow-inner font-black text-sm md:text-base tracking-tighter text-slate-400 hover:text-white hover:border-neon-purple/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                  {provider.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <h4 className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neon-yellow" />
              Accepted Currencies / Methods
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#f7931a]/10 to-transparent border border-[#f7931a]/20 px-5 py-3 rounded-2xl text-slate-300 font-bold hover:bg-[#f7931a]/20 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(247,147,26,0.05)] transform hover:-translate-y-1"><Bitcoin className="w-5 h-5 text-[#f7931a]" /> BTC</div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#627eea]/10 to-transparent border border-[#627eea]/20 px-5 py-3 rounded-2xl text-slate-300 font-bold hover:bg-[#627eea]/20 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(98,126,234,0.05)] transform hover:-translate-y-1"><Coins className="w-5 h-5 text-[#627eea]" /> ETH</div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#26a17b]/10 to-transparent border border-[#26a17b]/20 px-5 py-3 rounded-2xl text-slate-300 font-bold hover:bg-[#26a17b]/20 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(38,161,123,0.05)] transform hover:-translate-y-1"><Coins className="w-5 h-5 text-[#26a17b]" /> USDT</div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#097939]/10 to-transparent border border-[#097939]/20 px-5 py-3 rounded-2xl text-slate-300 font-bold hover:bg-[#097939]/20 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(9,121,57,0.05)] transform hover:-translate-y-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 16L7 8H11L7 16H3Z" fill="#0054A6" />
                  <path d="M9 16L13 8H17L13 16H9Z" fill="#097939" />
                </svg>
                UPI
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#0054A6]/10 to-transparent border border-[#0054A6]/20 px-5 py-3 rounded-2xl text-slate-300 font-bold hover:bg-[#0054A6]/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                <Landmark className="w-5 h-5 text-[#0054A6]" /> IMPS
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#ff5722]/10 to-transparent border border-[#ff5722]/20 px-5 py-3 rounded-2xl text-slate-300 font-bold hover:bg-[#ff5722]/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                <Landmark className="w-5 h-5 text-[#ff5722]" /> RTGS
              </div>
            </div>
          </div>

        </div>

        {/* Trust Badges & Certifications Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 py-8 my-8 border-t border-b border-slate-900/50">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800/60 hover:border-slate-700 transition-all duration-300">
              <img src="/gamcare.webp" alt="GamCare Certified" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              <span className="text-slate-400 text-xs font-semibold">GamCare Certified</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800/60 hover:border-slate-700 transition-all duration-300">
              <img src="/begambleaware.webp" alt="BeGambleAware" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              <span className="text-slate-400 text-xs font-semibold">BeGambleAware</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800/60 hover:border-slate-700 transition-all duration-300">
              <img src="/eighteen.webp" alt="18+ Underage Gaming Restricted" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              <span className="text-slate-400 text-xs font-semibold">Strictly 18+ Only</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800/60 hover:border-slate-700 transition-all duration-300">
              <svg className="h-6 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 16L7 8H11L7 16H3Z" fill="#0054A6" />
                <path d="M9 16L13 8H17L13 16H9Z" fill="#097939" />
              </svg>
              <span className="text-slate-400 text-xs font-semibold">UPI Payments Accepted</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-900/20 px-4 py-2 rounded-xl border border-slate-900/40">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-neon-green" /> SSL Secure Connection</span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-neon-purple" /> Provably Fair RNG</span>
          </div>
        </div>

        {/* Regulatory Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center font-black text-slate-400">
              18+
            </div>
            <div className="flex flex-col gap-2 max-w-4xl">
              <p>
                AuraPlay is operated by BlockDance B.V., a company registered in Curaçao, operating under the E-gaming license No. 1668/JAZ. Play responsibly.
              </p>
              <p className="text-[10px] text-slate-600">
                Participation in gaming and betting activities is restricted to individuals of legal age as determined by the jurisdiction in which the individual resides. By using this website, you represent that you are at least 18 years of age and that you are legally permitted to participate in the activities offered. AuraPlay supports responsible gambling. If you feel you have a problem, please contact appropriate support organizations.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span>© 2026 AuraPlay. All rights reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
