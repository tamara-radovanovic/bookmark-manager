// Deliberately outside React: the axios interceptor (also outside React) and
// AuthContext both need to read/write the current access token, and neither
// can call React hooks. Plain module state is the simplest bridge between
// them — AuthContext is still the single source of truth for UI re-renders
// (see its own isAuthenticated state), this only mirrors the token itself.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
