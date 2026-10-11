// ML client: request shape, response validation, timeout/failure fallback.
// global.fetch is replaced per test, so no real ML service is contacted.
process.env.ML_API_URL = 'http://ml.test:8000/';

const test = require('node:test');
const assert = require('node:assert/strict');

const { predictWaitTime } = require('../src/utils/mlPrediction');

const realFetch = global.fetch;
const realWarn = console.warn;
test.beforeEach(() => { console.warn = () => {}; });
test.afterEach(() => { global.fetch = realFetch; console.warn = realWarn; });

const input = { peopleAhead: 12, averageServiceTime: 5, activeCounters: 3 };

test('sends the expected request and returns the ML result', async () => {
  let call;
  global.fetch = async (url, options) => {
    call = { url, options };
    return {
      ok: true,
      json: async () => ({ predicted_wait_time: 23.4, baseline_wait_time: 20, model_used: 'random_forest' })
    };
  };

  const result = await predictWaitTime(input);

  assert.equal(call.url, 'http://ml.test:8000/predict'); // trailing slash trimmed
  assert.deepEqual(JSON.parse(call.options.body), {
    people_ahead: 12, average_service_time: 5, active_counters: 3
  });
  assert.deepEqual(result, {
    predictedWaitTime: 23.4, baselineWaitTime: 20, modelUsed: 'random_forest'
  });
});

test('falls back to the baseline when the ML API is unreachable', async () => {
  global.fetch = async () => { throw new Error('connect ECONNREFUSED'); };
  const result = await predictWaitTime(input);
  assert.deepEqual(result, {
    predictedWaitTime: 20, baselineWaitTime: 20, modelUsed: 'baseline_fallback'
  });
});

test('falls back on HTTP errors and on invalid payloads', async () => {
  global.fetch = async () => ({ ok: false, status: 500 });
  assert.equal((await predictWaitTime(input)).modelUsed, 'baseline_fallback');

  global.fetch = async () => ({ ok: true, json: async () => ({ predicted_wait_time: -3 }) });
  assert.equal((await predictWaitTime(input)).modelUsed, 'baseline_fallback');

  global.fetch = async () => ({ ok: true, json: async () => ({ predicted_wait_time: 'abc' }) });
  assert.equal((await predictWaitTime(input)).modelUsed, 'baseline_fallback');
});

test('does not call the ML API when there are no active counters', async () => {
  let called = false;
  global.fetch = async () => { called = true; };
  const result = await predictWaitTime({ ...input, activeCounters: 0 });
  assert.equal(called, false);
  assert.deepEqual(result, {
    predictedWaitTime: null, baselineWaitTime: null, modelUsed: 'no_active_counters'
  });
});

test('rejects a non-positive average service time without calling the API', async () => {
  let called = false;
  global.fetch = async () => { called = true; };
  const result = await predictWaitTime({ ...input, averageServiceTime: 0 });
  assert.equal(called, false);
  assert.equal(result.modelUsed, 'invalid_average_service_time');
});

test('nobody ahead gives a zero baseline', async () => {
  global.fetch = async () => { throw new Error('down'); };
  const result = await predictWaitTime({ ...input, peopleAhead: 0 });
  assert.equal(result.predictedWaitTime, 0);
});
