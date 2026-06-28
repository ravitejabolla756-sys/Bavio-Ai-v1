const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\bolla\\.gemini\\antigravity-ide\\brain\\3e413d45-51be-4497-9e38-1b90bcaf3d21\\media__1782657773954.png';

const destinations = [
  'c:\\Startup\\bavio-frontend-v2\\src\\app\\favicon.ico',
  'c:\\Startup\\bavio-frontend-v2\\src\\app\\icon.png',
  'c:\\Startup\\bavio-frontend-v2\\src\\app\\apple-icon.png',
  'c:\\Startup\\bavio-frontend-v2\\public\\favicon.ico',
  'c:\\Startup\\bavio-frontend-v2\\public\\favicon.png',
  'c:\\Startup\\bavio-frontend-v2\\public\\apple-touch-icon.png',
  'c:\\Startup\\bavio-frontend-v2\\public\\icon.png',
];

destinations.forEach(dest => {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(srcPath, dest);
    console.log(`Copied successfully to ${dest}`);
  } catch (e) {
    console.error(`Failed to copy to ${dest}:`, e.message);
  }
});
