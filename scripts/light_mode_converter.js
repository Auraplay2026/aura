const fs = require('fs');
const path = require('path');

const DIR_TO_PROCESS = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components')
];

const REPLACEMENTS = [
  // Backgrounds
  { from: /bg-\[\#0a0f1d\]/g, to: 'bg-slate-50' },
  { from: /bg-\[\#050914\]/g, to: 'bg-white' },
  { from: /bg-\[\#060814\]/g, to: 'bg-white' },
  { from: /bg-\[\#151623\]/g, to: 'bg-slate-50' },
  { from: /bg-\[\#1a1b2a\]/g, to: 'bg-white' },
  { from: /bg-\[\#05060f\]/g, to: 'bg-white' },
  { from: /bg-\[\#0a0a0f\]/g, to: 'bg-white' },
  { from: /bg-\[\#25273c\]/g, to: 'bg-slate-100' },
  { from: /bg-\[\#31334b\]/g, to: 'bg-slate-200' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-white/g, to: 'bg-slate-50' },
  { from: /bg-slate-50/g, to: 'bg-slate-100' },
  { from: /bg-white\/40/g, to: 'bg-slate-50\/80' },
  { from: /bg-white\/60/g, to: 'bg-slate-50' },
  { from: /bg-white\/40/g, to: 'bg-slate-50' },
  { from: /bg-white\/50/g, to: 'bg-slate-100' },
  { from: /bg-white\/60/g, to: 'bg-white' },
  { from: /bg-white\/80/g, to: 'bg-white' },
  { from: /bg-white\/90/g, to: 'bg-white\/95' },
  { from: /bg-white\/95/g, to: 'bg-white\/95' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-white\/85/g, to: 'bg-white\/40' },
  
  // Borders
  { from: /border-slate-800/g, to: 'border-slate-200' },
  { from: /border-slate-850/g, to: 'border-slate-200' },
  { from: /border-slate-900/g, to: 'border-slate-200' },
  { from: /border-white\/5/g, to: 'border-slate-200' },
  { from: /border-white\/10/g, to: 'border-slate-200' },
  { from: /border-\[\#25273c\]/g, to: 'border-slate-200' },
  { from: /border-\[\#31334b\]/g, to: 'border-slate-300' },

  // Texts
  // Text white is tricky, let's only replace it where it's typically used for headings
  // E.g. `text-slate-900` -> `text-slate-900`
  // We'll run a safer regex: only if it's not preceded by a button color like bg-blue, bg-purple, bg-yellow
  // Since that's hard in JS regex without lookbehinds, I'll do manual regex:
  // We'll replace text-slate-900 with text-slate-900 but manually verify buttons.
  // Actually, replacing `text-slate-400` -> `text-slate-600` etc is safer.
  { from: /text-slate-400/g, to: 'text-slate-600' },
  { from: /text-slate-300/g, to: 'text-slate-700' },
  { from: /text-slate-200/g, to: 'text-slate-800' },
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

let modifiedFiles = 0;

DIR_TO_PROCESS.forEach(dir => {
  const files = walkDir(dir);
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    REPLACEMENTS.forEach(repl => {
      content = content.replace(repl.from, repl.to);
    });

    // Special handling for text-slate-900 -> text-slate-900
    // But we avoid replacing inside elements that clearly have bg-blue-600 or bg-emerald-500 etc.
    // Instead of regex, just replace `text-slate-900` to `text-slate-900` 
    // And then replace `bg-blue-600 text-slate-900` back to `bg-blue-600 text-slate-900`
    content = content.replace(/text-slate-900/g, 'text-slate-900');
    
    // Restore text-slate-900 for colored backgrounds
    const restores = [
      /bg-blue-([0-9]+)\s+.*?text-slate-900/g,
      /bg-emerald-([0-9]+)\s+.*?text-slate-900/g,
      /bg-purple-([0-9]+)\s+.*?text-slate-900/g,
      /bg-green-([0-9]+)\s+.*?text-slate-900/g,
      /bg-red-([0-9]+)\s+.*?text-slate-900/g,
      /bg-indigo-([0-9]+)\s+.*?text-slate-900/g,
      /bg-yellow-([0-9]+)\s+.*?text-slate-900/g,
      /bg-white\s+.*?text-slate-900/g, // if we missed some
      /bg-white\s+.*?text-slate-900/g,
      /bg-gradient-to-[a-z]+\s+.*?text-slate-900/g
    ];

    restores.forEach(reg => {
      content = content.replace(reg, match => match.replace('text-slate-900', 'text-slate-900'));
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated: ${file}`);
      modifiedFiles++;
    }
  });
});

console.log(`Conversion complete. Modified ${modifiedFiles} files.`);
