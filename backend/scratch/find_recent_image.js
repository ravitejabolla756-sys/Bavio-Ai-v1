const fs = require('fs');
const path = require('path');

const mediaDir = 'C:\\Users\\bolla\\.gemini\\antigravity-ide\\brain\\3e413d45-51be-4497-9e38-1b90bcaf3d21\\.tempmediaStorage';

try {
  const files = fs.readdirSync(mediaDir);
  const sorted = files
    .map(name => {
      const filePath = path.join(mediaDir, name);
      const stat = fs.statSync(filePath);
      return { name, filePath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  console.log('MOST RECENT FILES:');
  sorted.slice(0, 5).forEach(f => {
    console.log(`${new Date(f.mtime).toISOString()} - ${f.name} (${f.filePath})`);
  });
} catch (e) {
  console.error('Error:', e.message);
}
