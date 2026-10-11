// Central environment validation. Called once at startup, before the app
// (and its MongoDB session store) is created, so a missing value fails
// fast with a clear message instead of a confusing runtime error.

const PLACEHOLDERS = new Set([
  'your_mongodb_atlas_connection_string',
  'change_me_to_a_long_random_string'
]);

const REQUIRED = ['MONGO_URI', 'SESSION_SECRET', 'CLIENT_URL'];

const validateEnv = (env = process.env) => {
  const problems = [];

  for (const name of REQUIRED) {
    const value = (env[name] || '').trim();

    if (!value || PLACEHOLDERS.has(value)) {
      problems.push(`${name} is required (see backend/.env.example)`);
    }
  }

  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 16) {
    problems.push('SESSION_SECRET must be at least 16 characters');
  }

  if (env.PORT && !/^\d+$/.test(env.PORT)) {
    problems.push('PORT must be a number');
  }

  if (problems.length) {
    throw new Error(
      `Invalid environment configuration:\n - ${problems.join('\n - ')}`
    );
  }
};

// CLIENT_URL may contain several comma-separated origins.
const getAllowedOrigins = (env = process.env) =>
  (env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

// Cookie settings. Defaults suit same-site/local development.
// For a frontend on a different site over HTTPS set
// COOKIE_SECURE=true and COOKIE_SAMESITE=none (and TRUST_PROXY=1 behind a proxy).
const getCookieOptions = (env = process.env) => {
  const secure = env.COOKIE_SECURE === 'true';
  const sameSite = ['lax', 'strict', 'none'].includes(env.COOKIE_SAMESITE)
    ? env.COOKIE_SAMESITE
    : 'lax';

  return {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure,
    sameSite
  };
};

module.exports = { validateEnv, getAllowedOrigins, getCookieOptions };
