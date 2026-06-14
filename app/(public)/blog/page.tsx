"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, BookOpen, Clock, Calendar, ArrowRight, User, TrendingUp, 
  Gamepad2, Trophy, ShieldCheck, Heart, Share2, Sparkles, Send, CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: "Sports" | "Casino" | "Strategy" | "Announcements";
  image: string;
  date: string;
  author: string;
  readTime: string;
  likes: number;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "ipl-cricket-odds",
    title: "RCB vs CSK: The Ultimate In-Play Betting & Tactical Breakdown",
    excerpt: "With both powerhouses fighting for top spot, we analyze key player match-ups, pitch variables, and optimal hedge strategies for back/lay exchange markets.",
    content: "Detailed analysis of IPL live odds, player form, and weather parameters to help you construct the perfect hedge slip.",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
    date: "June 14, 2026",
    author: "Rahul Sharma (Cricket Lead)",
    readTime: "5 min read",
    likes: 245,
    featured: true
  },
  {
    id: "rng-provably-fair",
    title: "Provably Fair Algorithms: The Science Behind Aura Originals",
    excerpt: "Discover how cryptographic seeding and SHA-256 validation ensure every roll of the dice and crash multiplier is 100% transparent and verifiable.",
    content: "An in-depth guide to verifying game hashes directly via smart contract logic, proving AuraPlay's commitment to clean gameplay.",
    category: "Announcements",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
    date: "June 12, 2026",
    author: "Elena Rostov (Security Architect)",
    readTime: "8 min read",
    likes: 189
  },
  {
    id: "crash-multiplier-strategies",
    title: "Crash Games: High-Roller Risk Management & Multiplier Optimization",
    excerpt: "Tired of busting early? Learn the double-down buffer strategy and automated cash-out triggers used by seasoned arcade pros to secure steady gains.",
    content: "Mathematical breakdown of crash game probability models and structural triggers for auto-collecting bets.",
    category: "Strategy",
    image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80",
    date: "June 10, 2026",
    author: "Vikram Malhotra (Arcade Pro)",
    readTime: "6 min read",
    likes: 312
  },
  {
    id: "rtp-slots-explained",
    title: "Understanding Slot Mechanics: RTP, Volatility & Max Win Caps",
    excerpt: "Demystifying Return to Player rates. Learn the physical difference between low-volatility drop games and high-volatility slots.",
    content: "How random number generators interact with mathematical hold patterns to deliver jackpot payout opportunities.",
    category: "Casino",
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&q=80",
    date: "June 08, 2026",
    author: "Sam Wood (Casino Manager)",
    readTime: "4 min read",
    likes: 154
  },
  {
    id: "crypto-betting-basics",
    title: "Crypto Betting 101: High-Speed Deposits & Cold Storage Security",
    excerpt: "Why blockchain transactions offer superior speeds, lower fees, and absolute banking privacy compared to traditional cards.",
    content: "Step-by-step onboarding walkthrough for configuring wallet addresses, checking confirmations, and security protocols.",
    category: "Strategy",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80",
    date: "June 05, 2026",
    author: "Aura Security Team",
    readTime: "7 min read",
    likes: 278
  },
  {
    id: "euro-cup-favorites",
    title: "Euro Cup Outrights: Golden Boot Contenders & Dark Horse Value Picks",
    excerpt: "As the group stages conclude, we scour the exchange markets for mismatched outright bookmaker margins and high-probability lays.",
    content: "Statistical deep-dive into Euro Cup historical parameters, injury list updates, and defensive metrics.",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80",
    date: "June 02, 2026",
    author: "Marco Rossi (European Football)",
    readTime: "9 min read",
    likes: 402
  }
];

const CATEGORIES = ["All", "Sports", "Casino", "Strategy", "Announcements"] as const;

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    BLOG_POSTS.reduce((acc, post) => ({ ...acc, [post.id]: post.likes }), {})
  );
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const alreadyLiked = likedPosts[id];
    setLikedPosts(prev => ({ ...prev, [id]: !alreadyLiked }));
    setLikeCounts(prev => ({
      ...prev,
      [id]: alreadyLiked ? prev[id] - 1 : prev[id] + 1
    }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
    }
  };

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured || activeCategory !== "All");

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-8 md:gap-12 min-h-screen">
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/50 pb-8"
      >
        <div>
          <span className="text-red-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5" /> AuraPlay Chronicles
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Sports News & Betting Strategy
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl text-sm md:text-base">
            Expert insights, math-focused casino breakdowns, in-depth tournament previews, and the latest platform nodes updates.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all shadow-sm"
          />
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border whitespace-nowrap",
                isActive 
                  ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/10" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
              )}
            >
              {category}
            </button>
          );
        })}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Articles */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Featured Post (Only show on 'All' or when matched) */}
          {activeCategory === "All" && searchQuery === "" && featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Link 
                href={`/blog/${featuredPost.id}`}
                className="group relative flex flex-col md:flex-row bg-white border border-slate-200/80 rounded-[24px] overflow-hidden hover:shadow-xl hover:ring-2 hover:ring-red-200/30 hover:-translate-y-1 transition-all duration-300 shadow-sm"
              >
                {/* Image Section */}
                <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <span className="px-3 py-1 bg-yellow-400 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> FEATURED
                    </span>
                    <span className="px-3 py-1 bg-white/95 backdrop-blur-sm border border-slate-200 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                      {featuredPost.category}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 md:p-8 flex flex-col justify-between flex-1 md:w-1/2">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {featuredPost.date}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight group-hover:text-red-600 transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{featuredPost.author}</span>
                    </div>
                    <button 
                      onClick={(e) => handleLike(featuredPost.id, e)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg border transition-all active:scale-95",
                        likedPosts[featuredPost.id]
                          ? "bg-red-50 border-red-200 text-red-500"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <Heart className={cn("w-3.5 h-3.5", likedPosts[featuredPost.id] && "fill-red-500")} />
                      <span>{likeCounts[featuredPost.id]}</span>
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Regular Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {regularPosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <Link 
                    href={`/blog/${post.id}`}
                    className="group relative flex flex-col h-full bg-white border border-slate-200/80 rounded-[20px] overflow-hidden hover:shadow-xl hover:ring-2 hover:ring-red-200/30 hover:-translate-y-1 transition-all duration-300 shadow-sm"
                  >
                    {/* Post Image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-sm border border-slate-200 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm z-10">
                        {post.category}
                      </span>
                    </div>

                    {/* Post Info */}
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed font-medium line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {post.author.split(' ')[0]}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => handleLike(post.id, e)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-black transition-all active:scale-95",
                              likedPosts[post.id]
                                ? "bg-red-50 border-red-200 text-red-500"
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                            )}
                          >
                            <Heart className={cn("w-3 h-3", likedPosts[post.id] && "fill-red-500")} />
                            {likeCounts[post.id]}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {filteredPosts.length === 0 && (
              <div className="col-span-2 py-16 bg-slate-50 border border-slate-200 border-dashed rounded-3xl text-center flex flex-col items-center justify-center">
                <Search className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-black text-slate-900 mb-1">No Articles Found</h3>
                <p className="text-sm text-slate-500 font-medium max-w-xs">
                  We couldn't find any match for "{searchQuery}". Try selecting another category or typing different terms.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Widgets / Newsletter */}
        <div className="flex flex-col gap-6">
          
          {/* Trending / Guide Widget */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4"
          >
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" /> Trending Topics
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 font-black text-xs flex items-center justify-center shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors leading-tight">
                    Cricket Betting exchange rates hedge strategies
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <Trophy className="w-3 h-3 text-yellow-500" /> SPORTS • 14k reads
                  </span>
                </div>
              </div>
              
              <div className="w-full h-px bg-slate-100" />

              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 font-black text-xs flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors leading-tight">
                    How random number seeds prove 100% fair games
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> CASINO • 9k reads
                  </span>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100" />

              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 font-black text-xs flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors leading-tight">
                    Martingale double-down buffers on crash mechanics
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <Gamepad2 className="w-3 h-3 text-purple-500" /> STRATEGY • 7k reads
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Newsletter Newsletter Widget */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-32 h-32 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4">
              <div>
                <span className="text-red-400 font-bold text-[10px] uppercase tracking-widest">Stay Updated</span>
                <h3 className="text-lg font-black tracking-tight mt-1">Weekly Betradar Guides</h3>
                <p className="text-slate-400 text-xs font-semibold mt-1.5 leading-relaxed">
                  Join 12,000+ traders receiving outright odds value picks and system updates directly in their inbox.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!newsletterSubscribed ? (
                  <motion.form 
                    key="form"
                    onSubmit={handleSubscribe} 
                    className="flex flex-col gap-2.5 mt-2"
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input 
                      type="email"
                      required
                      placeholder="Enter email address"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/10 hover:border-white/20 focus:border-red-600 focus:outline-none transition-all rounded-xl text-xs font-semibold text-white placeholder-slate-500"
                    />
                    <button 
                      type="submit"
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] shadow-md shadow-red-500/20 flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3 h-3" /> Subscribe
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Subscribed! Check your inbox soon.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>

      </div>

    </div>
  );
}
