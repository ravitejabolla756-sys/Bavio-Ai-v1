const fs = require('fs');
const path = require('path');

function findRecentInDir(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(name => {
      const filePath = path.join(dirPath, name);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findRecentInDir(filePath);
      } else if (/\.(png|jpg|jpeg|webp|ico)$/i.test(name)) {
        // If modified today (2026-06-28)
        const dateStr = stat.mtime.toISOString();
        if (dateStr.startsWith('2026-06-28')) {
          console.log(`${dateStr} - ${filePath} (${stat.size} bytes)`);
        }
      }
    });
  } catch (e) {
    // Ignore errors
  }
}

console.log('Searching for files modified today (2026-06-28)...');
findRecentInDir('C:\\Users\\bolla\\.gemini\\antigravity-ide\\brain\\3e413d45-51be-4497-9e38-1b90bcaf3d21');
