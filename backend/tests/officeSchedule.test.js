// Token-availability rules (working days, hours, cutoff, holidays) in IST.
// Replaces the old test-token-schedule.js, whose expectations (10:00-16:30)
// did not match the real defaults (08:00-20:00) and therefore failed.
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getTokenAvailability,
  getTodayBounds
} = require('../src/utils/officeSchedule');

// 2026-10-09 is a Friday. IST = UTC+05:30.
const ist = (hhmm, day = '2026-10-09') => new Date(`${day}T${hhmm}:00+05:30`);

const office = {
  workingDays: [1, 2, 3, 4, 5, 6],
  openingTime: '10:00',
  closingTime: '17:00',
  tokenCutoffMinutes: 30,
  holidays: []
};

test('blocked before opening time', () => {
  assert.equal(getTokenAvailability(office, ist('09:59')).allowed, false);
});

test('allowed at opening time', () => {
  assert.equal(getTokenAvailability(office, ist('10:00')).allowed, true);
});

test('allowed one minute before the cutoff, blocked at the cutoff', () => {
  assert.equal(getTokenAvailability(office, ist('16:29')).allowed, true);
  assert.equal(getTokenAvailability(office, ist('16:30')).allowed, false);
  assert.equal(getTokenAvailability(office, ist('16:31')).allowed, false);
});

test('blocked on a non-working day (Sunday)', () => {
  const result = getTokenAvailability(office, ist('11:00', '2026-10-11'));
  assert.equal(result.allowed, false);
  assert.match(result.message, /closed/);
});

test('blocked on a configured holiday (string and object forms)', () => {
  const object = { ...office, holidays: [{ date: '2026-10-09', name: 'Test' }] };
  const plain = { ...office, holidays: ['2026-10-09'] };

  assert.equal(getTokenAvailability(object, ist('11:00')).allowed, false);
  assert.equal(getTokenAvailability(plain, ist('11:00')).allowed, false);
});

test('an office with no schedule fields uses 08:00-20:00, Mon-Sat', () => {
  assert.equal(getTokenAvailability({}, ist('07:59')).allowed, false);
  assert.equal(getTokenAvailability({}, ist('08:00')).allowed, true);
  assert.equal(getTokenAvailability({}, ist('19:59')).allowed, true);
  assert.equal(getTokenAvailability({}, ist('20:00')).allowed, false);
  assert.equal(getTokenAvailability({}, ist('12:00', '2026-10-11')).allowed, false);
});

test('"today" is the IST calendar day, not the UTC day', () => {
  // 23:30 UTC on the 9th is already 05:00 IST on the 10th.
  const bounds = getTodayBounds(new Date('2026-10-09T23:30:00Z'));
  assert.equal(bounds.date, '2026-10-10');
  assert.equal(bounds.start.toISOString(), '2026-10-09T18:30:00.000Z');
  assert.equal(bounds.end.toISOString(), '2026-10-10T18:30:00.000Z');
});

test('invalid stored times fall back to defaults instead of crashing', () => {
  const broken = { openingTime: 'abc', closingTime: '99:99' };
  assert.equal(getTokenAvailability(broken, ist('12:00')).allowed, true);
});
