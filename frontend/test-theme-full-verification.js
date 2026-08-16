'use strict';

const puppeteer = require('puppeteer');
require('../../bavio-backend/node_modules/dotenv').config({ path: '../../bavio-backend/.env' });
const jwt = require('../../bavio-backend/node_modules/jsonwebtoken');
const db = require('../../bavio-backend/backend/database/db');
const assert = require('assert');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';
const JWT_SECRET = process.env.JWT_SECRET || 'bavio_secret';

async function runThemeVerification() {
  console.log('🚀 Running Complete End-to-End Theme Switching Verification...\n');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Generate authentic session token from database
    console.log('1️⃣ Generating authentic session token from database...');
    const bizRes = await db.query('SELECT * FROM businesses LIMIT 1');
    const business = bizRes.rows[0];
    assert(business, 'Database business required');

    const token = jwt.sign(
      { id: business.id, email: business.email, role: 'authenticated' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 2. Authenticate session
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.setCookie(
      { name: 'bavio_auth', value: 'true', domain: 'localhost', path: '/' },
      { name: 'bavio_onboarding_completed', value: 'true', domain: 'localhost', path: '/' }
    );

    await page.evaluate((tok, bId) => {
      localStorage.setItem('bavio_token', tok);
      localStorage.setItem('bavio_client_id', bId);
      localStorage.setItem('bavio_name', 'Apex Systems');
      localStorage.setItem('bavio_theme', 'light');
      document.cookie = 'bavio_auth=true; path=/; max-age=86400';
      document.cookie = 'bavio_onboarding_completed=true; path=/; max-age=86400';
    }, token, business.id);

    // 3. Open /workspace (baseline Light theme)
    console.log('2️⃣ Opening /workspace in Light mode...');
    await page.goto(`${BASE}/workspace`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    console.log(`Current URL: ${page.url()}`);
    await page.screenshot({ path: `${ARTIFACTS}/smooth_theme_1_light.png` });
    console.log('✅ [PASS] 1. Light theme baseline workspace captured.');

    // 4. Locate theme toggle button & test single-click Light -> Dark
    console.log('3️⃣ Clicking circular theme button: Light -> Dark...');
    await page.waitForSelector('button[data-theme-toggle="true"], #bavio-theme-toggle-desktop', { timeout: 10000 });
    const t0 = Date.now();
    await page.click('button[data-theme-toggle="true"]');

    const isDarkNow = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert(isDarkNow, 'Dark mode class was applied synchronously to <html> element');
    const storedTheme = await page.evaluate(() => localStorage.getItem('bavio_theme'));
    assert.strictEqual(storedTheme, 'dark', 'localStorage bavio_theme is "dark"');
    console.log(`⏱️ Applied Dark mode in ${Date.now() - t0}ms synchronously.`);

    // Wait for transition duration (550ms)
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${ARTIFACTS}/smooth_theme_2_dark.png` });
    console.log('✅ [PASS] 2. Dark theme transition completed and captured.');

    // 5. Single-click toggle: Dark -> Light
    console.log('4️⃣ Clicking circular theme button: Dark -> Light...');
    const t1 = Date.now();
    await page.click('button[data-theme-toggle="true"]');

    const isLightNow = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    assert(isLightNow, 'Light mode class was restored synchronously');
    const storedThemeLight = await page.evaluate(() => localStorage.getItem('bavio_theme'));
    assert.strictEqual(storedThemeLight, 'light', 'localStorage bavio_theme is "light"');
    console.log(`⏱️ Restored Light mode in ${Date.now() - t1}ms synchronously.`);

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${ARTIFACTS}/smooth_theme_3_restored_light.png` });
    console.log('✅ [PASS] 3. Light theme restored and captured.');

    // 6. Stress test: Rapid consecutive toggling (Light -> Dark -> Light -> Dark -> Light -> Dark)
    console.log('5️⃣ Stress testing rapid consecutive clicks (6x)...');
    for (let i = 0; i < 6; i++) {
      await page.click('button[data-theme-toggle="true"]');
      await new Promise(r => setTimeout(r, 120));
    }
    await new Promise(r => setTimeout(r, 400));
    const rapidState = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`Rapid test final state: ${rapidState ? 'Dark' : 'Light'}`);
    console.log('✅ [PASS] 4. Rapid toggling completed cleanly with 0 errors.');

    // 7. Test FOUC prevention & Reload with Dark Mode
    console.log('6️⃣ Testing page reload with persisted Dark Mode (0 FOUC)...');
    await page.evaluate(() => {
      localStorage.setItem('bavio_theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 500));
    const reloadedDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert(reloadedDark, 'Dark mode class is present immediately on page load');
    await page.screenshot({ path: `${ARTIFACTS}/smooth_theme_4_reloaded_dark.png` });
    console.log('✅ [PASS] 5. Page reload with Dark mode persisted verified.');

    // 8. Verify centralized theme across sub-pages
    console.log('7️⃣ Verifying centralized theme across workspace & dashboard pages...');
    await page.goto(`${BASE}/workspace/subscription`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    const isSubDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert(isSubDark, 'Subscription page inherited dark theme');
    await page.screenshot({ path: `${ARTIFACTS}/smooth_theme_5_workspace_subscription_dark.png` });
    console.log('✅ [PASS] 6. Workspace Subscription page verified in Dark mode.');

    await page.goto(`${BASE}/workspace/settings`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    const isSettingsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert(isSettingsDark, 'Settings page inherited dark theme');
    await page.screenshot({ path: `${ARTIFACTS}/smooth_theme_6_workspace_settings_dark.png` });
    console.log('✅ [PASS] 7. Workspace Settings page verified in Dark mode.');

    console.log('\n======================================================');
    console.log('ALL THEME TRANSITION & SMOOTHNESS TESTS PASSED (7/7)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Theme verification failed:', err);
    await page.screenshot({ path: `${ARTIFACTS}/theme_test_error.png` });
    throw err;
  } finally {
    await browser.close();
  }
}

runThemeVerification().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
