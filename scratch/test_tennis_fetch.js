const fs = require('fs');

const run = async () => {
  const url = 'https://sports.yahoo.com/tennis/';
  console.log(`Fetching Yahoo Tennis from ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    fs.writeFileSync('scratch/yahoo_tennis.html', html, 'utf-8');
    console.log("Saved scratch/yahoo_tennis.html");

    // Let's inspect links
    const matches = html.match(/href="([^"]*\/tennis\/[^"]*)"/g);
    console.log(`Found ${matches ? matches.length : 0} tennis URLs.`);
    if (matches) {
      console.log("Sample matches:", matches.slice(0, 10));
    }
  } catch (err) {
    console.error(err.message);
  }
};

run();
