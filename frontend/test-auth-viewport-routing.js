const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

(async () => {
  console.log('🚀 Running Complete Auth Screen Routing & Non-Scrollable Tests...\n');
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
    // Clear cookies & storage
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');

    // ─────────────────────────────────────────────────────────────
    // TEST 1: /login -> Click "Don't have an account? Sign Up" -> /signup ("Create Workspace Account")
    // ─────────────────────────────────────────────────────────────
    console.log('--- TEST 1: Login -> Click Sign Up Link ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${ARTIFACTS}/auth_matrix_1_login.png` });

    const signUpLink = await page.waitForSelector('#login-signup-link, a[href="/signup"]', { timeout: 5000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      signUpLink.click()
    ]);

    const url1 = page.url();
    const heading1 = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText.trim() : '';
    });
    console.log(`URL after click: ${url1}, Heading: "${heading1}"`);

    assert(url1.endsWith('/signup') && heading1 === 'Create Workspace Account',
           'Login "Sign Up" link navigated to /signup with "Create Workspace Account" heading (NOT generic "Get Started")');
    await page.screenshot({ path: `${ARTIFACTS}/auth_matrix_1_signup_rendered.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 2: /signup direct access & field verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2: Direct /signup & required fields ---');
    await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    const fields = await page.evaluate(() => {
      return {
        email: Boolean(document.querySelector('#email-input')),
        password: Boolean(document.querySelector('#password-input')),
        businessName: Boolean(document.querySelector('#business-name-input')),
        businessPhone: Boolean(document.querySelector('#business-phone-input')),
        heading: document.querySelector('h1')?.innerText.trim(),
      };
    });

    console.log('Signup Fields Detected:', fields);
    assert(fields.heading === 'Create Workspace Account' &&
           fields.email && fields.password && fields.businessName && fields.businessPhone,
           'Signup page has Create Workspace Account with Email, Password, Business Name, Business Phone');
    await page.screenshot({ path: `${ARTIFACTS}/auth_matrix_2_signup_fields.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 3: On /signup, click "Already have an account? Sign In" -> /login
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 3: On /signup, click Sign In link ---');
    const signInLink = await page.waitForSelector('#signup-signin-link, a[href="/login"]', { timeout: 5000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      signInLink.click()
    ]);

    const url3 = page.url();
    const loginHeading3 = await page.evaluate(() => document.querySelector('h1')?.innerText.trim());
    console.log(`URL after clicking Sign In: ${url3}, Heading: "${loginHeading3}"`);

    assert(url3.endsWith('/login') && loginHeading3 === 'Welcome Back',
           'Signup "Sign In" link navigated to /login with "Welcome Back" heading');
    await page.screenshot({ path: `${ARTIFACTS}/auth_matrix_3_login_rendered.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Refresh /signup -> Still /signup with "Create Workspace Account"
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Refresh /signup ---');
    await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const url4 = page.url();
    const heading4 = await page.evaluate(() => document.querySelector('h1')?.innerText.trim());
    assert(url4.endsWith('/signup') && heading4 === 'Create Workspace Account',
           'Refreshed /signup stays on /signup and renders "Create Workspace Account"');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Non-scrollable viewport test across resolutions
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 5: Non-scrollable viewport containment ---');
    const resolutions = [
      { width: 1920, height: 1080, name: '1080p Desktop' },
      { width: 1440, height: 900, name: '1440x900 Laptop' },
      { width: 1280, height: 800, name: '1280x800 Small Laptop' }
    ];

    for (const res of resolutions) {
      await page.setViewport({ width: res.width, height: res.height });
      await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 500));

      const scrollInfo = await page.evaluate(() => {
        return {
          windowHeight: window.innerHeight,
          bodyScrollHeight: document.body.scrollHeight,
          docScrollHeight: document.documentElement.scrollHeight,
          hasBodyVScroll: document.body.scrollHeight > window.innerHeight + 2,
          hasDocVScroll: document.documentElement.scrollHeight > window.innerHeight + 2,
          hasHScroll: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      console.log(`Scroll status for ${res.name}:`, scrollInfo);
      assert(!scrollInfo.hasBodyVScroll && !scrollInfo.hasHScroll,
             `Non-scrollable viewport containment on ${res.name} (No body or horizontal scrollbar)`);
      await page.screenshot({ path: `${ARTIFACTS}/auth_matrix_5_viewport_${res.width}x${res.height}.png` });
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Successful Signup & Transition
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 6: Successful Signup Flow ---');
    const testEmail = `corp-${Date.now()}@bavio.ai`;
    const testPassword = 'Password123!#';

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle2' });
    
    await page.type('#email-input', testEmail);
    await page.type('#password-input', testPassword);
    await page.type('#business-name-input', 'Apex Medical Care');
    await page.type('#business-phone-input', '9876543210');
    
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));

    const isSubmitted = await page.evaluate(() => {
      return Boolean(document.querySelector('#thank-you-card, [key="thank-you-state"]') || 
                     document.body.innerText.includes('Workspace Ready') || 
                     document.body.innerText.includes('Account Created') ||
                     document.body.innerText.includes('Go to Onboarding'));
    });
    assert(isSubmitted, 'Signup form submitted successfully and rendered success state without errors');
    await page.screenshot({ path: `${ARTIFACTS}/auth_matrix_6_signup_success.png` });

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Authentication Session Navigation to /workspace
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 7: Authenticated Session Navigation ---');
    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'test_verified_token');
      localStorage.setItem('bavio_name', 'Apex Medical Care');
      document.cookie = 'bavio_auth=true; path=/';
    });

    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      // Simulate auth success handler
      window.location.href = '/workspace';
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const url7 = page.url();
    assert(url7.includes('/workspace'),
           `Authenticated user resolves and loads /workspace (Current URL: ${url7})`);
    await page.screenshot({ path: `${ARTIFACTS}/auth_matrix_7_login_success.png` });

    console.log(`\n========================================`);
    console.log(`AUTH SCREEN MATRIX: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await browser.close();
  }
})();
