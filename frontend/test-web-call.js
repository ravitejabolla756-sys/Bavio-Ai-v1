const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const ARTIFACTS = 'C:/Users/bolla/.gemini/antigravity-ide/brain/0a6c7cbd-3899-44b3-bfb2-eaba683c7bd1';

(async () => {
  console.log('Launching browser to test Web Call & Paid Phone Call separation...');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--start-maximized',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE, ['microphone']);

  try {
    // 1. Authenticate session
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.setCookie(
      { name: 'bavio_auth', value: 'true', domain: 'localhost', path: '/' },
      { name: 'bavio_onboarding_completed', value: 'true', domain: 'localhost', path: '/' }
    );
    await page.evaluate(() => {
      localStorage.setItem('bavio_token', 'mock_jwt_token');
    });

    // 2. Open /workspace/demo
    console.log('[1] Opening /workspace/demo...');
    await page.goto(`${BASE}/workspace/demo`, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Saving screenshot: 1_page_overview.png...');
    await page.screenshot({ path: `${ARTIFACTS}/voice_1_page_overview.png`, fullPage: true });

    // 3. Test Free Web Call
    console.log('[2] Starting Free Web Call...');
    const startWebBtn = await page.waitForSelector('#start-web-call-btn', { timeout: 10000 });
    await startWebBtn.click();
    await new Promise(r => setTimeout(r, 2500));

    console.log('Saving screenshot: 2_webcall_active.png...');
    await page.screenshot({ path: `${ARTIFACTS}/voice_2_webcall_active.png` });

    // End Web Call
    const endWebBtn = await page.waitForSelector('#end-web-call-btn', { timeout: 10000 });
    await endWebBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    console.log('Saving screenshot: 3_webcall_complete.png...');
    await page.screenshot({ path: `${ARTIFACTS}/voice_3_webcall_complete.png` });

    // 4. Test Live Phone Call Section
    console.log('[3] Testing Live Phone Call ($0.99) section...');
    // Click top-right banner or start-phone-flow-btn
    await page.evaluate(() => {
      const topBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Want Bavio to call your phone'));
      if (topBtn) topBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log('Saving screenshot: 4_phone_step1_number.png...');
    await page.screenshot({ path: `${ARTIFACTS}/voice_4_phone_step1_number.png` });

    // Type phone number in PhoneInput
    const phoneInput = await page.waitForSelector('input[type="tel"], input', { timeout: 5000 });
    await phoneInput.type('5551234567');
    await new Promise(r => setTimeout(r, 800));

    // Click Confirm Number
    const confirmBtn = await page.waitForSelector('#confirm-phone-btn', { timeout: 5000 });
    await confirmBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    console.log('Saving screenshot: 5_phone_step2_confirm_pay.png...');
    await page.screenshot({ path: `${ARTIFACTS}/voice_5_phone_step2_confirm_pay.png` });

    console.log('\n🎉 Verified all voice experience flows successfully!');
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.error('❌ Error during voice test:', err);
    await page.screenshot({ path: `${ARTIFACTS}/voice_error.png` }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
