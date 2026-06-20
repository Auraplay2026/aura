const fs = require('fs');
const path = require('path');
// Walk from workspace root (two levels up) to process sibling packages
const repoRoot = path.resolve(__dirname, '..', '..');
const exts = ['js','ts','jsx','tsx','css','scss','mjs','html', 'tsx'];

const patterns = [
  { from: /bg-white\/60/g, to: 'bg-white/60' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-white/g, to: 'bg-white' },
  { from: /bg-slate-50/g, to: 'bg-slate-50' },
  { from: /bg-slate-100/g, to: 'bg-slate-100' },
  { from: /bg-slate-100/g, to: 'bg-slate-100' },
  { from: /text-slate-900/g, to: 'text-slate-900' },
  { from: /text-slate-900\b/g, to: 'text-slate-900' },
  { from: /hover:bg-white/g, to: 'hover:bg-white' },
  { from: /bg-white\b/g, to: 'bg-white' },
  { from: /bg-white(?=["'\s>])/g, to: 'bg-white' }
];
function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  patterns.forEach(p => {
    content = content.replace(p.from, p.to);
  });
  // Additional conservative replacements for opacity variants and paired classes
  content = content.replace(/bg-slate-9\d{2}\/([0-9]{1,3})/g, (_, op) => `bg-white/${op}`);
  content = content.replace(/bg-black\/([0-9]{1,3})/g, (_, op) => `bg-white/${op}`);
  content = content.replace(/bg-slate-9\d{2}/g, 'bg-white');

  // If a class attribute contains bg-white and still has text-white, switch the text to dark
  content = content.replace(/className=(['"])([^'"\n]*bg-white[^'"\n]*)\1/g, (m, q, cls) => {
    const updated = cls.replace(/\btext-white\b/g, 'text-slate-900');
    return `className=${q}${updated}${q}`;
  });
  // Template literal className={`...`} forms
  content = content.replace(/className=\{`([^`]*bg-white[^`]*)`\}/g, (m, inner) => {
    const updated = inner.replace(/\btext-white\b/g, 'text-slate-900');
    return `className={\`${updated}\`}`;
  });
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('UPDATED:', file);
  }
}

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', '.git'].includes(entry.name)) continue;
      walk(full, fileList);
    } else {
      const ext = entry.name.split('.').pop();
      if (exts.includes(ext)) fileList.push(full);
    }
  }
  return fileList;
}

function run() {
  const files = walk(repoRoot);
  files.forEach(f => {
    try { processFile(f); } catch (e) { console.error('ERR', f, e); }
  });
}

run();
console.log('Replacement pass complete.');
