const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // non-JSON body
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed (${response.status})`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export const getOperatorDashboard = () => request("/operator/dashboard");

export const getOperatorQueue = () => request("/operator/queue");

// May resolve with { success: false, message: "No waiting tokens" } (HTTP 200).
export const callNextToken = () =>
  request("/operator/tokens/next", { method: "POST" });

export const startToken = (tokenId) =>
  request(`/operator/tokens/${tokenId}/start`, { method: "POST" });

export const completeToken = (tokenId) =>
  request(`/operator/tokens/${tokenId}/complete`, { method: "POST" });

export const skipToken = (tokenId) =>
  request(`/operator/tokens/${tokenId}/skip`, { method: "POST" });

export const recallToken = (tokenId) =>
  request(`/operator/tokens/${tokenId}/recall`, { method: "POST" });

// status: "AVAILABLE" | "PAUSED" | "OFFLINE"
export const updateCounterStatus = (status) =>
  request("/operator/counter/status", {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
