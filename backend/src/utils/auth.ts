import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import type { PublicUser } from "../types";

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: "user" | "admin";
}

export function signToken(user: PublicUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export function publicUser<T extends { passwordHash: string }>(
  user: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}
