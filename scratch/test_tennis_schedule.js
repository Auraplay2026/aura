const fs = require('fs');

const run = async () => {
  const url = 'https://sports.yahoo.com/tennis/schedule/';
  console.log(`Fetching Yahoo Tennis Schedule from ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    fs.writeFileSync('scratch/yahoo_tennis_schedule.html', html, 'utf-8');
    console.log("Saved scratch/yahoo_tennis_schedule.html");

    // Let's search for player matchups
    // In Yahoo, a tennis match block might look like: "player1-vs-player2" or similar
    const matches = html.match(/class="[^"]*match[^"]*"|class="[^"]*matchup[^"]*"/g);
    console.log(`Found ${matches ? matches.length : 0} match elements.`);

    // Find any names. Usually player names are in <span> or <a> tags with specific classes
    // Let's print out text content of some elements
    // Let's do a search for player names or titles
    const titles = html.match(/<title>([^<]+)<\/title>/);
    console.log("Page Title:", titles ? titles[1] : "No Title");
  } catch (err) {
    console.error(err.message);
  }
};

run();
