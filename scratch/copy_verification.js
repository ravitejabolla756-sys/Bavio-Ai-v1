const fs = require('fs');
const path = require('path');

const srcPath = 'c:\\Startup\\google480dd64873bcccc5.html';
const destPath = 'c:\\Startup\\bavio-frontend-v2\\public\\google480dd64873bcccc5.html';

try {
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Successfully copied verification file to ${destPath}`);
  } else {
    // If not in c:\Startup directly, let's create it with the verification text
    fs.writeFileSync(destPath, 'google-site-verification: google480dd64873bcccc5.html');
    console.log(`Created verification file directly at ${destPath}`);
  }
} catch (e) {
  console.error('Error copying file:', e.message);
}
