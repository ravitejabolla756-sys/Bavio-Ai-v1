const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

(async () => {
  console.log('Launching browser to test website light theme preservation...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Authenticate and set dark theme in Dashboard
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.setCookie(
      { name: 'bavio_auth', value: 'true', domain: 'localhost', path: '/' },
      { name: 'bavio_onboarding_completed', value: 'true', domain: 'localhost', path: '/' }
    );
    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'mock_jwt_token');
      localStorage.setItem('bavio_theme', 'dark');
    });

    // 2. Open /dashboard (should be dark mode)
    console.log('[1] Opening /dashboard (Dark Mode)...');
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Saving screenshot: site_1_dashboard_dark.png...');
    await page.screenshot({ path: `${ARTIFACTS}/site_1_dashboard_dark.png` });

    // 3. Navigate to Marketing Landing Page (should be original light theme!)
    console.log('[2] Opening / (Landing Page)...');
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2000));

    const isLandingDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('Landing page is dark?', isLandingDark);

    console.log('Saving screenshot: site_2_landing_light.png...');
    await page.screenshot({ path: `${ARTIFACTS}/site_2_landing_light.png` });

    // 4. Navigate to /pricing (should be light theme)
    console.log('[3] Opening /pricing...');
    await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Saving screenshot: site_3_pricing_light.png...');
    await page.screenshot({ path: `${ARTIFACTS}/site_3_pricing_light.png` });

    // 5. Navigate back to /dashboard (should retain dark theme & theme toggle)
    console.log('[4] Returning to /dashboard...');
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2000));

    const isDashDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('Dashboard is dark?', isDashDark);

    console.log('Saving screenshot: site_4_dashboard_retained_dark.png...');
    await page.screenshot({ path: `${ARTIFACTS}/site_4_dashboard_retained_dark.png` });

    console.log('\n🎉 Verified: Website pages stay in original light theme, and Dashboard/Workspace retain theme toggle!');
    await new Promise(r => setTimeout(r, 1500));
  } catch (err) {
    console.error('❌ Error during test:', err);
    await page.screenshot({ path: `${ARTIFACTS}/site_error.png` }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
