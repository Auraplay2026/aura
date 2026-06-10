const fs = require('fs');
const html = fs.readFileSync('scratch/cricbuzz.html', 'utf-8');

const regex = /<a title="([^"]+)" href="(\/live-cricket-scores\/\d+\/[a-z0-9-]+)"/g;
let match;
const matches = [];

while ((match = regex.exec(html)) !== null) {
  const title = match[1];
  const url = match[2];

  // Title: "England Women vs India Women, 11th Match - ENGW won "
  // or "Netherlands vs Canada, 112th Match - CAN opt to bowl "
  // or "Bangladesh vs Australia, 2nd ODI - Preview "
  const parts = title.split(' vs ');
  if (parts.length >= 2) {
    const team1 = parts[0].trim();
    const rest = parts[1];
    
    // Split rest by ',' to isolate team2
    const commaParts = rest.split(',');
    const team2 = commaParts[0].trim();
    
    // The rest of the string has match details and status
    const restText = commaParts.slice(1).join(',');
    const dashParts = restText.split(' - ');
    
    let details = "";
    let statusText = "Live";
    
    if (dashParts.length >= 2) {
      details = dashParts[0].trim();
      statusText = dashParts[1].trim();
    } else {
      statusText = restText.trim();
    }

    // Determine status (Live vs Upcoming vs Completed)
    let status = "Live";
    let score = statusText;

    if (statusText.toLowerCase().includes('preview') || statusText.toLowerCase().includes('upcoming') || statusText.toLowerCase().includes('starts')) {
      status = "Upcoming";
      score = "Upcoming match";
    } else if (statusText.toLowerCase().includes('won') || statusText.toLowerCase().includes('tied') || statusText.toLowerCase().includes('draw') || statusText.toLowerCase().includes('abandon') || statusText.toLowerCase().includes('no result')) {
      status = "Upcoming"; // We show completed matches as Upcoming or we don't bet on them
      score = statusText; // e.g. "ENGW won"
    } else {
      status = "Live";
      score = statusText; // e.g. "CAN opt to bowl" or live score
    }

    // Generate random odds
    const odds1 = 1.2 + Math.random() * 3.5;
    const odds2 = 1.2 + Math.random() * 3.5;
    const oddsDraw = 2.5 + Math.random() * 3.5;

    matches.push({
      id: Math.abs(url.split('/')[2]) || Math.floor(Math.random() * 1000000),
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
const uniqueMatches = [];
const seenIds = new Set();
for (const m of matches) {
  if (!seenIds.has(m.id)) {
    seenIds.add(m.id);
    uniqueMatches.push(m);
  }
}

console.log(`Parsed ${uniqueMatches.length} unique cricket matches:`);
console.log(JSON.stringify(uniqueMatches.slice(0, 10), null, 2));
