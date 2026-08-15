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
  const key = sportName.toLowerCase();
  
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

  const SERIES_BY_SPORT: Record<string, string[]> = {
    cricket: [
      "Ranji Trophy 2026", 
      "Tamil Nadu Premier League 2026", 
      "Delhi Premier League 2026", 
      "Syed Mushtaq Ali Trophy 2026",
      "Big Bash League 2026",
      "Indian Premier League SRL",
      "One Day Internationals",
      "ICC World Test Championship"
    ],
    soccer: ["Premier League 2026", "UEFA Champions League 2026", "La Liga 2026", "ISL 2026", "FA Cup 2026"],
    football: ["Premier League 2026", "UEFA Champions League 2026", "La Liga 2026", "ISL 2026", "FA Cup 2026"],
    basketball: ["NBA Regular Season 2026", "EuroLeague 2026", "FIBA World Tour 2026"],
    tennis: ["ATP Masters 1000 Cincinnati", "WTA 1000 Cincinnati", "US Open Series 2026"],
    esports: ["VCT Champions 2026", "League of Legends Worlds 2026", "CS2 Major 2026"]
  };

  const FORMATS_BY_SPORT: Record<string, string[]> = {
    cricket: ["T20", "TEST", "ODI", "100B"],
    soccer: ["EPL", "UCL", "Cup"],
    football: ["EPL", "UCL", "Cup"],
    basketball: ["NBA", "Euro"],
    tennis: ["ATP", "WTA"],
    esports: ["BO3", "BO5"]
  };

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < count; i++) {
    if (teamIndex + 1 >= shuffledTeams.length) {
      teamIndex = 0; 
      shuffle(shuffledTeams);
    }

    const team1 = shuffledTeams[teamIndex];
    const team2 = shuffledTeams[teamIndex + 1];
    teamIndex += 2;

    const isLive = i < Math.min(3, count) && random() > 0.4;
    
    // Distribute upcoming matches across Days 0 to 7
    const dayOffset = isLive ? 0 : (i % 7);
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

    const seriesPool = SERIES_BY_SPORT[key] || SERIES_BY_SPORT.soccer;
    const seriesName = seriesPool[i % seriesPool.length];
    const formatPool = FORMATS_BY_SPORT[key] || ["PRO"];
    const matchFormat = formatPool[i % formatPool.length];

    const odds1 = 1.15 + (random() * 3.5);
    const odds2 = 1.15 + (random() * 3.5);
    const oddsDraw = supportsDraw ? (2.2 + (random() * 2.8)) : null;

    const trends = ['up', 'down', 'none'] as const;
    const trend1 = trends[Math.floor(random() * 3)];
    const trend2 = trends[Math.floor(random() * 3)];
    const trendDraw = supportsDraw ? trends[Math.floor(random() * 3)] : null;

    let score = "";
    if (isLive) {
      if (key === "soccer" || key === "football") {
        score = `${Math.floor(random() * 3)} - ${Math.floor(random() * 2)} (${Math.floor(random() * 75) + 10}')`;
      } else if (key === "tennis" || key === "table tennis") {
        score = `Set ${Math.floor(random() * 3) + 1} (${Math.floor(random() * 6)}-${Math.floor(random() * 6)})`;
      } else if (key === "basketball") {
        score = `Q${Math.floor(random() * 4) + 1} ${Math.floor(random() * 40) + 60}-${Math.floor(random() * 40) + 55}`;
      } else if (key === "cricket") {
        score = `${Math.floor(random() * 120) + 80}/${Math.floor(random() * 5)} (${Math.floor(random() * 16) + 3}.${Math.floor(random() * 6)} ov)`;
      } else {
        score = `${Math.floor(random() * 5)} - ${Math.floor(random() * 5)}`;
      }
    } else {
      score = dayOffset === 0 ? `Today, ${timeStr}` : dayOffset === 1 ? `Tomorrow, ${timeStr}` : `${displayDate}, ${timeStr}`;
    }

    matches.push({
      id: idCounter++,
      team1,
      team2,
      status: isLive ? "Live" : "Upcoming",
      score,
      odds: { 
        team1: parseFloat(odds1.toFixed(2)), 
        draw: oddsDraw ? parseFloat(oddsDraw.toFixed(2)) : null, 
        team2: parseFloat(odds2.toFixed(2)) 
      },
      trend: { team1: trend1, draw: trendDraw, team2: trend2 },
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
