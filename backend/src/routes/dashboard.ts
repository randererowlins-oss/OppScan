import { Router } from "express";
import { store } from "../db";
import { requireAuth, type AuthRequest } from "../middleware/auth";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

/**
 * GET /api/dashboard/stats — everything the dashboard needs in one call:
 * headline totals, per-type breakdown, score histogram, deadline pressure,
 * the user's own listings, and the freshest opportunities.
 */
dashboardRouter.get("/stats", (req: AuthRequest, res) => {
  const opps = store.data.opportunities;
  const userId = req.user!.id;

  const byType = ["Job", "Grant", "Tender", "Freelance", "Funding", "Scholarship"].map(
    (type) => ({
      type,
      count: opps.filter((o) => o.type === type).length,
      open: opps.filter((o) => o.type === type && o.status !== "closed").length,
    }),
  );

  // Score histogram buckets: 0–59, 60–74, 75–89, 90–100
  const buckets = [
    { range: "0–59", min: 0, max: 59 },
    { range: "60–74", min: 60, max: 74 },
    { range: "75–89", min: 75, max: 89 },
    { range: "90–100", min: 90, max: 100 },
  ].map((b) => ({
    range: b.range,
    count: opps.filter((o) => o.score >= b.min && o.score <= b.max).length,
  }));

  const now = Date.now();
  const closingSoon = opps
    .filter((o) => {
      if (!o.deadline || o.status === "closed") return false;
      const ms = new Date(o.deadline).getTime() - now;
      return ms > 0 && ms < 14 * 86_400_000;
    })
    .sort((a, b) => +new Date(a.deadline!) - +new Date(b.deadline!))
    .slice(0, 5);

  const savedIds = new Set(
    store.data.saved.filter((s) => s.userId === userId).map((s) => s.opportunityId),
  );

  res.json({
    totals: {
      opportunities: opps.length,
      open: opps.filter((o) => o.status !== "closed").length,
      closingSoon: opps.filter((o) => o.status === "closing-soon").length,
      saved: savedIds.size,
      postedByMe: opps.filter((o) => o.postedBy === userId).length,
      sources: store.data.sources.length,
      scans: store.data.scans.length,
    },
    byType,
    scoreBuckets: buckets,
    closingSoon,
    mine: opps
      .filter((o) => o.postedBy === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5),
    latest: [...opps]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5)
      .map((o) => ({ ...o, saved: savedIds.has(o.id) })),
    avgScore: opps.length
      ? Math.round(opps.reduce((s, o) => s + o.score, 0) / opps.length)
      : 0,
  });
});
