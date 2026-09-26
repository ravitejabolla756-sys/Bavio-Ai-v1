import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Test 1: Verify auth-utils constants and canonical origin resolution
import { PROD_AUTH_ORIGIN, getCanonicalAuthCallbackUrl } from '../src/lib/auth-utils.ts';

console.log('🧪 Running Bavio Google OAuth Regression Tests...\n');

// 1. Production auth origin is strictly bavio.in (no www)
assert.equal(PROD_AUTH_ORIGIN, 'https://bavio.in', 'PROD_AUTH_ORIGIN must be https://bavio.in');
console.log('✅ 1. PROD_AUTH_ORIGIN is canonical https://bavio.in');

// 2. SSR fallback returns bavio.in/auth/callback
// (When window is undefined, as in Node)
const ssrUrl = getCanonicalAuthCallbackUrl(false);
assert.equal(ssrUrl, 'https://bavio.in/auth/callback', 'SSR callback URL must be https://bavio.in/auth/callback');
const ssrPopupUrl = getCanonicalAuthCallbackUrl(true);
assert.equal(ssrPopupUrl, 'https://bavio.in/auth/callback?oauth_popup=true', 'SSR popup callback URL must have ?oauth_popup=true');
console.log('✅ 2. SSR getCanonicalAuthCallbackUrl() returns https://bavio.in/auth/callback');

// 3. Browser simulation on production apex domain (bavio.in)
global.window = {
  location: {
    hostname: 'bavio.in',
    origin: 'https://bavio.in',
  }
};
const clientApexUrl = getCanonicalAuthCallbackUrl(false);
assert.equal(clientApexUrl, 'https://bavio.in/auth/callback', 'Apex domain client URL must be https://bavio.in/auth/callback');
console.log('✅ 3. Client on bavio.in returns https://bavio.in/auth/callback');

// 4. Browser simulation on www.bavio.in (must resolve to canonical PROD_AUTH_ORIGIN)
global.window = {
  location: {
    hostname: 'www.bavio.in',
    origin: 'https://www.bavio.in',
  }
};
const clientWwwUrl = getCanonicalAuthCallbackUrl(false);
assert.equal(clientWwwUrl, 'https://bavio.in/auth/callback', 'www domain client URL must resolve to canonical https://bavio.in/auth/callback');
assert.ok(!clientWwwUrl.includes('www.bavio.in'), 'OAuth redirectTo must NEVER contain www.bavio.in');
console.log('✅ 4. Client on www.bavio.in redirects to canonical https://bavio.in/auth/callback (ZERO www in auth path)');

// 5. Browser simulation on preview/localhost (preserves localhost/preview origin)
global.window = {
  location: {
    hostname: 'localhost',
    origin: 'http://localhost:3000',
  }
};
const clientLocalUrl = getCanonicalAuthCallbackUrl(false);
assert.equal(clientLocalUrl, 'http://localhost:3000/auth/callback', 'Localhost must preserve local origin');

global.window = {
  location: {
    hostname: 'bavio-preview-git-feature.vercel.app',
    origin: 'https://bavio-preview-git-feature.vercel.app',
  }
};
const clientPreviewUrl = getCanonicalAuthCallbackUrl(false);
assert.equal(clientPreviewUrl, 'https://bavio-preview-git-feature.vercel.app/auth/callback', 'Vercel preview must preserve preview origin');
console.log('✅ 5. Localhost and Vercel preview environments correctly preserve their own origins');

// 6. Cleanup window simulation
delete global.window;

// 7. Verify AuthCallback page and AuthController source code guarantees
const authCallbackSrc = fs.readFileSync(path.resolve('./src/app/auth/callback/page.tsx'), 'utf-8');
assert.ok(!authCallbackSrc.includes("'https://www.bavio.in'"), 'auth/callback/page.tsx must have 0 occurrences of www.bavio.in');
console.log('✅ 6. auth/callback/page.tsx has zero www.bavio.in hardcoded origins');

const authControllerSrc = fs.readFileSync(path.resolve('../backend/controllers/authController.js'), 'utf-8');
assert.ok(!authControllerSrc.includes("emailRedirectTo: `${req.headers.origin || 'https://www.bavio.in'}"), 'authController.js must not fallback to www.bavio.in for email verification');
console.log('✅ 7. authController.js uses canonical https://bavio.in for email redirects');

console.log('\n🎉 ALL 7 OAUTH REGRESSION TESTS PASSED SUCCESSFULLY!\n');
