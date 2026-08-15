import { CricketOddsEngine } from "./cricketOddsEngine";

export type Match = {
  id: number;
  team1: string;
  team2: string;
  status: "Live" | "Upcoming";
  score: string;
  odds: { team1: number; draw: number | null; team2: number };
  trend: { team1: 'up'|'down'|'none'; draw: 'up'|'down'|'none' | null; team2: 'up'|'down'|'none' };
  dateStr?: string; // "2026-08-14"
  displayDate?: string; // "Fri, 14 Aug 2026"
  timeStr?: string; // "10:00 AM" or "07:30 PM"
  seriesName?: string; // "The Hundred 2026"
  matchFormat?: string; // "T20" | "TEST" | "ODI" | "EPL" | "NBA" | "ATP"
  sport?: string;
  team1Logo?: string;
  team2Logo?: string;
};

const TEAMS = {
  soccer: [
    "Arsenal", "Manchester City", "Real Madrid", "Paris Saint-Germain", "Chelsea",
    "Liverpool", "Mohun Bagan SG", "Mumbai City FC", "Kerala Blasters FC", "East Bengal FC",
    "Coventry City", "FC Barcelona", "Bayern Munich", "Juventus", "Inter Milan"
  ],
  basketball: [
    "Miami Heat", "Toronto Raptors", "Los Angeles Lakers", "Golden State Warriors", "Boston Celtics",
    "Milwaukee Bucks", "Denver Nuggets", "Phoenix Suns", "Dallas Mavericks", "Chicago Bulls"
  ],
  tennis: [
    "Novak Djokovic", "Carlos Alcaraz", "Jannik Sinner", "Alexander Zverev", "Daniil Medvedev",
    "Iga Swiatek", "Aryna Sabalenka", "Coco Gauff", "Rohan Bopanna", "Sumit Nagal"
  ],
  esports: [
    "Team Soul", "GodLike Esports", "Global Esports", "Entity Gaming", "Blind Esports",
    "T1", "Gen.G", "Sentinels", "Paper Rex", "Fnatic"
  ],
  cricket: [
    "Mumbai", "Tamil Nadu", "Karnataka", "Delhi", "Saurashtra", "Bengal", "Baroda", "Vidarbha", 
    "Dindigul Dragons", "Chepauk Super Gillies", "Lyca Kovai Kings", "Nellai Royal Kings", "Siechem Madurai Panthers",
    "East Delhi Riders", "South Delhi Superstarz", "Central Delhi Kings", "North Delhi Strikers", "Purani Dilli 6",
    "Chennai Super Kings", "Mumbai Indians", "Royal Challengers Bengaluru", "Kolkata Knight Riders", "Gujarat Titans",
    "Rajasthan Royals", "Sunrisers Hyderabad", "Delhi Capitals", "Punjab Kings", "Lucknow Super Giants",
    "India", "Australia", "England", "South Africa", "Pakistan", "New Zealand", "Sri Lanka", "Afghanistan"
  ],
  "table tennis": [
    "Sharath Kamal", "Sathiyan Gnanasekaran", "Harmeet Desai", "Manav Thakkar", "Sanil Shetty",
    "Manika Batra", "Sreeja Akula", "Ayhika Mukherjee", "Sutirtha Mukherjee", "Diya Chitale"
  ]
};

const TOURNAMENTS_BY_SPORT: Record<string, string[]> = {
  cricket: [
    "Assam Premier League",
    "Big Bash League",
    "Delhi Premier League",
    "German Super League T10",
    "ICC Cricket World Cup Challenge League",
    "ICC Men's T20 WC Europe Qualifier",
    "Indian Premier League SRL",
    "International Twenty20 Matches",
    "Metro Bank Womens One Day Cup",
    "Netherlands Topklasse T20",
    "One Day Internationals",
    "Pakistan Super League SRL",
    "Ranji Trophy",
    "SA20 SRL",
    "Super Smash SRL",
    "T20 International SRL",
    "Tamil Nadu Premier League",
    "Test Matches",
    "The Hundred 2026"
  ],
  soccer: [
    "English Premier League",
    "Spanish La Liga",
    "Italian Serie A",
    "German Bundesliga",
    "French Ligue 1",
    "UEFA Champions League",
    "Portuguese Primeira Liga",
    "Austrian Bundesliga",
    "Belgian Pro League",
    "Brazilian Serie A",
    "CONMEBOL Copa Libertadores",
    "English Sky Bet Championship"
  ],
  tennis: [
    "ATP Cincinnati 2026",
    "WTA Cincinnati 2026",
    "Asiago Challenger 2026",
    "Bloomsburg Challenger 2026",
    "Hamburg Challenger 2026",
    "Men's Wimbledon 2027",
    "Women's Wimbledon 2027",
    "US Open 2026"
  ],
  esports: [
    "GT Sports Leagues",
    "Battle Champions League",
    "Volta e-Tournaments"
  ]
};

// Seeded random number generator
let seed = 12345;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function shuffle(array: any[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMatches(sportName: string, count: number): Match[] {
  const key = sportName.toLowerCase() === "all" ? "cricket" : sportName.toLowerCase() === "football" ? "soccer" : sportName.toLowerCase();
  
  let teamList = (TEAMS as any)[key];
  if (!teamList) {
    const foundKey = Object.keys(TEAMS).find(k => k.includes(key) || key.includes(k));
    teamList = foundKey ? (TEAMS as any)[foundKey] : TEAMS.soccer;
  }

  seed = parseInt(sportName.split("").reduce((acc, char) => acc + char.charCodeAt(0).toString(), "0").slice(0, 5)) || 1234;
  
  const shuffledTeams = shuffle(teamList);
  const matches: Match[] = [];
  const supportsDraw = key === "soccer" || key === "cricket" || key === "football";

  let idCounter = seed * 10;
  let teamIndex = 0;
  const baseDate = new Date("2026-08-14T00:00:00Z");

  const tournamentList = TOURNAMENTS_BY_SPORT[key] || TOURNAMENTS_BY_SPORT.cricket;
  const targetCount = Math.max(count, tournamentList.length * 2);

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < targetCount; i++) {
    if (teamIndex + 1 >= shuffledTeams.length) {
      teamIndex = 0; 
      shuffle(shuffledTeams);
    }

    const team1 = shuffledTeams[teamIndex];
    const team2 = shuffledTeams[teamIndex + 1];
    teamIndex += 2;

    const seriesName = tournamentList[i % tournamentList.length];
    const isLive = i < Math.floor(tournamentList.length * 0.7); // Guarantee active live coverage across top leagues
    
    // Distribute upcoming matches across Days 0 to 7
    const dayOffset = isLive ? 0 : (i % 3);
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + dayOffset);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dayNum = String(targetDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayNum}`;
    const displayDate = `${DAYS[targetDate.getDay()]}, ${targetDate.getDate()} ${MONTHS[targetDate.getMonth()]} ${year}`;

    const hours = [10, 13, 15, 17, 19, 20, 22];
    const minutes = ["00", "30"];
    const hour = hours[i % hours.length];
    const min = minutes[i % minutes.length];
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const timeStr = `${String(displayHour).padStart(2, "0")}:${min} ${ampm}`;

    let matchFormat = "T20";
    if (seriesName.toLowerCase().includes("test") || seriesName.toLowerCase().includes("ranji")) matchFormat = "TEST";
    else if (seriesName.toLowerCase().includes("one day") || seriesName.toLowerCase().includes("odi")) matchFormat = "ODI";
    else if (seriesName.toLowerCase().includes("t10")) matchFormat = "T10";
    else if (seriesName.toLowerCase().includes("hundred")) matchFormat = "100_BALL";

    let score = "";
    let odds1 = 2.10;
    let odds2 = 2.30;
    let oddsDraw: number | null = supportsDraw ? 3.20 : null;

    if (isLive) {
      if (key === "cricket") {
        const oversVal = parseFloat((Math.floor(random() * 15) + 3 + (Math.floor(random() * 6) / 10)).toFixed(1));
        const runsVal = Math.floor(oversVal * 7.8) + Math.floor(random() * 20);
        const wicketsVal = Math.floor(random() * 4) + 1;
        score = `${runsVal}/${wicketsVal} (${oversVal} ov)`;

        const calculated = CricketOddsEngine.calculateOdds({
          format: matchFormat as any,
          inningsNumber: 1,
          battingTeamName: team1,
          bowlingTeamName: team2,
          runs: runsVal,
          wickets: wicketsVal,
          overs: oversVal,
          totalOvers: matchFormat === "TEST" ? 90 : matchFormat === "ODI" ? 50 : 20
        });

        odds1 = calculated.team1Back;
        odds2 = calculated.team2Back;
        oddsDraw = matchFormat === "TEST" ? 3.60 : null;
      } else if (key === "soccer" || key === "football") {
        score = `${Math.floor(random() * 3)} - ${Math.floor(random() * 2)} (${Math.floor(random() * 75) + 10}')`;
        odds1 = parseFloat((1.4 + random() * 2).toFixed(2));
        odds2 = parseFloat((1.8 + random() * 3).toFixed(2));
      } else if (key === "tennis") {
        score = `Set ${Math.floor(random() * 3) + 1} (${Math.floor(random() * 6)}-${Math.floor(random() * 6)})`;
        odds1 = parseFloat((1.3 + random() * 2).toFixed(2));
        odds2 = parseFloat((1.5 + random() * 2.5).toFixed(2));
      } else {
        score = `${Math.floor(random() * 5)} - ${Math.floor(random() * 5)}`;
      }
    } else {
      score = dayOffset === 0 ? `Today, ${timeStr}` : dayOffset === 1 ? `Tomorrow, ${timeStr}` : `${displayDate}, ${timeStr}`;
      odds1 = parseFloat((1.6 + random() * 1.5).toFixed(2));
      odds2 = parseFloat((1.6 + random() * 1.5).toFixed(2));
    }

    matches.push({
      id: idCounter++,
      team1,
      team2,
      status: isLive ? "Live" : "Upcoming",
      score,
      odds: { 
        team1: odds1, 
        draw: oddsDraw, 
        team2: odds2 
      },
      trend: { team1: 'none', draw: oddsDraw ? 'none' : null, team2: 'none' },
      dateStr,
      displayDate,
      timeStr,
      seriesName,
      matchFormat,
      sport: key
    });
  }

  return matches;
}
