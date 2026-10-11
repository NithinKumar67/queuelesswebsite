const Token = require('../models/Token');
const Counter = require('../models/Counter');

const TIME_ZONE = 'Asia/Kolkata';
const ACTIVE_STATUSES = ['WAITING', 'CALLED', 'SERVING'];
const EXPIRABLE_STATUSES = ['WAITING', 'CALLED'];

const DEFAULT_SCHEDULE = {
  workingDays: [1, 2, 3, 4, 5, 6],
  openingTime: '08:00',
  closingTime: '20:00',
  tokenCutoffMinutes: 0,
  holidays: []
};

function getLocalDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getLocalTimeMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return Number(values.hour) * 60 + Number(values.minute);
}

function getLocalDayOfWeek(date = new Date()) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short'
  }).format(date);

  return ({
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  })[weekday];
}

function addOneCalendarDay(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));

  return `${next.getUTCFullYear()}-${String(
    next.getUTCMonth() + 1
  ).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

// All office schedules use India Standard Time.
function getTodayBounds(now = new Date()) {
  const date = getLocalDateString(now);
  const nextDate = addOneCalendarDay(date);

  return {
    date,
    start: new Date(`${date}T00:00:00+05:30`),
    end: new Date(`${nextDate}T00:00:00+05:30`)
  };
}

function timeToMinutes(value, fallback) {
  if (
    typeof value !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  ) {
    return fallback;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function getOfficeSchedule(office) {
  return {
    workingDays:
      Array.isArray(office.workingDays) && office.workingDays.length
        ? office.workingDays.map(Number)
        : DEFAULT_SCHEDULE.workingDays,

    openingTime: office.openingTime || DEFAULT_SCHEDULE.openingTime,
    closingTime: office.closingTime || DEFAULT_SCHEDULE.closingTime,

    tokenCutoffMinutes: Number.isFinite(
      Number(office.tokenCutoffMinutes)
    )
      ? Math.max(0, Number(office.tokenCutoffMinutes))
      : DEFAULT_SCHEDULE.tokenCutoffMinutes,

    holidays: Array.isArray(office.holidays)
      ? office.holidays
      : DEFAULT_SCHEDULE.holidays
  };
}

function getTokenAvailability(office, now = new Date()) {
  const schedule = getOfficeSchedule(office);
  const { date } = getTodayBounds(now);
  const dayOfWeek = getLocalDayOfWeek(now);
  const nowMinutes = getLocalTimeMinutes(now);

  const openingMinutes = timeToMinutes(
    schedule.openingTime,
    8 * 60
  );

  const closingMinutes = timeToMinutes(
    schedule.closingTime,
    20 * 60
  );

  const cutoffMinutes =
    closingMinutes - schedule.tokenCutoffMinutes;

  const holiday = schedule.holidays.find((item) => {
    const holidayDate =
      typeof item === 'string' ? item : item?.date;

    return holidayDate === date;
  });

  if (holiday) {
    const holidayName =
      typeof holiday === 'object' && holiday.name
        ? ` (${holiday.name})`
        : '';

    return {
      allowed: false,
      message: `Tokens cannot be generated today because the office is closed for a holiday${holidayName}.`
    };
  }

  if (!schedule.workingDays.includes(dayOfWeek)) {
    return {
      allowed: false,
      message: 'Tokens cannot be generated today because the office is closed.'
    };
  }

  if (nowMinutes < openingMinutes) {
    return {
      allowed: false,
      message: `Token generation opens at ${schedule.openingTime}.`
    };
  }

  if (nowMinutes >= cutoffMinutes) {
    return {
      allowed: false,
      message: `Token generation has closed for today. The last-token cutoff is ${formatMinutes(cutoffMinutes)}.`
    };
  }

  return { allowed: true, schedule, date };
}

function formatMinutes(totalMinutes) {
  const normalized = Math.max(
    0,
    Math.min(23 * 60 + 59, totalMinutes)
  );

  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function getClosingInstant(office, now = new Date()) {
  const { date } = getTodayBounds(now);
  const schedule = getOfficeSchedule(office);

  const closingMinutes = timeToMinutes(
    schedule.closingTime,
    20 * 60
  );

  const closingTime =
    `${String(Math.floor(closingMinutes / 60)).padStart(2, '0')}:` +
    `${String(closingMinutes % 60).padStart(2, '0')}`;

  return new Date(`${date}T${closingTime}:00+05:30`);
}

// Expire previous-day unserved tokens.
// Tokens already being served are preserved.
async function expirePreviousDayUnservedTokens(now = new Date()) {
  const { start } = getTodayBounds(now);

  const expiredTokens = await Token.find({
    createdAt: { $lt: start },
    status: { $in: EXPIRABLE_STATUSES }
  }).select('_id');

  if (!expiredTokens.length) return 0;

  const expiredIds = expiredTokens.map((token) => token._id);

  const result = await Token.updateMany(
    {
      _id: { $in: expiredIds },
      status: { $in: EXPIRABLE_STATUSES }
    },
    { $set: { status: 'CANCELLED' } }
  );

  await Counter.updateMany(
    { currentTokenId: { $in: expiredIds } },
    { $set: { currentTokenId: null } }
  );

  return result.modifiedCount || 0;
}

async function checkQueueCanFinishBeforeClosing({
  office,
  service,
  now = new Date()
}) {
  const { start, end } = getTodayBounds(now);

  const counters = await Counter.countDocuments({
    officeId: office._id,
    status: 'AVAILABLE'
  });

  if (counters < 1) {
    return {
      allowed: false,
      message: 'No counters are currently available to serve new tokens.'
    };
  }

  // Include today's queue and tokens already being served.
  const queuedTokens = await Token.find({
    officeId: office._id,
    status: { $in: ACTIVE_STATUSES },
    $or: [
      { createdAt: { $gte: start, $lt: end } },
      { status: 'SERVING' }
    ]
  }).populate('serviceId', 'averageServiceTime');

  let remainingServiceMinutes = 0;

  for (const token of queuedTokens) {
    const averageMinutes = Number(
      token.serviceId?.averageServiceTime || 5
    );

    if (token.status === 'SERVING' && token.startedAt) {
      const elapsedMinutes =
        (now.getTime() - new Date(token.startedAt).getTime()) /
        60000;

      remainingServiceMinutes += Math.max(
        0,
        averageMinutes - elapsedMinutes
      );
    } else {
      remainingServiceMinutes += averageMinutes;
    }
  }

  const projectedMinutes =
    (
      remainingServiceMinutes +
      Number(service.averageServiceTime || 5)
    ) / counters;

  const projectedCompletion = new Date(
    now.getTime() + projectedMinutes * 60000
  );

  const closingInstant = getClosingInstant(office, now);

  if (projectedCompletion > closingInstant) {
    return {
      allowed: false,
      message:
        'The remaining queue is too large to reasonably serve another token before the office closes. Please visit on the next working day.'
    };
  }

  return { allowed: true, projectedMinutes };
}

module.exports = {
  TIME_ZONE,
  getTodayBounds,
  getTokenAvailability,
  expirePreviousDayUnservedTokens,
  checkQueueCanFinishBeforeClosing
};