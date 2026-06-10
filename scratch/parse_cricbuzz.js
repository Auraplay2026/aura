const fs = require('fs');

const run = async () => {
  try {
    const res = await fetch('https://www.cricbuzz.com/cricket-match/live-scores', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    fs.writeFileSync('scratch/cricbuzz.html', html, 'utf-8');
    console.log("Saved scratch/cricbuzz.html");

    // Let's search for divs or links containing match details
    // Unofficial Cricbuzz live score pages typically have class "cb-mtch-lst cb-col cb-col-100 cb-tms-itm"
    // Or let's see how many matches we can find by regex.
    // In Cricbuzz: Match titles are usually like "/live-cricket-scores/91283/ind-vs-pak-..." in anchors
    const matchUrls = html.match(/\/live-cricket-scores\/\d+\/[a-z0-9-]+/g);
    console.log(`Found ${matchUrls ? matchUrls.length : 0} match URL matches.`);
    if (matchUrls) {
      console.log("Sample URL matches:", [...new Set(matchUrls)].slice(0, 10));
    }

    // Let's also see if we can find headings like "cb-lv-scrs-col" or "cb-col cb-col-100 cb-lv-main"
    // Let's find matches of class cb-mtch-lst
    const matchesList = [];
    const rx = /<a class="text-hvr-underline" href="(\/live-cricket-scores\/\d+\/[a-z0-9-]+)"[^>]*><span>(.*?)<\/span>/g;
    let m;
    while ((m = rx.exec(html)) !== null) {
      matchesList.push({ url: m[1], title: m[2] });
    }
    console.log(`Parsed ${matchesList.length} matches using simple regex.`);
    console.log(matchesList.slice(0, 10));
  } catch (err) {
    console.error(err);
  }
};

run();
