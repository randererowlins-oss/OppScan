import type { NextFunction, Request, Response } from "express";
import { store } from "../db";
import { verifyToken } from "../utils/auth";
import type { PublicUser } from "../types";

/** Express request augmented with the authenticated user (if any). */
export interface AuthRequest extends Request {
  user?: PublicUser;
}

/**
 * `requireAuth` — rejects requests without a valid `Authorization: Bearer <jwt>`.
 * Attaches the fresh user record (minus password hash) as `req.user`.
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }
  try {
    const payload = verifyToken(token);
    const user = store.data.users.find((u) => u.id === payload.sub);
    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }
    const { passwordHash: _ignored, ...pub } = user;
    req.user = pub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * `optionalAuth` — same as above but never rejects; useful for endpoints
 * that personalise when logged in (e.g. `saved` flags on listings).
 */
export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      const payload = verifyToken(token);
      const user = store.data.users.find((u) => u.id === payload.sub);
      if (user) {
        const { passwordHash: _ignored, ...pub } = user;
        req.user = pub;
      }
    } catch {
      /* ignore — treat as anonymous */
    }
  }
  next();
}

/** `requireAdmin` — must run AFTER `requireAuth`. */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin privileges required" });
    return;
  }
  next();
}
