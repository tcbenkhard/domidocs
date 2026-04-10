import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const SALT_LEN = 16;
const KEY_LEN = 64;

export type PasswordHashRecord = {
  algorithm: "scrypt";
  saltB64: string;
  hashB64: string;
};

export async function hashPassword(plain: string): Promise<PasswordHashRecord> {
  const salt = randomBytes(SALT_LEN);
  const derived = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  return {
    algorithm: "scrypt",
    saltB64: salt.toString("base64"),
    hashB64: derived.toString("base64"),
  };
}

export async function verifyPassword(
  plain: string,
  record: PasswordHashRecord,
): Promise<boolean> {
  const salt = Buffer.from(record.saltB64, "base64");
  const expected = Buffer.from(record.hashB64, "base64");
  const derived = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
