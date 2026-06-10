import { NextResponse } from "next/server";
import { generateMatches, Match } from "@/lib/sportsData";

export const dynamic = "force-dynamic";

const TENNIS_PLAYERS = [
  "Williams", "Raducanu", "Draper", "Alcaraz", "Sinner", "Djokovic", "Nadal", 
  "Swiatek", "Sabalenka", "Gauff", "Medvedev", "Zverev", "Ruud", "Rublev", 
  "Tsitsipas", "Jabeur", "Rybakina", "Pegula", "Sakkari", "Badosa", "Murray", 
  "Osaka", "Halep", "Fernandez", "Kenin", "Andreescu", "Wozniacki", "Kerber", 
  "Mboko", "Federer", "Sharapova", "Dimitrov", "Hurkacz", "De Minaur", "Fritz"
];

// Helper to fetch and parse Cricket scores
async function fetchCricketMatches(): Promise<Match[]> {
  try {
    const res = await fetch("https://www.cricbuzz.com/cricket-match/live-scores", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      next: { revalidate: 30 } // cache for 30 seconds
    });
    
    if (!res.ok) {
      throw new Error(`Cricbuzz returned status ${res.status}`);
    }
    
    const html = await res.text();
    const regex = /<a title="([^"]+)" href="(\/live-cricket-scores\/\d+\/[a-z0-9-]+)"/g;
    let match;
    const matches: Match[] = [];

    while ((match = regex.exec(html)) !== null) {
      const title = match[1];
      const url = match[2];

      const parts = title.split(' vs ');
      if (parts.length >= 2) {
        const team1 = parts[0].trim();
        const rest = parts[1];
        
        const commaParts = rest.split(',');
        const team2 = commaParts[0].trim();
        
        const restText = commaParts.slice(1).join(',');
        const dashParts = restText.split(' - ');
        
        let statusText = "Live";
        if (dashParts.length >= 2) {
          statusText = dashParts[1].trim();
        } else {
          statusText = restText.trim();
        }

        let status: "Live" | "Upcoming" = "Live";
        let score = statusText;

        if (statusText.toLowerCase().includes('preview') || statusText.toLowerCase().includes('upcoming') || statusText.toLowerCase().includes('starts')) {
          status = "Upcoming";
          score = "Upcoming match";
        } else if (statusText.toLowerCase().includes('won') || statusText.toLowerCase().includes('tied') || statusText.toLowerCase().includes('draw') || statusText.toLowerCase().includes('abandon') || statusText.toLowerCase().includes('no result')) {
          status = "Upcoming"; 
          score = statusText; 
        } else {
          status = "Live";
          score = statusText; 
        }

        const odds1 = 1.2 + Math.random() * 3.5;
        const odds2 = 1.2 + Math.random() * 3.5;
        const oddsDraw = 2.5 + Math.random() * 3.5;

        matches.push({
          id: Math.abs(parseInt(url.split('/')[2])) || Math.floor(Math.random() * 1000000),
          team1,
          team2,
          status,
          score,
          odds: {
            team1: parseFloat(odds1.toFixed(2)),
            draw: parseFloat(oddsDraw.toFixed(2)),
            team2: parseFloat(odds2.toFixed(2))
          },
          trend: { team1: 'none', draw: 'none', team2: 'none' }
        });
      }
    }

    // Remove duplicates
    const uniqueMatches: Match[] = [];
    const seenIds = new Set<number>();
    for (const m of matches) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        uniqueMatches.push(m);
      }
    }
    
    return uniqueMatches;
  } catch (err) {
    console.error("Scrape Cricket Error:", err);
    return [];
  }
}

// Helper to fetch and parse Tennis scores
async function fetchTennisMatches(): Promise<Match[]> {
  try {
    const res = await fetch("https://feeds.bbci.co.uk/sport/tennis/rss.xml", {
      next: { revalidate: 30 } // cache for 30 seconds
    });
    
    if (!res.ok) {
      throw new Error(`BBC Tennis RSS returned status ${res.status}`);
    }
    
    const xml = await res.text();
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);
    if (!itemMatches) return [];

    const matches: Match[] = [];
    let idCounter = 200000;

    for (const item of itemMatches) {
      const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/);
      if (!titleMatch) continue;
      
      const title = titleMatch[1];
      
      const foundPlayers: string[] = [];
      for (const player of TENNIS_PLAYERS) {
        const regex = new RegExp(`\\b${player}\\b`, 'i');
        if (regex.test(title)) {
          foundPlayers.push(player);
        }
      }

      if (foundPlayers.length === 0) continue;

      let player1 = foundPlayers[0];
      let player2 = "";

      if (foundPlayers.length >= 2) {
        player2 = foundPlayers[1];
      } else {
        let sum = 0;
        for (let i = 0; i < player1.length; i++) sum += player1.charCodeAt(i);
        
        const choices = TENNIS_PLAYERS.filter(p => p !== player1);
        player2 = choices[sum % choices.length];
      }

      let status: "Live" | "Upcoming" = "Upcoming";
      const liveWords = ["win", "beat", "victory", "defeat", "match", "leads", "cruises", "through", "progresses", "dominates", "advances"];
      const lowerTitle = title.toLowerCase();
      if (liveWords.some(word => lowerTitle.includes(word))) {
        status = "Live";
      }

      let score = "";
      if (status === "Live") {
        const setNum = (title.length % 3) + 1;
        const set1_1 = 6;
        const set1_2 = Math.min(6, (title.length % 5) + 1);
        const set2_1 = title.length % 2 === 0 ? 6 : Math.min(6, (title.length % 4) + 1);
        const set2_2 = title.length % 2 === 0 ? Math.min(6, (title.length % 4) + 1) : 6;
        score = `Set ${setNum} (${set1_1}-${set1_2}, ${set2_1}-${set2_2})`;
      } else {
        score = "Upcoming match";
      }

      const odds1 = 1.1 + (title.length % 40) / 10;
      const odds2 = 1.1 + (title.length % 30) / 10;

      matches.push({
        id: idCounter++,
        team1: player1,
        team2: player2,
        status,
        score,
        odds: {
          team1: parseFloat(odds1.toFixed(2)),
          draw: null,
          team2: parseFloat(odds2.toFixed(2))
        },
        trend: { team1: 'none', draw: null, team2: 'none' }
      });
    }

    const uniqueMatches: Match[] = [];
    const seenNames = new Set<string>();
    for (const m of matches) {
      const matchKey = [m.team1, m.team2].sort().join('-vs-');
      if (!seenNames.has(matchKey)) {
        seenNames.add(matchKey);
        uniqueMatches.push(m);
      }
    }

    return uniqueMatches;
  } catch (err) {
    console.error("Scrape Tennis Error:", err);
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get("sport") || "all";

    let cricketScraped: Match[] = [];
    let tennisScraped: Match[] = [];

    if (sport === "cricket" || sport === "all") {
      cricketScraped = await fetchCricketMatches();
      // Fallback if scraping is empty
      if (cricketScraped.length === 0) {
        cricketScraped = generateMatches("cricket", 10);
      }
    }

    if (sport === "tennis" || sport === "all") {
      tennisScraped = await fetchTennisMatches();
      // Fallback if scraping is empty
      if (tennisScraped.length === 0) {
        tennisScraped = generateMatches("tennis", 10);
      }
    }

    if (sport === "cricket") {
      return NextResponse.json({ success: true, matches: cricketScraped });
    }

    if (sport === "tennis") {
      return NextResponse.json({ success: true, matches: tennisScraped });
    }

    return NextResponse.json({
      success: true,
      cricket: cricketScraped,
      tennis: tennisScraped
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
