import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../db";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import {
  hashPassword,
  publicUser,
  signToken,
  verifyPassword,
} from "../utils/auth";

export const authRouter = Router();

const AVATAR_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
});

/**
 * POST /api/auth/register — create account, return { user, token }.
 * Emails are unique (case-insensitive). First error wins with 400 + message.
 */
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { name, email, password } = parsed.data;
  if (store.data.users.some((u) => u.email === email)) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }
  const user = {
    id: `user-${nanoid(10)}`,
    name,
    email,
    passwordHash: await hashPassword(password),
    role: "user" as const,
    avatarColor: AVATAR_COLORS[store.data.users.length % AVATAR_COLORS.length],
    createdAt: new Date().toISOString(),
  };
  store.data.users.push(user);
  store.save();
  const pub = publicUser(user);
  res.status(201).json({ user: pub, token: signToken(pub) });
});

/** POST /api/auth/login — verify credentials, return { user, token }. */
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password } = parsed.data;
  const user = store.data.users.find((u) => u.email === email);
  // Same message either way: don't leak which emails are registered.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const pub = publicUser(user);
  res.json({ user: pub, token: signToken(pub) });
});

/** GET /api/auth/me — current user from token. */
authRouter.get("/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

/** PATCH /api/auth/me — update display name. */
authRouter.patch("/me", requireAuth, (req: AuthRequest, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const user = store.data.users.find((u) => u.id === req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (parsed.data.name) user.name = parsed.data.name;
  store.save();
  res.json({ user: publicUser(user) });
});
