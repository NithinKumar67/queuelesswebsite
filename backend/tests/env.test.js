const test = require('node:test');
const assert = require('node:assert/strict');

const { validateEnv, getAllowedOrigins, getCookieOptions } = require('../src/config/env');

const good = {
  MONGO_URI: 'mongodb://127.0.0.1:27017/queueless',
  SESSION_SECRET: 'a-long-enough-secret-value',
  CLIENT_URL: 'http://localhost:5173'
};

test('accepts a complete configuration', () => {
  assert.doesNotThrow(() => validateEnv(good));
});

test('reports every missing or placeholder value', () => {
  assert.throws(
    () => validateEnv({ MONGO_URI: 'your_mongodb_atlas_connection_string' }),
    (error) =>
      /MONGO_URI/.test(error.message) &&
      /SESSION_SECRET/.test(error.message) &&
      /CLIENT_URL/.test(error.message)
  );
});

test('rejects a short session secret and a non-numeric port', () => {
  assert.throws(() => validateEnv({ ...good, SESSION_SECRET: 'short' }), /at least 16/);
  assert.throws(() => validateEnv({ ...good, PORT: 'abc' }), /PORT/);
});

test('parses several origins and strips trailing slashes', () => {
  assert.deepEqual(
    getAllowedOrigins({ CLIENT_URL: 'http://a.com/, https://b.com' }),
    ['http://a.com', 'https://b.com']
  );
});

test('cookie options default to lax/insecure and honour env overrides', () => {
  assert.deepEqual(
    { s: getCookieOptions({}).secure, ss: getCookieOptions({}).sameSite },
    { s: false, ss: 'lax' }
  );
  const cross = getCookieOptions({ COOKIE_SECURE: 'true', COOKIE_SAMESITE: 'none' });
  assert.equal(cross.secure, true);
  assert.equal(cross.sameSite, 'none');
  assert.equal(getCookieOptions({ COOKIE_SAMESITE: 'bogus' }).sameSite, 'lax');
});
