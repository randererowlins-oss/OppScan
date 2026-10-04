import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { opportunitiesRouter } from "./routes/opportunities";
import { savedRouter } from "./routes/saved";
import { scanRouter } from "./routes/scan";

export function createApp() {
  const app = express();

  // Security + plumbing (order matters: helmet → cors → json → routes)
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: "256kb" }));
  if (!config.isProd) app.use(morgan("dev"));

  // Health check — used by Docker, load balancers and the frontend banner.
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "oppscan-api", time: new Date().toISOString() });
  });

  // Domain routers
  app.use("/api/auth", authRouter);
  app.use("/api/opportunities", opportunitiesRouter);
  app.use("/api/saved", savedRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api", scanRouter); // /api/sources, /api/scans, /api/scan
  app.use("/api/admin", adminRouter);

  // 404 for unknown API routes (frontend SPA handles its own 404 page)
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Unknown API endpoint" });
  });

  // Central error handler — always JSON, never a stack trace leak in prod.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({
        error: config.isProd ? "Internal server error" : String(err),
      });
    },
  );

  return app;
}
