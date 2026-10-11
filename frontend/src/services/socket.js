// One shared Socket.IO connection for the whole app.
//
// Pages call acquireSocket() when they mount and releaseSocket() when they
// unmount (normally through the useOfficeSocket hook). The connection is
// created for the first user and closed shortly after the last one leaves, so
// there is never more than one client no matter how many components listen.
// Authentication is the existing Passport session cookie (withCredentials).

import { io } from "socket.io-client";
import { getSocketUrl } from "./apiClient";

// Grace period so a quick unmount/mount (React StrictMode, or navigating
// between two live pages) reuses the connection instead of reconnecting.
const RELEASE_DELAY_MS = 300;

let socket = null;
let users = 0;
let releaseTimer = null;

export function acquireSocket() {
  clearTimeout(releaseTimer);
  releaseTimer = null;

  if (!socket) {
    const url = getSocketUrl();

    if (!url) return null; // VITE_API_URL not configured

    socket = io(url, { withCredentials: true });
  }

  users += 1;
  return socket;
}

export function releaseSocket() {
  users = Math.max(0, users - 1);

  if (users > 0 || !socket || releaseTimer) return;

  releaseTimer = setTimeout(() => {
    releaseTimer = null;

    if (users === 0 && socket) {
      socket.disconnect();
      socket = null;
    }
  }, RELEASE_DELAY_MS);
}
