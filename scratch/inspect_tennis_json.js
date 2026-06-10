const fs = require('fs');
const html = fs.readFileSync('scratch/yahoo_tennis_schedule.html', 'utf-8');

// Look for script tags with initial state, e.g., root.App.main or context
const matches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
console.log(`Found ${matches ? matches.length : 0} script tags.`);

if (matches) {
  let foundState = false;
  for (let i = 0; i < matches.length; i++) {
    const content = matches[i];
    if (content.includes('window.App') || content.includes('root.App') || content.includes('context') || content.includes('stores')) {
      console.log(`Script ${i} matches search terms! Length: ${content.length} characters.`);
      console.log(content.substring(0, 1000).replace(/\s+/g, ' '));
      foundState = true;
    }
  }
  if (!foundState) {
    console.log("No scripts matched state keyword search.");
  }
}
