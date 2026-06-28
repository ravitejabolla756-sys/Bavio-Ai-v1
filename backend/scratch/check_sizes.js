const fs = require('fs');
const path = require('path');

const img1 = 'C:\\Users\\bolla\\.gemini\\antigravity-ide\\brain\\3e413d45-51be-4497-9e38-1b90bcaf3d21\\media__1782657600457.png';
const img2 = 'C:\\Users\\bolla\\.gemini\\antigravity-ide\\brain\\3e413d45-51be-4497-9e38-1b90bcaf3d21\\media__1782657773954.png';

console.log('img1 size:', fs.statSync(img1).size);
console.log('img2 size:', fs.statSync(img2).size);
