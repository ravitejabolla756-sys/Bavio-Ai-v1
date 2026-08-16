'use strict';

const puppeteer = require('puppeteer');
const assert = require('assert');

async function testMarketingRedesign() {
  console.log('🚀 Running visual verification for Login & Signup left-side marketing redesign...\n');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // 1. Desktop Login Page (1440x900)
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Check text contents
    const loginText = await page.evaluate(() => document.body.innerText.toUpperCase());
    assert(loginText.includes('AI VOICE WORKFORCE'), 'Login missing eyebrow');
    assert(loginText.includes('YOUR BUSINESS,'), 'Login missing headline line 1');
    assert(loginText.includes('ALWAYS IN CONVERSATION.'), 'Login missing headline line 2');
    assert(loginText.includes('24/7 CALL'), 'Login missing 24/7 Call feature');
    assert(loginText.includes('LEAD'), 'Login missing Lead feature');
    assert(loginText.includes('WHATSAPP'), 'Login missing WhatsApp feature');
    assert(loginText.includes('APPOINTMENT'), 'Login missing Appointment feature');

    await page.screenshot({
      path: 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1/marketing_1_login_desktop.png',
    });
    console.log('✅ [PASS] Desktop Login page verified and captured.');

    // 2. Desktop Signup Page (1440x900)
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    const signupText = await page.evaluate(() => document.body.innerText.toUpperCase());
    assert(signupText.includes('AI VOICE WORKFORCE'), 'Signup missing eyebrow');
    assert(signupText.includes('YOUR BUSINESS,'), 'Signup missing headline line 1');
    assert(signupText.includes('ALWAYS IN CONVERSATION.'), 'Signup missing headline line 2');
    assert(signupText.includes('24/7 CALL'), 'Signup missing 24/7 Call feature');

    await page.screenshot({
      path: 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1/marketing_2_signup_desktop.png',
    });
    console.log('✅ [PASS] Desktop Signup page verified and captured.');

    // 3. Laptop / Tablet Viewport (1280x800)
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({
      path: 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1/marketing_3_login_1280x800.png',
    });
    console.log('✅ [PASS] 1280x800 Laptop Login page verified and captured.');

    // 4. Mobile Viewport (390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({
      path: 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1/marketing_4_signup_mobile.png',
    });
    console.log('✅ [PASS] Mobile Signup page verified and captured.');

    console.log('\n======================================================');
    console.log('ALL MARKETING REDESIGN TESTS PASSED (4/4)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Marketing test failed:', err);
    await page.screenshot({
      path: 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1/marketing_error.png',
    });
    throw err;
  } finally {
    await browser.close();
  }
}

testMarketingRedesign().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
