const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

(async () => {
  console.log('🚀 Running Root Cause Auth & Navigation Verification...\n');
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
    // TEST A: /signup -> Click "Already have an account? Sign In" -> MUST BE /login
    // ─────────────────────────────────────────────────────────────
    console.log('--- TEST A: Signup page -> Click Sign In link ---');
    await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${ARTIFACTS}/root_test_A_signup.png` });

    const signInLink = await page.waitForSelector('#signup-signin-link, a[href="/login"]', { timeout: 5000 });
    console.log('Clicking "Already have an account? Sign In"...');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      signInLink.click()
    ]);

    const urlAfterClick = page.url();
    const pageTextAfterClick = await page.evaluate(() => document.body.innerText);
    const isLoginPage = urlAfterClick.endsWith('/login') && pageTextAfterClick.includes('Welcome Back');
    const isNotWorkspace = !urlAfterClick.includes('/workspace') && !pageTextAfterClick.includes('VERIFYING SESSION');

    assert(isLoginPage && isNotWorkspace, `Clicking "Sign In" navigated to /login and rendered Login UI (Current URL: ${urlAfterClick})`);
    await page.screenshot({ path: `${ARTIFACTS}/root_test_A_login_rendered.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST B: Open /login directly while logged out
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST B: Direct access to /login ---');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    const loginDirectUrl = page.url();
    const isLoginDirect = loginDirectUrl.endsWith('/login');
    assert(isLoginDirect, `Direct access to /login remains on /login without redirect (Current URL: ${loginDirectUrl})`);
    await page.screenshot({ path: `${ARTIFACTS}/root_test_B_direct_login.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST C: Open /workspace while logged out -> Must immediately redirect to /login
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST C: Open /workspace while logged out ---');
    // Clear storage & cookies
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');

    await page.goto(`${BASE}/workspace`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    const loggedOutWorkspaceUrl = page.url();
    const isRedirectedToLogin = loggedOutWorkspaceUrl.includes('/login');
    const isNotStuck = !(await page.evaluate(() => document.body.innerText.includes('VERIFYING SESSION...')));

    assert(isRedirectedToLogin && isNotStuck, `Opening /workspace while logged out immediately redirects to /login (Current URL: ${loggedOutWorkspaceUrl})`);
    await page.screenshot({ path: `${ARTIFACTS}/root_test_C_logged_out_redirect.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST D: Authenticated user loads /workspace cleanly
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST D: Authenticated user loads /workspace ---');
    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'valid_test_token_999');
      localStorage.setItem('bavio_client_id', 'test_client_id_999');
      localStorage.setItem('bavio_name', 'Acme Voice Corp');
      document.cookie = 'bavio_auth=true; path=/';
    });

    await page.goto(`${BASE}/workspace`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const authWorkspaceUrl = page.url();
    const hasWorkspaceContent = await page.evaluate(() => {
      return document.body.innerText.includes('Welcome to Bavio') &&
             document.body.innerText.includes('Organization Profile');
    });

    assert(authWorkspaceUrl.includes('/workspace') && hasWorkspaceContent, `Workspace loads cleanly for authenticated session (Current URL: ${authWorkspaceUrl})`);
    await page.screenshot({ path: `${ARTIFACTS}/root_test_D_auth_workspace.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST E: Refresh /workspace -> Session restored cleanly
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST E: Refresh /workspace ---');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    const reloadedUrl = page.url();
    const hasContentOnReload = await page.evaluate(() => {
      return document.body.innerText.includes('Welcome to Bavio');
    });

    assert(reloadedUrl.includes('/workspace') && hasContentOnReload, `Workspace reloads cleanly without infinite spinner (Current URL: ${reloadedUrl})`);
    await page.screenshot({ path: `${ARTIFACTS}/root_test_E_reloaded_workspace.png` });

    console.log(`\n========================================`);
    console.log(`ROOT CAUSE VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await browser.close();
  }
})();
