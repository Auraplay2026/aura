const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('f:/bet/betmatrix-ui/components');
let matches = new Set();
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const found = content.match(/bg-[a-z]+-(900|950)[^\s\"\'\>\]]*/g);
  if (found) {
    found.forEach(m => matches.add(m));
  }
});
console.log(Array.from(matches).join('\n'));

