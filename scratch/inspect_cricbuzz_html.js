const fs = require('fs');
const html = fs.readFileSync('scratch/cricbuzz.html', 'utf-8');

const regex = /\/live-cricket-scores\/\d+\/[a-z0-9-]+/g;
let match;
let count = 0;

while ((match = regex.exec(html)) !== null && count < 5) {
  const index = match.index;
  const start = Math.max(0, index - 200);
  const end = Math.min(html.length, index + 300);
  console.log(`--- Match ${count + 1} at index ${index} ---`);
  console.log(html.substring(start, end).replace(/\s+/g, ' '));
  console.log('\n');
  count++;
}
