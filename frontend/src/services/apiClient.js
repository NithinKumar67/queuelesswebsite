// Shared API configuration and the JSON request helper used by the
// auth and citizen services. (The admin and operator services keep their own
// helpers because they deliberately turn non-2xx responses into thrown errors.)

// VITE_API_URL already ends with "/api", e.g. http://localhost:5000/api
export const API_URL = import.meta.env.VITE_API_URL;

// The Socket.IO server lives on the same origin as the API, without "/api".
export function getSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || "";

  return apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

// Sends the session cookie and resolves with the parsed JSON body whatever the
// HTTP status is: callers inspect `success` / `message` themselves.
export async function requestJson(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    ...(body !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });

  return response.json();
}
