export const EncryptionMode = {
  Client: "CLIENT",
  Backend: "BACKEND",
} as const;

export type EncryptionMode = (typeof EncryptionMode)[keyof typeof EncryptionMode];
