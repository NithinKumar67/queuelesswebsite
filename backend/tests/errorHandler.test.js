const test = require('node:test');
const assert = require('node:assert/strict');

const errorHandler = require('../src/middleware/errorHandler');
const ExpressError = require('../src/utils/ExpressError');

const run = (err, env = {}) => {
  const saved = process.env.NODE_ENV;
  const realError = console.error;
  console.error = () => {};
  if (env.NODE_ENV !== undefined) process.env.NODE_ENV = env.NODE_ENV;

  const res = {
    headersSent: false,
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };

  try { errorHandler(err, {}, res, () => {}); }
  finally { console.error = realError; process.env.NODE_ENV = saved; }
  return res;
};

test('keeps status and message of ExpressError', () => {
  const res = run(new ExpressError(404, 'Route not found'));
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { success: false, message: 'Route not found' });
});

test('maps mongoose CastError to 400, duplicate key to 409, bad JSON to 400', () => {
  assert.equal(run(Object.assign(new Error('x'), { name: 'CastError', path: '_id' })).statusCode, 400);
  assert.equal(run(Object.assign(new Error('dup'), { code: 11000 })).statusCode, 409);
  assert.equal(run(Object.assign(new Error('bad'), { type: 'entity.parse.failed', status: 400 })).statusCode, 400);
});

test('hides internal 500 messages in production only', () => {
  const secret = new Error('mongodb://user:pass@host failed');
  assert.equal(run(secret, { NODE_ENV: 'production' }).body.message, 'Something went wrong!');
  assert.equal(run(secret, { NODE_ENV: 'development' }).body.message, secret.message);
});
