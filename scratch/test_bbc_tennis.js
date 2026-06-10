const run = async () => {
  const url = 'https://feeds.bbci.co.uk/sport/tennis/rss.xml';
  console.log(`Fetching BBC Tennis RSS from ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const xml = await res.text();
    
    // Simple regex to extract <title> elements inside <item> tags
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);
    console.log(`Found ${itemMatches ? itemMatches.length : 0} items.`);
    if (itemMatches) {
      itemMatches.slice(0, 10).forEach((item, index) => {
        const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/);
        console.log(`${index + 1}: ${titleMatch ? titleMatch[1] : 'No Title'}`);
      });
    }
  } catch (err) {
    console.error(err.message);
  }
};

run();
