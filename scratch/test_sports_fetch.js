const checkFetch = async () => {
  const urls = [
    { name: 'Cricbuzz Live', url: 'https://www.cricbuzz.com/cricket-match/live-scores' },
    { name: 'ESPN Cricinfo Live', url: 'https://www.espncricinfo.com/live-cricket-score' },
    { name: 'Yahoo Cricket RSS', url: 'https://news.yahoo.com/rss/cricket' }
  ];

  for (const item of urls) {
    console.log(`Fetching ${item.name} from ${item.url}...`);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        }
      });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Length: ${text.length} bytes`);
      console.log(`Preview: ${text.substring(0, 300).replace(/\s+/g, ' ')}\n`);
    } catch (err) {
      console.error(`Error fetching ${item.name}:`, err.message);
    }
  }
};

checkFetch();
