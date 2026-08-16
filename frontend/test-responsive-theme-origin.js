const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

(async () => {
  console.log('🚀 Running Responsive Theme Transition Origin Tests...\n');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();

  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      testsFailed++;
    }
  };

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: Desktop Viewport (1440 x 900)
    // ─────────────────────────────────────────────────────────────
    console.log('--- TEST 1: Desktop (1440x900) Workspace Theme Toggle Origin ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'test_token');
      localStorage.setItem('bavio_name', 'Test Workspace');
      document.cookie = 'bavio_auth=true; path=/';
    });

    await page.goto(`${BASE}/workspace`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Get desktop toggle position
    const desktopBtnCoords = await page.evaluate(() => {
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

    console.log('Desktop Toggle Center:', desktopBtnCoords);
    assert(desktopBtnCoords && desktopBtnCoords.centerX > 0 && desktopBtnCoords.centerY > 0, 'Found visible Desktop Theme Toggle coordinates');

    // Click desktop toggle and capture transition
    const desktopToggle = await page.waitForSelector('#bavio-theme-toggle-desktop, [data-theme-toggle="true"]');
    await desktopToggle.click();

    // Verify CSS origin variables
    const desktopCssOrigin = await page.evaluate(() => ({
      originX: document.documentElement.style.getPropertyValue('--theme-origin-x'),
      originY: document.documentElement.style.getPropertyValue('--theme-origin-y'),
    }));
    console.log('Document CSS Variables (Desktop):', desktopCssOrigin);
    assert(desktopCssOrigin.originX.includes(Math.round(desktopBtnCoords.centerX).toString()) ||
           Math.abs(parseFloat(desktopCssOrigin.originX) - desktopBtnCoords.centerX) < 2,
           'Theme transition origin X matches desktop button center exactly');

    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: `${ARTIFACTS}/theme_responsive_1_desktop_mid.png` });
    await new Promise(r => setTimeout(r, 600));

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Mobile Viewport (375 x 812)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2: Mobile (375x812) Dashboard Theme Toggle Origin ---');
    await page.setViewport({ width: 375, height: 812 });
    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'test_token');
      localStorage.setItem('bavio_client_id', 'test_client_id_999');
      localStorage.setItem('bavio_name', 'Test Workspace');
      document.cookie = 'bavio_auth=true; path=/';
    });
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Get mobile toggle position
    const mobileBtnCoords = await page.evaluate(() => {
      const btn = document.querySelector('#bavio-theme-toggle-mobile') || document.querySelector('[data-variant="mobile"]');
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

    console.log('Mobile Toggle Center:', mobileBtnCoords);
    assert(mobileBtnCoords && mobileBtnCoords.centerX > 0 && mobileBtnCoords.centerY > 0, 'Found visible Mobile Theme Toggle coordinates');

    const mobileToggle = await page.waitForSelector('#bavio-theme-toggle-mobile, [data-variant="mobile"]');
    await mobileToggle.click();

    const mobileCssOrigin = await page.evaluate(() => ({
      originX: document.documentElement.style.getPropertyValue('--theme-origin-x'),
      originY: document.documentElement.style.getPropertyValue('--theme-origin-y'),
    }));
    console.log('Document CSS Variables (Mobile):', mobileCssOrigin);
    assert(Math.abs(parseFloat(mobileCssOrigin.originX) - mobileBtnCoords.centerX) < 2,
           'Theme transition origin X dynamically adapts to mobile button center');

    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: `${ARTIFACTS}/theme_responsive_2_mobile_mid.png` });
    await new Promise(r => setTimeout(r, 600));

    console.log(`\n========================================`);
    console.log(`THEME ORIGIN TESTS SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await browser.close();
  }
})();
