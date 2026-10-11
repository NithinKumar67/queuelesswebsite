import { requestJson } from "./apiClient";

export const registerUser = (user) =>
  requestJson("/auth/register", { method: "POST", body: user });

export const loginUser = (credentials) =>
  requestJson("/auth/login", { method: "POST", body: credentials });

export const logoutUser = () => requestJson("/auth/logout", { method: "POST" });

export const getCurrentUser = () => requestJson("/auth/me");
