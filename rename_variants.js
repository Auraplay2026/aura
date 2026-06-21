const fs = require('fs');
const path = require('path');

const variants = ['European', 'American', 'French', 'Mini', 'MultiWheel', 'Lightning', 'DoubleBall', 'Speed', 'ZeroFree'];
const dir = path.join(__dirname, 'components', 'casino', 'engines', 'roulette');

for (const variant of variants) {
  const filePath = path.join(dir, `${variant}Roulette.tsx`);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/LiveRouletteEngine/g, `${variant}Roulette`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Renamed ${variant}Roulette`);
}
