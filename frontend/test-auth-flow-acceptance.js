const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

(async () => {
  console.log('🚀 Running Full Authentication Flow Acceptance Tests...\n');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

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
    // TEST 5: Open /workspace while logged out -> Redirect to /login
    // ─────────────────────────────────────────────────────────────
    console.log('--- TEST 5: Open /workspace while logged out ---');
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    // Clear all storage and cookies
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');

    await page.goto(`${BASE}/workspace`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const loggedOutUrl = page.url();
    assert(loggedOutUrl.includes('/login'), `Logged out access to /workspace redirects to /login (Current URL: ${loggedOutUrl})`);
    await page.screenshot({ path: `${ARTIFACTS}/auth_test_5_logged_out_redirect.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Signup page -> Click "Sign In" -> Must navigate to /login
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 1: Signup page "Sign In" link ---');
    await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${ARTIFACTS}/auth_test_1_signup_page.png` });

    // Find and click "Sign In" link
    const signInLink = await page.waitForSelector('a[href="/login"]', { timeout: 5000 });
    assert(signInLink !== null, 'Signup page contains link pointing to /login');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      signInLink.click()
    ]);
    
    const currentUrlAfterClick = page.url();
    assert(currentUrlAfterClick.endsWith('/login'), `Clicking "Sign In" from signup navigated to /login (Current URL: ${currentUrlAfterClick})`);
    await page.screenshot({ path: `${ARTIFACTS}/auth_test_1_login_page_after_click.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 2 & 3: Check Google and Microsoft buttons on Login page
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2 & 3: Verify Google & Microsoft OAuth triggers ---');
    const googleBtn = await page.$('button ::-p-text(Continue with Google)');
    const msftBtn = await page.$('button ::-p-text(Continue with Microsoft)');
    assert(googleBtn !== null, 'Google login button is present and ready');
    assert(msftBtn !== null, 'Microsoft login button is present and ready');
    await page.screenshot({ path: `${ARTIFACTS}/auth_test_2_3_login_buttons.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 4 & 6: Authenticated session resolution & workspace loading
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4 & 6: Authenticated session resolution & Workspace HUD ---');
    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'valid_test_session_token_123');
      localStorage.setItem('bavio_client_id', 'client_demo_789');
      localStorage.setItem('bavio_name', 'Acme Health AI');
      document.cookie = 'bavio_auth=true; path=/';
      document.cookie = 'bavio_onboarding_completed=true; path=/';
    });

    await page.goto(`${BASE}/workspace`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const workspaceUrl = page.url();
    const hasFailureError = await page.evaluate(() => {
      return document.body.innerText.includes('Workspace Load Failure') ||
             document.body.innerText.includes('Failed to fetch user profile');
    });
    
    assert(workspaceUrl.includes('/workspace') && !hasFailureError, 'Workspace loads normally without profile failure');
    await page.screenshot({ path: `${ARTIFACTS}/auth_test_4_6_workspace_loaded.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Refresh /workspace -> Session persists
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 7: Page reload persistence on /workspace ---');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    const reloadedUrl = page.url();
    const hasFailureOnReload = await page.evaluate(() => {
      return document.body.innerText.includes('Workspace Load Failure');
    });
    assert(reloadedUrl.includes('/workspace') && !hasFailureOnReload, 'Workspace session persists cleanly across browser refreshes');
    await page.screenshot({ path: `${ARTIFACTS}/auth_test_7_workspace_refreshed.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 8: Sign out -> Returned to /login, access revoked
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 8: Sign out and verify protection ---');
    const signOutBtn = await page.waitForSelector('#workspace-signout-btn', { timeout: 5000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      signOutBtn.click()
    ]);

    const urlAfterLogout = page.url();
    assert(urlAfterLogout.includes('/login'), `Sign out redirects user to /login (Current URL: ${urlAfterLogout})`);
    await page.screenshot({ path: `${ARTIFACTS}/auth_test_8_logged_out_login_page.png` });

    // Attempt to navigate back to /workspace
    await page.goto(`${BASE}/workspace`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const reaccessUrl = page.url();
    assert(reaccessUrl.includes('/login'), `Re-accessing /workspace without auth redirects to /login (Current URL: ${reaccessUrl})`);
    await page.screenshot({ path: `${ARTIFACTS}/auth_test_8_protected_route_revoked.png` });

    console.log(`\n========================================`);
    console.log(`ACCEPTANCE TESTS SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('❌ Acceptance test execution error:', err);
  } finally {
    await browser.close();
  }
})();
