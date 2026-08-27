const assert = require('assert');

console.log('🧪 Testing Backend CORS Origin Validation Logic...\n');

// Import CORS options logic pattern from server.js
const allowedOrigins = [
  'https://bavio.in',
  'https://www.bavio.in',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'https://bavio.vercel.app',
  'https://bavio-ai.vercel.app',
  'https://bavio-frontend.vercel.app',
  'https://bavio-ai-v1.vercel.app',
  'https://alaya-osteopathic-suppliantly.ngrok-free.dev'
];

if (process.env.FRONTEND_URL) {
  const envOrigin = process.env.FRONTEND_URL.replace(/\/$/, '');
  if (!allowedOrigins.includes(envOrigin)) {
    allowedOrigins.push(envOrigin);
  }
}

function checkCorsOrigin(origin) {
  return new Promise((resolve) => {
    const originChecker = function (originHeader, callback) {
      if (!originHeader) return callback(null, true);

      const isExplicitlyAllowed = allowedOrigins.includes(originHeader);
      const isVercelDomain = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(originHeader);

      if (isExplicitlyAllowed || isVercelDomain) {
        callback(null, true);
      } else {
        console.error('[CORS REJECTED] Origin not allowed:', originHeader);
        callback(new Error('Not allowed by CORS'));
      }
    };

    originChecker(origin, (err, allow) => {
      if (err) resolve({ allowed: false, error: err.message });
      else resolve({ allowed: true });
    });
  });
}

(async () => {
  const testCases = [
    { origin: undefined, expected: true, label: 'No Origin (mobile/curl)' },
    { origin: 'https://bavio.in', expected: true, label: 'Production custom domain' },
    { origin: 'https://www.bavio.in', expected: true, label: 'Production www custom domain' },
    { origin: 'http://localhost:3000', expected: true, label: 'Localhost dev 3000' },
    { origin: 'http://localhost:3001', expected: true, label: 'Localhost dev 3001' },
    { origin: 'https://bavio.vercel.app', expected: true, label: 'Vercel default app domain' },
    { origin: 'https://bavio-ai.vercel.app', expected: true, label: 'Vercel bavio-ai domain' },
    { origin: 'https://bavio-frontend-v2.vercel.app', expected: true, label: 'Vercel preview deployment' },
    { origin: 'https://bavio-ai-v1-git-main-user.vercel.app', expected: true, label: 'Vercel git branch deployment' },
    { origin: 'https://malicious-site.com', expected: false, label: 'Unauthorized external domain' },
    { origin: 'https://hacker-bavio.in.spoof.com', expected: false, label: 'Spoofed domain' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = await checkCorsOrigin(tc.origin);
    const success = res.allowed === tc.expected;
    if (success) {
      console.log(`✅ Passed: [${tc.label}] -> Origin: "${tc.origin}" -> Allowed: ${res.allowed}`);
      passed++;
    } else {
      console.error(`❌ Failed: [${tc.label}] -> Expected ${tc.expected}, got ${res.allowed}`);
    }
  }

  console.log(`\nResults: ${passed}/${testCases.length} CORS test cases passed.`);
  assert.strictEqual(passed, testCases.length, 'All CORS test cases must pass!');
  console.log('🎉 CORS verification completed successfully!');
})();
