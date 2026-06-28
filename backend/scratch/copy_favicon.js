const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\bolla\\.gemini\\antigravity-ide\\brain\\3e413d45-51be-4497-9e38-1b90bcaf3d21\\media__1782656859417.png';
const destFavicon = 'c:\\Startup\\bavio-frontend-v2\\src\\app\\favicon.ico';
const destIcon = 'c:\\Startup\\bavio-frontend-v2\\src\\app\\icon.png';

try {
  // Overwrite existing favicon.ico with the new PNG content
  fs.copyFileSync(srcPath, destFavicon);
  console.log(`Successfully copied to ${destFavicon}`);

  // Also create icon.png for Next.js App Router metadata support
  fs.copyFileSync(srcPath, destIcon);
  console.log(`Successfully copied to ${destIcon}`);
} catch (e) {
  console.error('Copy failed:', e.message);
}
