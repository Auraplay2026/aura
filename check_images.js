const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'f:/bet/betmatrix-ui/lib/games.ts',
  'f:/bet/betmatrix-ui/app/(public)/casino/[category]/page.tsx',
  'f:/bet/betmatrix-ui/app/(public)/casino/rtp/page.tsx'
];

const regex = /image:\s*['"](\/games\/[^'"]+)['"]/g;
let missing = [];

for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const fileContent = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
      const imagePath = match[1];
      const fullPath = path.join('f:/bet/betmatrix-ui/public', imagePath);
      if (!fs.existsSync(fullPath)) {
        missing.push({ file, imagePath });
      }
    }
  }
}

console.log(JSON.stringify(missing, null, 2));
