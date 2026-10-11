const ML_API_URL = (
  process.env.ML_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

/**
 * Gets a wait-time prediction from the existing FastAPI service.
 * Falls back to the mathematical baseline when the ML API is unavailable.
 * A zero active-counter count is handled separately because no reliable
 * finite wait-time estimate can be calculated while all counters are inactive.
 */
const predictWaitTime = async ({
  peopleAhead,
  averageServiceTime,
  activeCounters,
}) => {
  const ahead = Math.max(0, Number(peopleAhead) || 0);
  const avgTime = Number(averageServiceTime);
  const counters = Number(activeCounters);

  if (!Number.isFinite(avgTime) || avgTime <= 0) {
    return {
      predictedWaitTime: null,
      baselineWaitTime: null,
      modelUsed: 'invalid_average_service_time',
    };
  }

  if (!Number.isFinite(counters) || counters < 1) {
    return {
      predictedWaitTime: null,
      baselineWaitTime: null,
      modelUsed: 'no_active_counters',
    };
  }

  const baselineWaitTime = (ahead * avgTime) / counters;

  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        people_ahead: ahead,
        average_service_time: avgTime,
        active_counters: counters,
      }),
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      throw new Error(`ML API returned HTTP ${response.status}`);
    }

    const result = await response.json();
    const predicted = Number(result.predicted_wait_time);

    if (!Number.isFinite(predicted) || predicted < 0) {
      throw new Error('ML API returned an invalid predicted_wait_time');
    }

    return {
      predictedWaitTime: predicted,
      baselineWaitTime:
        Number.isFinite(Number(result.baseline_wait_time))
          ? Number(result.baseline_wait_time)
          : baselineWaitTime,
      modelUsed: result.model_used || 'unknown',
    };
  } catch (error) {
    console.warn(`[ML prediction] ${error.message}; using baseline estimate.`);

    return {
      predictedWaitTime: Math.round(baselineWaitTime * 10) / 10,
      baselineWaitTime: Math.round(baselineWaitTime * 10) / 10,
      modelUsed: 'baseline_fallback',
    };
  }
};

module.exports = { predictWaitTime };
