const fs = require('fs');
const code = fs.readFileSync('lib/games.ts', 'utf8');

// Use regex to parse out game objects
// We want to capture the id, title, and image
const matches = [...code.matchAll(/\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)"[\s\S]*?image:\s*"([^"]+)"/g)];

const imageMap = {};
matches.forEach(match => {
  const [_, id, title, image] = match;
  if (!imageMap[image]) {
    imageMap[image] = [];
  }
  imageMap[image].push({ id, title });
});

let found = false;
for (const [image, games] of Object.entries(imageMap)) {
  if (games.length > 1) {
    found = true;
    console.log(`Duplicate image path: ${image}`);
    games.forEach(g => {
      console.log(`  - ID: ${g.id}, Title: ${g.title}`);
    });
  }
}

if (!found) {
  console.log("No duplicate image paths found!");
}
