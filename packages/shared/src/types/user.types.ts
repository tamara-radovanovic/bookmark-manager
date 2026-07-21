/**
 * Public-facing user shape — deliberately excludes the password hash.
 * Not yet returned by any documented endpoint (Phase 1 only returns access_token),
 * but kept here so both apps can reuse it once a "current user" endpoint exists.
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
}

/** Body shared by POST /auth/register and POST /auth/login */
export interface AuthCredentialsInput {
  email: string;
  password: string;
}

/** Response body for register/login/refresh */
export interface AuthTokenResponse {
  access_token: string;
}
