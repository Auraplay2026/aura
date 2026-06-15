import { NextResponse } from "next/server";
import { generateMatches, Match } from "@/lib/sportsData";

export const dynamic = "force-dynamic";

// Extended Match type to support optional logos and sport classification
export type ExtendedMatch = Match & {
  team1Logo?: string;
  team2Logo?: string;
  sport?: string;
};

// Standardizes ESPN scoreboard data to ExtendedMatch
function parseESPNEvent(event: any, sportKey: string): ExtendedMatch | null {
  try {
    const competition = event.competitions?.[0];
    if (!competition) return null;

    const competitors = competition.competitors || [];
    if (competitors.length < 2) return null;

    // Home is usually competitors[0] or competitors[1] depending on homeAway property
    const homeTeamObj = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
    const awayTeamObj = competitors.find((c: any) => c.homeAway === "away") || competitors[1];

    const team1 = homeTeamObj.team?.displayName || "Home Team";
    const team2 = awayTeamObj.team?.displayName || "Away Team";
    const team1Logo = homeTeamObj.team?.logo;
    const team2Logo = awayTeamObj.team?.logo;

    const state = event.status?.type?.state; // "pre" | "in" | "post"
    const status: "Live" | "Upcoming" = state === "in" ? "Live" : "Upcoming";

    // Format scores based on sport
    let score = "";
    if (state === "in") {
      const score1 = homeTeamObj.score || "0";
      const score2 = awayTeamObj.score || "0";
      const clock = event.status?.displayClock || "";
      const period = event.status?.period ? `P${event.status.period}` : "";
      
      if (sportKey === "soccer") {
        score = `${score1} - ${score2} (${clock || period})`;
      } else if (sportKey === "basketball") {
        score = `${period || "Live"} ${score1}-${score2}`;
      } else if (sportKey === "tennis") {
        score = `Sets: ${score1}-${score2}`;
      } else {
        score = `${score1} - ${score2}`;
      }
    } else if (state === "post") {
      const score1 = homeTeamObj.score || "0";
      const score2 = awayTeamObj.score || "0";
      score = `FT ${score1}-${score2}`;
    } else {
      // Upcoming
      const date = new Date(event.date);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const day = days[date.getDay()];
      const hour = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      score = `${day}, ${hour}:${min}`;
    }

    // Generate semi-realistic deterministic odds based on scores or seed
    const scoreVal1 = parseFloat(homeTeamObj.score || "0") || 0;
    const scoreVal2 = parseFloat(awayTeamObj.score || "0") || 0;
    const diff = scoreVal1 - scoreVal2;

    let o1 = 2.0;
    let o2 = 2.0;
    let oDraw: number | null = sportKey === "soccer" ? 3.2 : null;

    if (state === "in") {
      if (diff > 0) {
        o1 = Math.max(1.05, 1.8 - diff * 0.4);
        o2 = Math.min(20, 2.5 + diff * 2);
        if (oDraw) oDraw = Math.min(15, 3.0 + diff * 1.5);
      } else if (diff < 0) {
        const absDiff = Math.abs(diff);
        o1 = Math.min(20, 2.5 + absDiff * 2);
        o2 = Math.max(1.05, 1.8 - absDiff * 0.4);
        if (oDraw) oDraw = Math.min(15, 3.0 + absDiff * 1.5);
      } else {
        o1 = 2.2;
        o2 = 2.2;
        if (oDraw) oDraw = 2.5;
      }
    } else {
      // Upcoming, generate randomly but seeded on event id
      let eventSeed = 0;
      const idStr = String(event.id);
      for (let i = 0; i < idStr.length; i++) {
        eventSeed += idStr.charCodeAt(i);
      }
      const rand1 = ((Math.sin(eventSeed) + 1) / 2) * 3; // 0 to 3
      const rand2 = ((Math.cos(eventSeed) + 1) / 2) * 3; // 0 to 3
      
      o1 = parseFloat((1.2 + rand1).toFixed(2));
      o2 = parseFloat((1.2 + rand2).toFixed(2));
      if (oDraw) {
        oDraw = parseFloat((2.0 + ((rand1 + rand2) / 2)).toFixed(2));
      }
    }

    // Rounding
    o1 = parseFloat(o1.toFixed(2));
    o2 = parseFloat(o2.toFixed(2));
    if (oDraw) oDraw = parseFloat(oDraw.toFixed(2));

    const id = parseInt(event.id) || Math.floor(Math.random() * 1000000);

    return {
      id,
      team1,
      team2,
      team1Logo,
      team2Logo,
      status: status,
      score,
      odds: {
        team1: o1,
        draw: oDraw,
        team2: o2
      },
      trend: { team1: 'none', draw: oDraw ? 'none' : null, team2: 'none' },
      sport: sportKey
    };
  } catch (e) {
    console.error("Error parsing ESPN event:", e);
    return null;
  }
}

async function fetchESPINScoreboard(url: string, sportKey: string): Promise<ExtendedMatch[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 30 } // Cache for 30s
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    const events = data.events || [];
    const parsed: ExtendedMatch[] = [];

    for (const event of events) {
      const match = parseESPNEvent(event, sportKey);
      if (match) parsed.push(match);
    }
    return parsed;
  } catch (err) {
    console.error(`ESPN Scoreboard fetch failed for ${url}:`, err);
    return [];
  }
}

async function fetchSoccerMatches(): Promise<ExtendedMatch[]> {
  // Aggregate top worldwide soccer leagues
  const urls = [
    { url: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard", name: "EPL" },
    { url: "https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard", name: "LaLiga" },
    { url: "https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard", name: "SerieA" },
    { url: "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard", name: "UCL" },
    { url: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard", name: "MLS" }
  ];

  const allMatches: ExtendedMatch[] = [];
  const promises = urls.map(item => fetchESPINScoreboard(item.url, "soccer"));
  const results = await Promise.all(promises);

  results.forEach(matches => {
    allMatches.push(...matches);
  });

  return allMatches;
}

async function fetchBasketballMatches(): Promise<ExtendedMatch[]> {
  return fetchESPINScoreboard("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard", "basketball");
}

async function fetchTennisMatches(): Promise<ExtendedMatch[]> {
  const atp = await fetchESPINScoreboard("https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard", "tennis");
  const wta = await fetchESPINScoreboard("https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard", "tennis");
  return [...atp, ...wta];
}

// Scrape Cricket live scores from Cricbuzz
async function fetchCricketMatches(): Promise<ExtendedMatch[]> {
  try {
    const res = await fetch("https://www.cricbuzz.com/cricket-match/live-scores", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      next: { revalidate: 30 }
    });
    
    if (!res.ok) {
      throw new Error(`Cricbuzz returned status ${res.status}`);
    }
    
    const html = await res.text();
    // Regex for matching cricket links & descriptions
    const regex = /<a title="([^"]+)" href="(\/live-cricket-scores\/\d+\/[a-z0-9-]+)"/g;
    let match;
    const matches: ExtendedMatch[] = [];

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
          team1Logo: `https://www.cricbuzz.com/a/img/v1/72x72/i1/c${Math.floor(Math.random() * 20) + 1}/flag.jpg`, // Cricbuzz default random flags
          team2Logo: `https://www.cricbuzz.com/a/img/v1/72x72/i1/c${Math.floor(Math.random() * 20) + 21}/flag.jpg`,
          status,
          score,
          odds: {
            team1: parseFloat(odds1.toFixed(2)),
            draw: parseFloat(oddsDraw.toFixed(2)),
            team2: parseFloat(odds2.toFixed(2))
          },
          trend: { team1: 'none', draw: 'none', team2: 'none' },
          sport: 'cricket'
        });
      }
    }

    // Remove duplicates
    const uniqueMatches: ExtendedMatch[] = [];
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sport = (searchParams.get("sport") || "all").toLowerCase();

    let matches: ExtendedMatch[] = [];

    if (sport === "soccer") {
      matches = await fetchSoccerMatches();
      if (matches.length === 0) {
        matches = generateMatches("soccer", 15);
      }
      matches = matches.map(m => ({ ...m, sport: "soccer" }));
    } else if (sport === "basketball") {
      matches = await fetchBasketballMatches();
      if (matches.length === 0) {
        matches = generateMatches("basketball", 12);
      }
      matches = matches.map(m => ({ ...m, sport: "basketball" }));
    } else if (sport === "tennis") {
      matches = await fetchTennisMatches();
      if (matches.length === 0) {
        matches = generateMatches("tennis", 10);
      }
      matches = matches.map(m => ({ ...m, sport: "tennis" }));
    } else if (sport === "cricket") {
      matches = await fetchCricketMatches();
      if (matches.length === 0) {
        matches = generateMatches("cricket", 10);
      }
      matches = matches.map(m => ({ ...m, sport: "cricket" }));
    } else {
      // "all" or combined
      const soc = (await fetchSoccerMatches()).map(m => ({ ...m, sport: "soccer" }));
      const bas = (await fetchBasketballMatches()).map(m => ({ ...m, sport: "basketball" }));
      const ten = (await fetchTennisMatches()).map(m => ({ ...m, sport: "tennis" }));
      const cri = (await fetchCricketMatches()).map(m => ({ ...m, sport: "cricket" }));
      matches = [...soc, ...bas, ...ten, ...cri];
      if (matches.length === 0) {
        matches = [
          ...generateMatches("soccer", 5).map(m => ({ ...m, sport: "soccer" })),
          ...generateMatches("basketball", 5).map(m => ({ ...m, sport: "basketball" })),
          ...generateMatches("tennis", 5).map(m => ({ ...m, sport: "tennis" })),
          ...generateMatches("cricket", 5).map(m => ({ ...m, sport: "cricket" }))
        ];
      }
    }

    // Ensure all matches have valid logos (fallbacks if ESPN/Cricbuzz doesn't supply one)
    const processed = matches.map(m => {
      const isSoccer = m.sport === "soccer";
      const isCricket = m.sport === "cricket";
      
      let fallback1 = "";
      let fallback2 = "";
      if (isSoccer) {
        fallback1 = `https://a.espncdn.com/i/teamlogos/soccer/500/default-soccer.png`;
        fallback2 = `https://a.espncdn.com/i/teamlogos/soccer/500/default-soccer.png`;
      } else if (isCricket) {
        fallback1 = `https://www.cricbuzz.com/a/img/v1/72x72/i1/c1/flag.jpg`;
        fallback2 = `https://www.cricbuzz.com/a/img/v1/72x72/i1/c2/flag.jpg`;
      } else {
        fallback1 = `https://a.espncdn.com/i/teamlogos/default-team-logo-500.png`;
        fallback2 = `https://a.espncdn.com/i/teamlogos/default-team-logo-500.png`;
      }

      return {
        ...m,
        team1Logo: m.team1Logo || fallback1,
        team2Logo: m.team2Logo || fallback2
      };
    });

    return NextResponse.json({ success: true, matches: processed });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
