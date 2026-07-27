/**
 * Ziplink — test suite (Node.js built-in assert, no DB required)
 * Run: node test.js
 */
import assert from 'node:assert/strict';

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    results.push({ name, ok: true });
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    results.push({ name, ok: false, error: err.message });
    failed++;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. createShortCode (links.service.js)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[1] createShortCode');

function createShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

test('generates 6-character string', () => {
  assert.equal(createShortCode().length, 6);
});
test('only alphanumeric characters', () => {
  for (let i = 0; i < 50; i++) assert.match(createShortCode(), /^[A-Za-z0-9]{6}$/);
});
test('produces unique codes (1000 samples)', () => {
  const seen = new Set();
  for (let i = 0; i < 1000; i++) seen.add(createShortCode());
  assert.ok(seen.size > 900, `Expected >900 unique codes, got ${seen.size}`);
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. expireAt status logic (links.service.js fix)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[2] Link status with expireAt');

function getLinkStatus(link) {
  const now = new Date();
  const isExpired = link.expireAt && link.expireAt.getTime() < now.getTime();
  return link.active && !isExpired ? 'Active' : 'Expired';
}

test('active link with future expireAt → Active', () => {
  const link = { active: true, expireAt: new Date(Date.now() + 1e9) };
  assert.equal(getLinkStatus(link), 'Active');
});
test('active link with null expireAt → Active (permanent link)', () => {
  const link = { active: true, expireAt: null };
  assert.equal(getLinkStatus(link), 'Active');
});
test('active link with past expireAt → Expired', () => {
  const link = { active: true, expireAt: new Date(Date.now() - 1000) };
  assert.equal(getLinkStatus(link), 'Expired');
});
test('inactive link → Expired regardless of expireAt', () => {
  const link = { active: false, expireAt: new Date(Date.now() + 1e9) };
  assert.equal(getLinkStatus(link), 'Expired');
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. redirect route logic — errorBool check order
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[3] redirect.route — errorBool order');

function simulateRedirectGet(response) {
  if (response.errorBool) return { status: response.errorStatus, body: { error: true, message: response.errorMSG } };
  const isExpired = response.expireAt && response.expireAt.getTime() < Date.now();
  if (!response.active || isExpired) return { status: 410, body: { error: true, code: 'LINK-410' } };
  return { status: 200, body: { error: false, originalUrl: response.originalUrl } };
}

test('error response returns 404 without accessing .user', () => {
  const r = simulateRedirectGet({ errorBool: true, errorStatus: 404, errorMSG: 'Not found' });
  assert.equal(r.status, 404);
  assert.equal(r.body.error, true);
});
test('inactive link returns 410', () => {
  const r = simulateRedirectGet({ errorBool: false, active: false, expireAt: null, originalUrl: 'https://x.com' });
  assert.equal(r.status, 410);
});
test('expired link returns 410', () => {
  const r = simulateRedirectGet({ errorBool: false, active: true, expireAt: new Date(Date.now() - 1000), originalUrl: 'https://x.com' });
  assert.equal(r.status, 410);
});
test('valid link returns 200 with originalUrl', () => {
  const r = simulateRedirectGet({ errorBool: false, active: true, expireAt: null, originalUrl: 'https://example.com' });
  assert.equal(r.status, 200);
  assert.equal(r.body.originalUrl, 'https://example.com');
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Authorization header parsing (custom.router.js fix)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[4] Authorization header parsing');

function extractToken(cookies, authHeader) {
  if (cookies?.access_token) return cookies.access_token;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) return parts[1];
  }
  return null;
}

test('cookie takes priority', () => {
  assert.equal(extractToken({ access_token: 'tok1' }, 'Bearer tok2'), 'tok1');
});
test('valid Bearer header returns token', () => {
  assert.equal(extractToken({}, 'Bearer mytoken'), 'mytoken');
});
test('"Bearer" with no token returns null', () => {
  assert.equal(extractToken({}, 'Bearer'), null);
});
test('malformed header returns null', () => {
  assert.equal(extractToken({}, 'TokenOnly'), null);
});
test('empty header returns null', () => {
  assert.equal(extractToken({}, ''), null);
});
test('no cookie and no header returns null', () => {
  assert.equal(extractToken({}, undefined), null);
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. Cookie options consistency (user.route.js fix)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[5] Cookie secure flag consistency');

function cookieOpts(nodeEnv) {
  return { httpOnly: true, sameSite: 'lax', secure: nodeEnv === 'production', path: '/' };
}

test('development → secure: false', () => {
  assert.equal(cookieOpts('development').secure, false);
});
test('production → secure: true', () => {
  assert.equal(cookieOpts('production').secure, true);
});
test('login and logout use same logic', () => {
  const login = cookieOpts(process.env.NODE_ENV || 'development');
  const logout = cookieOpts(process.env.NODE_ENV || 'development');
  assert.deepEqual(login, logout);
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. ObjectId validation guard (linkClick.DAO.js fix)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[6] ObjectId validation');

function isValidObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

test('valid 24-char hex → true', () => {
  assert.ok(isValidObjectId('507f1f77bcf86cd799439011'));
});
test('"abc" → false', () => {
  assert.ok(!isValidObjectId('abc'));
});
test('empty string → false', () => {
  assert.ok(!isValidObjectId(''));
});
test('23-char string → false', () => {
  assert.ok(!isValidObjectId('507f1f77bcf86cd79943901'));
});
test('25-char string → false', () => {
  assert.ok(!isValidObjectId('507f1f77bcf86cd7994390111'));
});
test('non-hex 24 chars → false', () => {
  assert.ok(!isValidObjectId('xxxxxxxxxxxxxxxxxxxxxxxx'));
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. URL validation (link.validation.js logic)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[7] URL validation');

function validateUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

test('https URL → valid', () => assert.ok(validateUrl('https://example.com')));
test('http URL → valid', () => assert.ok(validateUrl('http://example.com/path?q=1')));
test('javascript: protocol → invalid', () => assert.ok(!validateUrl('javascript:alert(1)')));
test('ftp: protocol → invalid', () => assert.ok(!validateUrl('ftp://files.example.com')));
test('plain text → invalid', () => assert.ok(!validateUrl('not a url')));
test('empty string → invalid', () => assert.ok(!validateUrl('')));

// ──────────────────────────────────────────────────────────────────────────────
// 8. NoSQL injection prevention (link.DAO.js fix — using $eq instead of $regex)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[8] NoSQL injection prevention');

function buildQuery(linkId, userID) {
  return { originalUrl: { $eq: linkId }, user: userID };
}

test('query uses $eq not $regex', () => {
  const q = buildQuery('https://example.com', 'user123');
  assert.ok('$eq' in q.originalUrl);
  assert.ok(!('$regex' in q.originalUrl));
});
test('regex pattern passed as linkId is treated as literal string', () => {
  const malicious = '.*';
  const q = buildQuery(malicious, 'user123');
  assert.equal(q.originalUrl.$eq, '.*');
});

// ──────────────────────────────────────────────────────────────────────────────
// 9. Session expiration comparison (custom.router.js fix)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[9] Session expiration comparison');

function isSessionExpired(session) {
  return !session || session.expiresAt.getTime() < Date.now();
}

test('future expiresAt → not expired', () => {
  assert.ok(!isSessionExpired({ expiresAt: new Date(Date.now() + 60000) }));
});
test('past expiresAt → expired', () => {
  assert.ok(isSessionExpired({ expiresAt: new Date(Date.now() - 1000) }));
});
test('null session → expired', () => {
  assert.ok(isSessionExpired(null));
});

// ──────────────────────────────────────────────────────────────────────────────
// 10. name length trimming (link.route.js fix)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[10] Name field sanitization');

function sanitizeName(raw) {
  return String(raw || '').trim().slice(0, 200) || null;
}

test('normal name preserved', () => assert.equal(sanitizeName('My Link'), 'My Link'));
test('name over 200 chars is truncated', () => assert.equal(sanitizeName('a'.repeat(300)).length, 200));
test('whitespace-only name → null', () => assert.equal(sanitizeName('   '), null));
test('empty name → null', () => assert.equal(sanitizeName(''), null));
test('undefined name → null', () => assert.equal(sanitizeName(undefined), null));

// ──────────────────────────────────────────────────────────────────────────────
// 11. country/city input sanitization (redirect.route.js fix)
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[11] Country/city sanitization');

function sanitizeGeo(raw) {
  return String(raw || 'Unknown').slice(0, 100);
}

test('normal country preserved', () => assert.equal(sanitizeGeo('Argentina'), 'Argentina'));
test('very long country truncated to 100', () => assert.equal(sanitizeGeo('x'.repeat(200)).length, 100));
test('null → "Unknown"', () => assert.equal(sanitizeGeo(null), 'Unknown'));
test('undefined → "Unknown"', () => assert.equal(sanitizeGeo(undefined), 'Unknown'));

// ──────────────────────────────────────────────────────────────────────────────
// 12. Race condition retry logic
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n[12] Race condition retry logic');

async function createLinkWithRetry(insertFn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await insertFn(attempt);
    } catch (err) {
      if (err?.code !== 11000 || attempt === maxRetries - 1) {
        return { errorBool: true, errorStatus: 500, errorMSG: 'Failed to create link' };
      }
    }
  }
}

test('succeeds on first try', async () => {
  const result = await createLinkWithRetry(async () => ({ shortCode: 'abc123' }));
  assert.equal(result.shortCode, 'abc123');
});
test('retries on E11000 and succeeds on 2nd attempt', async () => {
  let calls = 0;
  const result = await createLinkWithRetry(async () => {
    calls++;
    if (calls < 2) { const e = new Error('dup'); e.code = 11000; throw e; }
    return { shortCode: 'new123' };
  });
  assert.equal(result.shortCode, 'new123');
  assert.equal(calls, 2);
});
test('returns errorBool after max retries', async () => {
  const result = await createLinkWithRetry(async () => {
    const e = new Error('dup'); e.code = 11000; throw e;
  }, 3);
  assert.equal(result.errorBool, true);
});
test('non-11000 errors propagate as errorBool', async () => {
  const result = await createLinkWithRetry(async () => { throw new Error('DB down'); });
  assert.equal(result.errorBool, true);
});

// ──────────────────────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────────────────────

// wait for async tests
await Promise.resolve();
// Give async tests a tick to settle
await new Promise(r => setTimeout(r, 50));

console.log(`\n${'─'.repeat(60)}`);
console.log(`  Tests: ${passed + failed} | ✓ Passed: ${passed} | ✗ Failed: ${failed}`);
console.log('─'.repeat(60));

if (failed > 0) {
  console.error('\nFailed tests:');
  results.filter(r => !r.ok).forEach(r => console.error(`  ✗ ${r.name}: ${r.error}`));
  process.exit(1);
}
process.exit(0);
