/** Auth HTTP API route prefixes (no trailing slash). */
export const AuthRoutes = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  jwks: "/.well-known/jwks.json",
} as const;

/** Web (BFF) HTTP API route prefixes. */
export const WebApiRoutes = {
  health: "/health",
  me: "/api/me",
  documents: "/api/documents",
} as const;
