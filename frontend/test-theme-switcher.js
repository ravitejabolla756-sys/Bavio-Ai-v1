const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

(async () => {
  console.log('Launching browser to test radial theme transition...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();

  try {
    // 1. Setup cookies and localStorage for authenticated dashboard access
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });

    await page.setCookie(
      { name: 'bavio_auth', value: 'true', domain: 'localhost', path: '/' },
      { name: 'bavio_onboarding_completed', value: 'true', domain: 'localhost', path: '/' }
    );

    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'mock_jwt_token');
      localStorage.setItem('bavio_theme', 'light');
    });

    // 2. Open dashboard in Light Mode
    console.log('[1] Opening dashboard in Light mode...');
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Saving screenshot of Light Mode...');
    await page.screenshot({ path: `${ARTIFACTS}/theme_1_light_mode.png` });

    // 3. Locate the visible theme toggle button in the header
    console.log('[2] Finding visible theme toggle button in header...');
    await page.setViewport({ width: 1440, height: 900 });
    const toggleBtn = await page.waitForSelector('header button[aria-label*="mode"], header button[title*="mode"]', { timeout: 10000 });
    const rect = await toggleBtn.boundingBox();
    console.log(`    Theme toggle coordinates: x=${rect.x + rect.width / 2}, y=${rect.y + rect.height / 2}`);

    // 4. Click theme toggle to trigger radial expansion into Dark Mode
    console.log('[3] Clicking theme toggle (Light -> Dark radial expansion)...');
    await toggleBtn.click();

    // Wait for the 650ms animation to complete
    await new Promise(r => setTimeout(r, 1200));

    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`    HTML dark class active: ${isDark ? '✓ YES' : '❌ NO'}`);

    console.log('Saving screenshot of Dark Mode...');
    await page.screenshot({ path: `${ARTIFACTS}/theme_2_dark_mode.png` });

    // 5. Test sub-pages in Dark Mode
    console.log('[4] Checking /dashboard/calls in Dark mode...');
    await page.goto(`${BASE}/dashboard/calls`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${ARTIFACTS}/theme_3_dark_calls.png` });

    console.log('[5] Checking /dashboard/leads in Dark mode...');
    await page.goto(`${BASE}/dashboard/leads`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${ARTIFACTS}/theme_4_dark_leads.png` });

    console.log('[6] Checking /dashboard/assistant in Dark mode...');
    await page.goto(`${BASE}/dashboard/assistant`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${ARTIFACTS}/theme_5_dark_assistant.png` });

    // 6. Test Dark -> Light radial transition
    console.log('[7] Testing Dark -> Light radial transition...');
    const toggleBtnDark = await page.waitForSelector('header button[aria-label*="mode"], header button[title*="mode"]', { timeout: 10000 });
    await toggleBtnDark.click();
    await new Promise(r => setTimeout(r, 1200));

    const isLightAgain = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    console.log(`    HTML light mode restored: ${isLightAgain ? '✓ YES' : '❌ NO'}`);

    console.log('Saving screenshot of restored Light Mode...');
    await page.screenshot({ path: `${ARTIFACTS}/theme_6_restored_light.png` });

    console.log('\n🎉 Theme transition test completed successfully!');
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.error('❌ Error during theme switcher test:', err);
    await page.screenshot({ path: `${ARTIFACTS}/theme_error.png` }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
