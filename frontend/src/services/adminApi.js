// Admin API calls. Same base URL convention as authApi.js
// (VITE_API_URL is expected to already end with "/api", e.g. http://localhost:5000/api).

const API_URL = import.meta.env.VITE_API_URL;

const FALLBACK_MESSAGES = {
  400: "The request was invalid. Please check the entered details.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested item no longer exists.",
  409: "This action conflicts with the current data.",
  500: "Server error. Please try again in a moment.",
};

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    const error = new Error(
      "Cannot reach the server. Check your connection and try again."
    );
    error.status = 0;
    throw error;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        FALLBACK_MESSAGES[response.status] ||
        "Something went wrong. Please try again."
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

/* ---------- Offices ---------- */

export const getOffices = () =>
  request("/admin/offices").then((data) => data.offices || []);

/* ---------- Counters ---------- */

export const getOfficeCounters = (officeId) =>
  request(`/admin/offices/${officeId}/counters`).then(
    (data) => data.counters || []
  );

export const createCounter = (officeId, body) =>
  request(`/admin/offices/${officeId}/counters`, json("POST", body));

export const updateCounter = (counterId, body) =>
  request(`/admin/counters/${counterId}`, json("PUT", body));

export const deleteCounter = (counterId) =>
  request(`/admin/counters/${counterId}`, { method: "DELETE" });

/* ---------- Services ---------- */
// There is no admin "list services" endpoint. The public office endpoint
// returns ACTIVE services only.

export const getOfficeServices = (officeId) =>
  request(`/offices/${officeId}/services`).then((data) => data.services || []);

export const createService = (officeId, body) =>
  request(`/admin/offices/${officeId}/services`, json("POST", body));

export const updateService = (serviceId, body) =>
  request(`/admin/services/${serviceId}`, json("PUT", body));

// Soft delete: sets isActive = false
export const deactivateService = (serviceId) =>
  request(`/admin/services/${serviceId}`, { method: "DELETE" });

/* ---------- Staff (users with role "operator") ---------- */

export const getStaff = () =>
  request("/admin/staff").then((data) => data.staff || []);

export const createStaff = (body) => request("/admin/staff", json("POST", body));

export const updateStaff = (staffId, body) =>
  request(`/admin/staff/${staffId}`, json("PUT", body));

export const deleteStaff = (staffId) =>
  request(`/admin/staff/${staffId}`, { method: "DELETE" });

export const assignStaff = (staffId, officeId, counterId) =>
  request(
    `/admin/staff/${staffId}/assignment`,
    json("PATCH", { officeId, counterId })
  );

/* ---------- Analytics ---------- */

export const getQueueAnalytics = () =>
  request("/admin/analytics/queue").then((data) => data.analytics);

export const getPeakHours = () =>
  request("/admin/analytics/peak-hours").then((data) => data.peakHours || []);

export const getOfficePeakHours = (officeId) =>
  request(`/offices/${officeId}/analytics/peak-hours`).then((data) => ({
    office: data.office,
    peakHours: data.peakHours || [],
  }));
