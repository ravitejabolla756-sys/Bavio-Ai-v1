import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

async function verifyRotatingHeader() {
  console.log('🚀 Testing Rotating Marketing Header on /login and /signup...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Load /login
  console.log('1️⃣ Loading /login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACTS, 'marketing_1_login_desktop.png') });
  console.log('✅ Captured /login initial message.');

  // Wait 5.5s for 3D flip animation to trigger second message
  console.log('2️⃣ Waiting for 3D flip animation to trigger second message...');
  await new Promise(r => setTimeout(r, 5500));
  await page.screenshot({ path: path.join(ARTIFACTS, 'marketing_2_login_flipped.png') });
  console.log('✅ Captured /login flipped second message.');

  // 3. Load /signup (test non-repeating reload / navigation index)
  console.log('3️⃣ Loading /signup page (checking reload variation)...');
  await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACTS, 'marketing_3_signup_desktop.png') });
  console.log('✅ Captured /signup header.');

  await browser.close();
  console.log('🎉 Verification completed successfully.');
}

verifyRotatingHeader().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
