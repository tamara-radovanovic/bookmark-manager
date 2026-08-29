import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthTokenResponse } from "@bookmark-manager/shared";
import { getAccessToken, setAccessToken } from "./token-store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Sends/receives the httpOnly refresh_token cookie on every request —
  // without this, the browser never attaches it cross-request.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// In-flight refresh call, shared across *every* caller that needs one at
// the same time — the response interceptor below, AND AuthContext's
// mount-time silent refresh (see auth.service.ts's `refresh` export, which
// just re-exports this). Our backend's refresh tokens are single-use
// (rotated on every call), so two concurrent real HTTP calls would have
// the second one fail — StrictMode's dev-only double-effect-invoke hit
// this exact case with AuthContext's mount effect. Coalescing into one
// shared promise means every caller awaits the *same* refresh instead of
// racing each other, no matter how many places in the app ask for one.
let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  // Plain axios, not the `api` instance — must not go through the response
  // interceptor below, or a failed refresh would try to refresh itself.
  const response = await axios.post<AuthTokenResponse>(
    "/auth/refresh",
    {},
    { baseURL: import.meta.env.VITE_API_URL, withCredentials: true },
  );
  setAccessToken(response.data.access_token);
  return response.data.access_token;
}

export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isAuthEndpoint = originalRequest?.url?.startsWith("/auth/");
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      window.location.assign("/login");
      return Promise.reject(refreshError);
    }
  },
);
