"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Calendar, Clock, User, Heart, Share2, 
  Trophy, ShieldCheck, Gamepad2, BookOpen, AlertCircle, Copy, Check 
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
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "ipl-cricket-odds",
    title: "RCB vs CSK: The Ultimate In-Play Betting & Tactical Breakdown",
    excerpt: "With both powerhouses fighting for top spot, we analyze key player match-ups, pitch variables, and optimal hedge strategies for back/lay exchange markets.",
    content: `Cricket exchange markets represent one of the highest liquidity channels in modern sports trading. In the upcoming Royal Challengers Bangalore (RCB) vs Chennai Super Kings (CSK) fixture, understanding in-play parameters is key to locking in green-books.

### Pitch & Venue Conditions
The match is scheduled at the M. Chinnaswamy Stadium, Bangalore. Known for its notoriously short boundary parameters (averaging 55-60 meters on the squares) and a high-altitude bounce vector, batting first requires a minimum buffer threshold of 195 runs. 

### Key Match-ups
1. **Virat Kohli vs Ravindra Jadeja**: Kohli’s strike rate against left-arm orthodox spin in middle-overs averages 114.2. Laying RCB during this spin choke phase offers high-probability entry points.
2. **Pathirana’s Death Vector**: Matheesha Pathirana’s slingy action yields a high dot-ball percentage in overs 16-20. Laving the batting team's run-rate line during this block is historically profitable.

### Exchange Strategy: The middle-overs back/lay hedge
If RCB bats first and reaches 60/0 in the Powerplay, their back price will collapse to ~1.40. This is the optimal execution window to lay RCB and buy back on CSK at ~2.80 once spin is introduced from both ends. By structuring a hedge block, traders can lock in a 15% guaranteed return regardless of the final outcome.`,
    category: "Sports",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
    date: "June 14, 2026",
    author: "Rahul Sharma (Cricket Lead)",
    readTime: "5 min read",
    likes: 245
  },
  {
    id: "rng-provably-fair",
    title: "Provably Fair Algorithms: The Science Behind Aura Originals",
    excerpt: "Discover how cryptographic seeding and SHA-256 validation ensure every roll of the dice and crash multiplier is 100% transparent and verifiable.",
    content: `Transparency has historically been the primary pain point in online casino architectures. Traditional RNG models rely on private centralized servers, forcing players to trust the operator implicitly. AuraPlay's 'Originals' suite eliminates this trust requirement entirely via cryptographic Provably Fair algorithms.

### The Cryptographic Trifecta
AuraPlay uses three variable hashes to determine the outcome of any given round:
1. **Server Seed**: Provided by the platform, hashed using SHA-256 and shown to the player *before* the round starts.
2. **Client Seed**: Chosen and customized by the player (or their browser), ensuring the server cannot anticipate the input.
3. **Nonce**: A sequential integer starting from 0 that increments by 1 with each wager placed under the active seed pair.

### Verification Code Walkthrough
Below is the verification formula to calculate the roll outcome:
\`\`\`javascript
const crypto = require('crypto');

function getRollResult(serverSeed, clientSeed, nonce) {
  const combinedHash = crypto.createHmac('sha256', serverSeed)
                             .update(\`\${clientSeed}:\${nonce}\`)
                             .digest('hex');
  
  // Take the first 5 characters and convert to an integer
  const rawValue = parseInt(combinedHash.substring(0, 5), 16);
  
  // Map value to a 0-99.99 roll range
  if (rawValue >= 1000000) {
    return getRollResult(serverSeed, clientSeed, nonce); // Buffer recalculation
  }
  return (rawValue % 10000) / 100;
}
\`\`\`

By utilizing this verification framework, players can manually paste their seeds into any third-party parser to verify that outcomes were generated without bias.`,
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
    content: `Crash games like Aviator and Aura-Crash are defined by their pure simplicity and rapid progression. However, without a systematic wagering plan, players fall prey to the emotional temptation of chasing high multipliers, leading to rapid drawdown.

### The Double-Down Buffer System
Unlike traditional Martingale models which double the entire stake on a loss, high-rollers employ a segmented buffer approach:
- **Base Unit**: 1% of your total wallet balance.
- **Target Cash-out**: 1.50x multiplier.
- **Loss Progression**: Upon a loss, scale the next wager to 2.2x the previous stake. This allows you to recoup the lost unit and secure a margin at a low 1.50x trigger, avoiding the need for high-risk extensions.

### Automated Trigger Integration
AuraPlay allows you to set auto-bet and auto-cashout parameters. By setting your auto-cashout precisely at **1.35x**, you capitalize on the statistically dominant probability band, where crash-outs below 1.35x occur in less than 18% of game rounds.`,
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
    content: `Return to Player (RTP) is the statistical percentage of wagered money a slot machine pays back to players over a long-term testing cycle. If a game has a 96.5% RTP, it implies that over millions of spins, the system retains a house edge of 3.5%.

### Volatility Indexes
Many players confuse RTP with volatility. Volatility determines *how* the payouts are distributed:
- **High Volatility**: Payouts are infrequent but large. These games are built for players with larger balances who can sustain long dry spells in hopes of hitting 5,000x or 10,000x jackpot caps.
- **Low Volatility**: Payouts are regular but small. These offer steady play sessions and are optimal for clearing wager requirements.`,
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
    content: `Blockchain integration has transformed online casino speed and security parameters. Depositing with Bitcoin (BTC), Ethereum (ETH), or Tether (USDT) bypasses legacy banking delays, offering transaction processing in under 5 minutes.

### The Security Ledger
When you deposit on AuraPlay, your funds are secured in multi-signature cold wallets. This ensures that:
- Centralized server breaches cannot compromise user assets.
- Transactions are executed peer-to-peer, completely eliminating merchant card declines.`,
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
    content: `Outright sports betting markets are often prone to public sentiment inflation. By leveraging trading exchanges instead of traditional sportsbooks, you can lock in value by backing underdogs or laying favorites.

### The Golden Boot Pricing Discrepancy
Historical data shows that outright top scorer lines are heavily weighted toward penalty takers and group stage fixtures. By laying the front-runners early and backing secondary wingers with soft group-stage matches, exchange traders can build high-value portfolios.`,
    category: "Sports",
    image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80",
    date: "June 02, 2026",
    author: "Marco Rossi (European Football)",
    readTime: "9 min read",
    likes: 402
  }
];

export default function BlogPostDetail() {
  const params = useParams();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const postId = params.id as string;
  const post = BLOG_POSTS.find(p => p.id === postId);

  if (!post) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">Article Not Found</h1>
        <p className="text-sm text-slate-500 font-medium mb-6">
          The sporting analysis article you are trying to read might have been archived or moved to a different catalog.
        </p>
        <button 
          onClick={() => router.push("/blog")}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
        >
          Back to Chronicles
        </button>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Select related posts (same category, or random)
  const relatedPosts = BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 2);

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-6 md:gap-8 min-h-screen">
      {/* Reading Progress Bar */}
      <div className="fixed top-14 left-0 w-full h-[3px] bg-slate-100 z-50 pointer-events-none">
        <div 
          className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 transition-all duration-75" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* Back Button */}
      <div>
        <button 
          onClick={() => router.push("/blog")}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Chronicles</span>
        </button>
      </div>

      {/* Article Header */}
      <div className="flex flex-col gap-4">
        <span className="w-max px-3 py-1 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
          {post.category}
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {post.title}
        </h1>
        
        {/* Author / Date info */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 font-semibold border-y border-slate-100 py-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
              <User className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-slate-800 font-bold">{post.author}</span>
          </div>
          <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {post.date}</div>
          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {post.readTime}</div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="relative aspect-[16/9] w-full rounded-[24px] overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
        <img 
          src={post.image} 
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Article Content */}
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium text-sm sm:text-base flex flex-col gap-6">
        {post.content.split('\n\n').map((paragraph, index) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={index} className="text-lg sm:text-xl font-black text-slate-900 mt-4 tracking-tight">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('- ')) {
            return (
              <ul key={index} className="list-disc pl-5 flex flex-col gap-1">
                {paragraph.split('\n').map((li, liIdx) => (
                  <li key={liIdx}>{li.replace('- ', '')}</li>
                ))}
              </ul>
            );
          }
          if (paragraph.startsWith('```')) {
            const lines = paragraph.split('\n');
            const code = lines.slice(1, lines.length - 1).join('\n');
            return (
              <pre key={index} className="bg-white text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                <code>{code}</code>
              </pre>
            );
          }
          return (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          );
        })}
      </div>

      {/* Article Actions / Engagement */}
      <div className="flex items-center justify-between border-t border-slate-200/60 pt-6 mt-4">
        <button 
          onClick={() => setLiked(!liked)}
          className={cn(
            "flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl border transition-all active:scale-95 shadow-sm",
            liked
              ? "bg-red-50 border-red-200 text-red-500"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Heart className={cn("w-4 h-4", liked && "fill-red-500")} />
          <span>{post.likes + (liked ? 1 : 0)} Likes</span>
        </button>

        <button 
          onClick={handleCopyLink}
          className="flex items-center gap-2 text-xs font-black px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all active:scale-95 shadow-sm"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Link Copied!" : "Share Article"}</span>
        </button>
      </div>

      {/* Related Posts Section */}
      <div className="border-t border-slate-100 pt-8 mt-4 flex flex-col gap-6">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
          <BookOpen className="w-5 h-5 text-red-600" /> Recommended Reading
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {relatedPosts.map(related => (
            <Link 
              key={related.id}
              href={`/blog/${related.id}`}
              className="group flex flex-col gap-3 bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
            >
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100">
                <img 
                  src={related.image} 
                  alt={related.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div>
                <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">{related.category}</span>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors leading-tight mt-1 line-clamp-2">
                  {related.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
