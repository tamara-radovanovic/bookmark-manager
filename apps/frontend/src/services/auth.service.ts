import type { AuthCredentialsInput, AuthTokenResponse } from "@bookmark-manager/shared";
import { api, refreshAccessToken } from "./api";

export function register(credentials: AuthCredentialsInput): Promise<AuthTokenResponse> {
  return api.post<AuthTokenResponse>("/auth/register", credentials).then((res) => res.data);
}

export function login(credentials: AuthCredentialsInput): Promise<AuthTokenResponse> {
  return api.post<AuthTokenResponse>("/auth/login", credentials).then((res) => res.data);
}

export function logout(): Promise<void> {
  return api.post("/auth/logout").then(() => undefined);
}

// Shared with the axios response interceptor in api.ts — same coalesced,
// at-most-one-in-flight call, so this is safe to call from anywhere
// (including twice in a row, e.g. React StrictMode's dev double-invoke)
// without racing the interceptor's own refresh or itself.
export const refresh = refreshAccessToken;
