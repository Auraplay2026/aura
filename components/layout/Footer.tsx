import Link from "next/link";
import { Shield, Mail, MessageSquare, Globe, MessageCircle, ShieldCheck, Bitcoin, CreditCard, Coins, Landmark } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 relative bg-white/80 backdrop-blur-md pt-16 pb-8">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6 mb-16">
          
          <div className="space-y-4">
            <h3 className="text-slate-900 font-black text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              AuraPlay
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed pr-4">
              The premier destination for crypto casino gaming and global sportsbook trading.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <button className="text-slate-500 hover:text-blue-600 transition-colors"><MessageCircle className="w-5 h-5" /></button>
              <button className="text-slate-500 hover:text-blue-600 transition-colors"><Globe className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold tracking-wide">Casino</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/casino/slots" className="hover:text-blue-600 transition-colors">Slots</Link></li>
              <li><Link href="/casino/live" className="hover:text-blue-600 transition-colors">Live Casino</Link></li>
              <li><Link href="/casino/originals" className="hover:text-blue-600 transition-colors">Originals</Link></li>
              <li><Link href="/casino/rtp" className="hover:text-blue-600 transition-colors">Live RTP</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold tracking-wide">Sports</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/sportsbook" className="hover:text-blue-600 transition-colors">Live Sports</Link></li>
              <li><Link href="/sportsbook/soccer" className="hover:text-blue-600 transition-colors">Soccer</Link></li>
              <li><Link href="/sportsbook/esports" className="hover:text-blue-600 transition-colors">Esports</Link></li>
              <li><Link href="/predictions/politics" className="hover:text-blue-600 transition-colors">Predictions</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold tracking-wide">About</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/rg" className="hover:text-blue-600 transition-colors">Responsible Gaming</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/support" className="hover:text-blue-600 transition-colors flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Live Support</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold tracking-wide">Promotions</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/vip" className="hover:text-blue-600 transition-colors">VIP Club</Link></li>
              <li><Link href="/affiliate" className="hover:text-blue-600 transition-colors">Affiliates</Link></li>
              <li><Link href="/promotions" className="hover:text-blue-600 transition-colors">Giveaways</Link></li>
              <li><Link href="/tournaments" className="hover:text-blue-600 transition-colors">Races</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold tracking-wide">Community</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-[#1DA1F2] transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-[#0088cc] transition-colors">Telegram</a></li>
              <li><a href="#" className="hover:text-[#5865F2] transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-[#E4405F] transition-colors">Instagram</a></li>
            </ul>
          </div>

        </div>

        {/* Brand Logos Sections (Moved Below Footer Links) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 mb-8 pt-16 border-t border-slate-200">
          
          {/* Game Providers */}
          <div className="space-y-6">
            <h4 className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Premium Providers
            </h4>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {["Pragmatic Play", "Evolution", "Hacksaw", "Nolimit City"].map((provider) => (
                <div key={provider} className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl shadow-sm font-black text-sm md:text-base tracking-tighter text-slate-600 hover:text-slate-900 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                  {provider.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <h4 className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-500" />
              Accepted Currencies / Methods
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#f7931a]/5 border border-[#f7931a]/20 px-5 py-3 rounded-2xl text-slate-700 font-bold hover:bg-[#f7931a]/10 hover:shadow-md transition-all duration-300 cursor-pointer shadow-sm transform hover:-translate-y-1"><Bitcoin className="w-5 h-5 text-[#f7931a]" /> BTC</div>
              <div className="flex items-center gap-2 bg-[#627eea]/5 border border-[#627eea]/20 px-5 py-3 rounded-2xl text-slate-700 font-bold hover:bg-[#627eea]/10 hover:shadow-md transition-all duration-300 cursor-pointer shadow-sm transform hover:-translate-y-1"><Coins className="w-5 h-5 text-[#627eea]" /> ETH</div>
              <div className="flex items-center gap-2 bg-slate-50/5 border border-[#26a17b]/20 px-5 py-3 rounded-2xl text-slate-700 font-bold hover:bg-slate-50/10 hover:shadow-md transition-all duration-300 cursor-pointer shadow-sm transform hover:-translate-y-1"><Coins className="w-5 h-5 text-[#26a17b]" /> USDT</div>
              <div className="flex items-center gap-2 bg-slate-50/5 border border-[#0054A6]/20 px-5 py-3 rounded-2xl text-slate-700 font-bold hover:bg-slate-50/10 hover:shadow-md transition-all duration-300 cursor-pointer shadow-sm transform hover:-translate-y-1">
                <Landmark className="w-5 h-5 text-[#0054A6]" /> IMPS
              </div>
              <div className="flex items-center gap-2 bg-[#ff5722]/5 border border-[#ff5722]/20 px-5 py-3 rounded-2xl text-slate-700 font-bold hover:bg-[#ff5722]/10 hover:shadow-md transition-all duration-300 cursor-pointer shadow-sm transform hover:-translate-y-1">
                <Landmark className="w-5 h-5 text-[#ff5722]" /> RTGS
              </div>
            </div>
          </div>

        </div>

        {/* Trust Badges & Certifications Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 py-8 my-8 border-t border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300">
              <img src="/gamcare.webp" alt="GamCare Certified" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              <span className="text-slate-600 text-xs font-semibold">GamCare Certified</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300">
              <img src="/begambleaware.webp" alt="BeGambleAware" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              <span className="text-slate-600 text-xs font-semibold">BeGambleAware</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300">
              <img src="/eighteen.webp" alt="18+ Underage Gaming Restricted" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              <span className="text-slate-600 text-xs font-semibold">Strictly 18+ Only</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-600" /> SSL Secure Connection</span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-600" /> Provably Fair RNG</span>
          </div>
        </div>

        {/* Regulatory Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 pb-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center font-black text-slate-600">
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
            <span className="text-slate-400">© 2026 AuraPlay. All rights reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
