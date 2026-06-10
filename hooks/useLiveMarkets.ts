"use client";

import { useState, useEffect } from 'react';

export interface Market {
  id: string;
  category: string;
  sportId?: string;
  title: string;
  volume: string;
  yes: number; // Current YES price (in cents, 1-99)
  no: number;  // Current NO price (100 - yes)
  history: number[]; // Array of last 20 YES prices
  team1Logo?: string;
  team2Logo?: string;
  status: 'live' | 'upcoming';
  startTime?: string;
  image?: string;
  options?: { id: string; name: string; yes: number; no: number }[];
}

const INITIAL_MARKETS: Market[] = [
  // Politics
  { 
    id: "pol-1", category: 'politics', title: "Iran closes its airspace by...?", volume: "$65.9m Vol.", yes: 100, no: 0, history: [100, 100], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Iran_location_map.svg/150px-Iran_location_map.svg.png",
    options: [
      { id: "opt1", name: "June 15", yes: 100, no: 0 },
      { id: "opt2", name: "June 30", yes: 100, no: 0 },
    ]
  },
  { 
    id: "pol-2", category: 'politics', title: "Peru Presidential Election Winner", volume: "$76.9m Vol.", yes: 83, no: 17, history: [80, 83], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Peru.svg/150px-Flag_of_Peru.svg.png",
    options: [
      { id: "opt1", name: "Keiko Fujimori", yes: 83, no: 17 },
      { id: "opt2", name: "Roberto Sánchez", yes: 18, no: 82 },
    ]
  },
  { 
    id: "pol-3", category: 'politics', title: "US x Iran permanent peace deal by...?", volume: "$270.5m Vol.", yes: 69, no: 31, history: [65, 69], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/150px-Flag_of_the_United_States.svg.png",
    options: [
      { id: "opt1", name: "December 31", yes: 69, no: 31 },
      { id: "opt2", name: "October 31", yes: 58, no: 42 },
    ]
  },
  { 
    id: "pol-4", category: 'politics', title: "Israel closes its airspace by...?", volume: "$18.2m Vol.", yes: 20, no: 80, history: [20, 20], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flag_of_Israel.svg/150px-Flag_of_Israel.svg.png",
    options: [
      { id: "opt1", name: "July 15", yes: 20, no: 80 },
      { id: "opt2", name: "June 15", yes: 10, no: 90 },
    ]
  },
  { 
    id: "pol-5", category: 'politics', title: "US announces new Iran agreement/ceasefire extension by...?", volume: "$12.4m Vol.", yes: 10, no: 90, history: [10, 10], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/International_tie.svg/150px-International_tie.svg.png",
    options: [
      { id: "opt1", name: "July 31", yes: 10, no: 90 },
      { id: "opt2", name: "June 30", yes: 10, no: 90 },
    ]
  },
  { 
    id: "pol-6", category: 'finance', title: "Fed Decision in June?", volume: "$13.1m Vol.", yes: 94, no: 6, history: [90, 94], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Jerome_Powell_official_portrait_%28cropped%29.jpg/150px-Jerome_Powell_official_portrait_%28cropped%29.jpg",
    options: [
      { id: "opt1", name: "No Change", yes: 94, no: 6 },
      { id: "opt2", name: "25 Bps Decrease", yes: 6, no: 94 },
    ]
  },
  
  // Crypto
  { 
    id: "cry-1", category: 'crypto', title: "Bitcoin hits $100k by end of 2026?", volume: "$185.9m Vol.", yes: 75, no: 25, history: [70, 75], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/150px-Bitcoin.svg.png",
    options: [
      { id: "opt1", name: "Yes", yes: 75, no: 25 },
      { id: "opt2", name: "No", yes: 25, no: 75 },
    ]
  },
  { 
    id: "cry-2", category: 'crypto', title: "Ethereum ETF approval in Europe?", volume: "$42.1m Vol.", yes: 40, no: 60, history: [35, 40], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Ethereum_logo_2014.svg/150px-Ethereum_logo_2014.svg.png",
    options: [
      { id: "opt1", name: "Approved", yes: 40, no: 60 },
      { id: "opt2", name: "Denied/Delayed", yes: 60, no: 40 },
    ]
  },

  // Trump
  { 
    id: "tru-1", category: 'trump', title: "Will Trump announce a new VP pick early?", volume: "$88.4m Vol.", yes: 15, no: 85, history: [12, 15], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/150px-Donald_Trump_official_portrait.jpg",
    options: [
      { id: "opt1", name: "Yes", yes: 15, no: 85 },
      { id: "opt2", name: "No", yes: 85, no: 15 },
    ]
  },

  // Tech / Earnings
  { 
    id: "tec-1", category: 'tech', title: "Apple to announce new AI hardware?", volume: "$110.2m Vol.", yes: 88, no: 12, history: [85, 88], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/150px-Apple_logo_black.svg.png",
    options: [
      { id: "opt1", name: "Yes", yes: 88, no: 12 },
      { id: "opt2", name: "No", yes: 12, no: 88 },
    ]
  },
  { 
    id: "ear-1", category: 'earnings', title: "NVIDIA beats Q3 earnings estimates?", volume: "$340.5m Vol.", yes: 92, no: 8, history: [90, 92], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/150px-Nvidia_logo.svg.png",
    options: [
      { id: "opt1", name: "Beat", yes: 92, no: 8 },
      { id: "opt2", name: "Miss", yes: 8, no: 92 },
    ]
  },
  


  // Culture, World, Economy, Elections, Geopolitics
  { 
    id: "cul-1", category: 'culture', title: "Will Taylor Swift release Rep TV in 2026?", volume: "$12.4m Vol.", yes: 88, no: 12, history: [80, 88], status: 'live',
    options: [ { id: "opt1", name: "Yes", yes: 88, no: 12 }, { id: "opt2", name: "No", yes: 12, no: 88 } ]
  },
  { 
    id: "wor-1", category: 'world', title: "UN approves new climate pact by Q4?", volume: "$21.9m Vol.", yes: 45, no: 55, history: [40, 45], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/150px-Flag_of_the_United_Nations.svg.png",
    options: [ { id: "opt1", name: "Approved", yes: 45, no: 55 }, { id: "opt2", name: "Delayed", yes: 55, no: 45 } ]
  },
  { 
    id: "eco-1", category: 'economy', title: "US Inflation Drops Below 2.5%?", volume: "$65.2m Vol.", yes: 35, no: 65, history: [30, 35], status: 'live',
    options: [ { id: "opt1", name: "Drops Below", yes: 35, no: 65 }, { id: "opt2", name: "Stays Above", yes: 65, no: 35 } ]
  },
  { 
    id: "ele-1", category: 'elections', title: "UK General Election called for November?", volume: "$32.1m Vol.", yes: 20, no: 80, history: [15, 20], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/en/thumb/a/ae/Flag_of_the_United_Kingdom.svg/150px-Flag_of_the_United_Kingdom.svg.png",
    options: [ { id: "opt1", name: "Yes", yes: 20, no: 80 }, { id: "opt2", name: "No", yes: 80, no: 20 } ]
  },
  { 
    id: "ele-2", category: 'elections', title: "French Presidential Election 2027: Le Pen Wins?", volume: "$14.2m Vol.", yes: 45, no: 55, history: [42, 45], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Flag_of_France.svg/150px-Flag_of_France.svg.png",
    options: [ { id: "opt1", name: "Yes", yes: 45, no: 55 }, { id: "opt2", name: "No", yes: 55, no: 45 } ]
  },
  { 
    id: "geo-1", category: 'geopolitics', title: "EU expands Schengen Zone in 2026?", volume: "$8.4m Vol.", yes: 70, no: 30, history: [65, 70], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/150px-Flag_of_Europe.svg.png",
    options: [ { id: "opt1", name: "Yes", yes: 70, no: 30 }, { id: "opt2", name: "No", yes: 30, no: 70 } ]
  },
  { 
    id: "geo-2", category: 'geopolitics', title: "BRICS to add 3 new members by end of year?", volume: "$45.2m Vol.", yes: 82, no: 18, history: [80, 82], status: 'live',
    options: [ { id: "opt1", name: "Yes", yes: 82, no: 18 }, { id: "opt2", name: "No", yes: 18, no: 82 } ]
  },
  { 
    id: "tec-2", category: 'tech', title: "OpenAI to release GPT-5 before December?", volume: "$210.8m Vol.", yes: 60, no: 40, history: [55, 60], status: 'live',
    options: [ { id: "opt1", name: "Yes", yes: 60, no: 40 }, { id: "opt2", name: "No", yes: 40, no: 60 } ]
  },
  { 
    id: "ear-2", category: 'earnings', title: "Tesla Q4 Deliveries Beat Estimates?", volume: "$120.4m Vol.", yes: 48, no: 52, history: [50, 48], status: 'live',
    options: [ { id: "opt1", name: "Beat", yes: 48, no: 52 }, { id: "opt2", name: "Miss", yes: 52, no: 48 } ]
  },
  { 
    id: "tru-2", category: 'trump', title: "Trump to launch another social media platform?", volume: "$18.9m Vol.", yes: 30, no: 70, history: [25, 30], status: 'live',
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/150px-Donald_Trump_official_portrait.jpg",
    options: [ { id: "opt1", name: "Yes", yes: 30, no: 70 }, { id: "opt2", name: "No", yes: 70, no: 30 } ]
  },
  { 
    id: "fin-2", category: 'finance', title: "S&P 500 Closes Above 6000 by year end?", volume: "$412.5m Vol.", yes: 85, no: 15, history: [82, 85], status: 'live',
    options: [ { id: "opt1", name: "Yes", yes: 85, no: 15 }, { id: "opt2", name: "No", yes: 15, no: 85 } ]
  },
  
  // Cricket (IPL / Internationals)
  { id: "spo-cri-1", category: 'sports', sportId: 'cricket', title: "Chennai Super Kings vs Mumbai Indians", volume: "₹ 45.2M", yes: 48, no: 52, history: [45, 46, 48], team1Logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/120px-Chennai_Super_Kings_Logo.svg.png", team2Logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/120px-Mumbai_Indians_Logo.svg.png", status: 'live' },
  { id: "spo-cri-2", category: 'sports', sportId: 'cricket', title: "Royal Challengers vs Kolkata Knight Riders", volume: "₹ 38.1M", yes: 55, no: 45, history: [50, 52, 55], team1Logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Royal_Challengers_Bengaluru_logo.png/120px-Royal_Challengers_Bengaluru_logo.png", team2Logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/120px-Kolkata_Knight_Riders_Logo.svg.png", status: 'upcoming', startTime: 'Today, 19:30 IST' },
  { id: "spo-cri-3", category: 'sports', sportId: 'cricket', title: "India vs Australia (T20)", volume: "₹ 85.5M", yes: 65, no: 35, history: [60, 62, 65], team1Logo: "https://flagcdn.com/w40/in.png", team2Logo: "https://flagcdn.com/w40/au.png", status: 'upcoming', startTime: 'Tomorrow, 14:00 IST' },

  // Kabaddi (Pro Kabaddi)
  { id: "spo-kab-1", category: 'sports', sportId: 'kabaddi', title: "Patna Pirates vs Puneri Paltan", volume: "₹ 12.1M", yes: 60, no: 40, history: [55, 58, 60], team1Logo: "https://ui-avatars.com/api/?name=Patna+Pirates&background=0D8ABC&color=fff", team2Logo: "https://ui-avatars.com/api/?name=Puneri+Paltan&background=F37021&color=fff", status: 'live' },
  { id: "spo-kab-2", category: 'sports', sportId: 'kabaddi', title: "Bengaluru Bulls vs Jaipur Panthers", volume: "₹ 8.4M", yes: 45, no: 55, history: [40, 42, 45], team1Logo: "https://ui-avatars.com/api/?name=Bengaluru+Bulls&background=E53935&color=fff", team2Logo: "https://ui-avatars.com/api/?name=Jaipur+Panthers&background=E91E63&color=fff", status: 'upcoming', startTime: 'Today, 20:30 IST' },

  // Football (ISL)
  { id: "spo-isl-1", category: 'sports', sportId: 'football', title: "Mohun Bagan SG vs Mumbai City FC", volume: "₹ 9.5M", yes: 52, no: 48, history: [50, 51, 52], team1Logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/Mohun_Bagan_Super_Giant_logo.svg/120px-Mohun_Bagan_Super_Giant_logo.svg.png", team2Logo: "https://ui-avatars.com/api/?name=Mumbai+City&background=03A9F4&color=fff", status: 'live' },
  { id: "spo-isl-2", category: 'sports', sportId: 'football', title: "Kerala Blasters vs Bengaluru FC", volume: "₹ 11.2M", yes: 58, no: 42, history: [55, 56, 58], team1Logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Kerala_Blasters_FC_logo.svg/120px-Kerala_Blasters_FC_logo.svg.png", team2Logo: "https://ui-avatars.com/api/?name=Bengaluru+FC&background=0D47A1&color=fff", status: 'upcoming', startTime: 'Sunday, 19:30 IST' },

  // BGMI (Esports)
  { id: "spo-bgmi-1", category: 'sports', sportId: 'bgmi', title: "Team Soul vs GodLike Esports", volume: "₹ 15.4M", yes: 55, no: 45, history: [50, 52, 55], team1Logo: "https://ui-avatars.com/api/?name=Team+Soul&background=000&color=fff", team2Logo: "https://ui-avatars.com/api/?name=GodLike&background=FFD700&color=000", status: 'live' },

  // Badminton
  { id: "spo-bad-1", category: 'sports', sportId: 'badminton', title: "Satwik/Chirag vs Liang/Wang", volume: "₹ 5.2M", yes: 65, no: 35, history: [60, 62, 65], team1Logo: "https://flagcdn.com/w40/in.png", team2Logo: "https://flagcdn.com/w40/cn.png", status: 'live' },
  { id: "spo-bad-2", category: 'sports', sportId: 'badminton', title: "PV Sindhu vs Tai Tzu Ying", volume: "₹ 6.8M", yes: 48, no: 52, history: [45, 46, 48], team1Logo: "https://flagcdn.com/w40/in.png", team2Logo: "https://flagcdn.com/w40/tw.png", status: 'upcoming', startTime: 'Tomorrow, 10:00 IST' },

  // Chess
  { id: "spo-che-1", category: 'sports', sportId: 'chess', title: "D. Gukesh vs Magnus Carlsen", volume: "₹ 8.9M", yes: 42, no: 58, history: [40, 41, 42], team1Logo: "https://flagcdn.com/w40/in.png", team2Logo: "https://flagcdn.com/w40/no.png", status: 'live' },

  // Hockey
  { id: "spo-hoc-1", category: 'sports', sportId: 'hockey', title: "India vs Pakistan (Final)", volume: "₹ 22.1M", yes: 75, no: 25, history: [70, 72, 75], team1Logo: "https://flagcdn.com/w40/in.png", team2Logo: "https://flagcdn.com/w40/pk.png", status: 'upcoming', startTime: 'Saturday, 18:00 IST' },
];

// Global market state (outside component so it persists across navigations)
let globalMarkets = [...INITIAL_MARKETS];
let isSportsScraped = false;

// Helper to convert decimal odds to implied probability (YES price: 1-99)
function calculateYesPrice(odds1: number, odds2: number): number {
  if (!odds1 || !odds2) return 50;
  const p1 = 1 / odds1;
  const p2 = 1 / odds2;
  const total = p1 + p2;
  if (total <= 0) return 50;
  const yes = Math.round((p1 / total) * 100);
  return Math.min(99, Math.max(1, yes));
}

export function useLiveMarkets(categoryFilter?: string) {
  const [markets, setMarkets] = useState<Market[]>(globalMarkets);

  // Fetch live sports matches and merge them into predictions state
  useEffect(() => {
    const fetchLiveSports = async () => {
      if (isSportsScraped) return;
      try {
        const res = await fetch("/api/sports/live?sport=all");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const cricket = data.cricket || [];
            const tennis = data.tennis || [];
            
            const scrapedMarkets: Market[] = [];
            
            cricket.forEach((m: any) => {
              const yesPrice = calculateYesPrice(m.odds.team1, m.odds.team2);
              scrapedMarkets.push({
                id: `scraped-cri-${m.id}`,
                category: 'sports',
                sportId: 'cricket',
                title: `${m.team1} vs ${m.team2}`,
                volume: `₹ ${(Math.random() * 40 + 10).toFixed(1)}M`,
                yes: yesPrice,
                no: 100 - yesPrice,
                history: [yesPrice - 2, yesPrice - 1, yesPrice],
                status: m.status.toLowerCase() as 'live' | 'upcoming',
                startTime: m.status === 'Upcoming' ? m.score : undefined
              });
            });

            tennis.forEach((m: any) => {
              const yesPrice = calculateYesPrice(m.odds.team1, m.odds.team2);
              scrapedMarkets.push({
                id: `scraped-ten-${m.id}`,
                category: 'sports',
                sportId: 'tennis',
                title: `${m.team1} vs ${m.team2}`,
                volume: `₹ ${(Math.random() * 20 + 5).toFixed(1)}M`,
                yes: yesPrice,
                no: 100 - yesPrice,
                history: [yesPrice - 1, yesPrice + 1, yesPrice],
                status: m.status.toLowerCase() as 'live' | 'upcoming',
                startTime: m.status === 'Upcoming' ? m.score : undefined
              });
            });

            // Keep non-sports predictions + other simulated sports predictions (except simulated cricket/tennis)
            const otherMarkets = globalMarkets.filter(m => 
              m.category !== 'sports' || 
              (m.id.startsWith('spo-') && !m.id.includes('cri') && !m.id.includes('ten'))
            );
            
            globalMarkets = [...otherMarkets, ...scrapedMarkets];
            setMarkets([...globalMarkets]);
            isSportsScraped = true;
          }
        }
      } catch (err) {
        console.error("Failed to load scraped sports for predictions:", err);
      }
    };
    
    fetchLiveSports();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      globalMarkets = globalMarkets.map(market => {
        // Random walk: 30% chance to move up or down by 1-3 cents
        if (Math.random() > 0.7) {
          const change = Math.floor(Math.random() * 3) + 1;
          const direction = Math.random() > 0.5 ? 1 : -1;
          
          let newYes = market.yes + (change * direction);
          
          // Clamp between 1 and 99
          if (newYes >= 99) newYes = 99;
          if (newYes <= 1) newYes = 1;

          const newHistory = [...market.history, newYes];
          if (newHistory.length > 30) newHistory.shift(); // Keep last 30 data points

          const newOptions = market.options?.map(opt => {
            if (Math.random() > 0.5) return opt;
            const optChange = Math.floor(Math.random() * 3) + 1;
            const optDir = Math.random() > 0.5 ? 1 : -1;
            let optYes = opt.yes + (optChange * optDir);
            if (optYes >= 99) optYes = 99;
            if (optYes <= 1) optYes = 1;
            return { ...opt, yes: optYes, no: 100 - optYes };
          });

          return {
            ...market,
            yes: newYes,
            no: 100 - newYes,
            history: newHistory,
            options: newOptions
          };
        }
        return market;
      });

      setMarkets([...globalMarkets]);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  if (categoryFilter) {
    const filterLower = categoryFilter.toLowerCase();
    if (filterLower === 'trending' || filterLower === 'featured') {
      // Return a mix of popular markets for trending/featured
      return markets.slice(0, 16); 
    }
    return markets.filter(m => m.category.toLowerCase() === filterLower);
  }
  
  return markets;
}
