const fs = require('fs');
const path = require('path');

const DIRS = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components')
];

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

let modifiedFiles = 0;

DIRS.forEach(dir => {
  const files = walk(dir);
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Convert colored dark backgrounds (e.g. bg-emerald-950/50 -> bg-emerald-100)
    // Avoid replacing slate/gray/zinc etc if we want them to just be slate-50
    // Actually, bg-slate-950 -> bg-slate-100 is fine, bg-emerald-950 -> bg-emerald-100 is fine
    content = content.replace(/bg-([a-z]+)-(900|950)(?:\/\d+)?/g, (match, color) => {
      // If it's a neutral color, maybe we want it whiter, but 50/100 is fine
      return `bg-${color}-100`;
    });

    // Convert colored dark borders
    content = content.replace(/border-([a-z]+)-(800|900|950)(?:\/\d+)?/g, (match, color) => {
      return `border-${color}-300`;
    });

    // Convert colored light texts (which were used on dark backgrounds)
    // E.g. text-emerald-300 -> text-emerald-700
    // Exclude text-slate, text-gray because we might have handled them, but handling them again is fine if they are still -300
    content = content.replace(/text-([a-z]+)-(300|400)(?:\/\d+)?/g, (match, color, shade) => {
      if (shade === '300') return `text-${color}-700`;
      if (shade === '400') return `text-${color}-600`;
      return match;
    });

    // Some specific hex colors that might still be lingering like bg-[#1c1d29]
    content = content.replace(/bg-\[\#[0-9a-fA-F]{6}\]/g, match => {
       const hex = match.substring(5, 11).toLowerCase();
       // Check if it's a dark color (e.g., #0a0f1d, #11131c, #1a1c29, #05060f)
       // If the hex is very dark, replace it with bg-slate-50
       // Simple heuristic: if the first character is 0, 1, 2 it's probably dark
       if (['0', '1', '2', '3'].includes(hex[0])) {
           return 'bg-slate-50';
       }
       return match;
    });

    // Shadow colors might still be dark mode optimized like shadow-emerald-500/5
    // That's usually fine in light mode, actually.

    // bg-white/5 or bg-white/10 -> bg-slate-900/5
    content = content.replace(/bg-white\/(5|10|20|30)/g, (match, opacity) => {
        return `bg-slate-900/${opacity}`;
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles++;
      console.log(`Updated: ${file}`);
    }
  });
});

console.log(`Conversion V2 complete. Modified ${modifiedFiles} files.`);
