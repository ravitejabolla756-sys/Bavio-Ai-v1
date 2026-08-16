const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

(async () => {
  console.log('Launching browser to test exact theme toggle origin...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Authenticate session
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.setCookie(
      { name: 'bavio_auth', value: 'true', domain: 'localhost', path: '/' },
      { name: 'bavio_onboarding_completed', value: 'true', domain: 'localhost', path: '/' }
    );
    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'mock_jwt_token');
      localStorage.setItem('bavio_theme', 'light');
    });

    // 2. Open /dashboard
    console.log('[1] Opening /dashboard in Light mode...');
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2000));

    // Get exact button position
    const btnCoords = await page.evaluate(() => {
      const btn = document.querySelector('#bavio-theme-toggle-desktop') || document.querySelector('[data-theme-toggle="true"]:not([id*="mobile"])');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2
      };
    });
    console.log('Detected Visible Desktop Theme Toggle Button Coords:', btnCoords);

    console.log('Capturing Light Mode initial screenshot...');
    await page.screenshot({ path: `${ARTIFACTS}/theme_origin_1_light.png` });

    // 3. Trigger Light -> Dark transition by clicking the top-right button
    console.log('[2] Clicking top-right Theme Toggle for Light -> Dark transition...');
    const toggleBtn = await page.waitForSelector('#bavio-theme-toggle-desktop', { timeout: 10000 });
    
    // Capture mid-transition
    await toggleBtn.click();
    await new Promise(r => setTimeout(r, 250));
    await page.screenshot({ path: `${ARTIFACTS}/theme_origin_2_mid_transition_dark.png` });

    await new Promise(r => setTimeout(r, 800));
    console.log('Capturing Dark Mode completed screenshot...');
    await page.screenshot({ path: `${ARTIFACTS}/theme_origin_3_dark_complete.png` });

    // 4. Trigger Dark -> Light transition by clicking the same top-right button
    console.log('[3] Clicking top-right Theme Toggle for Dark -> Light transition...');
    await toggleBtn.click();
    await new Promise(r => setTimeout(r, 250));
    await page.screenshot({ path: `${ARTIFACTS}/theme_origin_4_mid_transition_light.png` });

    await new Promise(r => setTimeout(r, 800));
    console.log('Capturing Light Mode restored screenshot...');
    await page.screenshot({ path: `${ARTIFACTS}/theme_origin_5_light_restored.png` });

    console.log('\n🎉 Theme toggle origin verification completed successfully!');
    await new Promise(r => setTimeout(r, 1500));
  } catch (err) {
    console.error('❌ Error during theme origin test:', err);
    await page.screenshot({ path: `${ARTIFACTS}/theme_origin_error.png` }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
