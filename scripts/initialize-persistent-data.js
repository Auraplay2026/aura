const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(process.cwd(), 'data_template');
const TARGET_DIR = path.join(process.cwd(), 'data');

console.log("Checking persistent volume data initialization...");

if (!fs.existsSync(TARGET_DIR)) {
  console.log(`Target directory ${TARGET_DIR} does not exist. Creating...`);
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

if (fs.existsSync(SOURCE_DIR)) {
  const files = fs.readdirSync(SOURCE_DIR);
  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const targetPath = path.join(TARGET_DIR, file);
    
    // Check if file is missing in target (mounted persistent disk)
    if (!fs.existsSync(targetPath)) {
      console.log(`Copying template seed file: ${file} -> ${targetPath}`);
      fs.copyFileSync(sourcePath, targetPath);
    } else {
      console.log(`File already exists in persistent storage: ${file}`);
    }
  }
  console.log("Persistent volume data initialization complete.");
} else {
  console.log(`Source template directory ${SOURCE_DIR} not found. Skipping initialization.`);
}
