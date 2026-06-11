const fs = require('fs');
const path = require('path');

const filesToFix = [
  'f:/bet/betmatrix-ui/app/(public)/vip/top-portfolios/page.tsx',
  'f:/bet/betmatrix-ui/app/(public)/tournaments/page.tsx',
  'f:/bet/betmatrix-ui/app/(public)/promotions/page.tsx'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Replace dark specific classes
    content = content.replace(/via-\[\#0[a-f0-9]{5}\](\/\d+)?/g, 'via-slate-100');
    content = content.replace(/to-\[\#0[a-f0-9]{5}\](\/\d+)?/g, 'to-slate-50');
    content = content.replace(/from-\[\#0[a-f0-9]{5}\](\/\d+)?/g, 'from-white');
    
    // Replace to-black, via-black, from-black
    content = content.replace(/via-black(\/\d+)?/g, 'via-slate-100');
    content = content.replace(/to-black(\/\d+)?/g, 'to-slate-50');
    content = content.replace(/from-black(\/\d+)?/g, 'from-white');

    // Replace bg-black
    content = content.replace(/bg-black(\/\d+)?/g, 'bg-slate-50');
    
    // Replace custom text colors
    content = content.replace(/text-slate-400/g, 'text-slate-600');
    content = content.replace(/text-white/g, 'text-slate-900');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed ' + path.basename(file));
    }
  }
});
