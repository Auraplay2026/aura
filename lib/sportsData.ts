export type Match = {
  id: number;
  team1: string;
  team2: string;
  status: "Live" | "Upcoming";
  score: string;
  odds: { team1: number; draw: number | null; team2: number };
  trend: { team1: 'up'|'down'|'none'; draw: 'up'|'down'|'none' | null; team2: 'up'|'down'|'none' };
};

const TEAMS = {
  soccer: [
    "Mohun Bagan SG", "Mumbai City FC", "Kerala Blasters FC", "Bengaluru FC", "FC Goa",
    "Chennaiyin FC", "Odisha FC", "East Bengal FC", "NorthEast United FC", "Hyderabad FC",
    "Jamshedpur FC", "Punjab FC", "Mohammedan SC", "Gokulam Kerala FC", "Real Kashmir FC"
  ],
  basketball: [
    "Chennai Slam", "Pune Peshwas", "Bengaluru Beast", "Mumbai Challengers", "Punjab Steelers",
    "Haryana Gold", "Hyderabad Sky", "Delhi Capitals Hoops", "Kochi Stars", "Ahmedabad Wingers"
  ],
  tennis: [
    "Rohan Bopanna", "Sumit Nagal", "Ramkumar Ramanathan", "Yuki Bhambri", "Prajnesh Gunneswaran",
    "Sasikumar Mukund", "Sania Mirza", "Ankita Raina", "Karman Kaur Thandi", "Rutuja Bhosale",
    "Mahesh Bhupathi", "Leander Paes", "Somdev Devvarman", "Vijay Amritraj", "Ramesh Krishnan"
  ],
  esports: [
    "Team Soul", "GodLike Esports", "Global Esports", "Entity Gaming", "Blind Esports",
    "Orangutan", "Revenant Esports", "Medal Esports", "Enigma Gaming", "Reckoning Esports",
    "Gods Reign", "Team XSpark", "Gladiators Esports", "Marcos Gaming", "Carnival Gaming"
  ],
  cricket: [
    "Chennai Super Kings", "Mumbai Indians", "Royal Challengers Bengaluru", "Kolkata Knight Riders", "Sunrisers Hyderabad",
    "Delhi Capitals", "Rajasthan Royals", "Gujarat Titans", "Lucknow Super Giants", "Punjab Kings",
    "UP Warriorz", "Royal Challengers Bangalore W", "Mumbai Indians W", "Delhi Capitals W", "Gujarat Giants"
  ],
  "table tennis": [
    "Sharath Kamal", "Sathiyan Gnanasekaran", "Harmeet Desai", "Manav Thakkar", "Sanil Shetty",
    "Manika Batra", "Sreeja Akula", "Ayhika Mukherjee", "Sutirtha Mukherjee", "Diya Chitale",
    "Anthony Amalraj", "Soumyajit Ghosh", "Madhurika Patkar", "Poulomi Ghatak", "Mouma Das"
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
  
  // Try exact match first
  let teamList = (TEAMS as any)[key];
  
  if (!teamList) {
    // If exact match fails, try fuzzy matching or fallback to soccer
    const foundKey = Object.keys(TEAMS).find(k => k.includes(key) || key.includes(k));
    if (foundKey) {
      teamList = (TEAMS as any)[foundKey];
    } else {
      teamList = TEAMS.soccer;
    }
  }

  // Shuffle teams using a consistent seed so the list doesn't wildly change on every render unnecessarily
  // (We'll use a time-based or requested seed later if we want real dynamism, but for static simulation we'll reset seed)
  seed = parseInt(sportName.split("").reduce((acc, char) => acc + char.charCodeAt(0).toString(), "0").slice(0, 5)) || 1234;
  
  const shuffledTeams = shuffle(teamList);
  const matches: Match[] = [];

  const supportsDraw = key === "soccer" || key === "cricket";

  let idCounter = seed * 10;

  // We pair teams up. If we run out of unique pairs, we can reuse them with different statuses
  let teamIndex = 0;

  for (let i = 0; i < count; i++) {
    if (teamIndex + 1 >= shuffledTeams.length) {
      // Loop around if we need more matches than unique teams
      teamIndex = 0; 
      shuffle(shuffledTeams); // Reshuffle for variety
    }

    const team1 = shuffledTeams[teamIndex];
    const team2 = shuffledTeams[teamIndex + 1];
    teamIndex += 2;

    const isLive = random() > 0.6; // 40% chance to be live
    
    // Odds generation
    const odds1 = 1.1 + (random() * 4); // 1.10 to 5.10
    const odds2 = 1.1 + (random() * 4);
    const oddsDraw = supportsDraw ? (2.0 + (random() * 3)) : null;

    // Trend generation
    const trends = ['up', 'down', 'none'] as const;
    const trend1 = trends[Math.floor(random() * 3)];
    const trend2 = trends[Math.floor(random() * 3)];
    const trendDraw = supportsDraw ? trends[Math.floor(random() * 3)] : null;

    // Score generation
    let score = "";
    if (isLive) {
      if (key === "soccer") {
        score = `${Math.floor(random() * 4)} - ${Math.floor(random() * 4)} (${Math.floor(random() * 90) + 1}')`;
      } else if (key === "tennis" || key === "table tennis") {
        score = `Set ${Math.floor(random() * 5) + 1} (${Math.floor(random() * 6)}-${Math.floor(random() * 6)})`;
      } else if (key === "basketball") {
        score = `Q${Math.floor(random() * 4) + 1} ${Math.floor(random() * 60) + 50}-${Math.floor(random() * 60) + 50}`;
      } else if (key === "cricket") {
        score = `${Math.floor(random() * 200) + 50}/${Math.floor(random() * 10)} (${Math.floor(random() * 19) + 1}.${Math.floor(random() * 6)})`;
      } else if (key === "esports") {
        score = `Map ${Math.floor(random() * 3) + 1} (${Math.floor(random() * 13)}-${Math.floor(random() * 13)})`;
      } else {
        score = `${Math.floor(random() * 10)} - ${Math.floor(random() * 10)}`;
      }
    } else {
      // Upcoming formats
      const days = ["Today", "Tomorrow", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const day = days[Math.floor(random() * days.length)];
      const hour = Math.floor(random() * 14) + 10; // 10:00 to 23:00
      score = `${day}, ${hour}:00`;
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
      trend: { team1: trend1, draw: trendDraw, team2: trend2 }
    });
  }

  return matches;
}
