/**
 * Deep Sports & Player Statistics Database
 * Provides exhaustive CREX & ESPN grade data for matches, venues, pitches, weather,
 * playing XIs, and player dossiers across Cricket, Football, Tennis, and Basketball.
 */

export interface CareerStatFormat {
  format: string; // "Test" | "ODI" | "T20I" | "IPL / League"
  matches: number;
  innings: number;
  runs: number;
  highestScore: string;
  average: number;
  strikeRate: number;
  centuries: number;
  fifties: number;
  wickets?: number;
  economy?: number;
  bestBowling?: string;
}

export interface PlayerDossier {
  id: string;
  name: string;
  fullName: string;
  country: string;
  countryCode: string;
  avatar: string;
  role: "Top-order Batter" | "Middle-order Batter" | "Wicketkeeper Batter" | "All-rounder" | "Fast Bowler" | "Spin Bowler" | "Forward" | "Midfielder" | "Defender" | "Goalkeeper" | "Tennis Pro" | "Guard" | "Forward / Center";
  height: string;
  born: string;
  age: number;
  battingStyle?: string;
  bowlingStyle?: string;
  jerseyNumber?: number;
  careerStats: CareerStatFormat[];
  recentForm: { score: string; opponent: string; date: string; format: string }[];
  marketLine?: { runsNo: number; runsYes: number; sixesOver: number };
}

export interface CrexInningsScorecard {
  teamName: string;
  teamCode: string;
  inningsNumber: 1 | 2;
  totalScore: string; // "263 (75.5)" or "54-10 (22.0)"
  runRate: string;
  batting: {
    playerId: string;
    name: string;
    dismissal: string; // "lbw b Thompson", "c Jacobs b Thompson", "NOT OUT"
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
  }[];
  extras: {
    total: number;
    breakdown: string; // "b 0, lb 1, w 0, nb 0, p 0"
  };
  bowling: {
    playerId: string;
    name: string;
    overs: string;
    maidens: number;
    runs: number;
    wickets: number;
    economy: number;
  }[];
  fallOfWickets: {
    batsmanName: string;
    score: string;
    over: string;
  }[];
  partnerships: {
    batter1: { name: string; runs: number; balls: number };
    batter2: { name: string; runs: number; balls: number };
    wicket: string;
    totalRuns: number;
    totalBalls: number;
  }[];
  yetToBat: {
    name: string;
    role: string;
    average: number;
  }[];
}

export interface DeepMatchInfo {
  id: string;
  series: string;
  title: string;
  matchType: "TEST" | "T20" | "ODI" | "FOOTBALL" | "TENNIS" | "NBA";
  stage: string;
  date: string;
  timeIST: string;
  status: string;
  toss: string;
  venue: {
    stadium: string;
    city: string;
    country: string;
    capacity: string;
    pitchReport: string;
    weather: {
      temperature: string;
      condition: string;
      humidity: string;
      rainProbability: string;
    };
  };
  officials: {
    umpires: string[];
    thirdUmpire: string;
    matchReferee: string;
  };
  team1: {
    name: string;
    code: string;
    scoreSummary: string;
    playingXI: string[]; // player IDs
    bench: string[];
  };
  team2: {
    name: string;
    code: string;
    scoreSummary: string;
    playingXI: string[]; // player IDs
    bench: string[];
  };
  headToHead: {
    totalPlayed: number;
    team1Wins: number;
    team2Wins: number;
    drawsOrTies: number;
    last5Matches: ("W" | "L" | "D")[];
  };
  scorecards?: CrexInningsScorecard[];
}

// ═══════════════════════════════════════════════
// EXHAUSTIVE PLAYER REGISTRY
// ═══════════════════════════════════════════════

export const PLAYERS_DATABASE: Record<string, PlayerDossier> = {
  // Bangladesh vs Australia XI Players
  "tanzid-hasan": {
    id: "tanzid-hasan",
    name: "Tanzid Hasan",
    fullName: "Tanzid Hasan Tamim",
    country: "Bangladesh",
    countryCode: "BAN",
    avatar: "🏏",
    role: "Top-order Batter",
    height: "5 ft 8 in (173 cm)",
    born: "Dec 01, 2000 (Bogra)",
    age: 25,
    battingStyle: "Left Handed Bat",
    bowlingStyle: "Right-arm Offbreak",
    jerseyNumber: 14,
    careerStats: [
      { format: "Test / Warm-Up", matches: 4, innings: 8, runs: 284, highestScore: "84", average: 35.50, strikeRate: 58.4, centuries: 0, fifties: 3 },
      { format: "ODI", matches: 21, innings: 21, runs: 612, highestScore: "84", average: 29.14, strikeRate: 91.2, centuries: 0, fifties: 4 },
      { format: "T20I", matches: 26, innings: 26, runs: 588, highestScore: "71*", average: 24.50, strikeRate: 126.8, centuries: 0, fifties: 3 }
    ],
    recentForm: [
      { score: "22 (41)", opponent: "Australia XI", date: "Aug 2026", format: "Warm-Up" },
      { score: "46 (52)", opponent: "Australia XI", date: "Aug 2026", format: "Warm-Up" },
      { score: "67 (44)", opponent: "Sri Lanka", date: "Jul 2026", format: "T20I" },
      { score: "34 (28)", opponent: "India", date: "Jun 2026", format: "T20 World Cup" }
    ],
    marketLine: { runsNo: 24, runsYes: 26, sixesOver: 0.5 }
  },

  "shadman-islam": {
    id: "shadman-islam",
    name: "Shadman Islam",
    fullName: "Shadman Islam Anik",
    country: "Bangladesh",
    countryCode: "BAN",
    avatar: "🏏",
    role: "Top-order Batter",
    height: "5 ft 10 in (178 cm)",
    born: "May 18, 1995 (Dhaka)",
    age: 31,
    battingStyle: "Left Handed Bat",
    bowlingStyle: "Slow Left-arm Orthodox",
    jerseyNumber: 23,
    careerStats: [
      { format: "Test", matches: 16, innings: 30, runs: 842, highestScore: "115*", average: 30.07, strikeRate: 43.8, centuries: 1, fifties: 4 }
    ],
    recentForm: [
      { score: "6 (6)", opponent: "Australia XI", date: "Aug 2026", format: "Warm-Up" },
      { score: "48 (94)", opponent: "Australia XI", date: "Aug 2026", format: "Warm-Up" },
      { score: "57 (110)", opponent: "Pakistan", date: "May 2026", format: "Test" }
    ]
  },

  "campbell-thompson": {
    id: "campbell-thompson",
    name: "Campbell Thompson",
    fullName: "Campbell James Thompson",
    country: "Australia",
    countryCode: "AUS",
    avatar: "🎯",
    role: "Fast Bowler",
    height: "6 ft 3 in (191 cm)",
    born: "Mar 14, 2002 (Perth)",
    age: 24,
    battingStyle: "Right Handed Bat",
    bowlingStyle: "Right-arm Fast (142 km/h)",
    jerseyNumber: 77,
    careerStats: [
      { format: "First-Class / Warm-Up", matches: 12, innings: 23, runs: 85, highestScore: "24", average: 9.44, strikeRate: 41.2, centuries: 0, fifties: 0, wickets: 48, economy: 2.84, bestBowling: "8/25" },
      { format: "List A", matches: 15, innings: 15, runs: 34, highestScore: "12*", average: 6.80, strikeRate: 68.0, centuries: 0, fifties: 0, wickets: 28, economy: 4.62, bestBowling: "4/28" }
    ],
    recentForm: [
      { score: "8/25 (11.0 ov)", opponent: "Bangladesh", date: "Aug 2026", format: "Warm-Up" },
      { score: "3/42 (16.0 ov)", opponent: "Bangladesh", date: "Aug 2026", format: "Warm-Up" },
      { score: "4/38 (10.0 ov)", opponent: "Victoria", date: "Feb 2026", format: "Sheffield Shield" }
    ],
    marketLine: { runsNo: 2, runsYes: 3, sixesOver: 0.5 }
  },

  "virat-kohli": {
    id: "virat-kohli",
    name: "Virat Kohli",
    fullName: "Virat Kohli",
    country: "India",
    countryCode: "IND",
    avatar: "👑",
    role: "Top-order Batter",
    height: "5 ft 9 in (175 cm)",
    born: "Nov 05, 1988 (Delhi)",
    age: 37,
    battingStyle: "Right Handed Bat",
    bowlingStyle: "Right-arm Medium",
    jerseyNumber: 18,
    careerStats: [
      { format: "Test", matches: 119, innings: 201, runs: 9040, highestScore: "254*", average: 48.86, strikeRate: 55.6, centuries: 29, fifties: 31 },
      { format: "ODI", matches: 295, innings: 283, runs: 13906, highestScore: "183", average: 58.18, strikeRate: 93.6, centuries: 50, fifties: 72 },
      { format: "T20I", matches: 125, innings: 117, runs: 4188, highestScore: "122*", average: 48.69, strikeRate: 137.0, centuries: 1, fifties: 38 },
      { format: "IPL", matches: 252, innings: 244, runs: 8004, highestScore: "113*", average: 38.66, strikeRate: 131.9, centuries: 8, fifties: 55 }
    ],
    recentForm: [
      { score: "74* (42)", opponent: "CSK", date: "Today", format: "IPL 2026" },
      { score: "83 (51)", opponent: "KKR", date: "May 2026", format: "IPL" },
      { score: "76 (59)", opponent: "South Africa", date: "T20 WC Final", format: "T20I" }
    ],
    marketLine: { runsNo: 42, runsYes: 44, sixesOver: 1.5 }
  },

  "kevin-de-bruyne": {
    id: "kevin-de-bruyne",
    name: "Kevin De Bruyne",
    fullName: "Kevin De Bruyne",
    country: "Belgium",
    countryCode: "BEL",
    avatar: "⚽",
    role: "Midfielder",
    height: "5 ft 11 in (181 cm)",
    born: "Jun 28, 1991 (Drongen)",
    age: 34,
    jerseyNumber: 17,
    careerStats: [
      { format: "UEFA Champions League", matches: 78, innings: 78, runs: 16, highestScore: "16 Goals", average: 26, strikeRate: 0, centuries: 0, fifties: 26 },
      { format: "Premier League", matches: 260, innings: 260, runs: 68, highestScore: "68 Goals", average: 112, strikeRate: 0, centuries: 0, fifties: 112 }
    ],
    recentForm: [
      { score: "1 Goal, 1 Assist", opponent: "Real Madrid", date: "Today", format: "UCL Semi" },
      { score: "2 Assists", opponent: "Arsenal", date: "May 2026", format: "EPL" }
    ]
  },

  "novak-djokovic": {
    id: "novak-djokovic",
    name: "Novak Djokovic",
    fullName: "Novak Djokovic",
    country: "Serbia",
    countryCode: "SRB",
    avatar: "🎾",
    role: "Tennis Pro",
    height: "6 ft 2 in (188 cm)",
    born: "May 22, 1987 (Belgrade)",
    age: 39,
    careerStats: [
      { format: "Grand Slam Singles", matches: 420, innings: 420, runs: 24, highestScore: "24 Titles", average: 88.5, strikeRate: 0, centuries: 24, fifties: 36 }
    ],
    recentForm: [
      { score: "6-4, 4-6, 4-4 (In-Play)", opponent: "Carlos Alcaraz", date: "Today", format: "Wimbledon Final" },
      { score: "6-3, 6-2, 6-4", opponent: "Jannik Sinner", date: "Semi-Final", format: "Wimbledon" }
    ]
  }
};

// ═══════════════════════════════════════════════
// DEEP MATCHES REPOSITORY
// ═══════════════════════════════════════════════

export const CREX_MATCHES_DATABASE: Record<string, DeepMatchInfo> = {
  "aus-xi-vs-ban": {
    id: "aus-xi-vs-ban",
    series: "Bangladesh Tour of Australia 2026",
    title: "Australia XI vs Bangladesh • 3-Day Warm-Up Match",
    matchType: "TEST",
    stage: "Day 3 • Match Completed",
    date: "August 12 - 14, 2026",
    timeIST: "05:30 AM IST (10:00 AM Local)",
    status: "Australia XI won by an innings and 38 runs 🏆",
    toss: "Australia XI won the toss and elected to field first",
    venue: {
      stadium: "WACA Ground",
      city: "Perth, Western Australia",
      country: "Australia",
      capacity: "24,500",
      pitchReport: "Hard, fast, and bouncy surface offering tremendous seam movement and pace to Campbell Thompson and fast bowlers.",
      weather: {
        temperature: "21°C",
        condition: "Clear & Sunny with coastal breeze",
        humidity: "48%",
        rainProbability: "0%"
      }
    },
    officials: {
      umpires: ["Bruce Oxenford (AUS)", "Shawn Craig (AUS)"],
      thirdUmpire: "Phillip Gillespie (AUS)",
      matchReferee: "David Boon (AUS)"
    },
    team1: {
      name: "Bangladesh",
      code: "BAN",
      scoreSummary: "263 (75.5 ov) & 54-10 (22.0 ov)",
      playingXI: ["tanzid-hasan", "shadman-islam", "mominul-haque", "soumya-sarkar", "mushfiqur-rahim", "amite-hasan", "najmul-hossain-shanto", "mehidy-hasan-miraz", "hasan-mahmud", "taskin-ahmed", "ebadot-hossain"],
      bench: ["taijul-islam", "khaled-ahmed", "musfik-hasan"]
    },
    team2: {
      name: "Australia XI",
      code: "AUS-XI",
      scoreSummary: "355 (87.2 ov)",
      playingXI: ["campbell-thompson", "hanno-jacobs", "corey-rocchiccioli", "jake-doran", "kurtis-patterson", "sam-fanning", "oliver-peake", "charlie-anderson", "harry-dixon", "raf-macmillan", "mahli-beardman"],
      bench: ["aidan-o-connor", "will-bosisto"]
    },
    headToHead: {
      totalPlayed: 6,
      team1Wins: 1,
      team2Wins: 5,
      drawsOrTies: 0,
      last5Matches: ["L", "L", "W", "L", "L"]
    },
    scorecards: [
      {
        teamName: "Bangladesh",
        teamCode: "BAN",
        inningsNumber: 1,
        totalScore: "263 (75.5 Overs)",
        runRate: "3.46",
        batting: [
          { playerId: "tanzid-hasan", name: "Tanzid Hasan", dismissal: "c Jacobs b Rocchiccioli", runs: 46, balls: 52, fours: 6, sixes: 1, strikeRate: 88.46 },
          { playerId: "shadman-islam", name: "Shadman Islam", dismissal: "c Doran b Thompson", runs: 48, balls: 94, fours: 7, sixes: 0, strikeRate: 51.06 },
          { playerId: "mominul-haque", name: "Mominul Haque", dismissal: "c Patterson b Beardman", runs: 38, balls: 78, fours: 4, sixes: 0, strikeRate: 48.71 },
          { playerId: "mushfiqur-rahim", name: "Mushfiqur Rahim", dismissal: "lbw b Thompson", runs: 64, balls: 112, fours: 8, sixes: 1, strikeRate: 57.14 },
          { playerId: "mehidy-hasan-miraz", name: "Mehidy Hasan Miraz", dismissal: "NOT OUT", runs: 32, balls: 68, fours: 3, sixes: 0, strikeRate: 47.05 }
        ],
        extras: { total: 12, breakdown: "b 4, lb 4, w 2, nb 2, p 0" },
        bowling: [
          { playerId: "campbell-thompson", name: "Campbell Thompson", overs: "16.0", maidens: 3, runs: 42, wickets: 3, economy: 2.62 },
          { playerId: "corey-rocchiccioli", name: "Corey Rocchiccioli", overs: "18.5", maidens: 4, runs: 68, wickets: 4, economy: 3.61 }
        ],
        fallOfWickets: [
          { batsmanName: "Tanzid Hasan", score: "68-1", over: "14.2" },
          { batsmanName: "Shadman Islam", score: "112-2", over: "28.4" },
          { batsmanName: "Mominul Haque", score: "154-3", over: "42.1" }
        ],
        partnerships: [
          { batter1: { name: "Tanzid Hasan", runs: 46, balls: 52 }, batter2: { name: "Shadman Islam", runs: 22, balls: 34 }, wicket: "1st Wicket", totalRuns: 68, totalBalls: 86 }
        ],
        yetToBat: []
      },
      {
        teamName: "Australia XI",
        teamCode: "AUS-XI",
        inningsNumber: 1,
        totalScore: "355 (87.2 Overs)",
        runRate: "4.06",
        batting: [
          { playerId: "sam-fanning", name: "Sam Fanning", dismissal: "c Mushfiqur b Taskin", runs: 88, balls: 142, fours: 11, sixes: 2, strikeRate: 61.97 },
          { playerId: "kurtis-patterson", name: "Kurtis Patterson", dismissal: "c Shanto b Mehidy", runs: 114, balls: 198, fours: 14, sixes: 1, strikeRate: 57.57 },
          { playerId: "jake-doran", name: "Jake Doran", dismissal: "b Ebadot", runs: 52, balls: 84, fours: 6, sixes: 0, strikeRate: 61.90 }
        ],
        extras: { total: 18, breakdown: "b 6, lb 5, w 4, nb 3, p 0" },
        bowling: [
          { playerId: "taskin-ahmed", name: "Taskin Ahmed", overs: "21.0", maidens: 3, runs: 78, wickets: 3, economy: 3.71 },
          { playerId: "mehidy-hasan-miraz", name: "Mehidy Hasan Miraz", overs: "26.2", maidens: 5, runs: 94, wickets: 4, economy: 3.56 }
        ],
        fallOfWickets: [
          { batsmanName: "Sam Fanning", score: "142-1", over: "36.2" },
          { batsmanName: "Kurtis Patterson", score: "278-2", over: "68.4" }
        ],
        partnerships: [
          { batter1: { name: "Sam Fanning", runs: 88, balls: 142 }, batter2: { name: "Kurtis Patterson", runs: 54, balls: 78 }, wicket: "1st Wicket", totalRuns: 142, totalBalls: 220 }
        ],
        yetToBat: []
      },
      {
        teamName: "Bangladesh",
        teamCode: "BAN",
        inningsNumber: 2,
        totalScore: "54-10 (22.0 Overs)",
        runRate: "2.45",
        batting: [
          { playerId: "tanzid-hasan", name: "Tanzid Hasan", dismissal: "lbw b Thompson", runs: 22, balls: 41, fours: 2, sixes: 1, strikeRate: 53.66 },
          { playerId: "shadman-islam", name: "Shadman Islam", dismissal: "c Jacobs b Thompson", runs: 6, balls: 6, fours: 1, sixes: 0, strikeRate: 100.00 },
          { playerId: "mominul-haque", name: "Mominul Haque", dismissal: "b Thompson", runs: 6, balls: 11, fours: 1, sixes: 0, strikeRate: 54.55 },
          { playerId: "soumya-sarkar", name: "Soumya Sarkar", dismissal: "c Patterson b Thompson", runs: 5, balls: 18, fours: 0, sixes: 0, strikeRate: 27.78 },
          { playerId: "mushfiqur-rahim", name: "Mushfiqur Rahim", dismissal: "b Thompson", runs: 2, balls: 11, fours: 0, sixes: 0, strikeRate: 18.18 },
          { playerId: "amite-hasan", name: "Amite Hasan", dismissal: "c Doran b Rocchiccioli", runs: 4, balls: 9, fours: 0, sixes: 0, strikeRate: 44.44 },
          { playerId: "najmul-hossain-shanto", name: "Najmul Hossain Shanto (C)", dismissal: "lbw b Thompson", runs: 0, balls: 8, fours: 0, sixes: 0, strikeRate: 0.00 },
          { playerId: "mehidy-hasan-miraz", name: "Mehidy Hasan Miraz", dismissal: "c Doran b Rocchiccioli", runs: 6, balls: 19, fours: 0, sixes: 0, strikeRate: 31.58 },
          { playerId: "hasan-mahmud", name: "Hasan Mahmud", dismissal: "NOT OUT", runs: 2, balls: 5, fours: 0, sixes: 0, strikeRate: 40.00 },
          { playerId: "taskin-ahmed", name: "Taskin Ahmed", dismissal: "b Thompson", runs: 0, balls: 3, fours: 0, sixes: 0, strikeRate: 0.00 },
          { playerId: "ebadot-hossain", name: "Ebadot Hossain", dismissal: "b Thompson", runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0.00 }
        ],
        extras: { total: 1, breakdown: "b 0, lb 1, w 0, nb 0, p 0" },
        bowling: [
          { playerId: "campbell-thompson", name: "Campbell Thompson", overs: "11.0", maidens: 2, runs: 25, wickets: 8, economy: 2.27 },
          { playerId: "hanno-jacobs", name: "Hanno Jacobs", overs: "7.0", maidens: 1, runs: 22, wickets: 0, economy: 3.14 },
          { playerId: "corey-rocchiccioli", name: "Corey Rocchiccioli", overs: "4.0", maidens: 1, runs: 6, wickets: 2, economy: 1.50 }
        ],
        fallOfWickets: [
          { batsmanName: "Shadman Islam", score: "13-1", over: "2.1" },
          { batsmanName: "Mominul Haque", score: "19-2", over: "5.0" },
          { batsmanName: "Soumya Sarkar", score: "28-3", over: "9.1" },
          { batsmanName: "Mushfiqur Rahim", score: "36-4", over: "12.0" },
          { batsmanName: "Tanzid Hasan", score: "45-5", over: "15.5" },
          { batsmanName: "Amite Hasan", score: "45-6", over: "16.1" },
          { batsmanName: "Najmul Hossain Shanto (C)", score: "47-7", over: "19.1" },
          { batsmanName: "Mehidy Hasan Miraz", score: "53-8", over: "21.0" },
          { batsmanName: "Taskin Ahmed", score: "54-9", over: "21.5" },
          { batsmanName: "Ebadot Hossain", score: "54-10", over: "22.0" }
        ],
        partnerships: [
          { batter1: { name: "Tanzid Hasan", runs: 7, balls: 7 }, batter2: { name: "Shadman Islam", runs: 6, balls: 6 }, wicket: "1st Wicket", totalRuns: 13, totalBalls: 13 },
          { batter1: { name: "Tanzid Hasan", runs: 0, balls: 6 }, batter2: { name: "Mominul Haque", runs: 6, balls: 11 }, wicket: "2nd Wicket", totalRuns: 6, totalBalls: 17 },
          { batter1: { name: "Tanzid Hasan", runs: 4, balls: 7 }, batter2: { name: "Soumya Sarkar", runs: 5, balls: 18 }, wicket: "3rd Wicket", totalRuns: 9, totalBalls: 25 },
          { batter1: { name: "Tanzid Hasan", runs: 6, balls: 6 }, batter2: { name: "Mushfiqur Rahim", runs: 2, balls: 11 }, wicket: "4th Wicket", totalRuns: 8, totalBalls: 17 },
          { batter1: { name: "Tanzid Hasan", runs: 5, balls: 15 }, batter2: { name: "Amite Hasan", runs: 4, balls: 8 }, wicket: "5th Wicket", totalRuns: 9, totalBalls: 23 },
          { batter1: { name: "Amite Hasan", runs: 0, balls: 1 }, batter2: { name: "Najmul Hossain Shanto", runs: 0, balls: 1 }, wicket: "6th Wicket", totalRuns: 0, totalBalls: 2 },
          { batter1: { name: "Najmul Hossain Shanto", runs: 0, balls: 7 }, batter2: { name: "Mehidy Hasan Miraz", runs: 2, balls: 11 }, wicket: "7th Wicket", totalRuns: 2, totalBalls: 18 },
          { batter1: { name: "Mehidy Hasan Miraz", runs: 4, balls: 8 }, batter2: { name: "Hasan Mahmud", runs: 1, balls: 3 }, wicket: "8th Wicket", totalRuns: 6, totalBalls: 11 },
          { batter1: { name: "Hasan Mahmud", runs: 1, balls: 2 }, batter2: { name: "Taskin Ahmed", runs: 0, balls: 3 }, wicket: "9th Wicket", totalRuns: 1, totalBalls: 5 },
          { batter1: { name: "Hasan Mahmud", runs: 0, balls: 0 }, batter2: { name: "Ebadot Hossain", runs: 0, balls: 1 }, wicket: "10th Wicket", totalRuns: 0, totalBalls: 1 }
        ],
        yetToBat: [
          { name: "Taijul Islam", role: "Bowler", average: 10.22 },
          { name: "Khaled Ahmed", role: "Bowler", average: 2.50 },
          { name: "Mohammad Musfik Hasan", role: "Bowler", average: 4.00 }
        ]
      }
    ]
  }
};
