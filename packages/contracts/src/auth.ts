import type { EncryptionMode } from "./encryption-mode";

export type RegisterRequest = {
  email: string;
  password: string;
  /** Preferred default for new documents; stored on user profile. */
  defaultEncryptionMode?: EncryptionMode;
};

export type RegisterResponse = {
  userId: string;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  tokenType: "Bearer";
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = LoginResponse;

export type AuthErrorBody = {
  error: string;
  code?: string;
};
