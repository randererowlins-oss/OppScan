import "dotenv/config";
import path from "node:path";

/**
 * Central, validated runtime configuration for the API.
 * Every value has a sane development default so `npm run dev`
 * works with zero setup — production overrides via environment.
 */
export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  dbFile:
    process.env.DB_FILE ??
    path.join(__dirname, "..", "data", "db.json"),
  isProd: process.env.NODE_ENV === "production",
} as const;

if (config.isProd && config.jwtSecret === "dev-only-secret-change-me") {
  // Fail fast: running prod with the dev secret would let anyone forge tokens.
  throw new Error(
    "JWT_SECRET must be set to a strong random value in production.",
  );
}
