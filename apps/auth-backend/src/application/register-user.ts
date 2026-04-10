import { EncryptionMode } from "@domidocs/contracts";
import type { RegisterRequest, RegisterResponse } from "@domidocs/contracts";
import { hashPassword } from "../business/password";
import { newUserId } from "../business/user-id";
import type { InMemoryUserRepository, UserRepository } from "../data/user-repository";

export async function registerUser(
  users: UserRepository | InMemoryUserRepository,
  body: RegisterRequest,
): Promise<RegisterResponse> {
  const email = body.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Invalid email");
  }
  if (body.password.length < 10) {
    throw new Error("Password too short");
  }
  const existing = await users.findByEmail(email);
  if (existing) {
    throw new Error("Email already registered");
  }
  const userId = newUserId();
  const password = await hashPassword(body.password);
  const defaultEncryptionMode =
    body.defaultEncryptionMode ?? EncryptionMode.Backend;
  const createdAt = new Date().toISOString();
  try {
    await users.createUser({
      userId,
      email,
      password,
      defaultEncryptionMode,
      createdAt,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Conflict") {
      throw new Error("Email already registered");
    }
    throw e;
  }
  return { userId, email };
}
