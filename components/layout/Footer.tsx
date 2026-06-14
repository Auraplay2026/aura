"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, MessageSquare, Globe, MessageCircle, ShieldCheck, Bitcoin, CreditCard, Coins, Landmark, Trophy } from "lucide-react";

export function Footer() {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Wins" },
    { id: "crypto", name: "Crypto & Casino" },
    { id: "malta", name: "Malta Excellence" },
    { id: "innovation", name: "Tech & Innovation" },
  ];

  const awards = [
    {
      id: "sigma-2025",
      category: "crypto",
      title: "Best Crypto Casino 2025",
      organizer: "SiGMA Group",
      winnerLabel: "Winner",
      type: "sigma",
    },
    {
      id: "affpapa-2023",
      category: "crypto",
      title: "iGaming Awards Winner 2023",
      organizer: "affpapa",
      winnerLabel: "Winner",
      type: "affpapa",
    },
    {
      id: "migea-startup",
      category: "malta",
      title: "Best Start-Up Company of the Year",
      organizer: "MiGEA MALTA'S GAMING",
      subOrganizer: "Excellence Awards 2023",
      winnerLabel: "Winner",
      type: "migea",
    },
    {
      id: "migea-operator",
      category: "malta",
      title: "Best Online Casino Operator of the Year",
      organizer: "MiGEA MALTA'S GAMING",
      subOrganizer: "Excellence Awards 2023",
      winnerLabel: "Winner",
      type: "migea",
    },
    {
      id: "migea-product",
      category: "malta",
      title: "Best Online Casino Product of the Year",
      organizer: "MiGEA MALTA'S GAMING",
      subOrganizer: "Excellence Awards 2023",
      winnerLabel: "Winner",
      type: "migea",
    },
    {
      id: "egr-2024",
      category: "crypto",
      title: "Crypto Operator of the Year",
      organizer: "EGR OPERATOR AWARDS",
      subOrganizer: "Global Awards 2024",
      winnerLabel: "Winner",
      type: "egr",
    },
    {
      id: "sbc-2024",
      category: "innovation",
      title: "Innovation in Sports & Esports Betting",
      organizer: "SBC GLOBAL AWARDS",
      subOrganizer: "Summit Awards 2024",
      winnerLabel: "Winner",
      type: "sbc",
    },
    {
      id: "gga-2025",
      category: "innovation",
      title: "Digital Operator of the Year 2025",
      organizer: "GLOBAL GAMING AWARDS",
      subOrganizer: "London 2025",
      winnerLabel: "Winner",
      type: "gga",
    },
    {
      id: "iga-2025",
      category: "innovation",
      title: "Best Crypto Casino Operator",
      organizer: "INTERNATIONAL GAMING",
      subOrganizer: "IGA London 2025",
      winnerLabel: "Winner",
      type: "iga",
    },
  ];

  const filteredAwards = activeCategory === "all"
    ? awards
    : awards.filter((award) => award.category === activeCategory);
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

        {/* Awards & Recognitions */}
        <div className="mt-16 pt-16 border-t border-slate-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.04)] relative overflow-hidden">
            {/* Decorative background effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/[0.02] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200/80">
              <div>
                <h4 className="text-slate-900 text-lg font-black tracking-wide flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500 animate-pulse" />
                  AuraPlay Achievements & Awards
                </h4>
                <p className="text-slate-500 text-xs mt-1">Recognized globally by top-tier gaming organizations for trust, safety, and innovation.</p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/80">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                      activeCategory === cat.id
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/10 scale-105"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Awards Grid with Transition */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[176px]">
              {filteredAwards.map((award) => {
                if (award.type === "sigma") {
                  return (
                    <div 
                      key={award.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between items-center text-center h-44 hover:scale-[1.03] hover:border-red-500/30 hover:shadow-[0_12px_30px_rgba(225,29,72,0.06)] transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex items-center gap-2 mt-2">
                        {/* SiGMA Square Logo */}
                        <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col justify-between w-11 h-11 shrink-0 shadow-sm">
                          <div className="text-[#0e1624] font-black text-[10px] leading-none tracking-tighter">SiG</div>
                          <div className="bg-[#e11d48] text-white font-black text-[9px] px-0.5 py-0.5 rounded-sm leading-none text-center tracking-tighter">MA</div>
                          <div className="bg-black text-white font-bold text-[4.5px] py-0.5 rounded-sm leading-none text-center tracking-widest uppercase">AWARDS</div>
                        </div>
                        
                        {/* Flag Ribbon */}
                        <svg width="105" height="38" viewBox="0 0 105 38" fill="none" className="shrink-0">
                          <path d="M1 1H100L93 19L100 37H1V1Z" stroke="#e11d48" strokeWidth="1.2" fill="rgba(225, 29, 72, 0.02)" />
                          <text x="8" y="15" fill="#e11d48" fontSize="7.5" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">BEST CRYPTO</text>
                          <text x="8" y="27" fill="#e11d48" fontSize="7.5" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">CASINO 2025</text>
                        </svg>
                      </div>

                      <div className="w-full border-t border-slate-100 pt-2 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-auto">
                        <span className="text-red-600 font-black">{award.winnerLabel}</span>
                        <span className="text-slate-600">{award.organizer}</span>
                      </div>
                    </div>
                  );
                }

                if (award.type === "affpapa") {
                  return (
                    <div 
                      key={award.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between items-center text-center h-44 hover:scale-[1.03] hover:border-emerald-500/30 hover:shadow-[0_12px_30px_rgba(16,185,129,0.06)] transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Inner frame */}
                      <div className="absolute inset-2 border border-slate-100 pointer-events-none rounded-xl">
                        <div className="absolute -top-1 -bottom-1 left-3 right-3 border-l border-r border-transparent"></div>
                        <div className="absolute -left-1 -right-1 top-3 bottom-3 border-t border-b border-transparent"></div>
                      </div>

                      <div className="text-[9px] text-slate-400 font-mono tracking-widest relative z-10 mt-1">— 2023 —</div>
                      
                      <div className="flex flex-col items-center relative z-10 my-2">
                        <span className="text-xl text-slate-900 font-black tracking-tighter">affpapa</span>
                        <span className="text-[8px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">iGaming awards</span>
                      </div>
                      
                      <div className="w-full relative z-10 flex items-center justify-center gap-2 mt-auto">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-[9px] text-emerald-600 font-black tracking-widest uppercase px-1.5">{award.winnerLabel}</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                    </div>
                  );
                }

                if (award.type === "migea") {
                  return (
                    <div 
                      key={award.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 h-44 hover:scale-[1.03] hover:border-red-500/30 hover:shadow-[0_12px_30px_rgba(225,29,72,0.06)] transition-all duration-300 group relative overflow-hidden text-slate-800"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* MiGEA Ribbon Logo SVG */}
                      <svg viewBox="0 0 80 100" className="w-10 h-14 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M40 85 C25 85 15 72 15 55 C15 35 32 15 48 28 C55 33 58 42 55 52 C51 64 36 78 22 84" stroke="url(#silverGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 84 C36 78 51 64 55 52 C58 42 55 33 48 28 C32 15 15 35 15 55" stroke="url(#roseGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        <g transform="translate(48, 42)">
                          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#f43f5e" />
                          <path d="M5 1 L8 4 L5 7 L2 4 Z" fill="#ffffff" />
                          <path d="-5 1 L-2 4 L-5 7 L-8 4 Z" fill="#ffffff" />
                          <path d="M0 6 L3 10 L0 14 L-3 10 Z" fill="#f43f5e" />
                        </g>
                        <defs>
                          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="60%" stopColor="#cbd5e1" />
                            <stop offset="100%" stopColor="#94a3b8" />
                          </linearGradient>
                          <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fda4af" />
                            <stop offset="40%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#9f1239" />
                          </linearGradient>
                        </defs>
                      </svg>

                      <div className="flex flex-col justify-between h-full py-0.5 text-left min-w-0 flex-1">
                        <div>
                          <span className="text-[7.5px] text-red-600 font-black tracking-widest uppercase block mb-0.5">{award.winnerLabel}</span>
                          <h5 className="text-[10px] font-black tracking-tight leading-tight uppercase text-slate-800 group-hover:text-red-600 transition-colors break-words">
                            {award.title}
                          </h5>
                        </div>
                        <div className="mt-auto pt-1 border-t border-slate-100">
                          <p className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider leading-none">{award.subOrganizer}</p>
                          <p className="text-[7.5px] text-slate-600 font-black tracking-wider uppercase mt-1 overflow-hidden text-ellipsis whitespace-nowrap">{award.organizer}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (award.type === "egr") {
                  return (
                    <div 
                      key={award.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between items-center text-center h-44 hover:scale-[1.03] hover:border-red-500/30 hover:shadow-[0_12px_30px_rgba(225,29,72,0.06)] transition-all duration-300 group relative overflow-hidden text-slate-800"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="bg-[#e11d48] text-white font-black px-1.5 py-0.5 rounded-sm text-[9px] tracking-wide leading-none">EGR</div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{award.subOrganizer}</span>
                      </div>

                      <div className="my-2 flex flex-col items-center">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{award.winnerLabel}</span>
                        <span className="text-[10.5px] text-slate-800 font-black uppercase tracking-tight leading-tight">{award.title}</span>
                      </div>

                      <div className="text-[7px] text-red-600 font-black uppercase tracking-widest border-t border-slate-100 pt-2 w-full mt-auto">
                        {award.organizer}
                      </div>
                    </div>
                  );
                }

                if (award.type === "sbc") {
                  return (
                    <div 
                      key={award.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between items-center text-center h-44 hover:scale-[1.03] hover:border-emerald-500/30 hover:shadow-[0_12px_30px_rgba(16,185,129,0.06)] transition-all duration-300 group relative overflow-hidden text-slate-800"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="bg-[#10b981] text-white font-black px-1.5 py-0.5 rounded-sm text-[9px] tracking-wider leading-none">SBC</div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{award.subOrganizer}</span>
                      </div>

                      <div className="my-2 flex flex-col items-center">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{award.winnerLabel}</span>
                        <span className="text-[10.5px] text-slate-800 font-black uppercase tracking-tight leading-tight">{award.title}</span>
                      </div>

                      <div className="text-[7px] text-emerald-600 font-black uppercase tracking-widest border-t border-slate-100 pt-2 w-full mt-auto">
                        {award.organizer}
                      </div>
                    </div>
                  );
                }

                if (award.type === "gga") {
                  return (
                    <div 
                      key={award.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between items-center text-center h-44 hover:scale-[1.03] hover:border-blue-500/30 hover:shadow-[0_12px_30px_rgba(59,130,246,0.06)] transition-all duration-300 group relative overflow-hidden text-slate-800"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="bg-[#06b6d4] text-white font-black px-1.5 py-0.5 rounded-sm text-[9px] tracking-wider leading-none">GGA</div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{award.subOrganizer}</span>
                      </div>

                      <div className="my-2 flex flex-col items-center">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{award.winnerLabel}</span>
                        <span className="text-[10.5px] text-slate-800 font-black uppercase tracking-tight leading-tight">{award.title}</span>
                      </div>

                      <div className="text-[7px] text-blue-600 font-black uppercase tracking-widest border-t border-slate-100 pt-2 w-full mt-auto">
                        {award.organizer}
                      </div>
                    </div>
                  );
                }

                if (award.type === "iga") {
                  return (
                    <div 
                      key={award.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between items-center text-center h-44 hover:scale-[1.03] hover:border-yellow-600/30 hover:shadow-[0_12px_30px_rgba(202,138,4,0.06)] transition-all duration-300 group relative overflow-hidden text-slate-800"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <Trophy className="w-3 h-3 text-yellow-600" />
                        <span className="text-[9px] text-yellow-600 font-black tracking-wider">IGA</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{award.subOrganizer}</span>
                      </div>

                      <div className="my-2 flex flex-col items-center">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{award.winnerLabel}</span>
                        <span className="text-[10.5px] text-slate-800 font-black uppercase tracking-tight leading-tight">{award.title}</span>
                      </div>

                      <div className="text-[7px] text-yellow-600 font-black uppercase tracking-widest border-t border-slate-100 pt-2 w-full mt-auto">
                        {award.organizer}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
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
