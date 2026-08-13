import fs from 'fs';
import path from 'path';

function replaceInDir(dirPath: string) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      replaceInDir(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('twintubrovquattro@gmail.com')) {
        content = content.replace(
          /currentUser\?\.email \|\| "twintubrovquattro@gmail\.com"/g,
          'currentUser?.username || currentUser?.email || ""'
        );
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file.name}`);
      }
    }
  }
}

replaceInDir(path.join(__dirname, '../components/casino/engines'));
console.log("All casino engine components updated cleanly!");
